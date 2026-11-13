/* Kiểm kê CCDC & TSCĐ — dữ liệu & logic thuần (dòng gốc 5730–5811, 5924–5945, 6162–6202, 6203 phần tính toán) */
import { db, S, X, norm, parseNum, fmt, saveSoon } from '../../core';

export const ASQ = ['Tốt', 'Trung bình', 'Kém', 'Hỏng'];
export const ASST = ['Đang sử dụng', 'Không sử dụng', 'Chờ thanh lý', 'Không tìm thấy'];
/* AP không bao giờ bị gán lại (nơi khác giữ tham chiếu); "AP={...}" của app gốc → resetAP() */
export const AP = { pid: null, q: '', flt: 'all', limit: 60, up: null, editing: null, editNew: false };
export function resetAP(init) {
  Object.keys(AP).forEach((k) => { delete AP[k]; });
  Object.assign(AP, { pid: null, q: '', flt: 'all', limit: 60, up: null, editing: null, editNew: false }, init || {});
  return AP;
}
export function asPer(id) { const a = db.assets || []; for (let i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
export function asDiff(it) { return it.counted ? Math.round(((it.cQty || 0) - (it.qty || 0)) * 100) / 100 : null; }
export function asDate(iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : String(iso || ''); }
export function asIso(s) { const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : ''; }
export function asLocOf(room) { const m = norm(room).match(/tang\s*(\d+)/); return m ? 'Tầng ' + m[1] : ''; }
export function asRid() { return Math.random().toString(36).slice(2, 7); }
export function asStats(p) {
  const s = { total: p.items.length, qty: 0, done: 0, cq: 0, ndiff: 0, extra: 0 };
  p.items.forEach((i) => {
    s.qty += i.qty || 0;
    if (i.extra) s.extra++;
    if (i.counted) { s.done++; s.cq += i.cQty || 0; if (asDiff(i) !== 0) s.ndiff++; }
  });
  return s;
}
export function asRooms(p) {
  const seen = {}; const out = [];
  p.items.forEach((i) => { if (i.room && !seen[i.room]) { seen[i.room] = 1; out.push(i.room); } });
  return out.sort();
}
export function asTeam(p) {
  const t = p.team || {}; const g = X.sgOf(p.branch);
  return { dauMoi: t.dauMoi || g.thuKho, toKiemKe: t.toKiemKe || g.hanhChinh, lanhDao: t.lanhDao || g.giamDoc };
}
export function asNextStt(p) { let m = 0; p.items.forEach((i) => { const n = parseInt(i.stt, 10); if (n > m) m = n; }); return m + 1; }

/* ---- Đọc file Excel (Phần I bắt buộc, Phần II nếu có) ---- */
export function asParseSheet(rows) {
  let hr = -1; let i; let ns = null;
  for (i = 0; i < Math.min(rows.length, 30); i++) {
    const t = rows[i].map(norm);
    if (t.some((x) => /^ma(\s|$)/.test(x)) && t.some((x) => /^ten(\s|$)/.test(x))) { hr = i; ns = t; break; }
  }
  if (hr < 0) return null;
  const col = (fn) => { for (let j = 0; j < ns.length; j++) if (fn(ns[j])) return j; return -1; };
  const C = {
    stt: col((x) => x === 'stt'),
    code: col((x) => /^ma(\s|$)/.test(x)),
    name: col((x) => /^ten(\s|$)/.test(x)),
    unit: col((x) => x === 'dvt' || /^don vi tinh/.test(x)),
    qty: col((x) => /so luong/.test(x) && !/kiem ke/.test(x)),
    unit1: col((x) => /don vi cap/.test(x)),
    cQty: col((x) => /so luong/.test(x) && /kiem ke/.test(x)),
    mgmt: col((x) => /don vi quan ly/.test(x)),
    room: col((x) => /^phong/.test(x)),
    user: col((x) => /nguoi su dung/.test(x)),
    loc: col((x) => /^vi tri/.test(x)),
    quality: col((x) => /pham chat/.test(x)),
    status: col((x) => /tinh trang/.test(x)),
    note: col((x) => /ghi chu/.test(x)),
  };
  const g = (r, k) => (C[k] >= 0 && r[C[k]] != null ? String(r[C[k]]).trim() : '');
  const info = { branch: '', dateCount: '', cutoff: '' };
  for (i = 0; i < hr; i++) {
    rows[i].forEach((c) => {
      const s = String(c || '').trim(); const n = norm(s);
      if (/^chi nhanh/.test(n) && !info.branch) info.branch = s.replace(/^chi\s*nh[^\s]*\s*/i, '').trim();
      if (/kiem ke/.test(n) && /thoi\s*diem/.test(n) && !/chot/.test(n)) info.dateCount = asIso(s);
      if (/chot/.test(n)) info.cutoff = asIso(s);
    });
  }
  const items = []; let n = 0;
  for (i = hr + 1; i < rows.length; i++) {
    const r = rows[i]; const code = g(r, 'code'); const name = g(r, 'name');
    if (!code && !name) continue;
    if (/^tong/.test(norm(name)) || /^tong/.test(norm(g(r, 'stt')))) continue;
    n++;
    const qs = g(r, 'qty'); const cs = g(r, 'cQty');
    const it = {
      id: 'a' + n + '_' + asRid(), stt: g(r, 'stt') || String(n), code, name: name || code, unit: g(r, 'unit'),
      qty: qs === '' ? 1 : (parseNum(qs) || 0), unit1: g(r, 'unit1'), counted: false, cQty: null,
      mgmt: g(r, 'mgmt'), room: g(r, 'room'), user: g(r, 'user'), loc: g(r, 'loc'), quality: g(r, 'quality'), status: g(r, 'status'), note: g(r, 'note'),
    };
    if (cs !== '') { it.counted = true; it.cQty = parseNum(cs) || 0; it.at = Date.now(); it.by = '(nhập từ file)'; }
    items.push(it);
  }
  return { items, info };
}

/* ---- Nhật ký / nhắc xuất Excel ---- */
export function asCurP() { try { return asPer((S.SC && S.SC.pid) || AP.pid); } catch (e) { return null; } }
export function asLog(p, a, it, d) {
  if (!p) return;
  p.log = p.log || [];
  p.log.push({ t: Date.now(), by: (db.profile && db.profile.ten) || '', a, c: it ? it.code : '', n: it ? it.name : '', d: d || '' });
  if (p.log.length > 1500) p.log.splice(0, p.log.length - 1500);
}
export function asPending(p) {
  let n = 0; let last = 0; const x = p.lastExport || 0;
  p.items.forEach((i) => { if (i.counted && (i.at || 0) > x) { n++; if (i.at > last) last = i.at; } });
  return { n, last };
}

/* ---- Ghi kết quả kiểm kê ---- */
export function asApply(p, it, v) {
  const was = it.counted; const oq = it.cQty;
  asLog(p, v.status === 'Không tìm thấy' ? 'Ghi nhận không tìm thấy' : (was ? 'Ghi đè kiểm kê' : 'Kiểm kê'), it, (was ? 'SL ' + fmt(oq) + ' → ' : 'SL ') + fmt(v.cQty) + (v.room ? ' · ' + v.room : ''));
  it.counted = true; it.cQty = v.cQty;
  it.mgmt = v.mgmt || it.unit1 || ''; it.room = v.room || ''; it.user = v.user || '';
  it.loc = v.loc || asLocOf(v.room);
  it.quality = v.quality || 'Tốt'; it.status = v.status || 'Đang sử dụng';
  if (v.note !== undefined) it.note = v.note;
  it.at = Date.now(); it.by = (db.profile && db.profile.ten) || '';
  p.cur = p.cur || {};
  if (v.room) p.cur.room = v.room;
  if (v.user) p.cur.user = v.user;
  p.cur.loc = it.loc || p.cur.loc || '';
  saveSoon();
}
export function asDefaults(p, it) {
  const c = p.cur || {};
  if (it.counted) return { cQty: it.cQty, mgmt: it.mgmt, room: it.room, user: it.user, loc: it.loc, quality: it.quality || 'Tốt', status: it.status || 'Đang sử dụng' };
  return { cQty: it.qty > 0 ? it.qty : 1, mgmt: it.unit1, room: c.room || '', user: c.user || 'Sử dụng chung', loc: c.loc || asLocOf(c.room), quality: 'Tốt', status: 'Đang sử dụng' };
}

export function asSummary(p) {
  const s = { tot: 0, done: 0, ok: 0, less: 0, more: 0, miss: 0, todo: 0, extra: 0, trace: 0, bad: 0 }; const fl = {};
  p.items.forEach((i) => {
    const f = asLocOf(i.room) || i.loc || 'Chưa rõ vị trí'; const g = fl[f] || (fl[f] = { tot: 0, done: 0, less: 0, more: 0, miss: 0, ext: 0 });
    if (i.extra) { s.extra++; g.ext++; if (i.trace) s.trace++; return; }
    s.tot++; g.tot++;
    if (!i.counted) { s.todo++; return; }
    s.done++; g.done++;
    if (i.status === 'Không tìm thấy') { s.miss++; g.miss++; return; }
    const d = asDiff(i);
    if (d === 0) s.ok++; else if (d < 0) { s.less++; g.less++; } else { s.more++; g.more++; }
    if (i.quality !== 'Tốt' || i.status !== 'Đang sử dụng') s.bad++;
  });
  s.pct = s.tot ? Math.round(s.done / s.tot * 100) : 0;
  s.floors = Object.keys(fl).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })).map((k) => [k, fl[k]]);
  return s;
}
