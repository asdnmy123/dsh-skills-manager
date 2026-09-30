import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { CHANNEL, ENDPOINT, type Action, type Catalog, type MutationResult, type SkillRow } from '../protocol.js'

export interface State {
  catalog: Catalog
  status: 'loading' | 'ready' | 'error'
  cwd: string
  busy: boolean
  error?: string
  notice?: string
  failures: string[]
}

/** Stable snapshot source projected into the main slot by its injection factory. */
export class ManagerModel {
  private state: State = { catalog: { skills: [], complete: false }, status: 'loading', cwd: '', busy: false, failures: [] }
  private listeners = new Set<() => void>()
  private lifetime = new AbortController()
  private read?: AbortController
  private generation = 0
  constructor(private readonly rpc: ClientConnectionRpc) {}
  readonly source = { getSnapshot: () => this.state, subscribe: (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  } }
  private publish(update: Partial<State>) {
    if (this.lifetime.signal.aborted) return
    this.state = { ...this.state, ...update }
    for (const listener of this.listeners) listener()
  }
  async refresh(cwd = this.state.cwd) {
    if (this.state.busy || this.lifetime.signal.aborted) return
    this.read?.abort()
    const read = this.read = new AbortController()
    const generation = ++this.generation
    this.publish({ cwd, status: 'loading', error: undefined, ...(cwd !== this.state.cwd ? { catalog: { skills: [], complete: false }, notice: undefined, failures: [] } : {}) })
    try {
      const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/list`, { cwd }, AbortSignal.any([read.signal, this.lifetime.signal]))
      if (generation !== this.generation || read.signal.aborted) return
      if (!response.ok) throw new Error(response.error.message)
      this.publish({ status: 'ready', catalog: response.value as Catalog })
    } catch (error) {
      if (!read.signal.aborted && generation === this.generation) this.publish({ status: 'error', error: error instanceof Error ? error.message : '无法连接技能管理服务' })
    }
  }
  async mutate(action: Action, rows: SkillRow[]) {
    if (this.state.busy || this.state.status !== 'ready' || !this.state.catalog.complete || !rows.length || this.lifetime.signal.aborted) return
    this.read?.abort()
    ++this.generation
    this.publish({ busy: true, error: undefined, notice: undefined, failures: [] })
    try {
      const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/mutate`, { cwd: this.state.cwd, action, targets: rows.map(row => ({ id: row.id, revision: row.revision })) }, this.lifetime.signal)
      if (!response.ok) throw new Error(response.error.message)
      const result = response.value as MutationResult
      const successes = result.results.filter(row => row.ok).length
      const failures = result.results.filter(row => !row.ok).map(row => `${row.name}：${row.message}`)
      this.publish({ notice: successes ? `${action === 'enable' ? '已启用' : action === 'disable' ? '已关闭' : '已移入回收目录'} ${successes} 项技能` : undefined, failures })
    } catch (error) { this.publish({ failures: [error instanceof Error ? error.message : '操作失败'] }) }
    finally { this.publish({ busy: false }); await this.refresh() }
  }
  dispose() { this.lifetime.abort(); this.read?.abort(); this.listeners.clear() }
}
