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
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var SOURCES = { "project-dsh": "\u9879\u76EE \xB7 dsh", "project-agents": "\u9879\u76EE \xB7 agents", "user-dsh": "\u4E2A\u4EBA \xB7 dsh", "user-agents": "\u4E2A\u4EBA \xB7 agents", custom: "\u81EA\u5B9A\u4E49", bundled: "\u7CFB\u7EDF", runtime: "\u8FD0\u884C\u65F6" };
var bucket = (source) => source.startsWith("project-") ? "project" : source.startsWith("user-") ? "personal" : source === "bundled" ? "system" : "other";
var tabs = [{ id: "all", label: "\u5168\u90E8" }, { id: "personal", label: "\u4E2A\u4EBA" }, { id: "project", label: "\u9879\u76EE" }, { id: "system", label: "\u7CFB\u7EDF" }, { id: "other", label: "\u5176\u4ED6\u6765\u6E90" }];
function SkillIcon({ size = 21 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m12 2 9 5v10l-9 5-9-5V7l9-5Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5", stroke: "currentColor", strokeWidth: "1.6" })
  ] });
}
function TrashIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) });
}
function DeleteDialog({ rows, onCancel, onConfirm }) {
  const dialog = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-dialog-shade", onClick: (event) => {
    if (event.target === event.currentTarget) onCancel();
  }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: dialog, className: "dsm-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dsm-delete-title", "aria-describedby": "dsm-delete-description", onKeyDown: (event) => {
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { id: "dsm-delete-title", children: [
      "\u5220\u9664 ",
      rows.length,
      " \u9879\u6280\u80FD\uFF1F"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { id: "dsm-delete-description", children: "\u6240\u9009\u6280\u80FD\u5C06\u4ECE\u76EE\u5F55\u4E2D\u79FB\u9664\uFF0C\u5176\u6587\u4EF6\u548C\u8D44\u6E90\u4F1A\u79FB\u5165\u539F\u6280\u80FD\u76EE\u5F55\u7684\u56DE\u6536\u6587\u4EF6\u5939\u3002\u540E\u7EED\u8C03\u7528\u5C06\u4E0D\u518D\u52A0\u8F7D\u5B83\u4EEC\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.name }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-meta", children: row.path })
    ] }, row.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-dialog-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-btn", onClick: onCancel, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-btn danger", onClick: onConfirm, children: "\u786E\u8BA4\u5220\u9664" })
    ] })
  ] }) });
}
function SkillsPage({ useManager, useWorkspaces, refresh, mutate }) {
  const state = useManager((value) => value);
  const workspaces = useWorkspaces((value) => value.items);
  const [query, setQuery] = (0, import_react.useState)("");
  const [tab, setTab] = (0, import_react.useState)("all");
  const [status, setStatus] = (0, import_react.useState)("all");
  const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [deleting, setDeleting] = (0, import_react.useState)(null);
  const mounted = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: "dsm", "aria-label": "\u6280\u80FD\u7BA1\u7406", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-inner", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dsm-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "\u6280\u80FD" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsm-sub", children: "\u7BA1\u7406\u4F60\u7684\u6280\u80FD\uFF0C\u8BA9\u6BCF\u6B21\u4EFB\u52A1\u62E5\u6709\u5408\u9002\u7684\u80FD\u529B\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsm-search", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "10", cy: "10", r: "6.5", stroke: "currentColor", strokeWidth: "1.6" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m15 15 5 5", stroke: "currentColor", strokeWidth: "1.6" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { "aria-label": "\u641C\u7D22\u6280\u80FD", placeholder: "\u641C\u7D22\u6280\u80FD", value: query, onChange: (event) => setQuery(event.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-icon-btn", "aria-label": "\u5237\u65B0\u6280\u80FD", title: "\u5237\u65B0\u6280\u80FD", disabled: state.busy || state.status === "loading", onClick: () => void refresh(), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-scope", children: [
      !!state.catalog.presets?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
        "\u6280\u80FD\u914D\u7F6E ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { "aria-label": "\u6280\u80FD\u914D\u7F6E", value: state.preset ?? "", disabled: state.busy, onChange: (event) => void refresh(void 0, event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u5BBF\u4E3B\u5168\u5C40" }),
          state.catalog.presets.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: preset.id, disabled: !!preset.broken, children: [
            preset.name ?? preset.id,
            preset.broken ? "\uFF08\u4E0D\u53EF\u7528\uFF09" : ""
          ] }, preset.id))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
        "\u67E5\u770B\u8303\u56F4 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { "aria-label": "\u67E5\u770B\u8303\u56F4", value: state.cwd, disabled: state.busy, onChange: (event) => void refresh(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "\u5168\u5C40\u6280\u80FD" }),
          workspaces.map((workspace) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: workspace.path, children: workspace.title }, workspace.workspaceId))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
        "\u72B6\u6001 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { "aria-label": "\u6280\u80FD\u72B6\u6001", value: status, onChange: (event) => {
          setStatus(event.target.value);
          setSelected(/* @__PURE__ */ new Set());
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "enabled", children: "\u5DF2\u542F\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "disabled", children: "\u5DF2\u5173\u95ED" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "dsm-filters", "aria-label": "\u6280\u80FD\u6765\u6E90", children: tabs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { className: "dsm-pill", "aria-pressed": tab === item.id, onClick: () => {
      setTab(item.id);
      setSelected(/* @__PURE__ */ new Set());
    }, children: [
      item.label,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsm-count", children: state.catalog.skills.filter((row) => item.id === "all" || bucket(row.source) === item.id).length })
    ] }, item.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { "aria-live": "polite", children: [
      state.notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-message success", role: "status", children: state.notice }),
      state.failures.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-message error", role: "alert", children: state.failures.map((failure, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: failure }, index)) })
    ] }),
    state.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-message error", role: "alert", children: [
      state.error,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-link", onClick: () => void refresh(), children: "\u91CD\u8BD5" })
    ] }),
    state.status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-message", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u6280\u80FD\u2026" }),
    state.status === "ready" && !state.catalog.complete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-message error", role: "alert", children: "\u90E8\u5206\u6280\u80FD\u6765\u6E90\u6682\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u5217\u8868\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002\u8BF7\u5237\u65B0\u540E\u518D\u8FDB\u884C\u7BA1\u7406\u64CD\u4F5C\u3002" }),
    groups.map((source) => {
      const rows = visible.filter((row) => row.source === source);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsm-group", "aria-label": SOURCES[source] ?? source, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-group-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
            SOURCES[source] ?? source,
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsm-count", children: [
              rows.length,
              " \u9879"
            ] })
          ] }),
          rows.some((row) => row.manageable) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-link", disabled: blocked, onClick: () => selectRows(rows), children: rows.filter((row) => row.manageable).every((row) => selected.has(row.id)) ? "\u53D6\u6D88\u9009\u62E9" : "\u9009\u62E9\u6B64\u7EC4" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-grid", children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: `dsm-row ${row.enabled ? "" : "disabled"} ${selected.has(row.id) ? "selected" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { className: "dsm-check", type: "checkbox", "aria-label": `\u9009\u62E9 ${row.name}`, checked: selected.has(row.id), disabled: blocked || !row.manageable, onChange: () => selectRows([row]) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-skill-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillIcon, {}) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-copy", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-name", title: row.name, children: row.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-desc", title: row.description, children: row.description }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-meta", title: row.path ?? row.provider, children: [
              row.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5173\u95ED",
              " \xB7 ",
              row.provider,
              row.enabled && (!row.invocation.modelInvocable || !row.invocation.userInvocable) ? row.invocation.modelInvocable ? " \xB7 \u4EC5\u6A21\u578B\u8C03\u7528" : " \xB7 \u4EC5\u624B\u52A8\u8C03\u7528" : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsm-row-actions", children: row.manageable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-switch", role: "switch", "aria-label": `${row.enabled ? "\u5173\u95ED" : "\u542F\u7528"} ${row.name}`, "aria-checked": row.enabled, disabled: blocked, onClick: () => void run(row.enabled ? "disable" : "enable", [row]), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-icon-btn dsm-delete", "aria-label": `\u5220\u9664 ${row.name}`, title: "\u5220\u9664\u6280\u80FD", disabled: blocked, onClick: () => setDeleting([row]), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrashIcon, {}) })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsm-readonly", title: row.reason, children: "\u53EA\u8BFB" }) })
        ] }, row.id)) })
      ] }, source);
    }),
    visible.length === 0 && state.status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillIcon, { size: 32 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: state.catalog.skills.length ? "\u6CA1\u6709\u5339\u914D\u7684\u6280\u80FD" : "\u8FD8\u6CA1\u6709\u52A0\u8F7D\u6280\u80FD" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: state.catalog.skills.length ? "\u8BD5\u8BD5\u5176\u4ED6\u5173\u952E\u8BCD\u6216\u7B5B\u9009\u6761\u4EF6\u3002" : "\u5C06\u6280\u80FD\u653E\u5165 dsh \u6216 agents \u7684 skills \u76EE\u5F55\uFF0C\u7136\u540E\u5237\u65B0\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsm-note", children: "\u5217\u8868\u663E\u793A\u5F53\u524D\u8303\u56F4\u4E2D\u751F\u6548\u7684\u6280\u80FD\uFF1B\u540C\u540D\u6280\u80FD\u6309 dsh \u7684\u6765\u6E90\u4F18\u5148\u7EA7\u53D6\u4E00\u9879\u3002\u5F00\u5173\u5F71\u54CD\u540E\u7EED\u8C03\u7528\uFF0C\u5DF2\u6CE8\u5165\u5BF9\u8BDD\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u3002" }),
    selectedRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-bulk", "aria-label": "\u6279\u91CF\u64CD\u4F5C", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        "\u5DF2\u9009\u62E9 ",
        selectedRows.length,
        " \u9879 ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-link", onClick: () => setSelected(/* @__PURE__ */ new Set()), children: "\u6E05\u7A7A" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsm-bulk-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run("enable", selectedRows), children: "\u542F\u7528" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-btn", disabled: blocked || selectedRows.length > 100, onClick: () => void run("disable", selectedRows), children: "\u5173\u95ED" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "dsm-btn danger", disabled: blocked || selectedRows.length > 100, onClick: () => setDeleting(selectedRows), children: "\u5220\u9664" })
      ] })
    ] }),
    deleting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteDialog, { rows: deleting, onCancel: () => setDeleting(null), onConfirm: () => {
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
.dsm-scope { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:32px 0 20px; color:var(--dsm-muted); }
.dsm select { background:var(--dsm-soft); color:var(--dsm-fg); border:1px solid var(--dsm-line); border-radius:8px; padding:7px 10px; max-width:320px; }
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
.dsm-check { width:15px; height:15px; accent-color:#5368dd; cursor:pointer; flex-shrink:0; }
.dsm-skill-icon { background:var(--dsm-soft); width:42px; height:42px; border-radius:11px; display:grid; place-items:center; color:#8070df; flex-shrink:0; }
.dsm-copy { flex:1; min-width:0; }
.dsm-name { font-size:14px; font-weight:550; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-desc { font-size:13px; color:var(--dsm-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px; }
.dsm-meta { color:var(--dsm-muted); font-size:11px; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsm-row.disabled .dsm-name,.dsm-row.disabled .dsm-skill-icon { opacity:.5; }
.dsm-row-actions { display:flex; align-items:center; gap:8px; }
.dsm-switch { width:31px; height:18px; padding:2px; border:0; border-radius:12px; background:#d5d7dd; display:flex; align-items:center; }
.dsm-switch[aria-checked=true] { background:#606ede; justify-content:flex-end; }
.dsm-switch span { display:block; width:14px; height:14px; border-radius:50%; background:#fff; box-shadow:0 1px 2px #0002; }
.dsm-delete { opacity:0; padding:4px; }
.dsm-row:hover .dsm-delete,.dsm-row:focus-within .dsm-delete { opacity:1; }
.dsm-readonly { color:var(--dsm-muted); font-size:11px; white-space:nowrap; }
.dsm-note { color:var(--dsm-muted); font-size:12px; margin-top:26px; }
.dsm-message { padding:11px 14px; margin-bottom:18px; border-radius:9px; background:var(--dsm-soft); }
.dsm-message.error { color:#ba424b; background:#d64a5710; }
.dsm-message.success { color:#278063; background:#27a4770d; }
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
