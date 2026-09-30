import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, isAbsolute } from 'node:path'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { webcrypto } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem'
import * as connection from '@deepseek-ai/dsh-client-connection'
import * as plugin from 'dsh-skills-manager'

export async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-skills-manager-'))
  const config = { dshHome: join(dir, 'dsh'), agentsHome: join(dir, 'agents'), customSkillDirs: [join(dir, 'custom')] }
  const ctx = new Context()
  const fibers = []
  let credential
  fibers.push(await ctx.plugin({ name: 'memory-credentials', apply(ctx) {
    ctx.reflect.provide('credentials', { async modifyRecord(_key, update) {
      const next = await update(credential)
      if (next !== undefined) credential = next
      return credential
    } })
  } }))
  fibers.push(await ctx.plugin(connection))
  fibers.push(await ctx.plugin(SkillRegistry))
  fibers.push(await ctx.plugin(filesystem, { ...config, watch: false, ...options.filesystem }))
  let manager = await ctx.plugin(plugin, { ...config, ...options.manager })
  const fetcher = ctx.connection.createSharedFetchHandler('/api')
  let sequence = 0
  const rpc = { async call(channel, endpoint, payload, signal) {
    const rpcId = String(++sequence)
    const response = await fetcher.fetch(new Request(`http://127.0.0.1${channel}/${endpoint}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal,
      body: JSON.stringify({ type: 'client-request', rpcId, method: endpoint, payload }),
    }))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const envelope = await response.json()
    if (envelope.type !== 'server-response' || envelope.rpcId !== rpcId) throw new Error('Invalid RPC correlation')
    return envelope.result
  } }
  t?.after(async () => {
    await manager.dispose()
    for (const fiber of fibers.reverse()) await fiber.dispose()
    const rel = relative(tmpdir(), dir)
    if (isAbsolute(rel) || !rel.startsWith('dsh-skills-manager-') || rel.includes('..')) throw new Error('Unexpected fixture root')
    await rm(dir, { recursive: true, force: true })
  })
  return {
    dir, ctx, config, rpc, fetcher, plugin,
    get manager() { return manager },
    async reload() { await manager.dispose(); manager = await ctx.plugin(plugin, { ...config, ...options.manager }); return manager },
    async list(cwd = '') { const result = await rpc.call('/api', 'dsh-skills-manager/list', { cwd }); if (!result.ok) throw new Error(result.error.message); return result.value },
    async mutate(action, rows, cwd = '') { return rpc.call('/api', 'dsh-skills-manager/mutate', { action, cwd, targets: rows.map(row => ({ id: row.id, revision: row.revision })) }) },
    async skill(name, { source = 'user-dsh', flat = false, flags = '', description = `Instructions for ${name}`, filename } = {}) {
      const root = source === 'user-agents' ? join(config.agentsHome, 'skills') : source === 'custom' ? config.customSkillDirs[0] : join(config.dshHome, 'skills')
      const path = flat ? join(root, filename ?? `${name}.md`) : join(root, name, 'SKILL.md')
      await mkdir(flat ? root : join(root, name), { recursive: true })
      const content = `---\n# keep this comment\nname: ${name}\ndescription: ${description}\n${flags}---\n\n# ${name}\n\nBody stays intact.\n`
      await writeFile(path, content)
      return { path, content, root }
    },
  }
}

export async function loadClient(specifier, globals = {}) {
  const require = createRequire(import.meta.url)
  let entry
  const loader = { load(value) { entry = value } }
  const sandbox = { console, setTimeout, clearTimeout, AbortController, AbortSignal, crypto: webcrypto, ...globals, __ModuleLoader__: loader }
  sandbox.window = globals.window ?? sandbox
  sandbox.window.__ModuleLoader__ = loader
  const path = specifier.startsWith('file:') ? new URL(specifier) : new URL(import.meta.resolve(specifier))
  runInNewContext(await readFile(path, 'utf8'), sandbox, { filename: path.pathname })
  if (!entry) throw new Error('No lazy module factory')
  return { id: entry.id, exports: entry.factory(require) }
}
