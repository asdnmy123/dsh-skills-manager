import type { Context } from '@deepseek-ai/cordis'
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { PANEL_ID, type Action, type SkillRow } from '../protocol.js'
import { ManagerModel } from './model.js'
import { SkillIcon, SkillsPage } from './page.js'
import { styles } from './styles.js'

export const inject = ['slots', 'connection']
export function apply(ctx: Context) {
  const connection = ctx.get('connection') as unknown as { rpc: ClientConnectionRpc }
  const model = new ManagerModel(connection.rpc)
  const refresh = (cwd?: string) => model.refresh(cwd)
  const mutate = (action: Action, rows: SkillRow[]) => model.mutate(action, rows)
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.dshSkillsManager = 'styles'
    style.textContent = styles
    document.head.append(style)
    return () => { style.remove(); model.dispose() }
  }, 'skills manager: page lifetime')
  ctx.on('connection/reset', () => { void refresh() })
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID,
    inject: () => ({ hooks: { manager: model.source }, refresh, mutate }),
  }, SkillsPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 10, label: '技能' }, SkillIcon))
}
