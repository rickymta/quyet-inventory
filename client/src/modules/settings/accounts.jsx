/* Tài khoản: đổi mật khẩu, đăng xuất, quản lý tài khoản (quản trị viên). Gọi API /api/auth/* và /api/users. */
import { api, auth, db, isAdmin, changePassword, adoptOwnUser, branchCode, klog, openModal, closeModal, rerender, toast, st, logout, loadPresets, getPresets, presetLabel, userPerms, MODULE_KEYS } from '../../core';
import { tsLabel } from './util.js';

export const ROLE_LABEL = { admin: 'Quản trị viên', user: 'Người dùng' };

/* ---------- Đổi mật khẩu ---------- */
export const PWF = { cur: '', nw: '', nw2: '', busy: false };
export const PWX = {
  async submit() {
    if (PWF.busy) return;
    if (!PWF.cur) { toast('Chưa nhập mật khẩu hiện tại'); return; }
    if (PWF.nw.length < 8) { toast('Mật khẩu mới phải có ít nhất 8 ký tự'); return; }
    if (PWF.nw !== PWF.nw2) { toast('Mật khẩu nhập lại không khớp'); return; }
    PWF.busy = true; rerender();
    try {
      await changePassword(PWF.cur, PWF.nw);
      PWF.cur = ''; PWF.nw = ''; PWF.nw2 = '';
      toast('Đã đổi mật khẩu');
    } catch (e) { toast('Không đổi được mật khẩu: ' + e.message); }
    PWF.busy = false; rerender();
  },
};

/* ---------- Danh sách tài khoản ---------- */
export const ACC = { list: null, loading: false, err: '' };
export async function loadUsers() {
  if (ACC.loading) return;
  ACC.loading = true; ACC.err = '';
  try { ACC.list = await api('/users'); }
  catch (e) { ACC.err = e.message; klog('accounts.load', e); }
  ACC.loading = false; rerender();
}

/* Form thêm / sửa / đặt lại mật khẩu (modal) */
/* Phân quyền trong form: preset, mods (khoá phân hệ -> 0|1|2), all (mọi chi nhánh) / sel (danh sách chi nhánh), lock, del */
const MOD_FALLBACK = { kiemke: 'Kiểm kê vật tư', hsd: 'Cảnh báo hạn sử dụng', assets: 'Kiểm kê CCDC & TSCĐ', handover: 'Biên bản bàn giao', explain: 'Giải trình chênh lệch', recon: 'Đối chiếu doanh thu – xuất kho', pay: 'Thanh toán NCC', ana: 'Phân tích mua hàng – tiêu hao', err: 'Báo lỗi nhập liệu & labo', sign: 'Ký số PDF', config: 'Cấu hình chung' };
const modList = () => { const g = getPresets(); return g && Array.isArray(g.modules) && g.modules.length ? g.modules : MODULE_KEYS.map((k) => ({ key: k, label: MOD_FALLBACK[k] })); };
const permBlank = () => ({ preset: 'xem', mods: Object.fromEntries(MODULE_KEYS.map((k) => [k, 1])), all: true, sel: [], lock: false, del: false });
const F = Object.assign({ mode: 'add', id: null, username: '', ten: '', chucVu: '', chiNhanh: '', ma: '', role: 'user', password: '', busy: false }, permBlank());
const blank = () => Object.assign(F, { mode: 'add', id: null, username: '', ten: '', chucVu: '', chiNhanh: '', ma: '', role: 'user', password: '', busy: false }, permBlank());
const permFrom = (p) => {
  const o = permBlank(); if (!p) return o;
  o.preset = p.preset || 'custom';
  MODULE_KEYS.forEach((k) => { const v = p.modules && p.modules[k]; o.mods[k] = typeof v === 'number' ? v : 0; });
  o.all = p.branches === '*' || !Array.isArray(p.branches); o.sel = o.all ? [] : p.branches.slice();
  o.lock = !!p.lock; o.del = !!p.del;
  return o;
};
const permBody = () => ({ preset: F.preset, modules: Object.assign({}, F.mods), branches: F.all ? '*' : F.sel.slice(), lock: F.lock, del: F.del });
const custom = () => { F.preset = 'custom'; };
const branchSummary = (p) => (!p || p.branches === '*' || !Array.isArray(p.branches) ? 'Tất cả chi nhánh' : (p.branches.length ? p.branches.join(', ') : 'Không có chi nhánh nào'));
const fld = (k) => ({ value: F[k], onChange: (e) => { F[k] = e.target.value; rerender(); } });
const mkProfile = () => {
  const ma = String(F.ma || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return { ten: F.ten.trim(), chucVu: F.chucVu.trim(), chiNhanh: F.chiNhanh.trim(), ma: ma || branchCode(F.chiNhanh.trim()), maManual: !!ma };
};

const permCheck = () => (F.role !== 'admin' && !F.all && !F.sel.length ? { bad: 'Chọn ít nhất một chi nhánh, hoặc bật “Tất cả chi nhánh”' } : null);

export const ACX = {
  openAdd() { blank(); loadPresets().then(rerender, () => {}); openModal(FormModal); },
  openEdit(u) {
    const p = u.profile || {};
    Object.assign(F, { mode: 'edit', id: u.id, username: u.username, ten: p.ten || '', chucVu: p.chucVu || '', chiNhanh: p.chiNhanh || '', ma: p.maManual ? (p.ma || '') : '', role: u.role, password: '', busy: false }, permFrom(u.perms));
    loadPresets().then(rerender, () => {});
    openModal(FormModal);
  },
  setPreset(k) {
    F.preset = k;
    const g = getPresets(); const pr = g && g.presets && g.presets.find((x) => x.key === k);
    if (pr && pr.perms) {
      MODULE_KEYS.forEach((m) => { const v = pr.perms.modules && pr.perms.modules[m]; F.mods[m] = typeof v === 'number' ? v : 0; });
      F.lock = !!pr.perms.lock; F.del = !!pr.perms.del;
    }
    rerender();
  },
  setMod(k, v) { F.mods[k] = v; custom(); rerender(); },
  setFlag(k, v) { F[k] = v; custom(); rerender(); },
  setAll(v) { F.all = v; rerender(); },
  toggleBranch(b) { const i = F.sel.indexOf(b); if (i >= 0) F.sel.splice(i, 1); else F.sel.push(b); rerender(); },
  openPw(u) { blank(); Object.assign(F, { mode: 'pw', id: u.id, username: u.username }); openModal(FormModal); },
  async submit() {
    if (F.busy) return;
    const r = await (async () => {
      if (F.mode === 'add') {
        const un = F.username.trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,32}$/.test(un)) return { bad: 'Tên đăng nhập 3–32 ký tự, gồm chữ thường không dấu, số, dấu chấm, gạch ngang, gạch dưới' };
        if (F.password.length < 8) return { bad: 'Mật khẩu ban đầu phải có ít nhất 8 ký tự' };
        const pb = permCheck(); if (pb && pb.bad) return pb;
        const body = { username: un, password: F.password, role: F.role, profile: mkProfile() }; if (F.role !== 'admin') body.perms = permBody();
        return { call: () => api('/users', { method: 'POST', body }), ok: 'Đã thêm tài khoản ' + un };
      }
      if (F.mode === 'pw') {
        if (F.password.length < 8) return { bad: 'Mật khẩu mới phải có ít nhất 8 ký tự' };
        return { call: () => api('/users/' + encodeURIComponent(F.id), { method: 'PUT', body: { password: F.password } }), ok: 'Đã đặt lại mật khẩu cho ' + F.username };
      }
      const body = { profile: mkProfile() };
      if (F.id !== (auth.user && auth.user.id)) body.role = F.role;
      if (F.role !== 'admin') { const pb = permCheck(); if (pb && pb.bad) return pb; body.perms = permBody(); }
      return { call: () => api('/users/' + encodeURIComponent(F.id), { method: 'PUT', body }), ok: 'Đã cập nhật tài khoản ' + F.username };
    })();
    if (r.bad) { toast(r.bad); return; }
    F.busy = true; rerender();
    try {
      const res = await r.call();
      if (F.mode === 'edit' && res && res.user && auth.user && res.user.id === auth.user.id) adoptOwnUser(res.user);
      toast(r.ok); closeModal(); await loadUsers();
    } catch (e) { F.busy = false; toast('Lỗi: ' + e.message); rerender(); }
  },
  async toggle(u) {
    const lock = u.active !== false;
    if (lock && !confirm('Khoá tài khoản “' + u.username + '”? Người này sẽ không đăng nhập được cho tới khi mở khoá.')) return;
    try { await api('/users/' + encodeURIComponent(u.id), { method: 'PUT', body: { active: !lock } }); toast(lock ? 'Đã khoá ' + u.username : 'Đã mở khoá ' + u.username); await loadUsers(); }
    catch (e) { toast('Lỗi: ' + e.message); }
  },
  async remove(u) {
    if (!confirm('Xoá tài khoản “' + u.username + '”? Không khôi phục được. Dữ liệu dùng chung không bị ảnh hưởng.')) return;
    try { await api('/users/' + encodeURIComponent(u.id), { method: 'DELETE' }); toast('Đã xoá ' + u.username); await loadUsers(); }
    catch (e) { toast('Lỗi: ' + e.message); }
  },
};

function FormModal() {
  const titles = { add: 'Thêm tài khoản', edit: 'Sửa tài khoản', pw: 'Đặt lại mật khẩu' };
  const self = F.mode === 'edit' && F.id === (auth.user && auth.user.id);
  const submitOnEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); ACX.submit(); } };
  return (
    <div className="ac-ovl" onClick={(e) => { if (e.target === e.currentTarget && !F.busy) closeModal(); }}>
      <form className="ac-modal" onSubmit={(e) => { e.preventDefault(); ACX.submit(); }} onKeyDown={submitOnEnter} noValidate>
        <h3>{titles[F.mode]}{F.mode !== 'add' ? ' · ' + F.username : ''}</h3>
        {F.mode === 'add' ? <><label className="lbl">Tên đăng nhập</label><input className="inp" autoComplete="off" autoCapitalize="none" spellCheck={false} {...fld('username')} /></> : null}
        {F.mode !== 'pw' ? (
          <>
            <label className="lbl">Họ tên</label><input className="inp" {...fld('ten')} />
            <label className="lbl">Chức vụ</label><input className="inp" {...fld('chucVu')} />
            <label className="lbl">Chi nhánh, bộ phận</label><input className="inp" {...fld('chiNhanh')} />
            <label className="lbl">Mã chi nhánh trong số biên bản (để trống = tự sinh)</label><input className="inp" {...fld('ma')} />
            <label className="lbl">Vai trò</label>
            <select className="inp" {...fld('role')} disabled={self}><option value="user">Người dùng</option><option value="admin">Quản trị viên</option></select>
            {self ? <div style={st('font-size:12px;color:var(--mut);margin-top:4px')}>Không đổi được vai trò của chính mình.</div> : null}
            {F.role === 'admin' ? <div className="pm-note">Quản trị viên có toàn quyền.</div> : <PermBlock />}
          </>
        ) : null}
        {F.mode !== 'edit' ? <><label className="lbl">{F.mode === 'add' ? 'Mật khẩu ban đầu (tối thiểu 8 ký tự)' : 'Mật khẩu mới (tối thiểu 8 ký tự)'}</label><input className="inp" type="password" autoComplete="new-password" {...fld('password')} /></> : null}
        <div className="ac-btns">
          <button type="button" className="btn btn-outline" onClick={() => closeModal()} disabled={F.busy}>Huỷ</button>
          <button type="submit" className="btn btn-primary" disabled={F.busy}>{F.busy ? 'Đang lưu…' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
}

function PermBlock() {
  const g = getPresets();
  const presets = (g && g.presets) || [];
  const opts = presets.filter((p) => p.key !== 'custom');
  return (
    <div className="pm-box">
      <div className="pm-sec" style={{ marginTop: 6 }}>Phân quyền</div>
      <label className="lbl">Vai trò mẫu</label>
      <select className="inp" value={F.preset} onChange={(e) => { if (e.target.value !== 'custom') ACX.setPreset(e.target.value); else { custom(); rerender(); } }}>
        {opts.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        {!opts.some((p) => p.key === F.preset) && F.preset !== 'custom' ? <option value={F.preset}>{presetLabel(F.preset)}</option> : null}
        <option value="custom">Tuỳ chỉnh</option>
      </select>
      {!g ? <div className="pm-note">Đang tải danh sách vai trò mẫu…</div> : null}
      <div className="pm-sec">Quyền theo phân hệ</div>
      {modList().map((m) => (
        <div className="pm-row" key={m.key}>
          <div className="pm-nm">{m.label}</div>
          <div className="pm-seg">
            {[[0, 'Không'], [1, 'Xem'], [2, 'Sửa']].map((o) => <button type="button" key={o[0]} className={'l' + o[0] + (F.mods[m.key] === o[0] ? ' on' : '')} onClick={() => ACX.setMod(m.key, o[0])}>{o[1]}</button>)}
          </div>
        </div>
      ))}
      <div className="pm-sec">Chi nhánh được phép</div>
      <label className="pm-chk"><input type="checkbox" checked={F.all} onChange={(e) => ACX.setAll(e.target.checked)} />Tất cả chi nhánh</label>
      {!F.all ? (db.folders || []).map((b) => (
        <label className="pm-chk" key={b} style={{ paddingLeft: 12 }}><input type="checkbox" checked={F.sel.indexOf(b) >= 0} onChange={() => ACX.toggleBranch(b)} />{b}</label>
      )) : null}
      {!F.all && !(db.folders || []).length ? <div className="pm-note">Chưa có chi nhánh nào.</div> : null}
      <div className="pm-sec">Quyền riêng</div>
      <label className="pm-chk"><input type="checkbox" checked={F.lock} onChange={(e) => ACX.setFlag('lock', e.target.checked)} />Khoá / mở khoá kỳ kiểm kê</label>
      <label className="pm-chk"><input type="checkbox" checked={F.del} onChange={(e) => ACX.setFlag('del', e.target.checked)} />Xoá dữ liệu (kỳ, biên bản, phiếu)</label>
    </div>
  );
}

/* Khối "Quyền của bạn" (chỉ đọc) trong thẻ Tài khoản của người dùng thường */
function MyPerms() {
  const p = userPerms(); const u = auth.user;
  if (!p || !u || u.role === 'admin') return null;
  const ml = modList();
  const by = (lv) => ml.filter((m) => p.modules[m.key] === lv);
  const edit = by(2); const view = by(1);
  return (
    <div style={{ margin: '0 0 14px', padding: '10px 12px', borderRadius: 12, background: 'var(--bg, #f4f6fb)', border: '1px solid var(--line)' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Quyền của bạn · {presetLabel(p.preset)}</div>
      <div style={st('font-size:12px;line-height:1.9')}>
        {edit.length ? <div><b>Được sửa:</b> {edit.map((m) => <span key={m.key} className="pm-tag e">{m.label}</span>)}</div> : null}
        {view.length ? <div><b>Chỉ xem:</b> {view.map((m) => <span key={m.key} className="pm-tag v">{m.label}</span>)}</div> : null}
        {!edit.length && !view.length ? <div>Chưa được cấp quyền phân hệ nào.</div> : null}
        <div><b>Chi nhánh:</b> {branchSummary(p)}</div>
        <div><b>Khoá / mở khoá kỳ:</b> {p.lock ? 'Có' : 'Không'} · <b>Xoá dữ liệu:</b> {p.del ? 'Có' : 'Không'}</div>
      </div>
    </div>
  );
}

/* ---------- Thẻ giao diện ---------- */
export function AccountCard() {
  const u = auth.user || {};
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Tài khoản</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Đang đăng nhập: <b style={{ color: 'var(--ink)' }}>{u.username}</b> · {ROLE_LABEL[u.role] || ''}</div>
      <MyPerms />
      <label className="lbl">Mật khẩu hiện tại</label>
      <input className="inp" type="password" autoComplete="current-password" value={PWF.cur} onChange={(e) => { PWF.cur = e.target.value; rerender(); }} style={{ marginBottom: 10 }} />
      <label className="lbl">Mật khẩu mới (tối thiểu 8 ký tự)</label>
      <input className="inp" type="password" autoComplete="new-password" value={PWF.nw} onChange={(e) => { PWF.nw = e.target.value; rerender(); }} style={{ marginBottom: 10 }} />
      <label className="lbl">Nhập lại mật khẩu mới</label>
      <input className="inp" type="password" autoComplete="new-password" value={PWF.nw2} onChange={(e) => { PWF.nw2 = e.target.value; rerender(); }} onKeyDown={(e) => { if (e.key === 'Enter') PWX.submit(); }} style={{ marginBottom: 12 }} />
      <button className="btn btn-primary" disabled={PWF.busy} onClick={() => PWX.submit()}>{PWF.busy ? 'Đang đổi…' : 'Đổi mật khẩu'}</button>
      <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => { logout(); }}>Đăng xuất</button>
    </div>
  );
}

export function UsersCard() {
  if (!isAdmin()) return null;
  const me = auth.user && auth.user.id;
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Quản lý tài khoản</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Mỗi tài khoản được cấp quyền theo phân hệ và chi nhánh; quản trị viên luôn có toàn quyền. Chỉ quản trị viên thấy mục này.</div>
      <button className="btn btn-primary" style={{ marginBottom: 8 }} onClick={() => ACX.openAdd()}>Thêm tài khoản</button>
      {ACC.err ? <div className="note-warn" style={st('font-size:13px;margin:8px 0')}>Không tải được danh sách: {ACC.err} <button className="pill" onClick={() => loadUsers()}>Thử lại</button></div> : null}
      {ACC.list === null && !ACC.err ? <div style={st('font-size:13px;color:var(--mut);padding:8px 0')}>Đang tải danh sách…</div> : null}
      {(ACC.list || []).map((u) => {
        const p = u.profile || {}; const off = u.active === false;
        return (
          <div className="ac-row" key={u.id} style={{ alignItems: 'flex-start' }}>
            <div className="ac-main">
              <div className="ac-nm">{u.username}<span className="ac-tag">{ROLE_LABEL[u.role] || u.role}</span><span className={'ac-tag' + (off ? ' off' : '')}>{off ? 'Đã khoá' : 'Hoạt động'}</span>{u.id === me ? <span className="ac-tag">Bạn</span> : null}</div>
              <div className="ac-meta">{p.ten || 'Chưa có họ tên'}{p.chucVu ? ' · ' + p.chucVu : ''}{p.chiNhanh ? ' · ' + p.chiNhanh : ''}<br />{u.role === 'admin' ? 'Toàn quyền' : 'Vai trò mẫu: ' + presetLabel(u.perms && u.perms.preset) + ' · ' + branchSummary(u.perms)}<br />Đăng nhập cuối: {u.lastLoginAt ? tsLabel(u.lastLoginAt) : 'chưa đăng nhập'}</div>
              <div className="ac-acts">
                <button className="pill" onClick={() => ACX.openEdit(u)}>Sửa</button>
                <button className="pill" onClick={() => ACX.openPw(u)}>Đặt lại mật khẩu</button>
                {u.id !== me ? <button className="pill" onClick={() => ACX.toggle(u)}>{off ? 'Mở khoá' : 'Khoá'}</button> : null}
                {u.id !== me ? <button className="pill" style={{ color: 'var(--red)' }} onClick={() => ACX.remove(u)}>Xoá</button> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
