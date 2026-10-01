import { useEffect, useId, useRef, useState } from 'react'

interface Option { value: string; label: string; disabled?: boolean }

export function Select({ label, value, options, disabled, onChange }: {
  label: string; value: string; options: Option[]; disabled?: boolean; onChange: (value: string) => void
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef({ text: '', time: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const current = options.findIndex(option => option.value === value)
  const available = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0)
  const show = () => { setActive(available.includes(current) ? current : available[0] ?? 0); setOpen(true) }
  const choose = (index: number) => {
    if (!options[index] || options[index].disabled) return
    onChange(options[index].value)
    setOpen(false)
    trigger.current?.focus()
  }
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])
  useEffect(() => {
    if (!open) return
    const option = document.getElementById(`${id}-${active}`)
    const menu = option?.parentElement
    if (!option || !menu) return
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight
  }, [open, active, id])
  return <div className="dsm-select" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <span className="dsm-select-label" id={`${id}-label`}>{label}</span>
    <button ref={trigger} className="dsm-select-trigger" type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={disabled} onClick={() => open ? setOpen(false) : show()} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
      if (event.key === 'Tab') { setOpen(false); return }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        if (!open) { show(); return }
        const position = available.indexOf(active)
        setActive(event.key === 'Home' ? available[0] ?? 0 : event.key === 'End' ? available.at(-1) ?? 0 : available[(position + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length] ?? 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (open) choose(active); else show()
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        const now = Date.now()
        const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase()
        search.current = { text, time: now }
        const match = available.find(index => options[index].label.toLocaleLowerCase().startsWith(text))
        if (!open) show()
        if (match !== undefined) setActive(match)
      }
    }}><span title={options[current]?.label}>{options[current]?.label ?? '请选择'}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    {open && <div className="dsm-select-menu" id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}>{options.map((option, index) => <div className={`dsm-select-option ${active === index ? 'active' : ''}`} key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value} aria-disabled={!!option.disabled} onPointerMove={() => { if (!option.disabled) setActive(index) }} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}><span title={option.label}>{option.label}</span>{option.value === value && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>)}</div>}
  </div>
}

export function Toast({ messages, error = false }: { messages: string[]; error?: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (error || paused || dismissed) return
    const timeout = window.setTimeout(() => setDismissed(true), 4500)
    return () => window.clearTimeout(timeout)
  }, [error, paused, dismissed])
  if (dismissed) return null
  return <div className={`dsm-toast ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'} aria-atomic="true" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <svg className="dsm-toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>{error ? <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> : <path d="m7.5 12 3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}</svg>
    <div className="dsm-toast-copy">{messages.map((message, index) => <div key={index}>{message}</div>)}</div>
    <button className="dsm-icon-btn dsm-toast-close" aria-label={error ? '关闭错误通知' : '关闭操作通知'} onClick={() => setDismissed(true)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></button>
  </div>
}
