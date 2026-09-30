import type { Context } from '@deepseek-ai/cordis'
import type { HostConnectionHandle } from '@deepseek-ai/dsh-client-connection'
import type { SkillRegistry } from '@deepseek-ai/dsh-skill'
import { SkillsManager, type Config, type PresetAccess } from './manager.js'
import { ENDPOINT, ManagerError, type MutationRequest } from './protocol.js'

export type { Config } from './manager.js'
export const inject = ['skills', 'connection']

export const name = 'dsh-skills-manager'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ManagerError('BAD_REQUEST', '请求必须是对象')
  return value as Record<string, unknown>
}

function cwdOf(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || value.length > 4096 || value.includes('\0') || !/^(?:[a-z]:[\\/]|\/|\\\\)/i.test(value)) {
    throw new ManagerError('BAD_REQUEST', '工作区必须是绝对目录路径')
  }
  return value
}

export function parseMutation(value: unknown): MutationRequest {
  const payload = object(value)
  if (typeof payload.action !== 'string' || !['enable', 'disable', 'delete'].includes(payload.action)) throw new ManagerError('BAD_REQUEST', '未知操作')
  if (!Array.isArray(payload.targets) || !payload.targets.length || payload.targets.length > 100) throw new ManagerError('BAD_REQUEST', '每次请选择 1 至 100 项技能')
  const targets = payload.targets.map(value => {
    const target = object(value)
    if (typeof target.id !== 'string' || !/^[a-f0-9]{64}$/.test(target.id) || typeof target.revision !== 'string' || !/^[a-f0-9]{64}$/.test(target.revision)) {
      throw new ManagerError('BAD_REQUEST', '技能标识或版本无效')
    }
    return { id: target.id, revision: target.revision }
  })
  if (new Set(targets.map(target => target.id)).size !== targets.length) throw new ManagerError('BAD_REQUEST', '不能重复选择同一技能')
  return { action: payload.action as MutationRequest['action'], targets, cwd: cwdOf(payload.cwd), preset: presetOf(payload.preset) }
}

function presetOf(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 256 || value.includes('\0')) throw new ManagerError('BAD_REQUEST', '技能配置范围无效')
  return value
}

/** Register an authenticated logical API, shared by Electron IPC and browser carriers. */
export function apply(ctx: Context, config: Config = {}): void {
  const skills = ctx.get('skills') as SkillRegistry
  const connection = ctx.get('connection') as HostConnectionHandle
  let invalidate: () => void = () => undefined
  // An empty provider owns the public invalidation capability, without replacing any skill provider.
  skills.registerProvider(control => {
    invalidate = control.invalidate
    return { name: 'dsh-skills-manager-refresh', list: async () => [], get: async () => undefined }
  })
  const manager = new SkillsManager(skills, () => invalidate(), config, () => ctx.get('agentPresets') as PresetAccess | undefined)
  ctx.effect(() => () => manager.dispose(), 'skills manager: pending operations')
  for (const operation of ['list', 'mutate'] as const) {
    const endpoint = `${ENDPOINT}/${operation}`
    // Exact Fetch routes coexist with the singleton shared-channel RPC interceptor.
    // Connection's browser/desktop carrier owns authentication; this route owns the standard envelope.
    connection.fetch.register({ path: `/api/${endpoint}`, methods: ['POST'], requestBody: 'buffered', async fetch(request) {
      let rpcId = ''
      try {
        if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new ManagerError('BAD_REQUEST', '需要 JSON 请求')
        const body = await request.text()
        if (Buffer.byteLength(body) > 65536) throw new ManagerError('BAD_REQUEST', '请求体过大')
        const envelope = object(JSON.parse(body))
        if (typeof envelope.rpcId !== 'string' || envelope.rpcId.length > 256 || envelope.type !== 'client-request') throw new ManagerError('BAD_REQUEST', 'RPC 请求格式无效')
        rpcId = envelope.rpcId
        if (envelope.method !== endpoint) throw new ManagerError('BAD_REQUEST', 'RPC 接口与请求路径不一致')
        const payload = object(envelope.payload)
        const value = operation === 'list' ? await manager.list(cwdOf(payload.cwd), request.signal, presetOf(payload.preset)) : await manager.mutate(parseMutation(payload), request.signal)
        return Response.json({ type: 'server-response', rpcId, result: { ok: true, value } }, { headers: { 'cache-control': 'no-store' } })
      } catch (error) {
        return Response.json({ type: 'server-response', rpcId, result: { ok: false, error: { code: error instanceof ManagerError ? error.code : 'MANAGER_FAILED', message: error instanceof Error ? error.message : String(error), details: {} } } }, { headers: { 'cache-control': 'no-store' } })
      }
    } })
  }
}
