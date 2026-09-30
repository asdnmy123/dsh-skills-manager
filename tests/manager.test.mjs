import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, writeFile, mkdir, access, symlink, link, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { isModelInvocable, isUserInvocable } from '@deepseek-ai/dsh-skill'
import { fixture } from './helpers.mjs'
import { setEnabled, readHeader } from '../lib/frontmatter.js'

test('real 0.2.0-rc.2 registry keeps disabled skills visible and restores invocation policy after reload', async t => {
  const env = await fixture(t)
  const file = await env.skill('manual-only', { flags: 'disable-model-invocation: true\nuser-invocable: true\n' })
  let catalog = await env.list()
  assert.equal(catalog.complete, true)
  assert.equal(catalog.skills[0].manageable, true)
  const disabled = await env.mutate('disable', catalog.skills)
  assert.equal(disabled.value.results[0].ok, true)
  const skill = await env.ctx.skills.get('manual-only')
  assert.equal(isModelInvocable(skill), false)
  assert.equal(isUserInvocable(skill), false)
  await env.reload()
  catalog = await env.list()
  assert.equal(catalog.skills[0].enabled, false)
  assert.equal(catalog.skills[0].manageable, true)
  assert.equal((await env.mutate('enable', catalog.skills)).value.results[0].ok, true)
  const enabled = await env.ctx.skills.get('manual-only')
  assert.deepEqual(enabled.invocation, { modelInvocable: false, userInvocable: true })
  assert.ok((await readFile(file.path, 'utf8')).includes('# keep this comment'))
  assert.ok((await readFile(file.path, 'utf8')).endsWith(file.content.split('---\n')[2]))
})

test('default policies, repeated actions and body edits while disabled are preserved', async t => {
  const env = await fixture(t)
  const file = await env.skill('regular-skill')
  let rows = (await env.list()).skills
  await env.mutate('disable', rows)
  const disabled = await readFile(file.path, 'utf8')
  rows = (await env.list()).skills
  assert.equal((await env.mutate('disable', rows)).value.results[0].ok, true)
  assert.equal(await readFile(file.path, 'utf8'), disabled)
  await writeFile(file.path, disabled.replace('Body stays intact.', 'Updated body.'))
  rows = (await env.list()).skills
  await env.mutate('enable', rows)
  const content = await readFile(file.path, 'utf8')
  assert.ok(content.endsWith('Updated body.\n'))
  assert.equal(readHeader(content).doc.has('user-invocable'), false)
  assert.equal(readHeader(content).doc.has('disable-model-invocation'), false)
})

test('CRLF header and body, comments, unknown metadata and partial policies survive a toggle', () => {
  const raw = '---\r\n# custom comment\r\nname: crlf-skill\r\ndescription: >-\r\n  multiline prose\r\nuser-invocable: "false"\r\nmetadata:\r\n  author: me\r\n---\r\n\r\n# Body\r\ntrailing  \r\n'
  const disabled = setEnabled(raw, false)
  assert.ok(disabled.endsWith('---\r\n\r\n# Body\r\ntrailing  \r\n'))
  const restored = setEnabled(disabled, true)
  assert.ok(restored.includes('# custom comment\r\n'))
  assert.deepEqual(readHeader(restored).doc.toJS(), readHeader(raw).doc.toJS())
})

test('externally disabled skills can be explicitly enabled; invalid records and external policy edits fail', () => {
  const raw = '---\nname: a\ndescription: A\ndisable-model-invocation: true\nuser-invocable: false\n---\nbody'
  const doc = readHeader(setEnabled(raw, true)).doc
  assert.equal(doc.get('disable-model-invocation'), false)
  assert.equal(doc.get('user-invocable'), true)
  assert.throws(() => setEnabled(raw.replace('description: A', 'description: A\ndsh-skills-manager-state: unknown'), false), /开关记录/)
  const disabled = setEnabled(raw.replace('disable-model-invocation: true', 'disable-model-invocation: false'), false)
  assert.throws(() => setEnabled(disabled.replace('user-invocable: false', 'user-invocable: true'), true), /外部修改/)
})

test('delete moves only the selected bundle and its assets, writes a receipt, and reveals a lower priority duplicate', async t => {
  const env = await fixture(t)
  const higher = await env.skill('duplicate-skill')
  const lower = await env.skill('duplicate-skill', { source: 'user-agents' })
  const other = await env.skill('other-skill')
  await writeFile(join(dirname(higher.path), 'asset.txt'), 'keep assets')
  const row = (await env.list()).skills.find(row => row.name === 'duplicate-skill')
  assert.equal(row.source, 'user-dsh')
  const result = (await env.mutate('delete', [row])).value.results[0]
  assert.equal(result.ok, true)
  await assert.rejects(access(higher.path), /ENOENT/)
  assert.equal(await readFile(join(result.trashPath, 'asset.txt'), 'utf8'), 'keep assets')
  assert.equal(await readFile(join(result.trashPath, 'SKILL.md'), 'utf8'), higher.content)
  assert.equal((await readdir(result.trashPath)).some(path => path.endsWith('.lock')), false)
  const receipt = JSON.parse(await readFile(join(dirname(result.trashPath), 'receipt.json'), 'utf8'))
  assert.equal(receipt.originalPath, dirname(higher.path))
  const replacement = (await env.list()).skills.find(row => row.name === 'duplicate-skill')
  assert.equal(replacement.source, 'user-agents')
  assert.notEqual(replacement.id, row.id)
  assert.equal((await env.mutate('delete', [row])).value.results[0].ok, false)
  await access(lower.path)
  await access(other.path)
})

test('flat skills including a flat SKILL.md are removed without moving the skill root', async t => {
  const env = await fixture(t)
  const flat = await env.skill('flat-skill', { flat: true, filename: 'SKILL.md' })
  const other = await env.skill('neighbor-skill', { flat: true })
  const row = (await env.list()).skills.find(row => row.name === 'flat-skill')
  const result = (await env.mutate('delete', [row])).value.results[0]
  assert.equal(result.ok, true)
  assert.equal(await readFile(result.trashPath, 'utf8'), flat.content)
  await access(other.path)
  await access(flat.root)
})

test('stale revisions and concurrent duplicate requests never overwrite external changes', async t => {
  const env = await fixture(t)
  const file = await env.skill('concurrent-skill')
  let rows = (await env.list()).skills
  const changes = await Promise.all([env.mutate('disable', rows), env.mutate('delete', rows)])
  assert.equal(changes[0].value.results[0].ok, true)
  assert.equal(changes[1].value.results[0].ok, false)
  rows = (await env.list()).skills
  await writeFile(file.path, (await readFile(file.path, 'utf8')) + '\nexternal change\n')
  assert.equal((await env.mutate('enable', rows)).value.results[0].ok, false)
  assert.ok((await readFile(file.path, 'utf8')).endsWith('external change\n'))
})

test('read-only providers, unconfigured roots, symlinks and hard links are never mutated', async t => {
  const env = await fixture(t)
  env.ctx.skills.register({ name: 'virtual-skill', description: 'virtual', content: 'body', source: 'runtime' })
  const outside = join(env.dir, 'outside')
  await mkdir(outside)
  const external = join(outside, 'SKILL.md')
  await writeFile(external, '---\nname: linked-skill\ndescription: Linked\n---\nexternal')
  await mkdir(join(env.config.dshHome, 'skills'), { recursive: true })
  await symlink(outside, join(env.config.dshHome, 'skills', 'linked-skill'), 'junction')
  const hard = await env.skill('hard-skill')
  await link(hard.path, join(env.dir, 'hard-alias'))
  const rows = (await env.list()).skills
  for (const name of ['virtual-skill', 'linked-skill', 'hard-skill']) assert.equal(rows.find(row => row.name === name).manageable, false)
  assert.equal(await readFile(external, 'utf8'), '---\nname: linked-skill\ndescription: Linked\n---\nexternal')
  const virtual = rows.find(row => row.name === 'virtual-skill')
  const response = await env.rpc.call('/api', 'dsh-skills-manager/mutate', { action: 'delete', targets: [{ id: virtual.id, revision: '0'.repeat(64) }] })
  assert.equal(response.value.results[0].ok, false)
})

test('project lookup uses the nearest git root and custom roots require explicit matching config', async t => {
  const env = await fixture(t, { manager: { customSkillDirs: [] } })
  const custom = await env.skill('custom-skill', { source: 'custom' })
  const project = join(env.dir, 'project')
  const cwd = join(project, 'src')
  await mkdir(join(project, '.git'), { recursive: true })
  await mkdir(cwd)
  const path = join(project, '.dsh', 'skills', 'project-skill', 'SKILL.md')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, '---\nname: project-skill\ndescription: Project\n---\nproject')
  assert.equal((await env.list()).skills.some(row => row.name === 'project-skill'), false)
  const rows = (await env.list(cwd)).skills
  assert.equal(rows.find(row => row.name === 'custom-skill').manageable, false)
  const row = rows.find(row => row.name === 'project-skill')
  assert.equal(row.manageable, true)
  assert.equal((await env.mutate('disable', [row], cwd)).value.results[0].ok, true)
  await access(custom.path)
})

test('incomplete discovery blocks mutations and batch failures are reported individually', async t => {
  const env = await fixture(t)
  const good = await env.skill('good-skill')
  await env.skill('stale-skill')
  const rows = (await env.list()).skills
  await writeFile(join(env.config.dshHome, 'skills', 'stale-skill', 'SKILL.md'), '---\nname: stale-skill\ndescription: Changed\n---\nnew body')
  const batch = await env.mutate('disable', rows)
  assert.equal(batch.value.results.filter(row => row.ok).length, 1)
  assert.equal(batch.value.results.filter(row => !row.ok).length, 1)
  assert.ok((await readFile(good.path, 'utf8')).includes('user-invocable: false'))
  const dispose = env.ctx.skills.registerProvider(() => ({ name: 'offline', list: async () => ({ candidates: [], complete: false }), get: async () => undefined }))
  t.after(dispose)
  const partial = await env.list()
  assert.equal(partial.complete, false)
  const response = await env.mutate('delete', partial.skills)
  assert.equal(response.ok, false)
  assert.equal(response.error.code, 'INCOMPLETE')
  await access(good.path)
})

test('malformed requests, duplicate targets and path/method confusion fail without writes', async t => {
  const env = await fixture(t)
  const file = await env.skill('validation-skill')
  const row = (await env.list()).skills[0]
  for (const payload of [null, { action: 'erase', targets: [] }, { action: ['enable'], targets: [{ id: row.id, revision: row.revision }] }, { action: 'enable', targets: [row, row] }, { action: 'enable', cwd: '../outside', targets: [row] }, { action: 'enable', targets: [{ id: '../../file', revision: row.revision }] }]) {
    const result = await env.rpc.call('/api', 'dsh-skills-manager/mutate', payload)
    assert.equal(result.ok, false)
    assert.equal(result.error.code, 'BAD_REQUEST')
  }
  const response = await env.fetcher.fetch(new Request('http://localhost/api/dsh-skills-manager/mutate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: '1', method: 'dsh-skills-manager/list', payload: {} }) }))
  assert.equal((await response.json()).result.ok, false)
  assert.equal(await readFile(file.path, 'utf8'), file.content)
})

test('Connection trust fence and plugin unload/reload work with another shared interceptor', async t => {
  const env = await fixture(t)
  assert.equal(env.ctx.connection.requestRejection({ headers: { host: '127.0.0.1:19387' } }), 401)
  assert.equal(env.ctx.connection.requestRejection({ headers: { host: 'evil.example', origin: 'https://evil.example' } }), 403)
  const dispose = env.ctx.connection.rpc.intercept('/api', endpoint => endpoint.startsWith('other/'), async () => ({ ok: true, value: 'other plugin' }))
  t.after(dispose)
  assert.equal((await env.rpc.call('/api', 'other/test', {})).value, 'other plugin')
  await env.list()
  await env.manager.dispose()
  const response = await env.fetcher.fetch(new Request('http://localhost/api/dsh-skills-manager/list', { method: 'POST', body: '{}' }))
  assert.equal(response.status, 404)
  await env.reload()
  assert.equal((await env.list()).complete, true)
})
