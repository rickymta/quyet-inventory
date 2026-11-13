/* Nhật ký lỗi im lặng (thay cho catch{} rỗng) — bám theo app gốc: lưu tối đa 100 dòng ở localStorage 'kk_errlog' */
const MAX = 100;
let buf = [];
let idx = {};
let timer = null;
let loaded = false;
function load() {
  if (loaded) return;
  loaded = true;
  try {
    const r = localStorage.getItem('kk_errlog');
    if (r) {
      const a = JSON.parse(r);
      if (Array.isArray(a)) { buf = a.slice(-MAX); buf.forEach((x, i) => { idx[x.c + '|' + x.m] = i; }); }
    }
  } catch (_) { /* bỏ qua */ }
}
function persist() { timer = null; try { localStorage.setItem('kk_errlog', JSON.stringify(buf)); } catch (_) { /* bỏ qua */ } }
export function klog(ctx, err) {
  try {
    load();
    const m = String(err && err.message ? err.message : err).slice(0, 200);
    const n = err && err.name ? String(err.name) : 'Error';
    const k = ctx + '|' + m;
    const now = Date.now();
    if (idx[k] !== undefined && buf[idx[k]] && buf[idx[k]].c === ctx && buf[idx[k]].m === m) { const e0 = buf[idx[k]]; e0.n = (e0.n || 1) + 1; e0.t = now; }
    else {
      buf.push({ t: now, c: ctx, e: n, m, n: 1 });
      if (buf.length > MAX) { buf.shift(); idx = {}; buf.forEach((x, i) => { idx[x.c + '|' + x.m] = i; }); } else idx[k] = buf.length - 1;
    }
    if (console && console.warn) console.warn('[kk]', ctx, err);
    if (!timer) timer = setTimeout(persist, 1500);
  } catch (_) { /* không bao giờ ném lỗi ra ngoài */ }
}
export function klogDump() { load(); return buf.slice(); }
export function klogClear() { buf = []; idx = {}; try { localStorage.removeItem('kk_errlog'); } catch (_) { /* bỏ qua */ } }
if (typeof window !== 'undefined') Object.assign(window, { klog, klogDump, klogClear });
