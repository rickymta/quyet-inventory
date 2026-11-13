/* Khoá dữ liệu kỳ kiểm kê (dòng gốc 8031–8113) + gộp nhật ký audit (8194–8197). */
import { db, S, A, X, store, audit, per, needsCount, zeroPending, render, toast, I, canLock, canEdit, can } from '../../core';

/* chỉ khoá/mở khoá: cần quyền khoá + ít nhất mức Xem của phân hệ (máy chủ áp cùng quy tắc) */
const mayLock = (kind) => canLock() && can(kind === 'as' ? 'assets' : 'kiemke', 1);

export function zeroResetHtml(p) {
  if (!p || p.locked) return null;
  const n = p.items.filter((i) => i.close === 0 && i.counted && i.countQty === 0).length;
  if (!n) return null;
  return (
    <button className="stklink" style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--red)' }} onClick={() => A.zeroReset(p.id)}>
      {I('box', 16)}{'Đưa ' + n + ' mã tồn 0 về chưa kiểm'}{I('chev', 16)}
    </button>
  );
}
export function lockTagHtml(p) {
  return p && p.locked
    ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 3 }}>{I('lock', 12)}Đã khoá</div>
    : null;
}
export function lockBarHtml(p, kind) {
  if (p.locked) {
    const d = new Date(p.locked.at).toLocaleString('vi-VN');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 4px', padding: '10px 12px', borderRadius: 14, background: '#e8f6ec', border: '1px solid #b6e0c2', color: '#14532d' }}>
        <span style={{ flex: 'none', display: 'flex' }}>{I('lock', 20)}</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.35 }}>
          <b>Đã khoá dữ liệu</b><br /><span style={{ fontSize: 12, opacity: 0.85 }}>{d + (p.locked.by ? ' · ' + p.locked.by : '')}</span>
        </div>
        {mayLock(kind) ? <button className="pill" style={{ flex: 'none', fontSize: 12, padding: '6px 10px' }} onClick={() => LKX.unlock(kind, p.id)}>Mở khoá</button> : null}
      </div>
    );
  }
  if (!mayLock(kind)) return null;
  return (
    <button className="stklink" style={{ display: 'flex', alignItems: 'center', gap: 7 }} onClick={() => LKX.lock(kind, p.id)}>
      {I('lock', 16)}Khoá dữ liệu kỳ kiểm kê{I('chev', 16)}
    </button>
  );
}

const who = () => ((db.profile && db.profile.ten) || '');
export const LKX = {
  get(kind, id) { return kind === 'as' ? (X.asPer && X.asPer(id)) : per(id); },
  lock(kind, id) {
    const p = LKX.get(kind, id); if (!p || p.locked) return;
    const left = kind === 'as' ? p.items.filter((i) => !i.counted).length : p.items.filter(needsCount).length;
    const zp = kind === 'as' ? 0 : p.items.filter(zeroPending).length;
    let msg = 'Khoá kỳ "' + p.name + '"?\n\n' + (left ? 'Còn ' + left + (kind === 'as' ? ' tài sản' : ' mã') + ' chưa kiểm.\n' : 'Đã kiểm xong toàn bộ.\n')
      + 'Sau khi khoá sẽ không sửa được số liệu, quét, xoá hay đổi tên kỳ. Vẫn xuất Excel, in và gửi email bình thường. Có thể mở khoá khi cần.';
    if (zp) msg += '\n\n⚠ Còn ' + zp + ' mã tồn sổ sách = 0 chưa kiểm. Bấm OK sẽ ghi nhận thực tế = 0 (khớp sổ) cho các mã này. Nếu cần đếm lại, bấm Huỷ rồi kiểm ở tab Tất cả.';
    if (!confirm(msg)) return;
    if (zp) p.items.forEach((i) => { if (zeroPending(i)) { i.counted = true; i.countQty = 0; } });
    p.locked = { at: Date.now(), by: who() };
    (p.lockLog = p.lockLog || []).push('Khoá ' + new Date().toLocaleString('vi-VN') + (who() ? ' · ' + who() : ''));
    store.save(); render(); toast('Đã khoá dữ liệu kỳ kiểm kê');
    audit('Khoá kỳ', p.name);
  },
  unlock(kind, id) {
    const p = LKX.get(kind, id); if (!p || !p.locked) return;
    if (!confirm('Mở khoá kỳ "' + p.name + '"?\nSố liệu sẽ sửa được trở lại.')) return;
    delete p.locked;
    (p.lockLog = p.lockLog || []).push('Mở khoá ' + new Date().toLocaleString('vi-VN') + (who() ? ' · ' + who() : ''));
    store.save(); render(); toast('Đã mở khoá');
    audit('Mở khoá kỳ', p.name);
  },
  lockAllDone() {
    const w = who(); const list = [];
    (db.periods || []).forEach((p) => { if (!p.locked && p.items && p.items.length && !p.items.filter(needsCount).length) list.push(p); });
    (db.assets || []).forEach((p) => { if (!p.locked && p.items && p.items.length && !p.items.filter((i) => !i.counted).length) list.push(p); });
    if (!list.length) { toast('Không có kỳ nào đã kiểm xong mà chưa khoá'); return; }
    let zpAll = 0; list.forEach((p) => { zpAll += p.items.filter(zeroPending).length; });
    if (!confirm('Khoá ' + list.length + ' kỳ đã kiểm xong?\n\n' + list.slice(0, 8).map((p) => '• ' + p.name).join('\n') + (list.length > 8 ? '\n…' : '') + (zpAll ? '\n\n⚠ Còn ' + zpAll + ' mã tồn sổ sách = 0 chưa kiểm. Bấm OK sẽ ghi nhận thực tế = 0 (khớp sổ) cho các mã này.' : '') + '\n\nCó thể mở khoá từng kỳ khi cần.')) return;
    const at = Date.now(); const tx = new Date(at).toLocaleString('vi-VN');
    list.forEach((p) => {
      p.items.forEach((i) => { if (zeroPending(i)) { i.counted = true; i.countQty = 0; } });
      p.locked = { at, by: w }; (p.lockLog = p.lockLog || []).push('Khoá ' + tx + (w ? ' · ' + w : ''));
    });
    store.save(); render(); toast('Đã khoá ' + list.length + ' kỳ kiểm kê');
  },
  guard(obj, names, getP) {
    names.forEach((n) => {
      const o = obj[n]; if (typeof o !== 'function') return;
      obj[n] = function (...args) {
        const p = getP.apply(this, args);
        if (p && p.locked) { toast('Kỳ này đã khoá, mở khoá để chỉnh sửa'); return undefined; }
        return o.apply(this, args);
      };
    });
  },
};

/* Dòng gốc 8098–8111: bọc hành động của phân hệ khác. Chạy sau khi mọi phân hệ đã đăng ký. */
export function installLockGuards() {
  const curVt = () => per(S.P && S.P.id); const byId = (id) => per(id);
  LKX.guard(A, ['openItem', 'seqStart', 'scanOpen', 'sheetSave', 'sheetReset', 'batAdd', 'photoTake', 'scQtySave', 'scPickQ'], curVt);
  LKX.guard(A, ['renamePeriod', 'delPeriod', 'periodMove', 'periodMoveSave'], byId);
  const curAs = () => X.asPer && X.asPer(X.AP && X.AP.pid); const asId = (id) => X.asPer && X.asPer(id);
  if (X.ASX) {
    LKX.guard(X.ASX, ['edit', 'scDetail', 'addExtra', 'scan', 'editSave', 'editDel', 'editReset', 'editMissing', 'dupAdd', 'autoAddManual', 'scShoot', 'phShoot', 'phDel', 'scSave', 'scUndo', 'autoUndo', 'cur', 'curAuto', 'confirmNum'], curAs);
    LKX.guard(X.ASX, ['delP'], asId);
  }
  /* mọi đường vào khác (trang chủ, menu ☰, thư mục cũ) thì nút quay lại về như trước */
  const og = A.go; A.go = function (v, ...r) { if (v !== 'upload') X.LS.back = false; if (v === 'assets' && X.AP) X.AP.pre = null; return og.call(this, v, ...r); };
  const of = A.openFolder; A.openFolder = function (...a) { X.LS.back = false; return of.apply(this, a); };
}
