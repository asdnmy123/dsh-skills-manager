import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createScope } from '@deepseek-ai/dsh-scope'
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem'
import { fixture } from './helpers.mjs'
import { ManagerModel } from '../lib/client/model.js'

async function scopedFixture(t) {
  // Reproduce Desktop: global filesystem row disabled, providers mounted in standing preset scopes.
  const env = await fixture(t, { filesystem: false })
  const keys = { primary: {}, alternate: {} }
  const primary = createScope(env.ctx, keys.primary)
  const alternate = createScope(env.ctx, keys.alternate)
  await primary.ctx.plugin(filesystem, { ...env.config, customSkillDirs: [], watch: false })
  await alternate.ctx.plugin(filesystem, { includeDefaultRoots: false, customSkillDirs: env.config.customSkillDirs, watch: false })
  env.ctx.skills.register({ name: 'global-skill', description: 'Global system skill', content: 'body', source: 'bundled' })
  let acquired = 0, released = 0
  const service = await env.ctx.plugin({ name: 'standing-presets', apply(ctx) {
    ctx.reflect.provide('agentPresets', {
      defaultId: 'primary',
      async list() { return [{ id: 'primary', name: '默认配置' }, { id: 'alternate', name: '其他配置' }] },
      async acquireScope(id = 'primary') {
        if (!keys[id]) throw new Error('Unknown preset')
        acquired++
        return { key: keys[id], async [Symbol.asyncDispose]() { released++ } }
      },
    })
  } })
  t.after(async () => { await service.dispose(); await alternate.dispose(); await primary.dispose() })
  return { ...env, primary, stats: () => ({ acquired, released }) }
}

test('Desktop preset-only filesystem skills appear by default and remain manageable without enabling the global provider', async t => {
  const env = await scopedFixture(t)
  const file = await env.skill('preset-skill')
  const initial = await env.list()
  assert.equal(initial.preset, 'primary')
  assert.equal(initial.presets.length, 2)
  const row = initial.skills.find(row => row.name === 'preset-skill')
  assert.equal(row.manageable, true)
  assert.deepEqual((await env.ctx.skills.snapshot()).skills.map(row => row.name), ['global-skill'])
  const disabled = await env.rpc.call('/api', 'dsh-skills-manager/mutate', { action: 'disable', preset: 'primary', targets: [{ id: row.id, revision: row.revision }] })
  assert.equal(disabled.value.results[0].ok, true)
  assert.match(await readFile(file.path, 'utf8'), /disable-model-invocation: true/)
  assert.equal((await env.list()).skills.find(row => row.name === 'preset-skill').enabled, false)
  const global = await env.rpc.call('/api', 'dsh-skills-manager/list', { preset: '' })
  assert.equal(global.value.preset, '')
  assert.deepEqual(global.value.skills.map(row => row.name), ['global-skill'])
  assert.deepEqual(env.stats(), { acquired: 3, released: 3 })
})

test('preset leases are released on success and failure; cross-preset targets and malformed scopes cannot write', async t => {
  const env = await scopedFixture(t)
  const file = await env.skill('same-name')
  await env.skill('same-name', { source: 'custom', description: 'Alternate copy' })
  const row = (await env.list()).skills.find(row => row.name === 'same-name')
  assert.equal(row.path, file.path)
  const result = await env.rpc.call('/api', 'dsh-skills-manager/mutate', { action: 'delete', preset: 'alternate', targets: [{ id: row.id, revision: row.revision }] })
  assert.equal(result.value.results[0].ok, false)
  assert.equal(await readFile(file.path, 'utf8'), file.content)
  assert.equal((await env.rpc.call('/api', 'dsh-skills-manager/list', { preset: ['primary'] })).ok, false)
  assert.equal((await env.rpc.call('/api', 'dsh-skills-manager/list', { preset: 'missing' })).ok, false)
  await env.primary.ctx.plugin({ inject: ['skills'], apply(ctx) {
    ctx.skills.registerProvider(() => ({ name: 'failing-source', async list() { throw new Error('offline') }, async get() {} }))
  } })
  const failed = await env.rpc.call('/api', 'dsh-skills-manager/mutate', { action: 'disable', preset: 'primary', targets: [{ id: row.id, revision: row.revision }] })
  assert.equal(failed.ok, false)
  assert.equal(failed.error.code, 'INCOMPLETE')
  assert.deepEqual(env.stats(), { acquired: 3, released: 3 })
})

test('client binds operations to the resolved preset and discards reads from a previous preset', async () => {
  const calls = []
  const model = new ManagerModel({ call(_channel, endpoint, payload, signal) {
    let resolve
    const promise = new Promise(r => { resolve = r })
    calls.push({ endpoint, payload, signal, resolve })
    return promise
  } })
  const first = model.refresh()
  calls[0].resolve({ ok: true, value: { complete: true, skills: [], preset: 'primary', presets: [{ id: 'primary' }, { id: 'alternate' }] } })
  await first
  assert.equal(model.source.getSnapshot().preset, 'primary')
  const old = model.refresh()
  const current = model.refresh(undefined, 'alternate')
  assert.equal(calls[1].signal.aborted, true)
  calls[2].resolve({ ok: true, value: { complete: true, skills: [], preset: 'alternate' } })
  await current
  calls[1].resolve({ ok: true, value: { complete: true, skills: [], preset: 'primary' } })
  await old
  assert.equal(model.source.getSnapshot().preset, 'alternate')
  const mutation = model.mutate('disable', [{ id: 'id', revision: 'version' }])
  assert.equal(calls[3].payload.preset, 'alternate')
  calls[3].resolve({ ok: true, value: { results: [] } })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(calls[4].payload.preset, 'alternate')
  calls[4].resolve({ ok: true, value: { complete: true, skills: [], preset: 'alternate' } })
  await mutation
  model.dispose()
})
