import assert from 'node:assert/strict'
import { test } from 'node:test'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { Select, Toast } from '../lib/client/controls.js'

async function mount(t, component) {
  const dom = new JSDOM('<!doctype html><div id="app"></div><button id="outside">outside</button>', { pretendToBeVisual: true })
  const originals = new Map()
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  const root = createRoot(dom.window.document.getElementById('app'))
  await act(async () => { root.render(component) })
  t.after(async () => {
    await act(async () => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of originals) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]
  })
  return { dom, root, document: dom.window.document }
}

test('custom select supports keyboard selection, disabled options, typeahead, dismissal and focus', async t => {
  const changes = []
  const props = { label: '技能配置', value: 'first', options: [{ value: 'first', label: 'Alpha' }, { value: 'broken', label: 'Broken', disabled: true }, { value: 'last', label: 'Zeta' }], onChange: value => changes.push(value) }
  const { dom, root, document } = await mount(t, React.createElement(Select, props))
  const trigger = document.querySelector('[role="combobox"]')
  const key = async name => act(async () => trigger.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })))
  const active = () => document.getElementById(trigger.getAttribute('aria-activedescendant'))?.textContent
  const open = async () => act(async () => trigger.click())
  await key('ArrowDown')
  assert.equal(trigger.getAttribute('aria-expanded'), 'true')
  assert.equal(active(), 'Alpha')
  assert.equal(document.querySelector('[role="listbox"]').id, trigger.getAttribute('aria-controls'))
  await key('ArrowDown')
  assert.equal(active(), 'Zeta', 'navigation skips unavailable presets')
  await key('ArrowDown')
  assert.equal(active(), 'Alpha', 'navigation wraps')
  await key('ArrowUp')
  assert.equal(active(), 'Zeta')
  await key('Enter')
  assert.deepEqual(changes, ['last'])
  assert.equal(document.querySelector('[role="listbox"]'), null)
  assert.equal(document.activeElement, trigger)
  await open()
  await act(async () => document.querySelector('[aria-disabled="true"]').click())
  assert.deepEqual(changes, ['last'])
  assert.equal(trigger.getAttribute('aria-expanded'), 'true')
  await key('End')
  assert.equal(active(), 'Zeta')
  await key('Home')
  assert.equal(active(), 'Alpha')
  await key('z')
  assert.equal(active(), 'Zeta')
  await key('Escape')
  assert.equal(document.querySelector('[role="listbox"]'), null)
  await open()
  await key('Tab')
  assert.equal(document.querySelector('[role="listbox"]'), null)
  await open()
  await act(async () => document.getElementById('outside').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })))
  assert.equal(document.querySelector('[role="listbox"]'), null)
  await open()
  await act(async () => document.getElementById('outside').focus())
  assert.equal(document.querySelector('[role="listbox"]'), null)
  await open()
  await act(async () => root.render(React.createElement(Select, { ...props, disabled: true })))
  assert.equal(trigger.disabled, true)
  assert.equal(document.querySelector('[role="listbox"]'), null)
})

test('success notifications expire, pause during interaction and clean up timers on unmount; failures require dismissal', async t => {
  const { dom, root, document } = await mount(t, React.createElement(Toast, { messages: ['已启用 1 项技能'] }))
  const timers = new Map()
  let sequence = 0
  dom.window.setTimeout = (callback, delay) => { timers.set(++sequence, { callback, delay }); return sequence }
  dom.window.clearTimeout = id => timers.delete(id)
  await act(async () => root.render(React.createElement(Toast, { key: 'timed', messages: ['已关闭 1 项技能'] })))
  assert.equal(document.querySelector('[role="status"]').textContent, '已关闭 1 项技能')
  assert.equal([...timers.values()][0].delay, 4500)
  const close = document.querySelector('[aria-label="关闭操作通知"]')
  await act(async () => close.focus())
  assert.equal(timers.size, 0, 'focused notifications remain available')
  await act(async () => document.getElementById('outside').focus())
  assert.equal(timers.size, 1)
  await act(async () => [...timers.values()][0].callback())
  assert.equal(document.querySelector('[role="status"]'), null)
  assert.equal(timers.size, 0)
  await act(async () => root.render(React.createElement(Toast, { key: 'next', messages: ['已启用 1 项技能'] })))
  assert.equal(timers.size, 1)
  await act(async () => root.render(React.createElement(Toast, { key: 'error', error: true, messages: ['demo：操作失败', 'other：文件已修改'] })))
  assert.equal(timers.size, 0, 'previous timer is cleaned up and errors do not expire')
  assert.ok(document.querySelector('[role="alert"]').textContent.includes('other：文件已修改'))
  await act(async () => document.querySelector('[aria-label="关闭错误通知"]').click())
  assert.equal(document.querySelector('[role="alert"]'), null)
})
