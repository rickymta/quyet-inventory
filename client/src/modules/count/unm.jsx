/* Số quét chưa khớp: tự ghi nhận để đối chiếu sau (unm*, UNM, asAutoAdd...). Mã gốc: dòng 6456–6648. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { db, S, X, per, norm, fmt, st, I, rerender, render, openLayer, closeLayer, saveSoon, store, toast, klog, A } from '../../core';
import { openSheet } from './sheet.jsx';

export function eanOk(d) {
  if (!/^\d+$/.test(d) || [8, 12, 13, 14].indexOf(d.length) < 0) return null;
  let sum = 0; const n = d.length;
  for (let i = 0; i < n - 1; i++) sum += (+d.charAt(i)) * (((n - 2 - i) % 2 === 0) ? 3 : 1);
  return ((10 - sum % 10) % 10) === (+d.charAt(n - 1));
}
export function unmList(p) { if (!p.unm) p.unm = []; return p.unm; }
export function unmOpenCount(p) { return (p && p.unm ? p.unm : []).filter((e) => e.st === 'open').length; }
export function unmKeyOf(text) { const t = String(text || '').trim(); return /^[\d\s.,-]+$/.test(t) ? X.ocrDigits(t) : t.toLowerCase(); }
export function unmAdd(p, text, kind, n) {
  const key = unmKeyOf(text); const L = unmList(p); const now = Date.now(); let e = null;
  L.forEach((x) => { if (!e && x.key === key) e = x; });
  if (e) { e.n += (n || 1); e.last = now; saveSoon(); return { e, isNew: false }; }
  e = { id: 'u' + now.toString(36) + Math.random().toString(36).slice(2, 5), key, text: String(text).trim(), kind, n: n || 1, first: now, last: now, st: 'open', by: (db.profile && db.profile.ten) || '' };
  L.push(e); saveSoon(); return { e, isNew: true };
}
export function unmBannerHtml(p) {
  if (typeof X.asPer === 'function' && X.asPer(p.id)) {
    const nt = p.items.filter((i) => i.trace).length;
    if (!nt) return null;
    return <button className="stklink" style={st('display:flex;align-items:center;gap:7px;color:var(--red)')} onClick={() => X.ASX.flt('trace')}>⚑ {nt} tài sản chưa có trong sổ, cần dò tìm{I('chev', 16)}</button>;
  }
  const n = unmOpenCount(p);
  if (!n) return null;
  return <button className="stklink" style={st('display:flex;align-items:center;gap:7px;color:var(--red)')} onClick={() => unmOpen(p.id)}>⚑ {n} số quét chưa khớp, bấm để đối chiếu{I('chev', 16)}</button>;
}

/* Vẽ nội dung vào khung kết quả quét (#scres) của lớp quét. Nếu phân hệ `scan` có X.scSetRes thì dùng nó. */
function scResSet(node) {
  if (typeof X.scSetRes === 'function') { X.scSetRes(node); return; }
  const el = document.getElementById('scres'); if (!el) return;
  try { if (el.__kkRoot) el.__kkRoot.unmount(); } catch (e) { klog('scResSet', e); }
  el.innerHTML = '';
  const host = document.createElement('div'); el.appendChild(host);
  el.__kkRoot = createRoot(host);
  el.__kkRoot.render(node);
}

export function scUnmChip() {
  const e = document.getElementById('scunm'); const SC = S.SC; if (!e || !SC) return;
  const p = per(SC.pid); let n; let lab;
  if (SC.kind === 'asset') { n = p.items.filter((i) => i.trace).length; lab = '⚑ Cần dò tìm: '; }
  else { n = unmOpenCount(p); lab = '⚑ Chưa khớp: '; }
  e.style.display = n ? 'block' : 'none';
  e.textContent = lab + n;
}
export function scTrack(lines) {
  const SC = S.SC;
  const now = Date.now(); const T = (SC.trk || []).filter((c) => now - c.t < 6000);
  lines.forEach((L) => {
    const d = L.digits; if (d.length < 6 || d.length > 20) return;
    let c = null;
    T.forEach((x) => { if (!c && (x.rep === d || (x.rep.length === d.length && X.ocrLev(x.rep, d, 1) <= 1))) c = x; });
    if (!c) { c = { rep: d, cnt: {}, n: 0, t: now, done: false }; T.push(c); }
    c.cnt[d] = (c.cnt[d] || 0) + 1; c.n++; c.t = now;
    let best = d; Object.keys(c.cnt).forEach((k) => { if (c.cnt[k] > c.cnt[best]) best = k; }); c.rep = best;
  });
  SC.trk = T; return T;
}
export function scUnmNotice(e, isNew) {
  const SC = S.SC;
  if (!SC || SC.hold) return;
  scUnmChip();
  try { if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (x) { klog('navigator.vibrate', x); }
  UNM.pid = SC.pid;
  const ean = eanOk(X.ocrDigits(e.text)); const note = ean === true ? ' · mã vạch EAN hợp lệ' : ean === false ? ' · ⚠ có thể đọc sai 1–2 số' : '';
  scResSet(
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:10px 12px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>⚑ Chưa khớp · đã ghi nhận để đối chiếu sau</div>
      <div style={st('font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;margin-top:4px;word-break:break-all')}>{e.text}</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>{e.kind === 'ocr' ? 'Đọc số' : 'Quét mã'} · thấy {e.n} lần{note}</div>
      <div style={st('display:flex;gap:8px;margin-top:8px')}><button className="btn" style={st('flex:1;padding:10px;background:#23232c;color:#fbbf24;border:1px solid #8a5a1a')} onClick={() => unmOpen(S.SC.pid, e.id)}>Chọn mã ngay</button>
        <button className="btn" style={st('width:auto;padding:10px 16px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Quét tiếp</button></div></div>,
  );
}
export function scUnmCode(p, text, m) {
  const SC = S.SC;
  if (SC.kind === 'asset') { const ra = asAutoAdd(p, text, 'code'); asAddedNotice(ra.it, ra.isNew); return; }
  const r = unmAdd(p, String(text).replace(/\u001d/g, ' '), 'code');
  SC.pending = { text, canon: m.canon, gs1: m.gs1 };
  scUnmNotice(r.e, r.isNew);
}

/* ===== Không khớp 100% → thêm thẳng vào danh mục kiểm kê, đánh dấu "Cần dò tìm" ===== */
export function asAutoAdd(p, text, kind) {
  const code = String(text).replace(/\u001d/g, ' ').trim().slice(0, 80); const key = unmKeyOf(code); let it = null;
  p.items.forEach((x) => { if (!it && unmKeyOf(x.code) === key) it = x; });
  if (it) { X.phTemFor(it); return { it, isNew: false }; }
  const c = p.cur || {}; const now = Date.now();
  it = {
    id: 'x_' + now.toString(36) + Math.random().toString(36).slice(2, 5), stt: String(X.asNextStt(p)), code, name: '(Chưa rõ tên) ' + code.slice(0, 40), unit: 'Cái', qty: 0,
    unit1: (p.items[0] && p.items[0].unit1) || '', counted: true, cQty: 1, mgmt: (p.items[0] && p.items[0].unit1) || '',
    room: c.room || '', user: c.user || 'Sử dụng chung', loc: c.loc || X.asLocOf(c.room), quality: 'Tốt', status: 'Đang sử dụng',
    note: 'Quét thấy nhưng chưa có trong sổ, cần dò tìm', extra: true, trace: true, at: now, by: (db.profile && db.profile.ten) || '',
  };
  p.items.push(it); saveSoon(); X.phTemFor(it);
  X.asLog(p, 'Phát hiện thêm: tem không khớp', it, kind === 'ocr' ? 'đọc số (OCR)' : 'quét mã');
  return { it, isNew: true };
}
export function asAddedNotice(it, isNew) {
  const SC = S.SC;
  if (!SC) return;
  SC.hold = false;
  try { if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (x) { klog('navigator.vibrate', x); }
  X.scBeep(); scUnmChip(); X.asRenderBody();
  const hasTem = (it.imgs || []).some((m) => m.k === 'tem');
  scResSet(
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:10px 12px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>⚑ {isNew ? 'Phát hiện tài sản chưa có trong danh mục · đã ghi nhận' : 'Phát hiện tài sản chưa có trong danh mục · đã ghi nhận trước đó'}</div>
      <div style={st('font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;margin-top:4px;word-break:break-all')}>{it.code}</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>Phát hiện thêm · SL kiểm kê {fmt(it.cQty)}{it.room ? ' · ' + it.room : ''} · gắn nhãn “Cần dò tìm”</div>
      <div id="scphn" style={st('font-size:12px;margin-top:4px;color:' + (hasTem ? '#4ade80' : '#a9bde0'))}>{hasTem ? '📷 Đã lưu ảnh tem vào file kiểm kê' : '📷 Đang chụp & lưu ảnh tem…'}</div>
      <div style={st('display:flex;gap:8px;margin-top:8px')}><button className="btn" style={st('flex:1;padding:10px;background:#23232c;color:#fbbf24;border:1px solid #8a5a1a')} onClick={() => X.ASX.scDetail(it.id)}>Nhập tên / chi tiết</button>
        {isNew ? <button className="btn" style={st('width:auto;padding:10px 14px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => X.ASX.autoUndo(it.id)}>Hoàn tác</button> : null}
        <button className="btn" style={st('width:auto;padding:10px 14px;background:#23232c;color:#e5e7eb;border:1px solid #33333d')} onClick={() => A.scNext()}>Quét tiếp</button></div>
      <button id="scshoot" data-raw="1" className="btn" style={st('margin-top:8px;padding:10px;background:#14203a;color:#a9bde0;border:1px solid #2c4f8f;display:flex;align-items:center;justify-content:center;gap:6px')} onClick={() => X.ASX.scShoot(it.id, 'tem')}>{I('camera', 16)}Chụp lại tem (nét)</button></div>,
  );
}
export function scChipClick() {
  const SC = S.SC;
  if (SC && SC.kind === 'asset') { X.AP.pid = SC.pid; X.AP.flt = 'trace'; X.AP.q = ''; A.scClose(); S.route = { view: 'asset' }; render(); }
  else if (SC) unmOpen(SC.pid);
}

/* ---- Màn hình đối chiếu ---- */
export const UNM = { pid: null, focus: null, done: false, sr: {} };
export function unmOpen(pid, focusId) {
  UNM.pid = pid; UNM.focus = focusId || null; UNM.done = false; UNM.sr = {};
  openLayer('unm', () => <UnmOverlay />);
}
export function unmClose() {
  closeLayer('unm');
  if (S.SC) scUnmChip();
  if (S.route.view === 'asset') { if (typeof X.renderAsset === 'function') X.renderAsset(); } else rerender();
}
export function unmCands(p, e) { return []; }
export function unmItemBtn(eid, it, tag) {
  return (
    <button key={it.id} onClick={() => unmLink(eid, it.id)} style={st('display:block;width:100%;text-align:left;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card2);color:var(--ink);font:inherit;font-size:13px')}><b>{it.name}</b><br /><span style={st('color:var(--mut);font-size:12px')}>{it.code} · {it.unit}{tag ? ' · ' : ''}{tag ? <span style={{ color: '#b45309' }}>{tag}</span> : null}</span></button>
  );
}
export function unmRender() { rerender(); }
function UnmOverlay() {
  const p = per(UNM.pid); if (!p) return null;
  const L = unmList(p); const isAsset = !!(typeof X.asPer === 'function' && X.asPer(p.id));
  const open = L.filter((e) => e.st === 'open').sort((a, b) => b.last - a.last);
  if (UNM.focus) { open.sort((a, b) => (b.id === UNM.focus) - (a.id === UNM.focus)); }
  const done = L.filter((e) => e.st !== 'open');
  return (
    <div id="unmovl" style={st('position:fixed;inset:0;z-index:150;background:rgba(16,24,40,.55);display:flex;align-items:flex-end;justify-content:center')}>
      <div style={st('background:var(--card);color:var(--ink);width:100%;max-width:560px;max-height:92%;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)')}>
        <div style={st('display:flex;justify-content:space-between;align-items:center;gap:8px')}><div style={st('font-weight:800;font-size:17px')}>Số quét chưa khớp ({open.length})</div><button className="pill" onClick={() => unmClose()}>✕</button></div>
        <div style={st('font-size:12px;color:var(--mut);margin-top:4px')}>Các số app đã thấy nhưng chưa khớp mã nào trong danh sách. Chọn đúng mã, thêm ngoài sổ hoặc bỏ qua. Danh sách cũng được xuất ra sheet “CHƯA KHỚP” trong file Excel.</div>
        {!open.length ? <div className="empty" style={{ marginTop: '14px' }}>Không còn số nào cần đối chiếu.</div> : null}
        {open.slice(0, 60).map((e) => {
          const c = unmCands(p, e); const ean = eanOk(X.ocrDigits(e.text));
          return (
            <div key={e.id} style={st('border:1px solid ' + (e.id === UNM.focus ? 'var(--teal)' : 'var(--line)') + ';border-radius:14px;padding:12px;margin-top:10px')}>
              <div style={st('font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;word-break:break-all')}>{e.text}</div>
              <div style={st('font-size:12px;color:var(--mut);margin-top:2px')}>{e.kind === 'ocr' ? 'Đọc số' : 'Quét mã'} · thấy {e.n} lần · {X.tsLabel(e.last)}{ean === true ? ' · EAN hợp lệ' : null}{ean === false ? <> · <span style={{ color: '#b45309' }}>có thể đọc sai</span></> : null}</div>
              {c.length ? <><div style={st('font-size:12px;color:var(--mut);margin-top:8px')}>Gợi ý:</div>{c.map((x) => unmItemBtn(e.id, x.item, x.tag))}</> : null}
              <div style={st('display:flex;gap:6px;margin-top:10px;flex-wrap:wrap')}><button className="btn btn-outline" style={st('flex:1;width:auto;padding:9px;font-size:13px')} onClick={() => unmSearch(e.id)}>Tìm mã khác</button>
                {isAsset ? <button className="btn btn-outline" style={st('flex:1;width:auto;padding:9px;font-size:13px')} onClick={() => unmExtra(e.id)}>+ Ngoài sổ</button> : null}
                <button className="btn btn-outline" style={st('flex:1;width:auto;padding:9px;font-size:13px')} onClick={() => unmIgnore(e.id)}>Bỏ qua</button></div>
              <div id={'unmsrch_' + e.id}><UnmSearchBox eid={e.id} p={p} /></div></div>
          );
        })}
        {done.length ? (
          <>
            <button className="addbat" style={st('display:block;width:100%;text-align:center;padding:14px 0')} onClick={() => { UNM.done = !UNM.done; unmRender(); }}>{UNM.done ? 'Ẩn' : 'Xem'} {done.length} số đã xử lý</button>
            {UNM.done ? done.map((e) => {
              const lab = { linked: 'Đã liên kết → ' + (e.itemCode || ''), ignored: 'Đã bỏ qua', extra: 'Đã thêm ngoài sổ' }[e.st] || e.st;
              return (
                <div key={e.id} style={st('display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line);font-size:13px')}><div style={{ minWidth: 0 }}><b style={st('font-family:ui-monospace,Menlo,monospace;word-break:break-all')}>{e.text}</b><div style={st('font-size:12px;color:var(--mut)')}>{lab}</div></div><button className="addbat" onClick={() => unmReopen(e.id)}>Mở lại</button></div>
              );
            }) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
function UnmSearchBox({ eid, p }) {
  const v = UNM.sr[eid];
  if (v === undefined) return null;
  const n = norm(v); const out = []; let c = 0;
  if (n) p.items.forEach((i) => { if (c < 8 && (norm(i.name).indexOf(n) >= 0 || norm(i.code).indexOf(n) >= 0)) { c++; out.push(unmItemBtn(eid, i, '')); } });
  return (
    <>
      <input className="inp" style={{ marginTop: '8px' }} placeholder="Gõ tên hoặc mã…" autoFocus value={v} onChange={(e) => unmQ(eid, e.target.value)} />
      <div id={'unmres_' + eid}>{out.length ? out : (n ? <div style={st('font-size:12px;color:var(--mut);margin-top:6px')}>Không có kết quả.</div> : null)}</div>
    </>
  );
}
export function unmFind(eid) { const p = per(UNM.pid); let r = null; unmList(p).forEach((e) => { if (e.id === eid) r = e; }); return r; }
export function unmSearch(eid) { if (UNM.sr[eid] === undefined) UNM.sr[eid] = ''; rerender(); }
export function unmQ(eid, v) { UNM.sr[eid] = v; rerender(); }
export function unmLink(eid, itemId) {
  const p = per(UNM.pid); const e = unmFind(eid); let it = null;
  p.items.forEach((x) => { if (x.id === itemId) it = x; });
  if (!e || !it) return;
  e.st = 'linked'; e.item = it.id; e.itemCode = it.code; e.itemName = it.name; e.doneAt = Date.now();
  const dg = X.ocrDigits(e.text);
  if (/^[\d\s.,-]+$/.test(e.text) && dg && dg !== X.ocrDigits(it.code)) { if (!db.ocrfix) db.ocrfix = {}; db.ocrfix[dg] = it.code; }
  if (e.kind === 'code') { if (!db.barcodes) db.barcodes = {}; db.barcodes[X.scCanon(e.text)] = it.code; }
  store.save();
  toast('Đã liên kết với ' + it.name);
  const isAsset = !!(typeof X.asPer === 'function' && X.asPer(p.id));
  unmClose();
  if (isAsset) { X.AP.pid = p.id; X.asEdit(it.id); }
  else { if (S.SC) A.scClose(); openSheet(it.id, false); }
}
export function unmIgnore(eid) { const e = unmFind(eid); if (!e) return; e.st = 'ignored'; e.doneAt = Date.now(); saveSoon(); unmRender(); }
export function unmReopen(eid) { const e = unmFind(eid); if (!e) return; e.st = 'open'; saveSoon(); unmRender(); }
export function unmExtra(eid) {
  const e = unmFind(eid); const p = per(UNM.pid); if (!e) return;
  e.st = 'extra'; e.doneAt = Date.now(); saveSoon();
  unmClose(); X.AP.pid = p.id; X.ASX.addExtra(e.text.slice(0, 60));
}
/* Xuất Excel: sheet "CHƯA KHỚP" (dùng ExcelJS, không phải HTML) */
export function addUnmSheet(wb, p) {
  const L = (p.unm || []); if (!L.length) return;
  const ws = wb.addWorksheet('CHƯA KHỚP'); const stt = { open: 'Chưa xử lý', linked: 'Đã liên kết', ignored: 'Bỏ qua', extra: 'Ngoài sổ' };
  const heads = ['STT', 'Nội dung quét', 'Loại', 'Số lần thấy', 'Lần đầu', 'Lần cuối', 'Trạng thái', 'Mã liên kết', 'Tên liên kết'];
  [6, 28, 12, 12, 20, 20, 14, 20, 40].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  heads.forEach((t, j) => { const c = ws.getCell(1, j + 1); c.value = t; c.font = { name: 'Times New Roman', size: 11, bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });
  L.slice().sort((a, b) => a.first - b.first).forEach((e, k) => {
    const row = [k + 1, e.text, e.kind === 'ocr' ? 'Đọc số' : 'Quét mã', e.n, new Date(e.first).toLocaleString('vi-VN'), new Date(e.last).toLocaleString('vi-VN'), stt[e.st] || e.st, e.itemCode || '', e.itemName || ''];
    row.forEach((v, j) => { const c = ws.getCell(k + 2, j + 1); c.value = v; c.font = { name: 'Times New Roman', size: 11 }; c.alignment = { vertical: 'middle', wrapText: true, horizontal: j === 1 || j >= 7 ? 'left' : 'center' }; });
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}
