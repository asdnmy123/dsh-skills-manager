import { useEffect, useRef, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { Action, SkillRow } from '../protocol.js'
import type { State } from './model.js'

export interface PageInjected {
  useManager: <T>(selector: (state: State) => T) => T
  refresh: (cwd?: string) => Promise<void>
  mutate: (action: Action, rows: SkillRow[]) => Promise<void>
}
type Props = PropsRuntime<'main'> & PageInjected
const SOURCES: Record<string, string> = { 'project-dsh': '项目 · dsh', 'project-agents': '项目 · agents', 'user-dsh': '个人 · dsh', 'user-agents': '个人 · agents', custom: '自定义', bundled: '系统', runtime: '运行时' }
const bucket = (source: string) => source.startsWith('project-') ? 'project' : source.startsWith('user-') ? 'personal' : source === 'bundled' ? 'system' : 'other'
const tabs = [{ id: 'all', label: '全部' }, { id: 'personal', label: '个人' }, { id: 'project', label: '项目' }, { id: 'system', label: '系统' }, { id: 'other', label: '其他来源' }]

export function SkillIcon({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5" stroke="currentColor" strokeWidth="1.6"/></svg>
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function DeleteDialog({ rows, onCancel, onConfirm }: { rows: SkillRow[]; onCancel: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { previous?.focus() }
  }, [])
  return <div className="dsm-dialog-shade" onClick={event => { if (event.target === event.currentTarget) onCancel() }}>
    <div ref={dialog} className="dsm-dialog" role="dialog" aria-modal="true" aria-labelledby="dsm-delete-title" aria-describedby="dsm-delete-description" onKeyDown={event => {
      if (event.key === 'Escape') onCancel()
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }}>
      <h2 id="dsm-delete-title">删除 {rows.length} 项技能？</h2>
      <p id="dsm-delete-description">所选技能将从目录中移除，其文件和资源会移入原技能目录的回收文件夹。后续调用将不再加载它们。</p>
      <ul>{rows.map(row => <li key={row.id}><strong>{row.name}</strong><div className="dsm-meta">{row.path}</div></li>)}</ul>
      <div className="dsm-dialog-actions"><button className="dsm-btn" onClick={onCancel}>取消</button><button className="dsm-btn danger" onClick={onConfirm}>确认删除</button></div>
    </div>
  </div>
}

export function SkillsPage({ useManager, useWorkspaces, refresh, mutate }: Props) {
  const state = useManager(value => value)
  const workspaces = useWorkspaces(value => value.items)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<SkillRow[] | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    void refresh()
    const focus = () => { void refresh() }
    window.addEventListener('focus', focus)
    return () => { mounted.current = false; window.removeEventListener('focus', focus) }
  }, [refresh])
  useEffect(() => { setSelected(new Set()); setDeleting(null) }, [state.cwd])
  const blocked = state.busy || state.status !== 'ready' || !state.catalog.complete
  const visible = state.catalog.skills.filter(row => (tab === 'all' || bucket(row.source) === tab)
    && (status === 'all' || row.enabled === (status === 'enabled'))
    && `${row.name} ${row.description} ${row.provider} ${row.source}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const selectedRows = visible.filter(row => selected.has(row.id) && row.manageable)
  const groups = [...new Set(visible.map(row => row.source))]
  const selectRows = (rows: SkillRow[]) => setSelected(previous => {
    const next = new Set(previous)
    const manageable = rows.filter(row => row.manageable)
    const all = manageable.every(row => next.has(row.id))
    for (const row of manageable) all ? next.delete(row.id) : next.add(row.id)
    return next
  })
  const run = async (action: Action, rows: SkillRow[]) => {
    setDeleting(null)
    await mutate(action, rows)
    if (mounted.current) setSelected(new Set())
  }
  return <section className="dsm" aria-label="技能管理"><div className="dsm-inner">
    <header className="dsm-head"><div><h1>技能</h1><p className="dsm-sub">管理你的技能，让每次任务拥有合适的能力。</p></div>
      <div className="dsm-tools"><label className="dsm-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.6"/></svg><input aria-label="搜索技能" placeholder="搜索技能" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <button className="dsm-icon-btn" aria-label="刷新技能" title="刷新技能" disabled={state.busy || state.status === 'loading'} onClick={() => void refresh()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
    </header>
    <div className="dsm-scope"><label>查看范围 <select aria-label="查看范围" value={state.cwd} disabled={state.busy} onChange={event => void refresh(event.target.value)}><option value="">全局技能</option>{workspaces.map(workspace => <option key={workspace.workspaceId} value={workspace.path}>{workspace.title}</option>)}</select></label><label>状态 <select aria-label="技能状态" value={status} onChange={event => { setStatus(event.target.value); setSelected(new Set()) }}><option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已关闭</option></select></label></div>
    <nav className="dsm-filters" aria-label="技能来源">{tabs.map(item => <button key={item.id} className="dsm-pill" aria-pressed={tab === item.id} onClick={() => { setTab(item.id); setSelected(new Set()) }}>{item.label}<span className="dsm-count">{state.catalog.skills.filter(row => item.id === 'all' || bucket(row.source) === item.id).length}</span></button>)}</nav>
    <div aria-live="polite">{state.notice && <div className="dsm-message success" role="status">{state.notice}</div>}{state.failures.length > 0 && <div className="dsm-message error" role="alert">{state.failures.map((failure, index) => <div key={index}>{failure}</div>)}</div>}</div>
    {state.error && <div className="dsm-message error" role="alert">{state.error} <button className="dsm-link" onClick={() => void refresh()}>重试</button></div>}
    {state.status === 'loading' && <div className="dsm-message" role="status">正在加载技能…</div>}
    {state.status === 'ready' && !state.catalog.complete && <div className="dsm-message error" role="alert">部分技能来源暂不可用，当前列表可能不完整。请刷新后再进行管理操作。</div>}
    {groups.map(source => { const rows = visible.filter(row => row.source === source); return <section className="dsm-group" key={source} aria-label={SOURCES[source] ?? source}>
      <div className="dsm-group-head"><h2>{SOURCES[source] ?? source}<span className="dsm-count">{rows.length} 项</span></h2>{rows.some(row => row.manageable) && <button className="dsm-link" disabled={blocked} onClick={() => selectRows(rows)}>{rows.filter(row => row.manageable).every(row => selected.has(row.id)) ? '取消选择' : '选择此组'}</button>}</div>
      <div className="dsm-grid">{rows.map(row => <article key={row.id} className={`dsm-row ${row.enabled ? '' : 'disabled'} ${selected.has(row.id) ? 'selected' : ''}`}>
        <input className="dsm-check" type="checkbox" aria-label={`选择 ${row.name}`} checked={selected.has(row.id)} disabled={blocked || !row.manageable} onChange={() => selectRows([row])}/>
        <div className="dsm-skill-icon"><SkillIcon/></div><div className="dsm-copy"><div className="dsm-name" title={row.name}>{row.name}</div><div className="dsm-desc" title={row.description}>{row.description}</div><div className="dsm-meta" title={row.path ?? row.provider}>{row.enabled ? '已启用' : '已关闭'} · {row.provider}{row.enabled && (!row.invocation.modelInvocable || !row.invocation.userInvocable) ? row.invocation.modelInvocable ? ' · 仅模型调用' : ' · 仅手动调用' : ''}</div></div>
        <div className="dsm-row-actions">{row.manageable ? <><button className="dsm-switch" role="switch" aria-label={`${row.enabled ? '关闭' : '启用'} ${row.name}`} aria-checked={row.enabled} disabled={blocked} onClick={() => void run(row.enabled ? 'disable' : 'enable', [row])}><span/></button><button className="dsm-icon-btn dsm-delete" aria-label={`删除 ${row.name}`} title="删除技能" disabled={blocked} onClick={() => setDeleting([row])}><TrashIcon/></button></> : <span className="dsm-readonly" title={row.reason}>只读</span>}</div>
      </article>)}</div>
    </section> })}
    {visible.length === 0 && state.status === 'ready' && <div className="dsm-empty"><SkillIcon size={32}/><strong>{state.catalog.skills.length ? '没有匹配的技能' : '还没有加载技能'}</strong><span>{state.catalog.skills.length ? '试试其他关键词或筛选条件。' : '将技能放入 dsh 或 agents 的 skills 目录，然后刷新。'}</span></div>}
    <p className="dsm-note">列表显示当前范围中生效的技能；同名技能按 dsh 的来源优先级取一项。开关影响后续调用，已注入对话的内容会保留。</p>
    {selectedRows.length > 0 && <div className="dsm-bulk" aria-label="批量操作"><span>已选择 {selectedRows.length} 项 <button className="dsm-link" onClick={() => setSelected(new Set())}>清空</button></span><div className="dsm-bulk-actions"><button className="dsm-btn" disabled={blocked || selectedRows.length > 100} onClick={() => void run('enable', selectedRows)}>启用</button><button className="dsm-btn" disabled={blocked || selectedRows.length > 100} onClick={() => void run('disable', selectedRows)}>关闭</button><button className="dsm-btn danger" disabled={blocked || selectedRows.length > 100} onClick={() => setDeleting(selectedRows)}>删除</button></div></div>}
    {deleting && <DeleteDialog rows={deleting} onCancel={() => setDeleting(null)} onConfirm={() => { if (!blocked) void run('delete', deleting) }}/>}
  </div></section>
}
