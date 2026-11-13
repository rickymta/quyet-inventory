/* Lưu trữ: thay localStorage/IndexedDB của app gốc bằng API Express + MongoDB.
   Mô hình giữ nguyên: mã nghiệp vụ sửa `db` tại chỗ rồi gọi store.save() / saveSoon().
   Tầng này tự so khác biệt với bản đã đồng bộ và chỉ gửi phần đã đổi (theo từng kỳ, từng dòng vật tư, từng khoá). */
import { useSyncExternalStore } from 'react';
import { db, emptyDb, DEFAULT_FOLDERS } from './state.js';
import { klog } from './klog.js';
import { idbGet, idbPut, idbDel, idbAll } from './idb.js';

/* mảng trong db có collection riêng; true = có mảng con `items` lưu theo từng dòng */
const COLS = { periods: true, assets: true, handovers: false, explains: false };
const SEP = '\u0001';

/* ---------- Vẽ lại giao diện ("immediate mode" như render() của app gốc) ---------- */
let version = 0;
const subs = new Set();
export function rerender() { version++; subs.forEach((f) => f()); }
function subscribe(f) { subs.add(f); return () => subs.delete(f); }
export function useStore() { return useSyncExternalStore(subscribe, () => version); }

/* ---------- Phiên đăng nhập ---------- */
export const auth = { user: null, checked: false, expired: false };
export const isAdmin = () => !!(auth.user && auth.user.role === 'admin');
let loaded = false;       // đã nạp dữ liệu máy chủ vào db ít nhất một lần trong trang này
let lastUser = null;      // tài khoản gần nhất (giữ quyền để phép so khác biệt ổn định khi phiên vừa hết)
let lastUid = null;       // id tài khoản của phiên gần nhất (để biết đăng nhập lại có cùng người không)
const blankProfile = () => ({ ten: '', chucVu: '', chiNhanh: '', ma: '', maManual: false });
function normProfile(p) {
  const o = blankProfile(); const src = p && typeof p === 'object' ? p : {};
  o.ten = String(src.ten || ''); o.chucVu = String(src.chucVu || ''); o.chiNhanh = String(src.chiNhanh || ''); o.ma = String(src.ma || ''); o.maManual = !!src.maManual;
  return o;
}
let profJson = null;      // JSON hồ sơ đã được lưu trên máy chủ
const profNow = () => JSON.stringify(normProfile(db.profile));
function applyProfile(p) { db.profile = normProfile(p); profJson = JSON.stringify(db.profile); }
function sessionExpired() {
  if (!auth.user) return;
  auth.user = null; auth.expired = true; store.ready = false;
  clearTimeout(retryT); clearTimeout(saveT); saveT = null;
  rerender();
}

/* ---------- Gọi API ---------- */
export async function api(path, { method = 'GET', body, keepalive } = {}) {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    keepalive,
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/me') sessionExpired();
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch (_) { /* giữ statusText */ }
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.json();
}

/* ---------- Làm sạch dữ liệu (như sanitizeDb của app gốc) ---------- */
const hasId = (x) => x !== null && typeof x === 'object' && !Array.isArray(x) && x.id != null;
export function sanitizeDb(d) {
  if (!Array.isArray(d.folders)) d.folders = DEFAULT_FOLDERS.slice();
  ['barcodes', 'hsd', 'counters', 'boxref', 'track'].forEach((k) => { if (!d[k] || typeof d[k] !== 'object' || Array.isArray(d[k])) d[k] = {}; });
  ['periods', 'handovers', 'explains'].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
  ['periods', 'handovers', 'explains', 'assets'].forEach((k) => { if (Array.isArray(d[k])) d[k] = d[k].filter(hasId); });
  d.periods = d.periods.filter((p) => typeof p.id === 'string' && Array.isArray(p.items));
  ['periods', 'assets'].forEach((k) => {
    if (Array.isArray(d[k])) d[k].forEach((p) => { if (Array.isArray(p.items)) p.items = p.items.filter(hasId); });
  });
  return d;
}

/* ---------- Ghi đè tại chỗ, giữ nguyên tham chiếu đối tượng (màn hình đang mở không bị "mồ côi") ---------- */
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export function deepSync(dst, src) {
  if (Array.isArray(dst) && Array.isArray(src)) {
    const old = new Map();
    dst.forEach((x) => { if (hasId(x)) old.set(String(x.id), x); });
    const used = new Set();
    const next = src.map((s, i) => {
      if (hasId(s)) {
        const o = old.get(String(s.id));
        if (o && !used.has(o)) { used.add(o); deepSync(o, s); return o; }
        return s;
      }
      const o = dst[i];
      if ((isObj(s) && isObj(o) && o.id == null && !used.has(o)) || (Array.isArray(s) && Array.isArray(o))) { used.add(o); deepSync(o, s); return o; }
      return s;
    });
    dst.length = 0; next.forEach((x) => dst.push(x));
    return dst;
  }
  if (isObj(dst) && isObj(src)) {
    Object.keys(dst).forEach((k) => { if (!(k in src)) delete dst[k]; });
    Object.keys(src).forEach((k) => {
      const a = dst[k]; const b = src[k];
      if (isObj(a) && isObj(b)) {
        if (a.id !== b.id && (a.id != null || b.id != null)) dst[k] = b; else deepSync(a, b);
      } else if (Array.isArray(a) && Array.isArray(b)) deepSync(a, b);
      else dst[k] = b;
    });
  }
  return dst;
}
/* Thay toàn bộ nội dung db. Không gán lại biến db. */
export function replaceDb(next) { deepSync(db, next); return db; }

/* ---------- Dữ liệu RIÊNG TỪNG THIẾT BỊ: không đồng bộ lên máy chủ, giữ ở localStorage 'kk_dev_local' ---------- */
const DEV_TOP = ['webauthn', 'waFail', 'waPref'];
const DEV_SG = ['sig', 'name', 'fixed', 'dev', 'pw'];
function devPick(src) {
  const o = {};
  DEV_TOP.forEach((k) => { if (src[k] !== undefined) o[k] = src[k]; });
  if (isObj(src.sg)) { const g = {}; DEV_SG.forEach((k) => { if (src.sg[k] !== undefined) g[k] = src.sg[k]; }); if (Object.keys(g).length) o.sg = g; }
  return o;
}
function devRead() { try { const j = JSON.parse(localStorage.getItem('kk_dev_local') || 'null'); return isObj(j) ? j : {}; } catch (_) { return {}; } }
let devJson = null;
function saveDev() {
  if (!loaded) return;
  try {
    const j = JSON.stringify(devPick(db));
    if (j === devJson) return;
    localStorage.setItem('kk_dev_local', j); devJson = j;
  } catch (e) { klog('store.saveDev', e); }
}
function devStrip(d) {
  DEV_TOP.forEach((k) => { delete d[k]; });
  if (isObj(d.sg)) DEV_SG.forEach((k) => { delete d.sg[k]; });
  return d;
}
function devAttach(dev) {
  DEV_TOP.forEach((k) => { if (dev[k] !== undefined) db[k] = dev[k]; else delete db[k]; });
  if (dev.sg) { if (!isObj(db.sg)) db.sg = {}; DEV_SG.forEach((k) => { if (dev.sg[k] !== undefined) db.sg[k] = dev.sg[k]; }); }
}

/* ---------- So khác biệt ---------- */
let snap = new Map();          // khoá thực thể -> { o: thứ tự, j: JSON }
const sentAudit = new Set();   // các `k` của mục audit đã có trên máy chủ
let rev = 0;
let gen = 0;                   // tăng khi lượt flush bắt đầu/kết thúc và mỗi lần save()/saveSoon()

function sgJson(v) {
  if (!isObj(v)) return JSON.stringify(v);
  const o = {}; Object.keys(v).forEach((k) => { if (DEV_SG.indexOf(k) < 0) o[k] = v[k]; });
  return JSON.stringify(o);
}
/* id trùng trong cùng một kỳ: đổi id của mục đứng sau thành id mới duy nhất */
function fixDupIds(arr) {
  let n = 0;
  arr.forEach((p) => {
    if (!p || !Array.isArray(p.items)) return;
    const seen = new Set();
    p.items.forEach((it) => {
      if (!hasId(it)) return;
      let id = String(it.id);
      if (seen.has(id)) {
        let c = 1; while (seen.has(id + '_d' + c) || p.items.some((z) => hasId(z) && z !== it && String(z.id) === id + '_d' + c)) c++;
        it.id = id + '_d' + c; id = String(it.id); n++;
      }
      seen.add(id);
    });
  });
  return n;
}
/* Khoá kv mà tài khoản hiện tại được phép ghi (cùng quy tắc với máy chủ — docs/PERMISSIONS.md).
   Khoá không được ghi thì không đưa vào so khác biệt: các phân hệ thường tự khởi tạo dữ liệu rỗng khi mở màn
   (db.err, db.sg, db.recon...), với tài khoản chỉ xem điều đó không được biến thành lượt ghi bị từ chối. */
const KV_MOD = { recon: 'recon', pay: 'pay', ana: 'ana', err: 'err', sg: 'sign', hsd: 'kiemke', print: 'config', signers: 'config', keys: 'config' };
function kvWritable(k) {
  const u = auth.user || lastUser;
  /* chưa từng có phiên: giữ nguyên mọi khoá trong phép so (nếu bỏ, phép so sẽ hiểu nhầm là các khoá bị xoá) */
  if (!u) return true;
  if (u.role === 'admin') return true;
  const pm = (u.perms && u.perms.modules) || {};
  const lv = (x) => Number(pm[x]) || 0;
  if (KV_MOD[k]) return lv(KV_MOD[k]) >= 2;
  if (k === 'barcodes' || k === 'boxref' || k === 'track' || k === 'ocrfix') return lv('kiemke') >= 2 || lv('assets') >= 2;
  if (k === 'folders') return lv('config') >= 2 && u.perms && u.perms.branches === '*';
  if (k === 'counters') return ['handover', 'explain', 'kiemke', 'assets'].some((x) => lv(x) >= 2);
  return Object.keys(pm).some((x) => lv(x) >= 2);
}

function scan() {
  if (auth.user) lastUser = auth.user;
  const m = new Map();
  Object.keys(db).forEach((k) => {
    if (!kvWritable(k)) return;
    if (k in COLS || k === 'audit' || k === 'profile' || k === 'lastBackup' || k === 'backupSnooze' || k.startsWith('__') || DEV_TOP.indexOf(k) >= 0) return;
    const v = db[k];
    if (v === undefined) return;
    m.set('kv' + SEP + k, { o: 0, j: k === 'sg' ? sgJson(v) : JSON.stringify(v) });
  });
  let dups = 0;
  Object.keys(COLS).forEach((col) => {
    const arr = db[col];
    if (!Array.isArray(arr)) return;
    if (COLS[col]) dups += fixDupIds(arr);
    arr.forEach((doc, ord) => {
      if (!doc || doc.id == null) return;
      const id = String(doc.id);
      if (COLS[col]) {
        const { items, ...meta } = doc;
        m.set('doc' + SEP + col + SEP + id, { o: ord, j: JSON.stringify(meta) });
        (Array.isArray(items) ? items : []).forEach((it, idx) => {
          if (!it || it.id == null) return;
          m.set('item' + SEP + col + SEP + id + SEP + String(it.id), { o: idx, j: JSON.stringify(it) });
        });
      } else m.set('doc' + SEP + col + SEP + id, { o: ord, j: JSON.stringify(doc) });
    });
  });
  if (dups) klog('store.scan', new Error('Có ' + dups + ' mục trùng id trong cùng kỳ: đã đổi id mục đứng sau'));
  return m;
}
function diff(prev, cur) {
  const ops = [];
  cur.forEach((v, key) => {
    const p = prev.get(key);
    if (p && p.j === v.j && p.o === v.o) return;
    const [t, a, b, c] = key.split(SEP);
    const full = !p || p.j !== v.j;
    if (t === 'kv') ops.push({ t: 'kv', k: a, v: JSON.parse(v.j) });
    else if (t === 'doc') ops.push(full ? { t: 'doc', c: a, id: b, ord: v.o, d: JSON.parse(v.j) } : { t: 'doc', c: a, id: b, ord: v.o });
    else ops.push(full ? { t: 'item', c: a, pid: b, id: c, idx: v.o, d: JSON.parse(v.j) } : { t: 'item', c: a, pid: b, id: c, idx: v.o });
  });
  const goneDocs = new Set();
  prev.forEach((v, key) => {
    if (cur.has(key)) return;
    const [t, a, b, c] = key.split(SEP);
    if (t === 'kv') ops.push({ t: 'kvdel', k: a });
    else if (t === 'doc') { ops.push({ t: 'docdel', c: a, id: b }); goneDocs.add(a + SEP + b); }
    else if (!goneDocs.has(a + SEP + b) && cur.has('doc' + SEP + a + SEP + b)) ops.push({ t: 'itemdel', c: a, pid: b, id: c });
  });
  return ops;
}
/* mục audit chưa gửi: có `k` mà máy chủ chưa có (mục không có `k` = dữ liệu cũ từ máy chủ, coi như đã gửi) */
function auditPending() {
  const a = Array.isArray(db.audit) ? db.audit : [];
  const add = []; const ks = []; const seen = new Set();
  a.forEach((e) => {
    if (e && typeof e === 'object' && typeof e.k === 'string' && !sentAudit.has(e.k) && !seen.has(e.k)) { seen.add(e.k); add.push(e); ks.push(e.k); }
  });
  return { add, ks };
}
/* dựng ops + chụp danh sách audit tại thời điểm này */
function buildOps(cur) {
  const ops = diff(snap, cur);
  const { add, ks } = auditPending();
  for (let i = 0; i < add.length; i += 200) ops.push({ t: 'audit', add: add.slice(i, i + 200) });
  return { ops, ks };
}

/* chia lô: mỗi request ≤ ~4MB; op đơn lẻ lớn hơn thì đi riêng. Trả mảng body (chuỗi JSON) */
const MAX_REQ = 4 * 1024 * 1024;
function chunkBodies(ops) {
  const out = []; let cur = []; let size = 0;
  const flush = () => { if (cur.length) out.push('{"ops":[' + cur.join(',') + ']}'); cur = []; size = 0; };
  ops.forEach((op) => {
    const j = JSON.stringify(op);
    if (cur.length && size + j.length > MAX_REQ) flush();
    cur.push(j); size += j.length + 1;
  });
  flush();
  return out;
}

/* ---------- Đồng bộ ---------- */
let saveT = null;
let syncing = null;   // Promise của lượt đồng bộ đang chạy
let retryT = null;
let retryN = 0;
const BACKOFF = [5000, 10000, 20000, 60000];
const fatalStatus = (e) => e && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429 && e.status !== 401;

export const store = {
  ok: true,
  state: 'ok',        // ok | pending | saving | fail
  at: 0,
  err: null,
  fatal: false,       // lỗi 4xx: không tự thử lại
  ready: false,
  bootErr: null,
  /* Đánh dấu đã đổi và đẩy lên máy chủ ngay sau một nhịp ngắn (gộp các lần lưu dồn) */
  save() { gen++; clearTimeout(saveT); store.state = 'pending'; saveT = setTimeout(() => { saveT = null; store.flushNow(); }, 60); return true; },
  /* Cần chắc chắn đã ghi xong thì dùng `await store.flushNow()`. */
  saveVerified() { return store.save(); },
  flush() { if (saveT) { clearTimeout(saveT); saveT = null; store.flushNow(); } },
  /* Chờ lượt đang chạy xong rồi tự chạy lượt của mình; trả kết quả của chính lượt đó */
  async flushNow() {
    while (syncing) await syncing;
    const p = (async () => {
      try { return await doFlush(); }
      catch (e) { klog('store.flushNow', e); store.state = 'fail'; store.err = e; return false; }
      finally { syncing = null; gen++; ind(); }
    })();
    syncing = p;
    return p;
  },
  dirty() { try { return diff(snap, scan()).length > 0 || auditPending().add.length > 0 || (profJson !== null && profNow() !== profJson); } catch (e) { return true; } },
  rev() { return rev; },
};

async function doFlush() {
  gen++;
  clearTimeout(saveT); saveT = null; clearTimeout(retryT);
  saveDev();
  await syncProfile();
  if (!auth.user) { store.state = 'pending'; return false; }   // hết phiên: giữ nguyên thay đổi, gửi sau khi đăng nhập lại
  let cur; let built;
  try { cur = scan(); built = buildOps(cur); }
  catch (e) { console.error(e); store.state = 'fail'; store.err = e; return false; }
  const { ops, ks } = built;
  if (!ops.length) { store.state = 'ok'; store.err = null; store.fatal = false; retryN = 0; return true; }
  store.state = 'saving';
  const bodies = chunkBodies(ops);
  const at = Date.now();
  await idbPut('pending', { at, uid: auth.user ? auth.user.id : lastUid, baseRev: rev, ops });
  try {
    let last = null; let gap = false; const rejected = [];
    for (let i = 0; i < bodies.length; i++) {
      const r = await api('/sync', { method: 'POST', body: bodies[i] });
      if (i === 0 ? r.prev !== rev : r.prev !== last) gap = true;
      last = r.rev;
      if (r && Array.isArray(r.rejected)) r.rejected.forEach((x) => rejected.push(x));
    }
    snap = cur; ks.forEach((k) => sentAudit.add(k));
    store.state = 'ok'; store.err = null; store.fatal = false; store.at = Date.now(); retryN = 0;
    if (gap) setTimeout(pull, 50); else rev = last;
    const pend = await idbGet('pending');
    if (pend && pend.at === at) await idbDel('pending');
    if (rejected.length) { notifyRejected(rejected); setTimeout(forcePull, 0); }
    return true;
  } catch (e) {
    if (e && e.status === 401) { store.state = 'pending'; return false; }
    klog('store.sync', e);
    store.state = 'fail'; store.err = e;
    if (fatalStatus(e)) store.fatal = true;
    else { store.fatal = false; retryT = setTimeout(() => store.flushNow(), BACKOFF[Math.min(retryN, BACKOFF.length - 1)]); retryN++; }
    return false;
  }
}
/* Hồ sơ của tài khoản: JSON khác bản đã lưu thì PUT /auth/profile. Lỗi thì bỏ qua, lần flush sau thử lại. */
async function syncProfile() {
  if (!auth.user || profJson === null) return true;
  const j = profNow();
  if (j === profJson) return true;
  try {
    const r = await api('/auth/profile', { method: 'PUT', body: { profile: JSON.parse(j) } });
    profJson = j;
    if (r && r.user) auth.user = r.user;
    return true;
  } catch (e) { if (!(e && e.status === 401)) klog('store.profile', e); return false; }
}
export async function saveProfile() { return syncProfile(); }
export function saveSoon() { gen++; clearTimeout(saveT); store.state = 'pending'; saveT = setTimeout(() => { saveT = null; store.flushNow(); }, 400); }
export const save = () => store.save();

/* Thanh báo khi chưa ghi được lên máy chủ */
function ind() {
  if (typeof document === 'undefined') return;
  let b = document.getElementById('svbar');
  if (store.state !== 'fail') { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('div'); b.id = 'svbar'; document.body.appendChild(b); }
  b.style.cssText = 'position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 66px);z-index:210;background:#fde8e8;color:#7a1218;border:1px solid #e0383d;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.18)';
  const msg = String((store.err && store.err.message) || 'mất kết nối').replace(/[<>&]/g, '');
  b.innerHTML = '<b>Chưa lưu được dữ liệu lên máy chủ</b> (' + msg + '). '
    + (store.fatal ? 'Máy chủ từ chối thay đổi này nên app không tự thử lại; dữ liệu vẫn còn trong phiên này, đừng đóng trang.' : 'Dữ liệu vẫn còn trong phiên này và app sẽ tự thử lại; đừng đóng trang cho tới khi lưu xong.')
    + '<div style="margin-top:8px"><button class="pill" id="svretry">Thử lưu lại</button></div>';
  const btn = b.querySelector('#svretry');
  if (btn) btn.onclick = () => { retryN = 0; store.flushNow(); };
}

/* ---------- Tải dữ liệu ---------- */
function adopt(remote, r) {
  const dev = loaded ? devPick(db) : devRead();
  devStrip(remote);
  delete remote.profile; delete remote.lastBackup; delete remote.backupSnooze;
  const prof = db.profile;
  sentAudit.clear();
  (Array.isArray(remote.audit) ? remote.audit : []).forEach((e) => { if (e && typeof e.k === 'string') sentAudit.add(e.k); });
  deepSync(db, sanitizeDb(remote));
  if (!db.handovers) db.handovers = [];
  if (!db.explains) db.explains = [];
  if (!db.counters) db.counters = {};
  db.profile = prof || blankProfile();
  devAttach(dev);
  rev = r;
}
function notifyRejected(rej) {
  const first = rej[0] && rej[0].reason ? String(rej[0].reason) : 'bạn không có quyền thực hiện thay đổi này';
  notify('Không lưu được: ' + first + (rej.length > 1 ? ' (+' + (rej.length - 1) + ' mục khác)' : ''), 0);
}
function notify(msg, delay = 600) {
  const go = () => {
    try {
      const t = typeof window !== 'undefined' && window.__kk && window.__kk.X && window.__kk.X.toast;
      if (t) t(msg); else import('./ui.jsx').then((m) => m.toast(msg)).catch(() => {});
    } catch (_) { /* bỏ qua */ }
  };
  setTimeout(go, delay);
}
/* Gửi lại các thay đổi chưa lưu của phiên trước. true = đã gửi lại */
async function replayPending() {
  const p = await idbGet('pending');
  if (!p || !Array.isArray(p.ops) || !p.ops.length) return false;
  /* chỉ gửi lại thay đổi của CHÍNH tài khoản đang đăng nhập */
  if (!auth.user || p.uid !== auth.user.id) { await idbDel('pending'); return false; }
  try {
    const rej = [];
    for (const body of chunkBodies(p.ops)) { const r = await api('/sync', { method: 'POST', body }); if (r && Array.isArray(r.rejected)) r.rejected.forEach((x) => rej.push(x)); }
    if (rej.length) notifyRejected(rej);
  } catch (e) {
    if (fatalStatus(e)) { klog('store.replay', e); await idbDel('pending'); notify('Không gửi lại được thay đổi chưa lưu từ phiên trước: ' + e.message); return false; }
    throw e;
  }
  await idbDel('pending');
  return true;
}
/* Tải dữ liệu máy chủ vào db (sau khi đã có phiên). Đăng nhập lại trong cùng trang (hết phiên) thì giữ nguyên db,
   đẩy nốt thay đổi đang dở rồi mới kéo dữ liệu mới. */
async function loadData() {
  try {
    if (loaded && auth.user && auth.user.id !== lastUid) {
      /* Người KHÁC đăng nhập trên cùng trang: dữ liệu trong bộ nhớ là phần đã lọc theo quyền của người trước.
         Không được đẩy nó lên bằng quyền của người mới — bỏ hẳn và tải lại từ đầu. */
      loaded = false; snap = new Map(); sentAudit.clear();
      replaceDb(emptyDb());
      await idbDel('pending');
    }
    if (loaded) {
      lastUid = auth.user && auth.user.id;
      store.ready = true; store.bootErr = null;
      rerender();
      await store.flushNow();
      pull();
    } else {
      let r = await api('/bootstrap');
      const replayed = await replayPending();
      if (replayed) r = await api('/bootstrap');
      applyProfile(auth.user && auth.user.profile);
      lastUid = auth.user && auth.user.id;
      loaded = true;
      adopt(r.db || {}, r.rev || 0);
      /* snap lấy theo đúng dữ liệu máy chủ; phần chuẩn hoá cục bộ (nếu có) sẽ được gửi ở lượt lưu kế tiếp */
      snap = scan();
      store.ready = true; store.bootErr = null;
      if (replayed) notify('Đã gửi lại các thay đổi chưa lưu từ phiên trước');
    }
  } catch (e) {
    if (!(e && e.status === 401)) { store.bootErr = e; klog('store.boot', e); }
  }
  rerender();
  loadBlobQueue().then(flushBlobQueue);
  return store.ready;
}
export async function boot() {
  store.bootErr = null;
  try {
    const r = await api('/auth/me');
    auth.user = r.user || null;
  } catch (e) {
    if (e && e.status === 401) auth.user = null;
    else { store.bootErr = e; klog('store.boot', e); auth.checked = true; rerender(); return false; }
  }
  auth.checked = true;
  if (!auth.user) { rerender(); return false; }
  auth.expired = false;
  return loadData();
}
export async function login(username, password) {
  const r = await api('/auth/login', { method: 'POST', body: { username: String(username || '').trim(), password: String(password || '') } });
  auth.user = r.user; auth.expired = false; auth.checked = true;
  rerender();
  return loadData();
}
/* Đăng xuất: đẩy nốt thay đổi chưa gửi (hỏi lại nếu không gửi được), huỷ phiên, xoá dữ liệu khỏi bộ nhớ rồi nạp lại trang. */
export async function logout() {
  if (store.ready) {
    let ok = true;
    try { ok = await store.flushNow(); } catch (_) { ok = false; }
    if (!ok && store.dirty() && !confirm('Còn thay đổi chưa gửi được lên máy chủ. Đăng xuất bây giờ sẽ mất các thay đổi đó. Vẫn đăng xuất?')) return false;
  }
  try { await api('/auth/logout', { method: 'POST' }); } catch (e) { klog('auth.logout', e); }
  clearTimeout(retryT); clearTimeout(saveT); saveT = null;
  auth.user = null; auth.expired = false; store.ready = false; loaded = false; lastUid = null; lastUser = null; profJson = null;
  snap = new Map(); rev = 0; sentAudit.clear(); bq.clear();
  replaceDb(emptyDb());
  await idbDel('pending');
  try { document.getElementById('svbar')?.remove(); } catch (_) { /* bỏ qua */ }
  rerender();
  try { history.replaceState(null, '', location.pathname); } catch (_) { /* bỏ qua */ }
  setTimeout(() => { try { location.reload(); } catch (_) { /* bỏ qua */ } }, 50);
  return true;
}
/* Gán lại hồ sơ/tài khoản của chính mình sau khi quản trị viên sửa */
export function adoptOwnUser(u) { auth.user = u; applyProfile(u && u.profile); rerender(); }
export async function changePassword(current, next) { return api('/auth/password', { method: 'PUT', body: { current, next } }); }
/* Lấy thay đổi từ máy khác. Chỉ adopt khi không có gì chen ngang trong lúc tải. */
let pulling = false;
export async function pull() {
  if (pulling || !store.ready) return;
  if (syncing || saveT || store.dirty()) { store.flushNow(); return; }
  pulling = true;
  const g = gen;
  try {
    const r = await api('/bootstrap');
    if (gen === g && !syncing && !saveT && !store.dirty() && r.rev !== rev) {
      adopt(r.db || {}, r.rev || 0);
      snap = scan();
      rerender();
    }
  } catch (e) { klog('store.pull', e); }
  pulling = false;
}
/* Tải lại BẮT BUỘC từ máy chủ (kể cả khi rev không đổi) để bỏ thay đổi cục bộ không được phép / quyền đã đổi.
   Thay đổi cục bộ mới phát sinh trong lúc chờ thì được gửi đi trước, rồi mới tải lại. */
let forcing = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function forcePull() {
  if (forcing || !store.ready) return;
  forcing = true;
  try {
    for (let n = 0; n < 4; n++) {
      while (pulling) await sleep(60);
      if (syncing || saveT || store.dirty()) { await store.flushNow(); continue; }
      pulling = true;
      const g = gen; let r = null;
      try { r = await api('/bootstrap'); } catch (e) { klog('store.forcePull', e); } finally { pulling = false; }
      if (!r) break;
      if (gen === g && !syncing && !saveT && !store.dirty()) {
        adopt(r.db || {}, r.rev || 0);
        snap = scan();
        rerender();
        break;
      }
    }
  } finally { forcing = false; }
}
/* Làm mới tài khoản (quyền có thể đã được quản trị viên đổi); quyền đổi thì tải lại dữ liệu */
let refreshing = false;
async function refreshMe() {
  if (refreshing || !auth.user) return;
  refreshing = true;
  try {
    const r = await api('/auth/me');
    if (r && r.user && auth.user && r.user.id === auth.user.id) {
      const changed = JSON.stringify(r.user.perms || null) !== JSON.stringify(auth.user.perms || null) || r.user.role !== auth.user.role;
      auth.user = r.user;
      if (changed) { rerender(); await forcePull(); }
    }
  } catch (_) { /* bỏ qua */ } finally { refreshing = false; }
}
async function checkRemote() {
  if (!store.ready || document.visibilityState === 'hidden' || syncing || saveT) return;
  try { const r = await api('/rev'); if (r.rev !== rev) await pull(); refreshMe(); } catch (_) { /* ngoại tuyến: bỏ qua */ }
}
/* Đóng/ẩn trang: gửi ngay phần chưa gửi bằng request keepalive riêng (≤ ~60KB); lớn hơn thì dựa vào hàng đợi IndexedDB */
function flushOnHide() {
  if (!store.ready) return;
  saveDev();
  try {
    const cur = scan(); const { ops } = buildOps(cur);
    if (!ops.length) return;
    const body = JSON.stringify({ ops });
    if (new Blob([body]).size < 60000) api('/sync', { method: 'POST', body, keepalive: true }).catch(() => {});
    else idbPut('pending', { at: Date.now(), uid: auth.user ? auth.user.id : lastUid, baseRev: rev, ops });
  } catch (e) { klog('store.hide', e); }
}
if (typeof window !== 'undefined') {
  const iv = setInterval(() => { checkRemote(); flushBlobQueue(); }, 15000);
  if (iv && iv.unref) iv.unref();
  window.addEventListener('focus', checkRemote);
  window.addEventListener('online', () => { store.flushNow(); checkRemote(); flushBlobQueue(); });
  window.addEventListener('pagehide', flushOnHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnHide(); else checkRemote();
  });
  window.store = store;
}

/* ---------- Nhật ký thay đổi (như audit() của app gốc) ---------- */
export function audit(type, target, before, after) {
  try {
    const a = db.audit || (db.audit = []);
    a.push({ k: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), at: Date.now(), by: (db.profile && db.profile.ten) || (auth.user && auth.user.username) || '', type, target: String(target || '').slice(0, 120), before: before === undefined ? null : before, after: after === undefined ? null : after });
    if (a.length > 3000) a.splice(0, 500);
  } catch (e) { klog('audit', e); }
}

/* ---------- Kho ảnh / tệp lớn trên máy chủ (thay IndexedDB: kk_photos, kk_err_img, PDF đã ký...) ---------- */
const enc = encodeURIComponent;
const bq = new Map();   // `${store}\u0001${key}` -> { s, k, op: 'put'|'del', value }
const qk = (s, k) => s + SEP + k;
const idbKey = (s, k) => 'blob:' + s + ':' + k;
const retriable = (e) => !e.status || e.status >= 500 || e.status === 401;
function enqueue(s, k, op, value) {
  const it = { s, k, op, value };
  bq.set(qk(s, k), it);
  idbPut(idbKey(s, k), it);
}
function unqueue(s, k) { if (bq.delete(qk(s, k))) idbDel(idbKey(s, k)); }
async function loadBlobQueue() {
  try { (await idbAll('blob:')).forEach(([, it]) => { if (it && it.s != null && it.k != null && !bq.has(qk(it.s, it.k))) bq.set(qk(it.s, it.k), it); }); } catch (e) { klog('blobs.load', e); }
}
let bqBusy = false;
async function flushBlobQueue() {
  if (bqBusy || !bq.size || !auth.user) return;
  bqBusy = true;
  try {
    for (const it of Array.from(bq.values())) {
      if (bq.get(qk(it.s, it.k)) !== it) continue;
      try {
        if (it.op === 'put') await api(`/blobs/${enc(it.s)}/${enc(it.k)}`, { method: 'PUT', body: { value: it.value } });
        else await api(`/blobs/${enc(it.s)}/${enc(it.k)}`, { method: 'DELETE' });
      } catch (e) {
        if (retriable(e)) break;
        klog('blobs.flush', e);   // 4xx: máy chủ từ chối, bỏ mục này để khỏi kẹt hàng đợi
      }
      if (bq.get(qk(it.s, it.k)) === it) unqueue(it.s, it.k);
    }
  } finally { bqBusy = false; }
}
export const blobs = {
  async get(s, k) {
    const q = bq.get(qk(s, k));
    if (q) return q.op === 'put' ? q.value : null;
    try { return (await api(`/blobs/${enc(s)}/${enc(k)}`)).value; } catch (e) { if (e.status === 404) return null; throw e; }
  },
  async put(s, k, value) {
    unqueue(s, k);
    try { await api(`/blobs/${enc(s)}/${enc(k)}`, { method: 'PUT', body: { value } }); return true; }
    catch (e) { if (retriable(e)) { enqueue(s, k, 'put', value); return true; } throw e; }
  },
  async del(s, k) {
    unqueue(s, k);
    try { await api(`/blobs/${enc(s)}/${enc(k)}`, { method: 'DELETE' }); return true; }
    catch (e) { if (retriable(e)) { enqueue(s, k, 'del'); return true; } throw e; }
  },
  async keys(s) { return (await blobs.list(s)).map((x) => x.key); },
  async list(s) {
    const out = (await api(`/blobs/${enc(s)}`)).filter((x) => !bq.has(qk(s, x.key)));
    bq.forEach((it) => {
      if (it.s !== s || it.op !== 'put') return;
      out.push({ key: it.k, size: typeof it.value === 'string' ? it.value.length : 0, updatedAt: null });
    });
    return out;
  },
  async clear(s) {
    Array.from(bq.values()).forEach((it) => { if (it.s === s) unqueue(it.s, it.k); });
    await api(`/blobs/${enc(s)}`, { method: 'DELETE' }); return true;
  },
  pending() { return bq.size; },
};
