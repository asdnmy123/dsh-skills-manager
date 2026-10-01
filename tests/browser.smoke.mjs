import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { fixture } from './helpers.mjs'

test('isolated browser renders real lazy modules in light/dark and narrow layouts, and manages fixture skills', async t => {
  const env = await fixture(t)
  for (const [name, description, flags] of [
    ['code-review', '检查代码改动，发现正确性、回归和测试覆盖问题。', ''],
    ['document-writer', '创建清晰易读的文档，整理需求、设计与项目说明。', ''],
    ['github-trending', '发现 GitHub 上的热门项目和开发者。', ''],
    ['planning-with-files', '将任务拆解为步骤，并持续记录进度与发现。', 'disable-model-invocation: true\nuser-invocable: false\n'],
    ['frontend-design', '设计和实现简洁、细致的产品界面。', 'disable-model-invocation: true\nuser-invocable: false\n'],
    ['data-analysis', '探索数据、提取趋势，并生成清晰的图表。', ''],
  ]) await env.skill(name, { description, flags })
  env.ctx.skills.register({ name: 'office-tools', description: '随 dsh 提供的办公文档能力。', content: 'builtin', source: 'bundled' })
  const key = {}
  const presetService = await env.ctx.plugin({ name: 'browser-presets', apply(ctx) {
    ctx.reflect.provide('agentPresets', { defaultId: 'personal', async list() { return [{ id: 'personal', name: '默认配置' }] }, async acquireScope() { return { key, async [Symbol.asyncDispose]() {} } } })
  } })
  t.after(() => presetService.dispose())
  const vendor = await build({ entryPoints: ['tests/preview-entry.tsx'], bundle: true, write: false, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } })
  const asset = async name => await readFile(new URL(import.meta.resolve(name)), 'utf8')
  const theme = await asset('@deepseek-ai/dsh-client-ui-theme/client')
  const cssMatch = /var design_platform_css_default = ("(?:[^"\\]|\\.)*");/.exec(theme)
  assert.ok(cssMatch, 'Host theme token stylesheet')
  const assets = new Map([
    ['/vendor.js', vendor.outputFiles[0].text],
    ['/connection.js', await asset('@deepseek-ai/dsh-client-connection/client')],
    ['/renderer.js', await asset('@deepseek-ai/dsh-client-ui-renderer/client')],
    ['/client.js', await asset('dsh-skills-manager/client')],
  ])
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname
      if (path === '/') {
        if (!env.ctx.connection.authorizeIndex(req, res)) return
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.end(`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${JSON.parse(cssMatch[1])}body{margin:0}html,body,#app{height:100%}</style><div id="app"></div><script src="/vendor.js"></script><script src="/connection.js"></script><script src="/renderer.js"></script><script src="/client.js"></script><script>window.startPreview()</script></html>`)
        return
      }
      if (assets.has(path)) { res.setHeader('content-type', 'text/javascript'); res.end(assets.get(path)); return }
      const rejection = env.ctx.connection.requestRejection(req)
      if (rejection) { res.writeHead(rejection); res.end(); return }
      let body = ''
      for await (const chunk of req) body += chunk
      const response = await env.fetcher.fetch(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(body ? { body } : {}) }))
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(await response.text())
    } catch (error) { res.writeHead(500); res.end(String(error)) }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}/`
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  const executablePath = process.env.DSM_BROWSER_EXECUTABLE ?? (existsSync(edge) ? edge : chromium.executablePath())
  assert.ok(existsSync(executablePath), 'Install a test Chromium browser or set DSM_BROWSER_EXECUTABLE')
  const browser = await chromium.launch({ executablePath, headless: true })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(env.ctx.connection.authenticatedUrl(url))
  await page.getByRole('switch', { name: '关闭 code-review', exact: true }).waitFor()
  assert.equal(await page.locator('.dsm-row').count(), 7)
  assert.equal(await page.locator('.dsm-grid').first().evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 2)
  await mkdir('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/skills-desktop-light.png', fullPage: true, animations: 'disabled' })
  const filters = page.getByRole('combobox', { name: '技能状态', exact: true })
  const groupBeforeMenu = await page.locator('.dsm-group').first().boundingBox()
  await filters.click()
  await page.getByRole('listbox', { name: '技能状态', exact: true }).waitFor()
  assert.equal(await page.locator('.dsm-select-menu').evaluate(node => getComputedStyle(node).position), 'absolute')
  assert.equal((await page.locator('.dsm-group').first().boundingBox()).y, groupBeforeMenu.y)
  await page.screenshot({ path: 'artifacts/skills-dropdown-light.png', fullPage: true, animations: 'disabled' })
  await filters.press('End')
  await filters.press('Enter')
  assert.equal(await page.locator('.dsm-row').count(), 2)
  await filters.click()
  await filters.press('Home')
  await filters.press('Enter')
  assert.equal(await page.locator('.dsm-row').count(), 7)
  const checkbox = page.getByRole('checkbox', { name: '选择 code-review', exact: true })
  assert.equal(await checkbox.evaluate(node => getComputedStyle(node).appearance), 'none')
  await checkbox.focus()
  await checkbox.press('Space')
  assert.equal(await checkbox.isChecked(), true)
  await page.screenshot({ path: 'artifacts/skills-checkbox-light.png', fullPage: true, animations: 'disabled' })
  await checkbox.press('Space')
  assert.equal(await checkbox.isChecked(), false)
  const light = await page.locator('.dsm').evaluate(node => getComputedStyle(node).backgroundColor)
  await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
  const dark = await page.locator('.dsm').evaluate(node => getComputedStyle(node).backgroundColor)
  assert.notEqual(dark, light)
  await page.screenshot({ path: 'artifacts/skills-desktop-dark.png', fullPage: true, animations: 'disabled' })
  await filters.click()
  assert.equal(await page.locator('.dsm-select-menu').evaluate(node => getComputedStyle(node).backgroundColor), dark)
  await page.screenshot({ path: 'artifacts/skills-dropdown-dark.png', fullPage: true, animations: 'disabled' })
  await filters.press('Escape')
  await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
  await page.setViewportSize({ width: 480, height: 850 })
  assert.equal(await page.locator('.dsm-grid').first().evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 1)
  assert.ok(await page.locator('.dsm').evaluate(node => node.scrollWidth <= node.clientWidth))
  await page.screenshot({ path: 'artifacts/skills-mobile.png', fullPage: true, animations: 'disabled' })
  const scope = page.getByRole('combobox', { name: '查看范围', exact: true })
  await scope.click()
  const scrollBeforeNavigation = await page.locator('.dsm').evaluate(node => node.scrollTop)
  assert.equal(await page.getByRole('option').count(), 25)
  await scope.press('End')
  assert.ok(await page.locator('.dsm-select-menu').evaluate(node => node.scrollTop > 0))
  assert.equal(await page.locator('.dsm').evaluate(node => node.scrollTop), scrollBeforeNavigation, 'menu navigation scrolls only the options')
  const menuBounds = await page.locator('.dsm-select-menu').boundingBox()
  assert.ok(menuBounds.x >= 0 && menuBounds.x + menuBounds.width <= 480)
  await page.screenshot({ path: 'artifacts/skills-workspaces-mobile.png', fullPage: true, animations: 'disabled' })
  assert.ok(await page.locator('.dsm').evaluate(node => node.scrollWidth <= node.clientWidth))
  await scope.press('Escape')
  await page.setViewportSize({ width: 320, height: 850 })
  await scope.click()
  const narrowMenu = await page.locator('.dsm-select-menu').boundingBox()
  assert.ok(narrowMenu.x >= 0 && narrowMenu.x + narrowMenu.width <= 320)
  assert.ok(await page.locator('.dsm').evaluate(node => node.scrollWidth <= node.clientWidth))
  await scope.press('Escape')
  await page.setViewportSize({ width: 480, height: 850 })
  await page.getByRole('textbox', { name: '搜索技能' }).fill('code-review')
  assert.equal(await page.locator('.dsm-row').count(), 1)
  await page.clock.install()
  const groupBeforeToast = await page.locator('.dsm-group').first().boundingBox()
  await page.getByRole('switch', { name: '关闭 code-review', exact: true }).click()
  await page.getByRole('switch', { name: '启用 code-review', exact: true }).waitFor()
  await page.locator('.dsm-toast').waitFor()
  assert.equal(await page.locator('.dsm-toasts').evaluate(node => getComputedStyle(node).position), 'fixed')
  assert.equal((await page.locator('.dsm-group').first().boundingBox()).y, groupBeforeToast.y, 'notification must not shift the skill list')
  const notification = await page.locator('.dsm-toast').boundingBox()
  assert.ok(notification.x >= 0 && notification.x + notification.width <= 480, 'notification fits the narrow viewport')
  await page.screenshot({ path: 'artifacts/skills-toast-mobile.png', fullPage: true, animations: 'disabled' })
  await page.mouse.move(0, 0)
  await page.clock.fastForward(4600)
  assert.equal(await page.locator('.dsm-toast').count(), 0, 'success expires automatically')
  assert.equal((await page.locator('.dsm-group').first().boundingBox()).y, groupBeforeToast.y)
  assert.equal((await env.ctx.skills.get('code-review')).invocation.modelInvocable, false)
  await page.getByRole('switch', { name: '启用 code-review', exact: true }).click()
  await page.getByRole('switch', { name: '关闭 code-review', exact: true }).waitFor()
  await page.getByRole('button', { name: '关闭操作通知', exact: true }).click()
  assert.equal(await page.locator('.dsm-toast').count(), 0, 'success can be dismissed')
  await page.getByRole('button', { name: '删除 code-review', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  assert.equal(await page.getByRole('dialog').count(), 0)
  await page.getByRole('button', { name: '删除 code-review', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await page.getByText('没有匹配的技能', { exact: true }).waitFor()
  assert.equal((await env.list()).skills.some(row => row.name === 'code-review'), false)
  assert.deepEqual(errors, [])
})
