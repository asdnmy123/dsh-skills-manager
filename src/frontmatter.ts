import { isMap, parseDocument } from 'yaml'
import { ManagerError } from './protocol.js'

const MARKER = 'dsh-skills-manager-state'
const MODEL = 'disable-model-invocation'
const USER = 'user-invocable'
type Flag = boolean | string | null
interface SavedPolicy { version: 1; model: Flag; user: Flag }

function flag(value: unknown): value is Flag {
  return value === null || typeof value === 'boolean' || value === 'true' || value === 'false'
}

/** Only the YAML header is serialized. The closing delimiter and body remain byte-for-byte intact. */
export function readHeader(raw: string) {
  const match = /^(---\r?\n)([\s\S]*?)(^---\r?$)/m.exec(raw)
  if (!match || match.index !== 0) throw new ManagerError('INVALID_SKILL', '技能缺少有效的 YAML 头部')
  const doc = parseDocument(match[2], { uniqueKeys: true })
  if (doc.errors.length || !isMap(doc.contents)) throw new ManagerError('INVALID_SKILL', '技能的 YAML 头部无效')
  // Converting also rejects recursive/excessive alias expansion before any mutation.
  doc.toJS({ maxAliasCount: 100 })
  const saved: unknown = doc.toJS({ maxAliasCount: 100 })[MARKER]
  if (saved !== undefined && (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1 || !('model' in saved) || !flag(saved.model) || !('user' in saved) || !flag(saved.user))) {
    throw new ManagerError('STATE_CONFLICT', '技能含有无法识别的开关记录，请先检查文件')
  }
  return { doc, saved: saved as SavedPolicy | undefined, prefix: match[1], suffix: raw.slice(match[1].length + match[2].length) }
}

export function setEnabled(raw: string, enabled: boolean): string {
  const { doc, saved, prefix, suffix } = readHeader(raw)
  const model = doc.has(MODEL) ? doc.get(MODEL) : null
  const user = doc.has(USER) ? doc.get(USER) : null
  if (!flag(model) || !flag(user)) throw new ManagerError('INVALID_SKILL', '调用策略必须为布尔值')
  const disabled = (model === true || model === 'true') && (user === false || user === 'false')
  if (enabled && saved) {
    if (!disabled) throw new ManagerError('STATE_CONFLICT', '调用策略已被外部修改，请刷新并检查技能文件')
    saved.model === null ? doc.delete(MODEL) : doc.set(MODEL, saved.model)
    saved.user === null ? doc.delete(USER) : doc.set(USER, saved.user)
    doc.delete(MARKER)
  } else if (enabled) {
    if (!disabled) return raw
    doc.set(MODEL, false)
    doc.set(USER, true)
  } else {
    if (disabled) return raw
    if (saved) throw new ManagerError('STATE_CONFLICT', '调用策略已被外部修改，请检查技能文件')
    doc.set(MARKER, { version: 1, model, user } satisfies SavedPolicy)
    doc.set(MODEL, true)
    doc.set(USER, false)
  }
  const header = doc.toString({ lineWidth: 0 })
  return prefix + (prefix.endsWith('\r\n') ? header.replace(/\n/g, '\r\n') : header) + suffix
}
