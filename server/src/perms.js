/* Phân quyền chi tiết — nguồn duy nhất ở máy chủ (đặc tả: docs/PERMISSIONS.md). Module thuần, không phụ thuộc DB. */

const httpError = (status, message) => Object.assign(new Error(message), { status });

/* 11 phân hệ, theo thứ tự hiển thị */
export const MODULES = [
  { key: 'kiemke', label: 'Kiểm kê vật tư' },
  { key: 'hsd', label: 'Cảnh báo hạn sử dụng' },
  { key: 'assets', label: 'Kiểm kê CCDC & TSCĐ' },
  { key: 'handover', label: 'Biên bản bàn giao' },
  { key: 'explain', label: 'Giải trình chênh lệch' },
  { key: 'recon', label: 'Đối chiếu doanh thu – xuất kho' },
  { key: 'pay', label: 'Thanh toán NCC' },
  { key: 'ana', label: 'Phân tích mua hàng – tiêu hao' },
  { key: 'err', label: 'Báo lỗi nhập liệu & labo' },
  { key: 'sign', label: 'Ký số PDF' },
  { key: 'config', label: 'Cấu hình chung' },
];
export const MODULE_KEYS = MODULES.map((m) => m.key);
const MODULE_LABEL = Object.fromEntries(MODULES.map((m) => [m.key, m.label]));
export const moduleLabel = (k) => MODULE_LABEL[k] || k;

const mods = (arr) => Object.fromEntries(MODULE_KEYS.map((k, i) => [k, arr[i]]));
//                       kiemke hsd assets handover explain recon pay ana err sign config
const PRESET_DEFS = [
  { key: 'thukho', label: 'Thủ kho', modules: mods([2, 1, 2, 2, 2, 0, 0, 0, 1, 0, 0]), lock: false, del: false },
  { key: 'ketoan', label: 'Kế toán', modules: mods([1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 0]), lock: true, del: false },
  { key: 'hanhchinh', label: 'Hành chính', modules: mods([2, 1, 2, 2, 2, 1, 1, 1, 2, 2, 2]), lock: true, del: true },
  { key: 'xem', label: 'Chỉ xem', modules: mods([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]), lock: false, del: false },
  /* Tuỳ chỉnh: trang giấy trắng — quản trị viên tự tích */
  { key: 'custom', label: 'Tuỳ chỉnh', modules: mods(MODULE_KEYS.map(() => 0)), lock: false, del: false },
];
const PRESET_KEYS = new Set(PRESET_DEFS.map((p) => p.key));
const presetPerms = (def) => ({ preset: def.key, modules: { ...def.modules }, branches: '*', lock: def.lock, del: def.del });

/* Danh sách mẫu trả cho GET /api/auth/presets */
export function listPresets() {
  return PRESET_DEFS.map((d) => ({ key: d.key, label: d.label, perms: presetPerms(d) }));
}
export const presetsPayload = () => ({ modules: MODULES.map((m) => ({ ...m })), presets: listPresets() });

export const fullPerms = () => ({
  preset: 'custom',
  modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, 2])),
  branches: '*',
  lock: true,
  del: true,
});
const viewOnlyPerms = () => presetPerms(PRESET_DEFS.find((d) => d.key === 'xem'));

/* Chuẩn hoá perms nhận từ client; sai → ném lỗi 400. Thiếu `modules` + có `preset` hợp lệ → lấy theo mẫu.
   Có `modules` thì khoá thiếu = 0 (ít quyền nhất). */
export function normalizePerms(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'Quyền (perms) không hợp lệ');
  const preset = input.preset === undefined || input.preset === null ? 'custom' : input.preset;
  if (typeof preset !== 'string' || !PRESET_KEYS.has(preset)) throw httpError(400, 'Vai trò mẫu không hợp lệ');
  const def = PRESET_DEFS.find((d) => d.key === preset);

  let modules;
  if (input.modules === undefined || input.modules === null) modules = { ...def.modules };
  else {
    if (typeof input.modules !== 'object' || Array.isArray(input.modules)) throw httpError(400, 'Trường modules không hợp lệ');
    modules = Object.fromEntries(MODULE_KEYS.map((k) => [k, 0]));
    for (const [k, v] of Object.entries(input.modules)) {
      if (!MODULE_KEYS.includes(k)) continue; // khoá lạ: bỏ
      if (v !== 0 && v !== 1 && v !== 2) throw httpError(400, `Mức quyền của "${k}" phải là 0, 1 hoặc 2`);
      modules[k] = v;
    }
  }

  let branches;
  const b = input.branches;
  if (b === undefined || b === null || b === '*') branches = '*';
  else if (Array.isArray(b)) {
    if (b.length > 100) throw httpError(400, 'Tối đa 100 chi nhánh');
    const seen = new Set();
    for (const x of b) {
      if (typeof x !== 'string' || !x.trim() || x.length > 120) throw httpError(400, 'Tên chi nhánh không hợp lệ');
      seen.add(x);
    }
    branches = [...seen];
  } else throw httpError(400, 'branches phải là "*" hoặc mảng tên chi nhánh');

  const flag = (name) => {
    const v = input[name];
    if (v === undefined || v === null) return input.modules === undefined || input.modules === null ? def[name] : false;
    if (typeof v !== 'boolean') throw httpError(400, `Trường ${name} phải là true/false`);
    return v;
  };
  return { preset, modules, branches, lock: flag('lock'), del: flag('del') };
}

/* Quyền hiệu lực của một tài khoản (document Mongoose hoặc object thuần) */
export function effectivePerms(user) {
  if (user && user.role === 'admin') return fullPerms();
  const raw = user && user.perms;
  if (!raw || typeof raw !== 'object') return viewOnlyPerms();
  try { return normalizePerms(typeof raw.toObject === 'function' ? raw.toObject() : raw); } catch { return viewOnlyPerms(); }
}
export const isFull = (p) => MODULE_KEYS.every((k) => p.modules[k] === 2) && p.branches === '*' && p.lock && p.del;

export const can = (p, module, level = 1) => (p.modules[module] || 0) >= level;
const folderStr = (f) => (typeof f === 'string' ? f : '');
/* Chi nhánh rỗng ("Chưa phân loại") chỉ tài khoản branches '*' được phép */
export function canBranch(p, folder) {
  if (p.branches === '*') return true;
  const f = folderStr(folder);
  return !!f && p.branches.includes(f);
}
export const anyLevel2 = (p, keys = MODULE_KEYS) => keys.some((k) => can(p, k, 2));

/* ---- Collection ---- */
export const COL_MODULE = { periods: 'kiemke', assets: 'assets', handovers: 'handover', explains: 'explain' };

/* Chi nhánh của một bản ghi collection. periods/assets: chuỗi (rỗng = chưa phân loại).
   handovers/explains: `folder` của bản ghi, hoặc folder của kỳ theo periodId; không xác định → null. */
export function branchOf(col, data, periodFolder) {
  const d = data && typeof data === 'object' ? data : {};
  if (col === 'periods' || col === 'assets') return folderStr(d.folder);
  const f = folderStr(d.folder);
  if (f) return f;
  if (d.periodId != null && periodFolder) {
    const pf = folderStr(periodFolder(String(d.periodId)));
    if (pf) return pf;
  }
  return null;
}
/* branch === null (không xác định) → ai có quyền phân hệ cũng thấy */
export const branchAllowed = (p, branch) => branch === null || canBranch(p, branch);

/* createdAt giảm dần (trong data), bằng nhau thì theo ord tăng dần */
export const byCreatedDesc = (a, b) => {
  const ca = Number(a.data && a.data.createdAt) || 0;
  const cb = Number(b.data && b.data.createdAt) || 0;
  return cb - ca || (a.ord || 0) - (b.ord || 0);
};

/* ---- kv ---- */
const KV_MODULE = { recon: 'recon', pay: 'pay', ana: 'ana', err: 'err', sg: 'sign' };
const KV_KIEMKE_ASSETS = new Set(['barcodes', 'boxref', 'track', 'ocrfix']);
const KV_CONFIG = new Set(['print', 'signers', 'keys']);

/* Khoá kv có được trả trong bootstrap không (folders còn phải lọc giá trị — xem filterFolders) */
export function kvReadable(p, key) {
  if (KV_MODULE[key]) return can(p, KV_MODULE[key], 1);
  if (key === 'hsd') return can(p, 'kiemke', 1) || can(p, 'hsd', 1);
  if (KV_KIEMKE_ASSETS.has(key)) return can(p, 'kiemke', 1) || can(p, 'assets', 1);
  return true; // counters, folders, print, signers, keys và các khoá khác
}
export function filterFolders(p, value) {
  if (p.branches === '*' || !Array.isArray(value)) return value;
  return value.filter((f) => typeof f === 'string' && p.branches.includes(f));
}

/* Kiểm tra ghi kv: trả null nếu được, hoặc lý do từ chối */
export function kvWriteDenied(p, key) {
  const need = (cond, msg) => (cond ? null : msg);
  if (KV_MODULE[key]) { const m = KV_MODULE[key]; return need(can(p, m, 2), `Không có quyền sửa phân hệ "${moduleLabel(m)}"`); }
  if (KV_KIEMKE_ASSETS.has(key)) return need(can(p, 'kiemke', 2) || can(p, 'assets', 2), 'Không có quyền sửa dữ liệu kiểm kê');
  if (key === 'hsd') return need(can(p, 'kiemke', 2), 'Không có quyền sửa dữ liệu hạn sử dụng');
  if (KV_CONFIG.has(key)) return need(can(p, 'config', 2), 'Không có quyền sửa cấu hình chung');
  if (key === 'folders') return need(can(p, 'config', 2) && p.branches === '*', 'Không có quyền sửa danh sách chi nhánh');
  if (key === 'counters') return need(anyLevel2(p, ['handover', 'explain', 'kiemke', 'assets']), 'Không có quyền cập nhật bộ đếm số văn bản');
  return need(anyLevel2(p), 'Không có quyền ghi dữ liệu');
}

/* ---- Blob ---- */
const BLOB_MODULE = { kk_photos: 'assets', kk_err_img: 'err', kk_sign: 'sign' };
/* level 1 = đọc, 2 = ghi/xoá. Store lạ chỉ quản trị viên. */
export function blobAllowed(p, store, level, isAdmin = false) {
  if (isAdmin) return true;
  const m = BLOB_MODULE[store];
  if (!m) return false;
  return can(p, m, level);
}
