/* Cài đặt hệ thống (view `settings`): hồ sơ tài khoản, đổi mật khẩu, quản lý tài khoản, cài đặt in, người ký theo chi nhánh, khoá dữ liệu — app gốc 5365–5456 + bản vá 8198–8205 */
import { useEffect } from 'react';
import { db, A, X, I, norm, saveSoon, store, toast, rerender, st, auth, isAdmin, canEdit, canLock } from '../../core';
import { AccountCard, UsersCard, loadUsers, ROLE_LABEL } from './accounts.jsx';

/* ================= Người ký theo chi nhánh ================= */
export const SG_ROLES = [
  { k: 'giamDoc', label: 'Giám đốc / Lãnh đạo đơn vị', ph: 'VD: Ông Nguyễn Văn A – Giám đốc cơ sở', use: 'Ô ký “Giám đốc cơ sở” (BB kiểm kê vật tư), “Lãnh đạo đơn vị” (BB kiểm kê CCDC & TSCĐ, phiếu giải trình)' },
  { k: 'thuKho', label: 'Thủ kho / Đầu mối kiểm kê', ph: 'VD: Bà Đỗ Thị Quỳnh – Thủ kho kiêm quản lý kho', use: 'Ô ký “Thủ kho cơ sở” (BB kiểm kê vật tư), “Đầu mối kiểm kê” (BB kiểm kê CCDC & TSCĐ), “Người kiểm kê” (báo cáo)' },
  { k: 'hanhChinh', label: 'Phòng Hành chính', ph: 'VD: Bà Trần Thị B – Trưởng phòng Hành chính', use: 'Ô ký “Phòng Hành chính Hậu cần” (BB kiểm kê vật tư), “Tổ kiểm kê” (BB kiểm kê CCDC & TSCĐ)' },
];
export function sgOf(branch) {
  const out = { giamDoc: '', thuKho: '', hanhChinh: '' }; const all = db.signers || {};
  const b = String(branch || '').trim() || (db.profile && db.profile.chiNhanh) || ''; const n = norm(b); let key = null;
  if (b && all[b]) key = b;
  else if (n) Object.keys(all).forEach((k) => { const nk = norm(k); if (!key && nk && (n.indexOf(nk) >= 0 || nk.indexOf(n) >= 0)) key = k; });
  if (key) SG_ROLES.forEach((r) => { out[r.k] = String(all[key][r.k] || '').trim(); });
  if (!out.thuKho) out.thuKho = X.defaultNguoi(b);
  return out;
}
export function sgBranches() {
  const seen = {}; const out = []; const add = (x) => { x = String(x || '').trim(); if (x && !seen[x]) { seen[x] = 1; out.push(x); } };
  (db.folders || []).forEach(add);
  const pc = String((db.profile && db.profile.chiNhanh) || '').trim(); const npc = norm(pc);
  if (pc && !out.some((x) => { const nx = norm(x); return nx.indexOf(npc) >= 0 || npc.indexOf(nx) >= 0; })) add(pc);
  Object.keys(db.signers || {}).forEach(add);
  return out;
}
export function sgCount(b) { const c = (db.signers || {})[b] || {}; let n = 0; SG_ROLES.forEach((r) => { if (String(c[r.k] || '').trim()) n++; }); return n; }
export function sgConfigured() { return Object.keys(db.signers || {}).some((b) => sgCount(b) > 0); }
export const SGX = {
  sel: '',
  pick(v) { SGX.sel = v; rerender(); },
  set(k, v) { if (!SGX.sel) return; if (!db.signers) db.signers = {}; const c = db.signers[SGX.sel] = db.signers[SGX.sel] || {}; c[k] = v; saveSoon(); rerender(); },
  copyHC() {
    const c = (db.signers || {})[SGX.sel] || {}; const v = String(c.hanhChinh || '').trim();
    if (!v) { toast('Hãy nhập Phòng Hành chính trước'); return; }
    if (!confirm('Dùng “' + v + '” làm Phòng Hành chính cho tất cả chi nhánh?')) return;
    sgBranches().forEach((b) => { db.signers[b] = db.signers[b] || {}; db.signers[b].hanhChinh = v; });
    store.save(); rerender(); toast('Đã áp dụng cho tất cả chi nhánh');
  },
};
export function sgCardHtml() {
  const br = sgBranches();
  const head = (
    <>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Người ký theo chi nhánh</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Thiết lập một lần cho từng chi nhánh. App tự điền tên vào đúng ô ký của các biên bản bên dưới, và làm tên mặc định khi ký điện tử.</div>
    </>
  );
  if (!br.length) {
    return <div className="card" style={{ marginBottom: 12 }}>{head}<div style={st('font-size:13px;color:var(--mut)')}>Chưa có chi nhánh nào. Hãy điền “Chi nhánh, bộ phận” ở mục Hồ sơ phía trên, hoặc tạo kỳ kiểm kê và chọn thư mục chi nhánh trước.</div></div>;
  }
  if (br.indexOf(SGX.sel) < 0) { const pc = db.profile && db.profile.chiNhanh; SGX.sel = br.indexOf(pc) >= 0 ? pc : br[0]; }
  const cur = (db.signers || {})[SGX.sel] || {};
  return (
    <div className="card" style={{ marginBottom: 12 }}>{head}
      <div style={st('display:flex;justify-content:space-between;align-items:center')}><label className="lbl" style={{ margin: 0 }}>Chi nhánh</label><span style={{ fontSize: 12, color: 'var(--mut)' }}>Đã điền <b id="sg_cnt" style={{ color: 'var(--ink)' }}>{sgCount(SGX.sel)}/3</b></span></div>
      <select className="inp" style={{ margin: '6px 0 4px' }} value={SGX.sel} onChange={(e) => SGX.pick(e.target.value)}>
        {br.map((b) => { const n = sgCount(b); return <option key={b} value={b}>{b + (n === 3 ? '  ✓' : n ? '  (' + n + '/3)' : '')}</option>; })}
      </select>
      {SG_ROLES.map((r) => (
        <div key={r.k}>
          <label className="lbl" style={{ marginTop: 12 }}>{r.label}</label>
          <input className="inp" id={'sg_' + r.k} placeholder={r.ph} value={cur[r.k] || ''} onChange={(e) => SGX.set(r.k, e.target.value)} />
          <div style={st('font-size:11px;color:var(--mut);margin-top:4px;line-height:1.4')}>Điền vào: {r.use}.</div>
        </div>
      ))}
      <button className="btn btn-outline" style={st('margin-top:14px;padding:10px;font-size:13px')} onClick={() => SGX.copyHC()}>Dùng Phòng Hành chính này cho mọi chi nhánh</button>
    </div>
  );
}

/* Cấu hình chung (cài đặt in, người ký): không có quyền sửa `config` thì hiện ở chế độ chỉ đọc */
function CfgGuard({ children }) {
  if (canEdit('config')) return <>{children}</>;
  return (
    <>
      <div className="note-warn" style={st('font-size:13px;margin-bottom:12px')}>Bạn chỉ được xem phần cấu hình chung (cài đặt in, người ký) — không có quyền chỉnh sửa.</div>
      <fieldset disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0, opacity: 0.75 }}>{children}</fieldset>
    </>
  );
}

/* ================= Màn hình Cài đặt ================= */
export function Settings() {
  const pr = db.profile || {};
  const admin = isAdmin();
  useEffect(() => { if (admin) loadUsers(); }, [admin]);
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('home')}>‹</button><div className="ttl">Cài đặt</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div className="card" style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, marginBottom: 2 }}>Hồ sơ của tài khoản</div>
          <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Hồ sơ này thuộc tài khoản đang đăng nhập. App tự điền thông tin vào biên bản bàn giao, phiếu giải trình và ô ký.</div>
          <div style={st('font-size:12px;margin:-6px 0 12px')}>Tài khoản: <b>{auth.user ? auth.user.username : ''}</b> · {ROLE_LABEL[auth.user && auth.user.role] || ''}</div>
          <label className="lbl">Họ tên</label><input className="inp" id="pf_ten" value={pr.ten || ''} onChange={(e) => A.pfSet('ten', e.target.value)} style={{ marginBottom: 10 }} />
          <label className="lbl">Chức vụ</label><input className="inp" id="pf_cv" value={pr.chucVu || ''} onChange={(e) => A.pfSet('chucVu', e.target.value)} style={{ marginBottom: 10 }} />
          <label className="lbl">Chi nhánh, bộ phận (VD: Kho Cát Linh)</label><input className="inp" id="pf_cn" value={pr.chiNhanh || ''} onChange={(e) => A.pfSet('chiNhanh', e.target.value)} style={{ marginBottom: 10 }} />
          <label className="lbl">Mã chi nhánh trong số biên bản (VD: CL)</label><input className="inp" id="pf_ma" value={pr.ma || ''} onChange={(e) => A.pfSet('ma', e.target.value)} />
          <div style={st('font-size:12px;color:var(--mut);margin-top:6px')}>Số biên bản sẽ có dạng 01/BBBG/{pr.ma || 'CL'}/{new Date().getFullYear()}, mỗi chi nhánh đếm riêng nên không bị trùng số.</div></div>
        <AccountCard />
        <UsersCard />
        <CfgGuard>{X.prCardHtml()}{sgCardHtml()}</CfgGuard>
        {canLock() ? <div className="card" style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, marginBottom: 2 }}>Khoá dữ liệu đã kiểm kê</div>
          <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Khoá cùng lúc mọi kỳ đã kiểm xong. Kỳ đã khoá không sửa được, vẫn xuất Excel và in bình thường. Trạng thái khoá được lưu cùng dữ liệu trên máy chủ.</div>
          <button className="btn btn-outline" onClick={() => X.LKX.lockAllDone()}>{I('lock', 17)}Khoá tất cả kỳ đã kiểm xong</button></div> : null}
        <div className="card"><div style={{ fontWeight: 700, marginBottom: 4 }}>Về ứng dụng</div><div style={st('font-size:13px;color:var(--mut)')}>Kiểm kê kho MedDental, built by Quyet Mai.</div></div>
      </div>
    </>
  );
}
export const renderSettings = () => rerender();
