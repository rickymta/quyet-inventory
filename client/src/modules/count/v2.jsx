/* UI v2 (HS, v2Periods, v2Cur, v2Use, v2Scan, v2List, v2Manual...) và các lệnh in thuộc dải 7494–7575.
   Mã gốc: dòng 7494–7575 (khối Object.assign(A) thứ hai), 7638–7709. */
import React from 'react';
import { db, S, A, X, per, norm, stok, smatch, st, rerender, render, openLayer, closeLayer, toast, saveSoon, hsdEntries, BUCKETS, fmt, fmtDate, diffOf } from '../../core';
import { newPKey } from './list.jsx';

export const HS = { pid: '', folder: '', area: 'all' };
export function v2Periods() { return db.periods.filter((p) => !HS.folder || (p.folder || '') === HS.folder); }
export function v2Cur() {
  const l = v2Periods(); let p = per(HS.pid);
  if (!p || l.indexOf(p) < 0) p = l[0] || null;
  HS.pid = p ? p.id : ''; return p;
}
/* mở màn kiểm kê của đợt đang chọn (cần để quét/lưu cập nhật đúng danh sách) */
export function v2Use() {
  if (S.route.view === 'period' && S.P && per(S.P.id)) return per(S.P.id);
  const p = v2Cur() || db.periods[0];
  if (!p) { toast('Chưa có đợt kiểm kê, hãy tạo đợt mới'); return null; }
  S.P = { id: p.id, q: '', flt: 'all', br: HS.area || 'all', limit: 80, _k: newPKey() }; S.route = { view: 'period' }; render();
  return p;
}
export function v2Scan() {
  if (S.route.view === 'asset') { X.ASX.scan(); return; }
  if (v2Use()) A.scanOpen();
}
export function v2List() {
  const LS = X.LS;
  if (S.route.view === 'lists' && LS.folder !== null) { LS.folder = null; render(); return; }
  S.route = { view: 'lists' }; render();
}

/* ---- Hộp "Nhập mã thủ công" ---- */
export const V2M = { q: '' };
export function v2Manual() {
  const p = v2Use(); if (!p) return;
  V2M.q = '';
  openLayer('v2manual', () => <V2ManualBox />);
}
function v2ManualClose() { closeLayer('v2manual'); }
function V2ManualBox() {
  const p = per(S.P && S.P.id);
  const nq = norm(V2M.q);
  const found = (p && nq) ? p.items.filter((i) => smatch(norm(i.name + ' ' + i.code), stok(V2M.q))).slice(0, 8) : [];
  return (
    <div id="nmovl"><div className="sigcard"><div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>Nhập mã thủ công</div>
      <input className="inp" id="v2mi" placeholder="Mã hoặc tên vật tư" autoFocus value={V2M.q} onChange={(e) => v2ManualQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') v2ManualEnter(); }} />
      <div id="v2ml" style={st('margin-top:8px;max-height:40vh;overflow:auto')}>
        {found.length ? found.map((i) => (
          <div className="item v2i" key={i.id} style={st('margin-bottom:6px;padding:10px')} onClick={() => { v2ManualClose(); A.openItem(i.id, false); }}><div className="im"><div className="ihd"><b>{i.code || i.name}</b></div><div className="inm">{i.name}</div></div></div>
        )) : (nq ? <div className="empty" style={{ padding: '16px 0' }}>Không có mã khớp</div> : null)}
      </div>
      <button className="btn btn-outline" style={st('margin-top:12px;padding:12px')} onClick={() => v2ManualClose()}>Đóng</button></div></div>
  );
}
export function v2ManualQ(q) { V2M.q = q; rerender(); }
export function v2ManualEnter() {
  const p = per(S.P && S.P.id); if (!p) return;
  const m = X.scMatch(p, V2M.q);
  if (m.item) { v2ManualClose(); A.openItem(m.item.id, false); } else toast('Không tìm thấy mã này trong đợt kiểm kê');
}

/* banner "Quét mã nhanh" đã bỏ ở app gốc: giữ hàm cho nơi khác gọi */
export function v2Hero(p) { return null; }
export function v2HeroInfo() { return null; }
export function v2Hub() { return null; }
export function v2PeriodInit() { return null; }

/* ---- Lệnh in (khối Object.assign(A) thứ hai, dòng 7527–7575) ---- */
export const actions = {
  prSet(k, v) { db.print = db.print || {}; db.print[k] = (k === 'margin' || k === 'size') ? +v : v; saveSoon(); },
  prTest() {
    const rows = []; for (let i = 1; i <= 5; i++) rows.push([String(i), 'Vật tư mẫu ' + i, 'Cái', String(i * 10), String(i * 10)]);
    X.printPreviewHtml(X.printTableHtml('Trang in thử', ['Kiểm tra căn lề, phông chữ, kiểu tiêu đề'], ['STT', 'Tên vật tư', 'ĐVT', 'Tồn', 'Kiểm'], rows, ['Người lập', 'Thủ kho', 'Lãnh đạo']));
  },
  hsdPrint() {
    const e = hsdEntries(); if (!e.length) { toast('Chưa có dữ liệu HSD để in'); return; }
    const rows = e.map((x, i) => {
      let bk = 'Còn > 6 tháng'; BUCKETS.forEach((b) => { if (b.test(x.days)) bk = b.label; });
      return [String(i + 1), x.branch, x.code, x.name + (x.label ? ' [' + x.label + ']' : ''), x.lot || '', (x.qty === null || x.qty === undefined ? '' : fmt(x.qty)) + ' ' + (x.unit || ''), fmtDate(x.exp), String(x.days), bk];
    });
    const d = new Date();
    X.printPreviewHtml(X.printTableHtml('Danh sách cảnh báo hạn sử dụng', ['Ngày lập: ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()], ['STT', 'Kho', 'Mã', 'Tên vật tư', 'Lô', 'SL', 'HSD', 'Còn (ngày)', 'Mức'], rows, ['Người lập', 'Thủ kho', 'Lãnh đạo'], 'landscape', [4, 13, 10, 29, 10, 8, 9, 7, 10]));
  },
  printCur() {
    const p = per(S.P && S.P.id); if (!p) return;
    const br = {}; p.items.forEach((it) => { br[it.branch] = 1; }); const bl = Object.keys(br); const one = bl.length === 1;
    const rows = p.items.map((it, i) => {
      const df = diffOf(it);
      const r = [String(i + 1)]; if (!one) r.push(it.branch);
      return r.concat([it.code, it.name, it.unit, fmt(it.close), it.counted && it.countQty !== null ? fmt(it.countQty) : '', df === null ? '' : (df > 0 ? '+' : '') + fmt(df), it.note || '']);
    });
    const heads = ['STT'].concat(one ? [] : ['Kho'], ['Mã', 'Tên vật tư', 'ĐVT', 'Tồn sổ sách', 'Kiểm kê', 'Chênh lệch', 'Ghi chú']);
    X.printPreviewHtml(X.printTableHtml('Biên bản kiểm kê vật tư', [p.name].concat(one ? ['Kho: ' + bl[0]] : []), heads, rows, ['Người kiểm kê', 'Thủ kho', 'Lãnh đạo'], 'landscape', one ? [4, 11, 32, 6, 8, 8, 8, 23] : [4, 12, 10, 30, 6, 8, 7, 8, 15]));
  },
};
