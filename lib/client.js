globalThis.__ModuleLoader__.load({id: 'dsh-skills-manager', factory(require) {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/protocol.ts
var CHANNEL = "/api";
var ENDPOINT = "dsh-skills-manager";
var PANEL_ID = "dsh-skills-manager";

// src/client/model.ts
var ManagerModel = class {
  constructor(rpc) {
    this.rpc = rpc;
  }
  state = { catalog: { skills: [], complete: false }, status: "loading", cwd: "", busy: false, failures: [] };
  listeners = /* @__PURE__ */ new Set();
  lifetime = new AbortController();
  read;
  generation = 0;
  source = { getSnapshot: () => this.state, subscribe: (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  } };
  publish(update) {
    if (this.lifetime.signal.aborted) return;
    this.state = { ...this.state, ...update };
    for (const listener of this.listeners) listener();
  }
  async refresh(cwd = this.state.cwd, preset = this.state.preset) {
    if (this.state.busy || this.lifetime.signal.aborted) return;
    this.read?.abort();
    const read = this.read = new AbortController();
    const generation = ++this.generation;
    this.publish({ cwd, preset, status: "loading", error: void 0, ...cwd !== this.state.cwd || preset !== this.state.preset ? { catalog: { skills: [], complete: false, presets: this.state.catalog.presets }, notice: void 0, failures: [] } : {} });
    try {
      const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/list`, { cwd, preset }, AbortSignal.any([read.signal, this.lifetime.signal]));
      if (generation !== this.generation || read.signal.aborted) return;
      if (!response.ok) throw new Error(response.error.message);
      const catalog = response.value;
      this.publish({ status: "ready", catalog, preset: catalog.preset ?? preset });
    } catch (error) {
      if (!read.signal.aborted && generation === this.generation) this.publish({ status: "error", error: error instanceof Error ? error.message : "\u65E0\u6CD5\u8FDE\u63A5\u6280\u80FD\u7BA1\u7406\u670D\u52A1" });
    }
  }
  async mutate(action, rows) {
    if (this.state.busy || this.state.status !== "ready" || !this.state.catalog.complete || !rows.length || this.lifetime.signal.aborted) return;
    this.read?.abort();
    ++this.generation;
    this.publish({ busy: true, error: void 0, notice: void 0, failures: [] });
    try {
      const response = await this.rpc.call(CHANNEL, `${ENDPOINT}/mutate`, { cwd: this.state.cwd, preset: this.state.preset, action, targets: rows.map((row) => ({ id: row.id, revision: row.revision })) }, this.lifetime.signal);
      if (!response.ok) throw new Error(response.error.message);
      const result = response.value;
      const successes = result.results.filter((row) => row.ok).length;
      const failures = result.results.filter((row) => !row.ok).map((row) => `${row.name}\uFF1A${row.message}`);
      this.publish({ notice: successes ? `${action === "enable" ? "\u5DF2\u542F\u7528" : action === "disable" ? "\u5DF2\u5173\u95ED" : "\u5DF2\u79FB\u5165\u56DE\u6536\u76EE\u5F55"} ${successes} \u9879\u6280\u80FD` : void 0, failures });
    } catch (error) {
      this.publish({ failures: [error instanceof Error ? error.message : "\u64CD\u4F5C\u5931\u8D25"] });
    } finally {
      this.publish({ busy: false });
      await this.refresh();
    }
  }
  dispose() {
    this.lifetime.abort();
    this.read?.abort();
    this.listeners.clear();
  }
};

// src/client/page.tsx
var import_react2 = require("react");

// src/client/controls.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Select({ label, value, options, disabled, onChange }) {
  const id = (0, import_react.useId)();
  const root = (0, import_react.useRef)(null);
  const trigger = (0, import_react.useRef)(null);
  const search = (0, import_react.useRef)({ text: "", time: 0 });
  const [open, setOpen] = (0, import_react.useState)(false);
  const [active, setActive] = (0, import_react.useState)(0);
  const current = options.findIndex((option) => option.value === value);
  const available = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
  const show = () => {
    setActive(available.includes(current) ? current : available[0] ?? 0);
    setOpen(true);
  };
  const choose = (index) => {
    if (!options[index] || options[index].disabled) return;
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  };
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const option = document.getElementById(`${id}-${active}`);
    const menu = option?.parentElement;
    if (!option || !menu) return;
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
  }, [open, active, id]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-select", ref: root, onBlur: (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsm-select-label", id: `${id}-label`, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { ref: trigger, className: "dsm-select-trigger", type: "button", role: "combobox", "aria-label": label, "aria-haspopup": "listbox", "aria-expanded": open, "aria-controls": open ? `${id}-list` : void 0, "aria-activedescendant": open ? `${id}-${active}` : void 0, disabled, onClick: () => open ? setOpen(false) : show(), onKeyDown: (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "Tab") {
        setOpen(false);
        return;
      }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (!open) {
          show();
          return;
        }
        const position = available.indexOf(active);
        setActive(event.key === "Home" ? available[0] ?? 0 : event.key === "End" ? available.at(-1) ?? 0 : available[(position + (event.key === "ArrowDown" ? 1 : -1) + available.length) % available.length] ?? 0);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (open) choose(active);
        else show();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const now = Date.now();
        const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase();
        search.current = { text, time: now };
        const match = available.find((index) => options[index].label.toLocaleLowerCase().startsWith(text));
        if (!open) show();
        if (match !== void 0) setActive(match);
      }
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: options[current]?.label, children: options[current]?.label ?? "\u8BF7\u9009\u62E9" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }) })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-select-menu", id: `${id}-list`, role: "listbox", "aria-labelledby": `${id}-label`, children: options.map((option, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsm-select-option ${active === index ? "active" : ""}`, id: `${id}-${index}`, role: "option", "aria-selected": option.value === value, "aria-disabled": !!option.disabled, onPointerMove: () => {
      if (!option.disabled) setActive(index);
    }, onMouseDown: (event) => event.preventDefault(), onClick: () => choose(index), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: option.label, children: option.label }),
      option.value === value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 12 4 4 10-10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
    ] }, option.value)) })
  ] });
}
function Toast({ messages, error = false }) {
  const [dismissed, setDismissed] = (0, import_react.useState)(false);
  const [paused, setPaused] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (error || paused || dismissed) return;
    const timeout = window.setTimeout(() => setDismissed(true), 4500);
    return () => window.clearTimeout(timeout);
  }, [error, paused, dismissed]);
  if (dismissed) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsm-toast ${error ? "error" : "success"}`, role: error ? "alert" : "status", "aria-atomic": "true", onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "dsm-toast-icon", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", strokeWidth: "1.6" }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7v6m0 4h.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m7.5 12 3 3 6-6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-toast-copy", children: messages.map((message, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: message }, index)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-icon-btn dsm-toast-close", "aria-label": error ? "\u5173\u95ED\u9519\u8BEF\u901A\u77E5" : "\u5173\u95ED\u64CD\u4F5C\u901A\u77E5", onClick: () => setDismissed(true), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 6 12 12M18 6 6 18", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" }) }) })
  ] });
}

// src/client/page.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var SOURCES = { "project-dsh": "\u9879\u76EE \xB7 dsh", "project-agents": "\u9879\u76EE \xB7 agents", "user-dsh": "\u4E2A\u4EBA \xB7 dsh", "user-agents": "\u4E2A\u4EBA \xB7 agents", custom: "\u81EA\u5B9A\u4E49", bundled: "\u7CFB\u7EDF", runtime: "\u8FD0\u884C\u65F6" };
var bucket = (source) => source.startsWith("project-") ? "project" : source.startsWith("user-") ? "personal" : source === "bundled" ? "system" : "other";
var tabs = [{ id: "all", label: "\u5168\u90E8" }, { id: "personal", label: "\u4E2A\u4EBA" }, { id: "project", label: "\u9879\u76EE" }, { id: "system", label: "\u7CFB\u7EDF" }, { id: "other", label: "\u5176\u4ED6\u6765\u6E90" }];
function SkillIcon({ size = 21 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m12 2 9 5v10l-9 5-9-5V7l9-5Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5", stroke: "currentColor", strokeWidth: "1.6" })
  ] });
}
function TrashIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) });
}
function DeleteDialog({ rows, onCancel, onConfirm }) {
  const dialog = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-dialog-shade", onClick: (event) => {
    if (event.target === event.currentTarget) onCancel();
  }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref: dialog, className: "dsm-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dsm-delete-title", "aria-describedby": "dsm-delete-description", onKeyDown: (event) => {
    if (event.key === "Escape") onCancel();
    if (event.key === "Tab") {
      const buttons = dialog.current?.querySelectorAll("button");
      if (!buttons?.length) return;
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
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { id: "dsm-delete-title", children: [
      "\u5220\u9664 ",
      rows.length,
      " \u9879\u6280\u80FD\uFF1F"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: "dsm-delete-description", children: "\u6240\u9009\u6280\u80FD\u5C06\u4ECE\u76EE\u5F55\u4E2D\u79FB\u9664\uFF0C\u5176\u6587\u4EF6\u548C\u8D44\u6E90\u4F1A\u79FB\u5165\u539F\u6280\u80FD\u76EE\u5F55\u7684\u56DE\u6536\u6587\u4EF6\u5939\u3002\u540E\u7EED\u8C03\u7528\u5C06\u4E0D\u518D\u52A0\u8F7D\u5B83\u4EEC\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: row.name }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-meta", children: row.path })
    ] }, row.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-dialog-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-btn", onClick: onCancel, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-btn danger", onClick: onConfirm, children: "\u786E\u8BA4\u5220\u9664" })
    ] })
  ] }) });
}
function SkillsPage({ useManager, useWorkspaces, refresh, mutate }) {
  const state = useManager((value) => value);
  const workspaces = useWorkspaces((value) => value.items);
  const [query, setQuery] = (0, import_react2.useState)("");
  const [tab, setTab] = (0, import_react2.useState)("all");
  const [status, setStatus] = (0, import_react2.useState)("all");
  const [selected, setSelected] = (0, import_react2.useState)(/* @__PURE__ */ new Set());
  const [deleting, setDeleting] = (0, import_react2.useState)(null);
  const mounted = (0, import_react2.useRef)(false);
  (0, import_react2.useEffect)(() => {
    mounted.current = true;
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      mounted.current = false;
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  (0, import_react2.useEffect)(() => {
    setSelected(/* @__PURE__ */ new Set());
    setDeleting(null);
  }, [state.cwd, state.preset]);
  const blocked = state.busy || state.status !== "ready" || !state.catalog.complete;
  const visible = state.catalog.skills.filter((row) => (tab === "all" || bucket(row.source) === tab) && (status === "all" || row.enabled === (status === "enabled")) && `${row.name} ${row.description} ${row.provider} ${row.source}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selectedRows = visible.filter((row) => selected.has(row.id) && row.manageable);
  const groups = [...new Set(visible.map((row) => row.source))];
  const selectRows = (rows) => setSelected((previous) => {
    const next = new Set(previous);
    const manageable = rows.filter((row) => row.manageable);
    const all = manageable.every((row) => next.has(row.id));
    for (const row of manageable) all ? next.delete(row.id) : next.add(row.id);
    return next;
  });
  const run = async (action, rows) => {
    setDeleting(null);
    await mutate(action, rows);
    if (mounted.current) setSelected(/* @__PURE__ */ new Set());
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("section", { className: "dsm", "aria-label": "\u6280\u80FD\u7BA1\u7406", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-inner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dsm-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: "\u6280\u80FD" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsm-sub", children: "\u7BA1\u7406\u4F60\u7684\u6280\u80FD\uFF0C\u8BA9\u6BCF\u6B21\u4EFB\u52A1\u62E5\u6709\u5408\u9002\u7684\u80FD\u529B\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dsm-search", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "10", cy: "10", r: "6.5", stroke: "currentColor", strokeWidth: "1.6" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m15 15 5 5", stroke: "currentColor", strokeWidth: "1.6" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { "aria-label": "\u641C\u7D22\u6280\u80FD", placeholder: "\u641C\u7D22\u6280\u80FD", value: query, onChange: (event) => setQuery(event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-icon-btn", "aria-label": "\u5237\u65B0\u6280\u80FD", title: "\u5237\u65B0\u6280\u80FD", disabled: state.busy || state.status === "loading", onClick: () => void refresh(), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-scope", children: [
      !!state.catalog.presets?.length && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Select, { label: "\u6280\u80FD\u914D\u7F6E", value: state.preset ?? "", disabled: state.busy, onChange: (value) => void refresh(void 0, value), options: [{ value: "", label: "\u5BBF\u4E3B\u5168\u5C40" }, ...state.catalog.presets.map((preset) => ({ value: preset.id, label: `${preset.name ?? preset.id}${preset.broken ? "\uFF08\u4E0D\u53EF\u7528\uFF09" : ""}`, disabled: !!preset.broken }))] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Select, { label: "\u67E5\u770B\u8303\u56F4", value: state.cwd, disabled: state.busy, onChange: (value) => void refresh(value), options: [{ value: "", label: "\u5168\u5C40\u6280\u80FD" }, ...workspaces.map((workspace) => ({ value: workspace.path, label: workspace.title }))] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Select, { label: "\u6280\u80FD\u72B6\u6001", value: status, onChange: (value) => {
        setStatus(value);
        setSelected(/* @__PURE__ */ new Set());
      }, options: [{ value: "all", label: "\u5168\u90E8\u72B6\u6001" }, { value: "enabled", label: "\u5DF2\u542F\u7528" }, { value: "disabled", label: "\u5DF2\u5173\u95ED" }] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "dsm-filters", "aria-label": "\u6280\u80FD\u6765\u6E90", children: tabs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "dsm-pill", "aria-pressed": tab === item.id, onClick: () => {
      setTab(item.id);
      setSelected(/* @__PURE__ */ new Set());
    }, children: [
      item.label,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsm-count", children: state.catalog.skills.filter((row) => item.id === "all" || bucket(row.source) === item.id).length })
    ] }, item.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-toasts", "aria-label": "\u64CD\u4F5C\u901A\u77E5", children: [
      state.notice && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Toast, { messages: [state.notice] }, state.notice),
      " ",
      state.failures.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Toast, { error: true, messages: state.failures }, state.failures.join("\n"))
    ] }),
    state.error && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-message error", role: "alert", children: [
      state.error,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-link", onClick: () => void refresh(), children: "\u91CD\u8BD5" })
    ] }),
    state.status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-message", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u6280\u80FD\u2026" }),
    state.status === "ready" && !state.catalog.complete && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-message error", role: "alert", children: "\u90E8\u5206\u6280\u80FD\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u5217\u8868\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002\u8BF7\u5237\u65B0\u540E\u518D\u8FDB\u884C\u7BA1\u7406\u64CD\u4F5C\u3002" }),
    groups.map((source) => {
      const rows = visible.filter((row) => row.source === source);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dsm-group", "aria-label": SOURCES[source] ?? source, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-group-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { children: [
            SOURCES[source] ?? source,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsm-count", children: [
              rows.length,
              " \u9879"
            ] })
          ] }),
          rows.some((row) => row.manageable) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-link", disabled: blocked, onClick: () => selectRows(rows), children: rows.filter((row) => row.manageable).every((row) => selected.has(row.id)) ? "\u53D6\u6D88\u9009\u62E9" : "\u9009\u62E9\u6B64\u7EC4" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-grid", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: `dsm-row ${row.enabled ? "" : "disabled"} ${selected.has(row.id) ? "selected" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: "dsm-check", type: "checkbox", "aria-label": `\u9009\u62E9 ${row.name}`, checked: selected.has(row.id), disabled: blocked || !row.manageable, onChange: () => selectRows([row]) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-skill-icon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SkillIcon, {}) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-copy", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-name", title: row.name, children: row.name }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-desc", title: row.description, children: row.description }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-meta", title: row.path ?? row.provider, children: [
              row.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5173\u95ED",
              " \xB7 ",
              row.provider,
              row.enabled && (!row.invocation.modelInvocable || !row.invocation.userInvocable) ? row.invocation.modelInvocable ? " \xB7 \u4EC5\u6A21\u578B\u8C03\u7528" : " \xB7 \u4EC5\u624B\u52A8\u8C03\u7528" : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsm-row-actions", children: row.manageable ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-switch", role: "switch", "aria-label": `${row.enabled ? "\u5173\u95ED" : "\u542F\u7528"} ${row.name}`, "aria-checked": row.enabled, disabled: blocked, onClick: () => void run(row.enabled ? "disable" : "enable", [row]), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-icon-btn dsm-delete", "aria-label": `\u5220\u9664 ${row.name}`, title: "\u5220\u9664\u6280\u80FD", disabled: blocked, onClick: () => setDeleting([row]), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TrashIcon, {}) })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsm-readonly", title: row.reason, children: "\u53EA\u8BFB" }) })
        ] }, row.id)) })
      ] }, source);
    }),
    visible.length === 0 && state.status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SkillIcon, { size: 32 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: state.catalog.skills.length ? "\u6CA1\u6709\u5339\u914D\u7684\u6280\u80FD" : "\u8FD8\u6CA1\u6709\u52A0\u8F7D\u6280\u80FD" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: state.catalog.skills.length ? "\u8BD5\u8BD5\u5176\u4ED6\u5173\u952E\u8BCD\u6216\u7B5B\u9009\u6761\u4EF6\u3002" : "\u5C06\u6280\u80FD\u653E\u5165 dsh \u6216 agents \u7684 skills \u76EE\u5F55\uFF0C\u7136\u540E\u5237\u65B0\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsm-note", children: "\u5217\u8868\u663E\u793A\u5F53\u524D\u8303\u56F4\u4E2D\u751F\u6548\u7684\u6280\u80FD\uFF1B\u540C\u540D\u6280\u80FD\u6309 dsh \u7684\u6765\u6E90\u4F18\u5148\u7EA7\u53D6\u4E00\u9879\u3002\u5F00\u5173\u5F71\u54CD\u540E\u7EED\u8C03\u7528\uFF0C\u5DF2\u6CE8\u5165\u5BF9\u8BDD\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u3002" }),
    selectedRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-bulk", "aria-label": "\u6279\u91CF\u64CD\u4F5C", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        "\u5DF2\u9009\u62E9 ",
        selectedRows.length,
        " \u9879 ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-link", onClick: () => setSelected(/* @__PURE__ */ new Set()), children: "\u6E05\u7A7A" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsm-bulk-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run("enable", selectedRows), children: "\u542F\u7528" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run("disable", selectedRows), children: "\u5173\u95ED" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dsm-btn danger", disabled: blocked || selectedRows.length > 100, onClick: () => setDeleting(selectedRows), children: "\u5220\u9664" })
      ] })
    ] }),
    deleting && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DeleteDialog, { rows: deleting, onCancel: () => setDeleting(null), onConfirm: () => {
      if (!blocked) void run("delete", deleting);
    } })
  ] }) });
}

// src/client/styles.ts
var styles = `
.dsm { --dsm-fg:var(--dsw-alias-label-primary,#202124); --dsm-muted:var(--dsw-alias-label-secondary,#737780); --dsm-line:var(--dsw-alias-border-l1,#e8e9ec); --dsm-bg:var(--dsw-alias-bg-base,#fff); --dsm-soft:var(--dsw-alias-interactive-bg-hover,#f6f7f9); color:var(--dsm-fg); background:var(--dsm-bg); height:100%; overflow:auto; font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif; }
.dsm * { box-sizing:border-box; }
.dsm button,.dsm input,.dsm select { font:inherit; }
.dsm button { cursor:pointer; color:inherit; }
.dsm button:disabled { cursor:default; opacity:.45; }
.dsm button:focus-visible,.dsm input:focus-visible,.dsm select:focus-visible { outline:2px solid #5079e8; outline-offset:3px; }
.dsm-inner { max-width:1080px; margin:0 auto; padding:52px 44px 96px; }
.dsm-head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.dsm h1 { font-size:27px; margin:0 0 7px; font-weight:650; letter-spacing:-.6px; }
.dsm-sub { margin:0; color:var(--dsm-muted); }
.dsm-tools { display:flex; align-items:center; gap:10px; padding-top:5px; }
.dsm-search { display:flex; align-items:center; gap:9px; border:1px solid var(--dsm-line); border-radius:22px; padding:7px 13px; width:250px; color:var(--dsm-muted); }
.dsm-search input { width:100%; background:transparent; color:var(--dsm-fg); border:0; outline:none; min-width:0; }
.dsm-icon-btn { border:0; background:transparent; padding:9px; display:flex; border-radius:50%; }
.dsm-icon-btn:hover { background:var(--dsm-soft); }
.dsm-scope { display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; margin:32px 0 20px; color:var(--dsm-muted); }
.dsm-select { position:relative; display:flex; align-items:center; gap:9px; min-width:0; max-width:100%; }
.dsm-select-label { font-size:12px; white-space:nowrap; }
.dsm-select-trigger { display:flex; align-items:center; justify-content:space-between; gap:18px; min-width:116px; max-width:260px; height:38px; padding:0 12px; background:var(--dsm-bg); border:1px solid var(--dsm-line); border-radius:10px; box-shadow:0 1px 2px #00000005; transition:border-color .16s,background .16s,box-shadow .16s; }
.dsm-select-trigger > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-select-trigger svg { flex-shrink:0; color:var(--dsm-muted); transition:transform .16s; }
.dsm-select-trigger:hover:not(:disabled) { background:var(--dsm-soft); border-color:#969ce0; }
.dsm-select-trigger[aria-expanded=true] { border-color:#737ee3; box-shadow:0 0 0 3px #737ee314; }
.dsm-select-trigger[aria-expanded=true] svg { transform:rotate(180deg); }
.dsm-select-menu { position:absolute; top:calc(100% + 7px); right:0; width:max-content; min-width:116px; max-width:min(320px,calc(100vw - 48px)); max-height:260px; overflow:auto; padding:5px; border:1px solid var(--dsm-line); border-radius:12px; background:var(--dsm-bg); box-shadow:0 12px 36px #0000001c,0 2px 6px #00000008; z-index:30; scrollbar-width:thin; }
.dsm-select-option { display:flex; align-items:center; justify-content:space-between; gap:20px; min-height:36px; padding:7px 10px; border-radius:7px; cursor:pointer; color:var(--dsm-fg); font-size:13px; }
.dsm-select-option > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-select-option svg { flex-shrink:0; }
.dsm-select-option.active { background:var(--dsm-soft); }
.dsm-select-option[aria-selected=true] { color:#737ee3; font-weight:600; background:#737ee310; }
.dsm-select-option[aria-disabled=true] { opacity:.4; cursor:default; }
.dsm-filters { display:flex; flex-wrap:wrap; gap:7px; margin:0 0 25px; }
.dsm-pill { border:0; border-radius:18px; padding:7px 15px; background:transparent; color:var(--dsm-muted) !important; }
.dsm-pill[aria-pressed=true] { background:var(--dsm-soft); color:var(--dsm-fg) !important; font-weight:600; }
.dsm-count { margin-left:7px; font-size:12px; opacity:.65; }
.dsm-group { margin:0 0 32px; }
.dsm-group-head { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--dsm-line); padding-bottom:12px; margin-bottom:8px; }
.dsm h2 { font-size:15px; margin:0; font-weight:600; }
.dsm-link { background:transparent; border:0; color:var(--dsm-muted) !important; font-size:12px !important; }
.dsm-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:30px; }
.dsm-row { display:flex; gap:12px; align-items:center; padding:18px 8px; min-width:0; border-radius:12px; }
.dsm-row:hover,.dsm-row.selected { background:var(--dsm-soft); }
.dsm-check { appearance:none; width:18px; height:18px; margin:0; border:1.5px solid color-mix(in srgb,var(--dsm-muted) 45%,var(--dsm-bg)); border-radius:5px; background:var(--dsm-bg); cursor:pointer; flex-shrink:0; display:grid; place-items:center; transition:background .16s,border-color .16s,box-shadow .16s; }
.dsm-check::after { content:''; width:9px; height:5px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:translateY(-1px) rotate(-45deg) scale(0); transition:transform .12s; }
.dsm-check:hover:not(:disabled) { border-color:#737ee3; box-shadow:0 0 0 3px #737ee310; }
.dsm-check:checked { border-color:#606ede; background:#606ede; }
.dsm-check:checked::after { transform:translateY(-1px) rotate(-45deg) scale(1); }
.dsm-check:disabled { opacity:.4; cursor:default; background:var(--dsm-soft); }
.dsm-check:checked:disabled { background:#606ede; }
.dsm-skill-icon { background:var(--dsm-soft); width:42px; height:42px; border-radius:11px; display:grid; place-items:center; color:#8070df; flex-shrink:0; }
.dsm-copy { flex:1; min-width:0; }
.dsm-name { font-size:14px; font-weight:550; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-desc { font-size:13px; color:var(--dsm-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px; }
.dsm-meta { color:var(--dsm-muted); font-size:11px; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-row.disabled .dsm-name,.dsm-row.disabled .dsm-skill-icon { opacity:.5; }
.dsm-row-actions { display:flex; align-items:center; gap:8px; }
.dsm-switch { width:34px; height:20px; padding:3px; border:0; border-radius:12px; background:var(--dsm-muted); display:flex; align-items:center; transition:background .18s,box-shadow .18s; }
.dsm-switch[aria-checked=true] { background:#606ede; }
.dsm-switch:hover:not(:disabled) { box-shadow:0 0 0 3px #737ee314; }
.dsm-switch span { display:block; width:14px; height:14px; border-radius:50%; background:#fff; box-shadow:0 1px 3px #0002; transition:transform .18s; }
.dsm-switch[aria-checked=true] span { transform:translateX(14px); }
.dsm-delete { opacity:0; padding:4px; }
.dsm-row:hover .dsm-delete,.dsm-row:focus-within .dsm-delete { opacity:1; }
.dsm-readonly { color:var(--dsm-muted); font-size:11px; white-space:nowrap; }
.dsm-note { color:var(--dsm-muted); font-size:12px; margin-top:26px; }
.dsm-message { padding:11px 14px; margin-bottom:18px; border-radius:9px; background:var(--dsm-soft); }
.dsm-message.error { color:#ba424b; background:#d64a5710; }
.dsm-toasts { position:fixed; top:24px; right:24px; z-index:100; display:flex; flex-direction:column; align-items:flex-end; gap:10px; max-width:min(420px,calc(100vw - 48px)); pointer-events:none; }
.dsm-toast { display:flex; align-items:flex-start; gap:10px; width:max-content; max-width:100%; padding:13px 14px; color:var(--dsm-fg); background:var(--dsm-bg); border:1px solid var(--dsm-line); border-radius:13px; box-shadow:0 8px 30px #0000001a,0 2px 8px #00000008; pointer-events:auto; animation:dsm-toast-in .18s ease-out; }
.dsm-toast-icon { flex-shrink:0; margin-top:1px; }
.dsm-toast.success .dsm-toast-icon { color:#28a078; }
.dsm-toast.error .dsm-toast-icon { color:#d55c66; }
.dsm-toast-copy { min-width:0; max-height:240px; overflow:auto; overflow-wrap:anywhere; }
.dsm-toast-close { flex-shrink:0; padding:3px; color:var(--dsm-muted) !important; border-radius:6px; }
@keyframes dsm-toast-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
.dsm-empty { text-align:center; padding:70px 20px; color:var(--dsm-muted); }
.dsm-empty strong { display:block; color:var(--dsm-fg); margin:16px 0 5px; font-size:17px; }
.dsm-bulk { position:sticky; bottom:20px; display:flex; justify-content:space-between; flex-wrap:wrap; align-items:center; gap:14px; background:var(--dsm-bg); border:1px solid var(--dsm-line); box-shadow:0 8px 30px #0001; padding:13px 18px; border-radius:14px; }
.dsm-bulk-actions { display:flex; gap:8px; }
.dsm-btn { padding:7px 13px; border:1px solid var(--dsm-line); border-radius:8px; background:var(--dsm-bg); }
.dsm-btn.primary { background:#24262c; color:#fff; border-color:#24262c; }
.dsm-btn.danger { color:#ba424b; }
.dsm-dialog-shade { position:fixed; inset:0; background:#1115; display:grid; place-items:center; z-index:1000; padding:24px; }
.dsm-dialog { background:var(--dsm-bg); color:var(--dsm-fg); max-width:480px; width:100%; padding:27px; border-radius:16px; box-shadow:0 16px 80px #0003; }
.dsm-dialog h2 { font-size:20px; margin-bottom:14px; }
.dsm-dialog ul { max-height:160px; overflow:auto; padding-left:20px; }
.dsm-dialog-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:24px; }
@media(prefers-color-scheme:dark) { .dsm { --dsm-bg:var(--dsw-alias-bg-base,#191b20); --dsm-soft:var(--dsw-alias-interactive-bg-hover,#252830); --dsm-fg:var(--dsw-alias-label-primary,#e8e9ee); --dsm-muted:var(--dsw-alias-label-secondary,#959ba8); --dsm-line:var(--dsw-alias-border-l1,#333640); } }
@media(max-width:800px) { .dsm-inner { padding:32px 24px 64px; } .dsm-head { flex-direction:column; gap:16px; } .dsm-tools { width:100%; } .dsm-search { flex:1; } .dsm-grid { grid-template-columns:1fr; } .dsm-delete { opacity:1; } }
@media(max-width:480px) { .dsm-select { flex:1 1 100%; justify-content:space-between; } .dsm-select-trigger { flex:1; min-width:0; max-width:240px; } .dsm-select-menu { width:240px; } .dsm-toasts { top:16px; right:16px; max-width:calc(100vw - 32px); } }
@media(prefers-reduced-motion:reduce) { .dsm-toast { animation:none; } .dsm-select-trigger,.dsm-select-trigger svg,.dsm-check,.dsm-check::after,.dsm-switch,.dsm-switch span { transition:none; } }
@media(forced-colors:active) { .dsm-check { appearance:auto; } .dsm-check::after { display:none; } .dsm-switch { border:1px solid ButtonText; } .dsm-switch[aria-checked=true] { background:Highlight; } .dsm-switch span { background:ButtonText; } }
`;

// src/client/index.tsx
var inject = ["slots", "connection"];
function apply(ctx) {
  const connection = ctx.get("connection");
  const model = new ManagerModel(connection.rpc);
  const refresh = (cwd, preset) => model.refresh(cwd, preset);
  const mutate = (action, rows) => model.mutate(action, rows);
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshSkillsManager = "styles";
    style.textContent = styles;
    document.head.append(style);
    return () => {
      style.remove();
      model.dispose();
    };
  }, "skills manager: page lifetime");
  ctx.on("connection/reset", () => {
    void refresh();
  });
  ctx.slots.inject("main", () => ctx.slots.register({
    name: "main",
    key: PANEL_ID,
    inject: () => ({ hooks: { manager: model.source }, refresh, mutate })
  }, SkillsPage));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL_ID, order: 10, label: "\u6280\u80FD" }, SkillIcon));
}

return module.exports;
}});
