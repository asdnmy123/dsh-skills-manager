import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
export function Select({ label, value, options, disabled, onChange }) {
    const id = useId();
    const root = useRef(null);
    const trigger = useRef(null);
    const search = useRef({ text: '', time: 0 });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const current = options.findIndex(option => option.value === value);
    const available = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
    const show = () => { setActive(available.includes(current) ? current : available[0] ?? 0); setOpen(true); };
    const choose = (index) => {
        if (!options[index] || options[index].disabled)
            return;
        onChange(options[index].value);
        setOpen(false);
        trigger.current?.focus();
    };
    useEffect(() => {
        if (!open)
            return;
        const outside = (event) => { if (!root.current?.contains(event.target))
            setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    useEffect(() => { if (disabled)
        setOpen(false); }, [disabled]);
    useEffect(() => {
        if (!open)
            return;
        const option = document.getElementById(`${id}-${active}`);
        const menu = option?.parentElement;
        if (!option || !menu)
            return;
        if (option.offsetTop < menu.scrollTop)
            menu.scrollTop = option.offsetTop;
        else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight)
            menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }, [open, active, id]);
    return _jsxs("div", { className: "dsm-select", ref: root, onBlur: event => { if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false); }, children: [_jsx("span", { className: "dsm-select-label", id: `${id}-label`, children: label }), _jsxs("button", { ref: trigger, className: "dsm-select-trigger", type: "button", role: "combobox", "aria-label": label, "aria-haspopup": "listbox", "aria-expanded": open, "aria-controls": open ? `${id}-list` : undefined, "aria-activedescendant": open ? `${id}-${active}` : undefined, disabled: disabled, onClick: () => open ? setOpen(false) : show(), onKeyDown: event => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        setOpen(false);
                        return;
                    }
                    if (event.key === 'Tab') {
                        setOpen(false);
                        return;
                    }
                    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                        event.preventDefault();
                        if (!open) {
                            show();
                            return;
                        }
                        const position = available.indexOf(active);
                        setActive(event.key === 'Home' ? available[0] ?? 0 : event.key === 'End' ? available.at(-1) ?? 0 : available[(position + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length] ?? 0);
                    }
                    else if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (open)
                            choose(active);
                        else
                            show();
                    }
                    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        const now = Date.now();
                        const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase();
                        search.current = { text, time: now };
                        const match = available.find(index => options[index].label.toLocaleLowerCase().startsWith(text));
                        if (!open)
                            show();
                        if (match !== undefined)
                            setActive(match);
                    }
                }, children: [_jsx("span", { title: options[current]?.label, children: options[current]?.label ?? '请选择' }), _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), open && _jsx("div", { className: "dsm-select-menu", id: `${id}-list`, role: "listbox", "aria-labelledby": `${id}-label`, children: options.map((option, index) => _jsxs("div", { className: `dsm-select-option ${active === index ? 'active' : ''}`, id: `${id}-${index}`, role: "option", "aria-selected": option.value === value, "aria-disabled": !!option.disabled, onPointerMove: () => { if (!option.disabled)
                        setActive(index); }, onMouseDown: event => event.preventDefault(), onClick: () => choose(index), children: [_jsx("span", { title: option.label, children: option.label }), option.value === value && _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "m5 12 4 4 10-10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })] }, option.value)) })] });
}
export function Toast({ messages, error = false }) {
    const [dismissed, setDismissed] = useState(false);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (error || paused || dismissed)
            return;
        const timeout = window.setTimeout(() => setDismissed(true), 4500);
        return () => window.clearTimeout(timeout);
    }, [error, paused, dismissed]);
    if (dismissed)
        return null;
    return _jsxs("div", { className: `dsm-toast ${error ? 'error' : 'success'}`, role: error ? 'alert' : 'status', "aria-atomic": "true", onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false), children: [_jsxs("svg", { className: "dsm-toast-icon", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", strokeWidth: "1.6" }), error ? _jsx("path", { d: "M12 7v6m0 4h.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) : _jsx("path", { d: "m7.5 12 3 3 6-6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] }), _jsx("div", { className: "dsm-toast-copy", children: messages.map((message, index) => _jsx("div", { children: message }, index)) }), _jsx("button", { className: "dsm-icon-btn dsm-toast-close", "aria-label": error ? '关闭错误通知' : '关闭操作通知', onClick: () => setDismissed(true), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "m6 6 12 12M18 6 6 18", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" }) }) })] });
}
