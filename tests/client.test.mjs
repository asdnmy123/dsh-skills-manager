import assert from 'node:assert/strict'
import { test } from 'node:test'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { Context } from '@deepseek-ai/cordis'
import { fixture, loadClient } from './helpers.mjs'
import { ManagerModel } from '../lib/client/model.js'

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const row = { id: '1', name: 'test', description: 'test', enabled: true, manageable: true, revision: 'revision', invocation: { modelInvocable: true, userInvocable: true }, source: 'user-dsh', provider: 'filesystem' }

test('client discards stale workspace reads and aborts outstanding reads on unload', async () => {
  const calls = []
  const model = new ManagerModel({ call(_channel, _endpoint, payload, signal) { const response = deferred(); calls.push({ payload, signal, ...response }); return response.promise } })
  const first = model.refresh('C:/first')
  const second = model.refresh('C:/second')
  assert.equal(calls[0].signal.aborted, true)
  calls[1].resolve({ ok: true, value: { complete: true, skills: [row] } })
  await second
  calls[0].resolve({ ok: true, value: { complete: true, skills: [] } })
  await first
  assert.equal(model.source.getSnapshot().cwd, 'C:/second')
  assert.equal(model.source.getSnapshot().catalog.skills.length, 1)
  const pending = model.refresh()
  model.dispose()
  assert.equal(calls[2].signal.aborted, true)
  calls[2].resolve({ ok: true, value: { complete: true, skills: [] } })
  await pending
  assert.equal(model.source.getSnapshot().catalog.skills.length, 1)
})

test('client blocks duplicate mutations, reports individual failures and refreshes once after settlement', async () => {
  let mutations = 0, lists = 0
  const pending = deferred()
  const model = new ManagerModel({ call(_channel, endpoint) {
    if (endpoint.endsWith('/list')) { lists++; return Promise.resolve({ ok: true, value: { complete: true, skills: [row] } }) }
    mutations++; return pending.promise
  } })
  await model.refresh()
  const first = model.mutate('disable', [row])
  await model.mutate('disable', [row])
  await model.refresh('C:/another')
  assert.equal(mutations, 1)
  pending.resolve({ ok: true, value: { results: [{ id: row.id, name: 'test', ok: false, message: 'stale' }] } })
  await first
  assert.equal(lists, 2)
  assert.equal(model.source.getSnapshot().cwd, '')
  assert.deepEqual(model.source.getSnapshot().failures, ['test：stale'])
  model.dispose()
})

test('actual 0.2.0-rc.2 Slot renderer mounts the lazy client and supports search, switches, batch and delete confirmation', async t => {
  const env = await fixture(t)
  await env.skill('demo-skill')
  await env.skill('another-skill')
  env.ctx.skills.register({ name: 'system-skill', description: 'Built in', content: 'virtual body', source: 'bundled' })
  const presetKey = {}
  const presetService = await env.ctx.plugin({ name: 'ui-test-presets', apply(ctx) {
    ctx.reflect.provide('agentPresets', { defaultId: 'personal', async list() { return [{ id: 'personal', name: '个人配置' }] }, async acquireScope() { return { key: presetKey, async [Symbol.asyncDispose]() {} } } })
  } })
  t.after(() => presetService.dispose())
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', { pretendToBeVisual: true, url: 'http://127.0.0.1' })
  const originals = new Map()
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  const ctx = new Context()
  const renderer = await loadClient('@deepseek-ai/dsh-client-ui-renderer/client', { window: dom.window, document: dom.window.document })
  const rendererFiber = await ctx.plugin(renderer.exports)
  const workspace = { items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null }
  const frame = await ctx.plugin({ name: 'test-frame', inject: ['slots'], apply(ctx) {
    ctx.reflect.provide('connection', { rpc: env.rpc })
    const emptyBinding = { key: undefined, hooks: {}, keyedHooks: {}, props: {} }
    const bindingSource = { getSnapshot: () => emptyBinding, subscribe: () => () => {} }
    ctx.slots.installScope('session', { current: bindingSource, bindingSource: () => bindingSource })
    ctx.slots.provideRoot({ hooks: { workspaces: { getSnapshot: () => workspace, subscribe: () => () => {} } } })
    ctx.slots.register({ name: 'root', children: { main: { kind: 'keyed', scope: 'root' }, 'sidebar.panellist': { kind: 'list', scope: 'root' } } }, ({ renderSlot }) => React.createElement('div', null, renderSlot('main', {}, { entryKey: 'dsh-skills-manager' })))
  } })
  const client = await loadClient('dsh-skills-manager/client', { window: dom.window, document: dom.window.document })
  let clientFiber = await ctx.plugin(client.exports)
  let unmount
  await act(async () => { unmount = ctx.uiRenderer.mount(document.getElementById('app')) })
  t.after(async () => {
    await act(async () => { unmount(); await clientFiber.dispose(); await frame.dispose(); await rendererFiber.dispose() })
    dom.window.close()
    for (const [key, descriptor] of originals) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]
  })
  const find = label => document.querySelector(`[aria-label="${label}"]`)
  const wait = async predicate => {
    for (let i = 0; i < 100; i++) {
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
      if (predicate()) return
    }
    assert.fail('UI condition did not settle: ' + document.body.textContent)
  }
  const click = async label => { const element = find(label); assert.ok(element, label); await act(async () => { element.click() }) }
  await wait(() => find('关闭 demo-skill'))
  assert.equal(ctx.slots.entries('main').length, 1)
  assert.equal(ctx.slots.entries('sidebar.panellist')[0].options.label, '技能')
  assert.ok(document.querySelector('style[data-dsh-skills-manager]'))
  assert.equal(document.querySelectorAll('.dsm-row').length, 3)
  assert.equal(document.querySelectorAll('.dsm-readonly').length, 1)
  assert.equal(document.querySelector('section[aria-label="系统"] .dsm-group-head button'), null)
  const presetPicker = find('技能配置')
  assert.equal(presetPicker.getAttribute('role'), 'combobox')
  assert.equal(presetPicker.textContent, '个人配置')
  await click('技能配置')
  assert.equal(presetPicker.getAttribute('aria-expanded'), 'true')
  await act(async () => { [...document.querySelectorAll('[role="option"]')].find(option => option.textContent === '宿主全局').click() })
  await wait(() => find('关闭 demo-skill') && !find('关闭 demo-skill').disabled)
  assert.equal(presetPicker.textContent, '宿主全局')
  assert.equal(document.querySelector('[role="listbox"]'), null)
  assert.equal(document.activeElement, presetPicker)
  await click('技能配置')
  await act(async () => { [...document.querySelectorAll('[role="option"]')].find(option => option.textContent === '个人配置').click() })
  await wait(() => find('关闭 demo-skill') && !find('关闭 demo-skill').disabled)
  assert.equal(presetPicker.textContent, '个人配置')
  const search = find('搜索技能')
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(search, 'demo')
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  assert.equal(document.querySelectorAll('.dsm-row').length, 1)
  await click('关闭 demo-skill')
  await wait(() => find('启用 demo-skill'))
  assert.equal(document.querySelector('.dsm-toasts [role="status"]').textContent, '已关闭 1 项技能')
  await click('关闭操作通知')
  assert.equal(document.querySelector('.dsm-toasts [role="status"]'), null)
  assert.deepEqual((await env.ctx.skills.get('demo-skill')).invocation, { modelInvocable: false, userInvocable: false })
  await click('启用 demo-skill')
  await wait(() => find('关闭 demo-skill'))
  assert.ok(document.querySelector('.dsm-toasts [role="status"]').textContent.includes('已启用 1 项技能'))
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(search, '')
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  await click('选择 demo-skill')
  await click('选择 another-skill')
  assert.equal(find('选择 demo-skill').checked, true)
  assert.equal(find('选择 another-skill').checked, true)
  assert.ok(find('批量操作').textContent.includes('已选择 2 项'))
  const disable = [...find('批量操作').querySelectorAll('button')].find(button => button.textContent === '关闭')
  await act(async () => { disable.click() })
  await wait(() => find('启用 demo-skill') && find('启用 another-skill'))
  await click('删除 demo-skill')
  assert.ok(document.querySelector('[role="dialog"]'))
  assert.equal(document.activeElement.textContent, '取消')
  await act(async () => { document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })) })
  assert.equal(document.activeElement.textContent, '确认删除')
  await act(async () => { [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === '取消').click() })
  assert.equal(document.querySelector('[role="dialog"]'), null)
  assert.ok((await env.list()).skills.some(row => row.name === 'demo-skill'))
  await click('删除 demo-skill')
  await act(async () => { [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === '确认删除').click() })
  await wait(() => !find('删除 demo-skill') && document.body.textContent.includes('已移入回收目录'))
  assert.equal((await env.list()).skills.some(row => row.name === 'demo-skill'), false)
  await act(async () => { await clientFiber.dispose() })
  assert.equal(ctx.slots.entries('main').length, 0)
  assert.equal(ctx.slots.entries('sidebar.panellist').length, 0)
  assert.equal(document.querySelector('style[data-dsh-skills-manager]'), null)
  await act(async () => { clientFiber = await ctx.plugin(client.exports) })
  await wait(() => find('启用 another-skill'))
  assert.equal(ctx.slots.entries('main').length, 1)
  const offline = env.ctx.skills.registerProvider(() => ({ name: 'offline-ui', list: async () => ({ candidates: [], complete: false }), get: async () => undefined }))
  await click('刷新技能')
  await wait(() => document.body.textContent.includes('部分技能来源暂不可用'))
  assert.ok([...document.querySelectorAll('[role="switch"]')].every(button => button.disabled))
  offline()
  await click('刷新技能')
  await wait(() => find('启用 another-skill') && !find('启用 another-skill').disabled)
  await env.manager.dispose()
  await click('刷新技能')
  await wait(() => document.body.textContent.includes('无法连接技能管理服务'))
  assert.ok(find('启用 another-skill').disabled)
})

test('official Connection client carries plugin RPC over a Desktop-style fetch transport', async t => {
  const env = await fixture(t)
  await env.skill('desktop-skill')
  const client = await loadClient('@deepseek-ai/dsh-client-connection/client')
  const ctx = new Context()
  const fiber = await ctx.plugin({ name: 'desktop-transport-fixture', apply(ctx) {
    client.exports.installConnection(ctx, { transport: { ownsHost: true, fetch: (input, init) => env.fetcher.fetch(new Request(new URL(input, 'http://127.0.0.1/'), init)) }, location: { hostname: 'desktop' } })
  } })
  t.after(() => fiber.dispose())
  const list = await ctx.connection.rpc.call('/api', 'dsh-skills-manager/list', {})
  assert.equal(list.ok, true)
  const row = list.value.skills[0]
  const mutated = await ctx.connection.rpc.call('/api', 'dsh-skills-manager/mutate', { action: 'disable', targets: [{ id: row.id, revision: row.revision }] })
  assert.equal(mutated.ok, true)
  assert.equal(mutated.value.results[0].ok, true)
  assert.equal((await env.ctx.skills.get('desktop-skill')).invocation.userInvocable, false)
})
