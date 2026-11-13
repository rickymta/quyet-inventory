import { effectivePerms } from './perms.js';

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const validUsername = (s) => typeof s === 'string' && /^[a-z0-9._-]{3,32}$/.test(s);
export const validPassword = (s) => typeof s === 'string' && s.length >= 8 && s.length <= 200;

export function userDto(u) {
  const p = (u.profile && typeof u.profile.toObject === 'function' ? u.profile.toObject() : u.profile) || {};
  return {
    id: String(u._id),
    username: u.username,
    role: u.role,
    active: u.active !== false,
    perms: effectivePerms(u),
    profile: { ten: p.ten || '', chucVu: p.chucVu || '', chiNhanh: p.chiNhanh || '', ma: p.ma || '', maManual: !!p.maManual },
    createdAt: u.createdAt || null,
    lastLoginAt: u.lastLoginAt || null,
  };
}

/* Chỉ nhận 5 trường; chuỗi ≤ 120 ký tự; thiếu → mặc định. null/undefined → hồ sơ rỗng. */
export function sanitizeProfile(p) {
  if (p === undefined || p === null) p = {};
  if (typeof p !== 'object' || Array.isArray(p)) throw httpError(400, 'Hồ sơ không hợp lệ');
  const out = {};
  for (const k of ['ten', 'chucVu', 'chiNhanh', 'ma']) {
    const v = p[k];
    if (v === undefined || v === null) { out[k] = ''; continue; }
    if (typeof v !== 'string') throw httpError(400, `Trường hồ sơ "${k}" phải là chuỗi`);
    const t = v.trim();
    if (t.length > 120) throw httpError(400, `Trường hồ sơ "${k}" dài tối đa 120 ký tự`);
    out[k] = t;
  }
  const m = p.maManual;
  if (m !== undefined && m !== null && typeof m !== 'boolean') throw httpError(400, 'Trường hồ sơ "maManual" phải là true/false');
  out.maManual = !!m;
  return out;
}
