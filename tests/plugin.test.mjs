import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { test } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { parse } from 'yaml'
import * as plugin from 'dsh-skills-manager'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))

test('built package exposes a typed Cordis plugin through its public entry', async () => {
  assert.equal(plugin.name, manifest.name)
  assert.equal(typeof plugin.apply, 'function')
  await access(new URL(manifest.exports['.'].default, root))
  await access(new URL(manifest.exports['.'].types, root))
})

test('Cordis can load, unload and load the plugin again', async (t) => {
  const ctx = new Context()
  const first = await ctx.plugin(plugin)
  t.after(() => first.dispose())
  assert.equal(first.name, plugin.name)
  assert.ok(ctx.registry.has(plugin))

  await first.dispose()
  assert.equal(first.uid, null)
  assert.equal(ctx.registry.has(plugin), false)

  const second = await ctx.plugin(plugin)
  t.after(() => second.dispose())
  assert.ok(ctx.registry.has(plugin))
  assert.notEqual(second.uid, null)
  await second.dispose()
  assert.equal(ctx.registry.has(plugin), false)
})

test('bundle manifest points to a valid patch that loads the public package', async () => {
  const patchPath = manifest.dsh.bundle.patch
  assert.ok(manifest.files.includes(patchPath.replace(/^\.\//, '')))
  const patch = parse(await readFile(new URL(patchPath, root), 'utf8'))
  assert.ok(Array.isArray(patch))
  assert.equal(patch.length, 1)
  assert.equal(patch[0].insert.length, 1)
  const entry = patch[0].insert[0]
  assert.equal(entry.id, plugin.name)
  assert.equal(entry.name, manifest.name)
  const loaded = await import(entry.name)
  assert.equal(loaded.apply, plugin.apply)
})
