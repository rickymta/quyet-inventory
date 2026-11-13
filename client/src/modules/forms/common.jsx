/* Phần dùng chung của phân hệ forms: Picker lấy vật tư từ kỳ kiểm kê, nhóm tích chọn, số văn bản, điền sẵn từ hồ sơ.
   Dòng gốc 2822–2892. */
import { S, A, X, db, esc, fmt, diffOf, per, store, toast, I, st, rerender } from '../../core';

/* Ô nhập có kiểm soát: lấy giá trị, gọi setter (ghi vào dữ liệu) rồi vẽ lại */
export const cinp = (val, set) => ({
  value: val == null ? '' : val,
  onChange: (e) => { set(e.target.value); rerender(); },
});

/* ================= Picker: lấy vật tư/tài sản từ kỳ kiểm kê ================= */
export function renderPicker(onlyDiff) {
  const PICK = S.PICK;
  if (!PICK) return null;
  const p = PICK.pid ? per(PICK.pid) : null;
  let items = p ? p.items : [];
  if (PICK.pid && onlyDiff) items = items.filter((i) => i.counted && diffOf(i) !== 0);
  return (
    <div className="card" style={st('margin-top:10px')}>
      <div style={st('font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:7px')}>{I('download', 16)}Lấy dữ liệu từ kỳ kiểm kê</div>
      <select className="inp" value={PICK.pid || ''} onChange={(e) => A.pickPeriod(e.target.value)} style={st('margin-bottom:8px')}>
        <option value="">— Chọn kỳ kiểm kê —</option>
        {db.periods.map((pp) => <option key={pp.id} value={pp.id}>{(pp.folder ? pp.folder + ' · ' : '') + pp.name}</option>)}
      </select>
      {PICK.pid ? (!items.length ? (
        <div className="note-warn">{onlyDiff ? 'Kỳ này chưa có mã nào chênh lệch.' : 'Kỳ này chưa có dữ liệu.'}</div>
      ) : (
        <>
          <div style={st('max-height:260px;overflow-y:auto;border:1px solid var(--line);border-radius:10px;margin-bottom:8px')}>
            {items.map((i) => (
              <label key={i.id} style={st('display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--line);font-size:13px')}>
                <input type="checkbox" checked={!!PICK.sel[i.id]} onChange={() => { A.pickToggle(i.id); rerender(); }} />
                <span style={{ flex: 1 }}>{i.name} <span style={st('color:var(--mut)')}>({i.code})</span></span>
                <span style={st('color:var(--mut)')}>{i.counted ? fmt(i.countQty) : fmt(i.close)} {i.unit}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => A.pickAdd(!!onlyDiff)}>+ Thêm mục đã chọn</button>
        </>
      )) : null}
      <button className="addbat" style={st('margin-top:8px')} onClick={() => A.pickClose()}>Đóng</button>
    </div>
  );
}

/* ================= Nhóm tích chọn (checkbox chips) dùng chung ================= */
/* dòng chữ tĩnh dùng khi xuất doc: ☑/☐ (giữ dạng chuỗi) */
export function chkLine(options, selArr, khacVal, khacLabel) {
  const parts = options.map((o) => (selArr && selArr.indexOf(o) !== -1 ? '☑' : '☐') + ' ' + esc(o));
  if (khacLabel !== false) parts.push((khacVal && khacVal.trim() ? '☑' : '☐') + ' Khác: ' + esc(khacVal || '..................'));
  return parts.join('&nbsp;&nbsp;&nbsp;');
}
/* toggleFn: hàm nhận giá trị (bản gốc nhận chuỗi tiền tố onclick) */
export function chipGroupUI(options, selArr, toggleFn) {
  return (
    <div className="chipwrap">
      {options.map((o) => {
        const on = selArr.indexOf(o) !== -1;
        return <span key={o} className={'chip' + (on ? ' chip-on' : '')} onClick={() => toggleFn(o)}>{(on ? '☑ ' : '☐ ') + o}</span>;
      })}
    </div>
  );
}
export function toggleArr(arr, val) { const i = arr.indexOf(val); if (i === -1) arr.push(val); else arr.splice(i, 1); }
export function nextSoVanBan(prefix) {
  const year = new Date().getFullYear();
  const ma = (db.profile && db.profile.ma) || '';
  const key = prefix + '_' + (ma ? ma + '_' : '') + year;
  if (!db.counters) db.counters = {};
  const n = (db.counters[key] || 0) + 1;
  db.counters[key] = n;
  store.save();
  return String(n).padStart(2, '0') + '/' + prefix + '/' + (ma ? ma + '/' : '') + year;
}
export function profileFillHV(o) {
  const pr = db.profile || {};
  if (pr.chiNhanh) { o.boPhan = pr.chiNhanh; o.benGiao.boPhan = pr.chiNhanh; }
  if (pr.ten) o.benGiao.ten = pr.ten;
  if (pr.chucVu) o.benGiao.chucVu = pr.chucVu;
}
export function profileFillEX(o) {
  const pr = db.profile || {};
  if (pr.chiNhanh) { o.boPhan = pr.chiNhanh; o.nguoiGiaiTrinh.boPhan = pr.chiNhanh; o.diaDiem = pr.chiNhanh; }
  if (pr.ten) o.nguoiGiaiTrinh.ten = pr.ten;
  if (pr.chucVu) o.nguoiGiaiTrinh.chucVu = pr.chucVu;
}
export function dot(val, ph) { return val && String(val).trim() ? esc(val) : (ph || '..................'); }

/* Phần tử JSX của khối chữ ký (docs cung cấp X.sigSectionHtml dạng JSX) */
export function sigSection(k) { return typeof X.sigSectionHtml === 'function' ? X.sigSectionHtml(k) : null; }
export { toast };

/* ---- Hành động picker (dùng chung): pickOpen, pickClose, pickPeriod, pickToggle, pickAdd (dòng gốc 6986–7007) ---- */
export const pickActions = {
  pickOpen(onlyDiff) { S.PICK = { pid: '', sel: {}, onlyDiff }; rerender(); },
  pickClose() { S.PICK = null; rerender(); },
  pickPeriod(id) { S.PICK.pid = id; S.PICK.sel = {}; rerender(); },
  pickToggle(itemId) { S.PICK.sel[itemId] = !S.PICK.sel[itemId]; },
  pickAdd(onlyDiff) {
    const PICK = S.PICK;
    const p = per(PICK.pid);
    if (!p) return;
    const items = p.items.filter((i) => PICK.sel[i.id]);
    if (!items.length) { toast('Chưa chọn mục nào'); return; }
    if (onlyDiff) {
      items.forEach((i) => {
        S.EX.items.push({ ma: i.code, ten: i.name, dvt: i.unit, slSoSach: fmt(i.close), slThucTe: i.counted ? fmt(i.countQty) : '', chenh: i.counted ? fmt(diffOf(i)) : '', donGia: '', thanhTien: '' });
      });
    } else {
      items.forEach((i) => {
        S.HV.items.push({ ma: i.code, ten: i.name, dvt: i.unit, sl: fmt(i.counted ? i.countQty : i.close), tinhTrang: '', ghiChu: '' });
      });
    }
    S.PICK = null;
    toast('Đã thêm ' + items.length + ' mục');
    rerender();
  },
};
