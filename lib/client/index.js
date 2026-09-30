import { PANEL_ID } from '../protocol.js';
import { ManagerModel } from './model.js';
import { SkillIcon, SkillsPage } from './page.js';
import { styles } from './styles.js';
export const inject = ['slots', 'connection'];
export function apply(ctx) {
    const connection = ctx.get('connection');
    const model = new ManagerModel(connection.rpc);
    const refresh = (cwd, preset) => model.refresh(cwd, preset);
    const mutate = (action, rows) => model.mutate(action, rows);
    ctx.effect(() => {
        const style = document.createElement('style');
        style.dataset.dshSkillsManager = 'styles';
        style.textContent = styles;
        document.head.append(style);
        return () => { style.remove(); model.dispose(); };
    }, 'skills manager: page lifetime');
    ctx.on('connection/reset', () => { void refresh(); });
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID,
        inject: () => ({ hooks: { manager: model.source }, refresh, mutate }),
    }, SkillsPage));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 10, label: '技能' }, SkillIcon));
}
