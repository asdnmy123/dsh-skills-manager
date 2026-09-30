import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
const SOURCES = { 'project-dsh': '项目 · dsh', 'project-agents': '项目 · agents', 'user-dsh': '个人 · dsh', 'user-agents': '个人 · agents', custom: '自定义', bundled: '系统', runtime: '运行时' };
const bucket = (source) => source.startsWith('project-') ? 'project' : source.startsWith('user-') ? 'personal' : source === 'bundled' ? 'system' : 'other';
const tabs = [{ id: 'all', label: '全部' }, { id: 'personal', label: '个人' }, { id: 'project', label: '项目' }, { id: 'system', label: '系统' }, { id: 'other', label: '其他来源' }];
export function SkillIcon({ size = 21 }) {
    return _jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "m12 2 9 5v10l-9 5-9-5V7l9-5Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }), _jsx("path", { d: "m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5", stroke: "currentColor", strokeWidth: "1.6" })] });
}
function TrashIcon() {
    return _jsx("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) });
}
function DeleteDialog({ rows, onCancel, onConfirm }) {
    const dialog = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        dialog.current?.querySelector('button')?.focus();
        return () => { previous?.focus(); };
    }, []);
    return _jsx("div", { className: "dsm-dialog-shade", onClick: event => { if (event.target === event.currentTarget)
            onCancel(); }, children: _jsxs("div", { ref: dialog, className: "dsm-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dsm-delete-title", "aria-describedby": "dsm-delete-description", onKeyDown: event => {
                if (event.key === 'Escape')
                    onCancel();
                if (event.key === 'Tab') {
                    const buttons = dialog.current?.querySelectorAll('button');
                    if (!buttons?.length)
                        return;
                    const first = buttons[0], last = buttons[buttons.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    }
                    if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }, children: [_jsxs("h2", { id: "dsm-delete-title", children: ["\u5220\u9664 ", rows.length, " \u9879\u6280\u80FD\uFF1F"] }), _jsx("p", { id: "dsm-delete-description", children: "\u6240\u9009\u6280\u80FD\u5C06\u4ECE\u76EE\u5F55\u4E2D\u79FB\u9664\uFF0C\u5176\u6587\u4EF6\u548C\u8D44\u6E90\u4F1A\u79FB\u5165\u539F\u6280\u80FD\u76EE\u5F55\u7684\u56DE\u6536\u6587\u4EF6\u5939\u3002\u540E\u7EED\u8C03\u7528\u5C06\u4E0D\u518D\u52A0\u8F7D\u5B83\u4EEC\u3002" }), _jsx("ul", { children: rows.map(row => _jsxs("li", { children: [_jsx("strong", { children: row.name }), _jsx("div", { className: "dsm-meta", children: row.path })] }, row.id)) }), _jsxs("div", { className: "dsm-dialog-actions", children: [_jsx("button", { className: "dsm-btn", onClick: onCancel, children: "\u53D6\u6D88" }), _jsx("button", { className: "dsm-btn danger", onClick: onConfirm, children: "\u786E\u8BA4\u5220\u9664" })] })] }) });
}
export function SkillsPage({ useManager, useWorkspaces, refresh, mutate }) {
    const state = useManager(value => value);
    const workspaces = useWorkspaces(value => value.items);
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('all');
    const [status, setStatus] = useState('all');
    const [selected, setSelected] = useState(new Set());
    const [deleting, setDeleting] = useState(null);
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
        void refresh();
        const focus = () => { void refresh(); };
        window.addEventListener('focus', focus);
        return () => { mounted.current = false; window.removeEventListener('focus', focus); };
    }, [refresh]);
    useEffect(() => { setSelected(new Set()); setDeleting(null); }, [state.cwd, state.preset]);
    const blocked = state.busy || state.status !== 'ready' || !state.catalog.complete;
    const visible = state.catalog.skills.filter(row => (tab === 'all' || bucket(row.source) === tab)
        && (status === 'all' || row.enabled === (status === 'enabled'))
        && `${row.name} ${row.description} ${row.provider} ${row.source}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const selectedRows = visible.filter(row => selected.has(row.id) && row.manageable);
    const groups = [...new Set(visible.map(row => row.source))];
    const selectRows = (rows) => setSelected(previous => {
        const next = new Set(previous);
        const manageable = rows.filter(row => row.manageable);
        const all = manageable.every(row => next.has(row.id));
        for (const row of manageable)
            all ? next.delete(row.id) : next.add(row.id);
        return next;
    });
    const run = async (action, rows) => {
        setDeleting(null);
        await mutate(action, rows);
        if (mounted.current)
            setSelected(new Set());
    };
    return _jsx("section", { className: "dsm", "aria-label": "\u6280\u80FD\u7BA1\u7406", children: _jsxs("div", { className: "dsm-inner", children: [_jsxs("header", { className: "dsm-head", children: [_jsxs("div", { children: [_jsx("h1", { children: "\u6280\u80FD" }), _jsx("p", { className: "dsm-sub", children: "\u7BA1\u7406\u4F60\u7684\u6280\u80FD\uFF0C\u8BA9\u6BCF\u6B21\u4EFB\u52A1\u62E5\u6709\u5408\u9002\u7684\u80FD\u529B\u3002" })] }), _jsxs("div", { className: "dsm-tools", children: [_jsxs("label", { className: "dsm-search", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "10", cy: "10", r: "6.5", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "m15 15 5 5", stroke: "currentColor", strokeWidth: "1.6" })] }), _jsx("input", { "aria-label": "\u641C\u7D22\u6280\u80FD", placeholder: "\u641C\u7D22\u6280\u80FD", value: query, onChange: event => setQuery(event.target.value) })] }), _jsx("button", { className: "dsm-icon-btn", "aria-label": "\u5237\u65B0\u6280\u80FD", title: "\u5237\u65B0\u6280\u80FD", disabled: state.busy || state.status === 'loading', onClick: () => void refresh(), children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), _jsxs("div", { className: "dsm-scope", children: [!!state.catalog.presets?.length && _jsxs("label", { children: ["\u6280\u80FD\u914D\u7F6E ", _jsxs("select", { "aria-label": "\u6280\u80FD\u914D\u7F6E", value: state.preset ?? '', disabled: state.busy, onChange: event => void refresh(undefined, event.target.value), children: [_jsx("option", { value: "", children: "\u5BBF\u4E3B\u5168\u5C40" }), state.catalog.presets.map(preset => _jsxs("option", { value: preset.id, disabled: !!preset.broken, children: [preset.name ?? preset.id, preset.broken ? '（不可用）' : ''] }, preset.id))] })] }), _jsxs("label", { children: ["\u67E5\u770B\u8303\u56F4 ", _jsxs("select", { "aria-label": "\u67E5\u770B\u8303\u56F4", value: state.cwd, disabled: state.busy, onChange: event => void refresh(event.target.value), children: [_jsx("option", { value: "", children: "\u5168\u5C40\u6280\u80FD" }), workspaces.map(workspace => _jsx("option", { value: workspace.path, children: workspace.title }, workspace.workspaceId))] })] }), _jsxs("label", { children: ["\u72B6\u6001 ", _jsxs("select", { "aria-label": "\u6280\u80FD\u72B6\u6001", value: status, onChange: event => { setStatus(event.target.value); setSelected(new Set()); }, children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "enabled", children: "\u5DF2\u542F\u7528" }), _jsx("option", { value: "disabled", children: "\u5DF2\u5173\u95ED" })] })] })] }), _jsx("nav", { className: "dsm-filters", "aria-label": "\u6280\u80FD\u6765\u6E90", children: tabs.map(item => _jsxs("button", { className: "dsm-pill", "aria-pressed": tab === item.id, onClick: () => { setTab(item.id); setSelected(new Set()); }, children: [item.label, _jsx("span", { className: "dsm-count", children: state.catalog.skills.filter(row => item.id === 'all' || bucket(row.source) === item.id).length })] }, item.id)) }), _jsxs("div", { "aria-live": "polite", children: [state.notice && _jsx("div", { className: "dsm-message success", role: "status", children: state.notice }), state.failures.length > 0 && _jsx("div", { className: "dsm-message error", role: "alert", children: state.failures.map((failure, index) => _jsx("div", { children: failure }, index)) })] }), state.error && _jsxs("div", { className: "dsm-message error", role: "alert", children: [state.error, " ", _jsx("button", { className: "dsm-link", onClick: () => void refresh(), children: "\u91CD\u8BD5" })] }), state.status === 'loading' && _jsx("div", { className: "dsm-message", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u6280\u80FD\u2026" }), state.status === 'ready' && !state.catalog.complete && _jsx("div", { className: "dsm-message error", role: "alert", children: "\u90E8\u5206\u6280\u80FD\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u5217\u8868\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002\u8BF7\u5237\u65B0\u540E\u518D\u8FDB\u884C\u7BA1\u7406\u64CD\u4F5C\u3002" }), groups.map(source => {
                    const rows = visible.filter(row => row.source === source);
                    return _jsxs("section", { className: "dsm-group", "aria-label": SOURCES[source] ?? source, children: [_jsxs("div", { className: "dsm-group-head", children: [_jsxs("h2", { children: [SOURCES[source] ?? source, _jsxs("span", { className: "dsm-count", children: [rows.length, " \u9879"] })] }), rows.some(row => row.manageable) && _jsx("button", { className: "dsm-link", disabled: blocked, onClick: () => selectRows(rows), children: rows.filter(row => row.manageable).every(row => selected.has(row.id)) ? '取消选择' : '选择此组' })] }), _jsx("div", { className: "dsm-grid", children: rows.map(row => _jsxs("article", { className: `dsm-row ${row.enabled ? '' : 'disabled'} ${selected.has(row.id) ? 'selected' : ''}`, children: [_jsx("input", { className: "dsm-check", type: "checkbox", "aria-label": `选择 ${row.name}`, checked: selected.has(row.id), disabled: blocked || !row.manageable, onChange: () => selectRows([row]) }), _jsx("div", { className: "dsm-skill-icon", children: _jsx(SkillIcon, {}) }), _jsxs("div", { className: "dsm-copy", children: [_jsx("div", { className: "dsm-name", title: row.name, children: row.name }), _jsx("div", { className: "dsm-desc", title: row.description, children: row.description }), _jsxs("div", { className: "dsm-meta", title: row.path ?? row.provider, children: [row.enabled ? '已启用' : '已关闭', " \u00B7 ", row.provider, row.enabled && (!row.invocation.modelInvocable || !row.invocation.userInvocable) ? row.invocation.modelInvocable ? ' · 仅模型调用' : ' · 仅手动调用' : ''] })] }), _jsx("div", { className: "dsm-row-actions", children: row.manageable ? _jsxs(_Fragment, { children: [_jsx("button", { className: "dsm-switch", role: "switch", "aria-label": `${row.enabled ? '关闭' : '启用'} ${row.name}`, "aria-checked": row.enabled, disabled: blocked, onClick: () => void run(row.enabled ? 'disable' : 'enable', [row]), children: _jsx("span", {}) }), _jsx("button", { className: "dsm-icon-btn dsm-delete", "aria-label": `删除 ${row.name}`, title: "\u5220\u9664\u6280\u80FD", disabled: blocked, onClick: () => setDeleting([row]), children: _jsx(TrashIcon, {}) })] }) : _jsx("span", { className: "dsm-readonly", title: row.reason, children: "\u53EA\u8BFB" }) })] }, row.id)) })] }, source);
                }), visible.length === 0 && state.status === 'ready' && _jsxs("div", { className: "dsm-empty", children: [_jsx(SkillIcon, { size: 32 }), _jsx("strong", { children: state.catalog.skills.length ? '没有匹配的技能' : '还没有加载技能' }), _jsx("span", { children: state.catalog.skills.length ? '试试其他关键词或筛选条件。' : '将技能放入 dsh 或 agents 的 skills 目录，然后刷新。' })] }), _jsx("p", { className: "dsm-note", children: "\u5217\u8868\u663E\u793A\u5F53\u524D\u8303\u56F4\u4E2D\u751F\u6548\u7684\u6280\u80FD\uFF1B\u540C\u540D\u6280\u80FD\u6309 dsh \u7684\u6765\u6E90\u4F18\u5148\u7EA7\u53D6\u4E00\u9879\u3002\u5F00\u5173\u5F71\u54CD\u540E\u7EED\u8C03\u7528\uFF0C\u5DF2\u6CE8\u5165\u5BF9\u8BDD\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u3002" }), selectedRows.length > 0 && _jsxs("div", { className: "dsm-bulk", "aria-label": "\u6279\u91CF\u64CD\u4F5C", children: [_jsxs("span", { children: ["\u5DF2\u9009\u62E9 ", selectedRows.length, " \u9879 ", _jsx("button", { className: "dsm-link", onClick: () => setSelected(new Set()), children: "\u6E05\u7A7A" })] }), _jsxs("div", { className: "dsm-bulk-actions", children: [_jsx("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run('enable', selectedRows), children: "\u542F\u7528" }), _jsx("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run('disable', selectedRows), children: "\u5173\u95ED" }), _jsx("button", { className: "dsm-btn danger", disabled: blocked || selectedRows.length > 100, onClick: () => setDeleting(selectedRows), children: "\u5220\u9664" })] })] }), deleting && _jsx(DeleteDialog, { rows: deleting, onCancel: () => setDeleting(null), onConfirm: () => { if (!blocked)
                        void run('delete', deleting); } })] }) });
}
