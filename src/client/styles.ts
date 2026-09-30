export const styles = `
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
`
