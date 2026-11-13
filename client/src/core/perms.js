/* Phân quyền phía giao diện. Máy chủ mới là nơi thực thi; các hàm ở đây chỉ để ẩn/khoá cho tiện dùng.
   auth.user.perms do máy chủ trả = quyền hiệu lực (admin → toàn quyền). Chưa có user → mọi hàm trả false. */
import { auth, api } from './store.js';
import { X } from './state.js';

export const MODULE_KEYS = ['kiemke', 'hsd', 'assets', 'handover', 'explain', 'recon', 'pay', 'ana', 'err', 'sign', 'config'];

/* route.view -> khoá phân hệ; không có trong bảng (home, dchub, settings...) = luôn vào được */
const VIEW_MOD = {
  lists: 'kiemke', upload: 'kiemke', folder: 'kiemke', period: 'kiemke', stock: 'kiemke', transfer: 'kiemke', baocao: 'kiemke', reporthub: 'kiemke', mgmt: 'kiemke',
  hsd: 'hsd', assets: 'assets', asset: 'assets', handover: 'handover', handoverEdit: 'handover', explain: 'explain', explainEdit: 'explain',
  recon: 'recon', pay: 'pay', ana: 'ana', err: 'err', sign: 'sign',
};

const isAdminU = () => !!(auth.user && auth.user.role === 'admin');
/* quyền hiệu lực; tài khoản user cũ chưa có perms → coi như Chỉ xem */
export function userPerms() {
  const u = auth.user; if (!u) return null;
  if (u.role === 'admin') return { preset: 'admin', modules: null, branches: '*', lock: true, del: true };
  const p = u.perms || {};
  const modules = {}; MODULE_KEYS.forEach((k) => { const v = p.modules && p.modules[k]; modules[k] = typeof v === 'number' ? v : (u.perms ? 0 : (k === 'config' ? 0 : 1)); });
  return { preset: p.preset || 'xem', modules, branches: p.branches === undefined ? '*' : p.branches, lock: !!p.lock, del: !!p.del };
}
export function permLevel(moduleKey) {
  const p = userPerms(); if (!p) return 0;
  if (!p.modules) return 2;
  return p.modules[moduleKey] || 0;
}
export const can = (moduleKey, lv = 1) => !!auth.user && permLevel(moduleKey) >= lv;
export const canEdit = (moduleKey) => can(moduleKey, 2);
export function allBranches() { const p = userPerms(); return !!p && (p.branches === '*' || !Array.isArray(p.branches)); }
export function canBranch(folder) {
  const p = userPerms(); if (!p) return false;
  if (allBranches()) return true;
  const f = String(folder || ''); if (!f) return false;
  return p.branches.indexOf(f) >= 0;
}
export const canLock = () => { const p = userPerms(); return !!p && !!p.lock; };
export const canDel = () => { const p = userPerms(); return !!p && !!p.del; };
export const viewModule = (view) => VIEW_MOD[view] || null;
export function canView(view) {
  if (!auth.user) return false;
  const m = viewModule(view); return m == null ? true : can(m, 1);
}
/* mức của phân hệ chứa màn hiện tại (null nếu màn không thuộc phân hệ nào) */
export function viewLevel(view) { const m = viewModule(view); return m == null ? null : permLevel(m); }

/* Danh sách vai trò mẫu (GET /api/auth/presets), cache trong bộ nhớ */
let presets = null; let presetsP = null;
export function loadPresets() {
  if (presets) return Promise.resolve(presets);
  if (!presetsP) presetsP = api('/auth/presets').then((r) => { presets = r; return r; }).catch((e) => { presetsP = null; throw e; });
  return presetsP;
}
export const getPresets = () => presets;
export function presetLabel(key) {
  if (key === 'admin') return 'Quản trị viên';
  if (key === 'custom') return 'Tuỳ chỉnh';
  const p = presets && presets.presets && presets.presets.find((x) => x.key === key);
  return p ? p.label : (key === 'thukho' ? 'Thủ kho' : key === 'ketoan' ? 'Kế toán' : key === 'hanhchinh' ? 'Hành chính' : key === 'xem' ? 'Chỉ xem' : 'Tuỳ chỉnh');
}

/* Bọc các hàm obj[names]: chỉ chạy khi check(...args) đúng, nếu không thì toast msg (chuỗi hoặc hàm). Chạy sau khi mọi phân hệ đăng ký. */
export function guardAction(obj, names, check, msg) {
  if (!obj) return;
  names.forEach((n) => {
    const o = obj[n]; if (typeof o !== 'function' || o.__permGuard) return;
    const w = function (...args) {
      let ok = false;
      try { ok = !!check.apply(this, args); } catch (e) { ok = false; }
      if (!ok) { const t = X.toast; if (t) t(typeof msg === 'function' ? msg(...args) : msg); return undefined; }
      return o.apply(this, args);
    };
    w.__permGuard = true;
    obj[n] = w;
  });
}
