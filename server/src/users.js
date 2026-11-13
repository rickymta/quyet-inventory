import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from './models.js';
import { requireAdmin, BCRYPT_COST } from './auth.js';
import { withLock } from './dataset.js';
import { normalizePerms } from './perms.js';
import { userDto, sanitizeProfile, validUsername, validPassword, httpError } from './userutil.js';

const r = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
r.use(requireAdmin);

const findTarget = async (id) => {
  const u = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!u) throw httpError(404, 'Không tìm thấy tài khoản');
  return u;
};
/* Còn quản trị viên đang hoạt động nào khác `u` không? */
const otherActiveAdmins = (u) => User.countDocuments({ role: 'admin', active: { $ne: false }, _id: { $ne: u._id } });
const isActiveAdmin = (u) => u.role === 'admin' && u.active !== false;

r.get('/', wrap(async (req, res) => {
  const list = await User.find().sort({ username: 1 });
  res.json(list.map(userDto));
}));

r.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
  if (!validUsername(username)) throw httpError(400, 'Tên đăng nhập gồm 3–32 ký tự a-z, 0-9, dấu chấm, gạch dưới, gạch ngang');
  if (!validPassword(b.password)) throw httpError(400, 'Mật khẩu phải có ít nhất 8 ký tự');
  const role = b.role === undefined ? 'user' : b.role;
  if (role !== 'admin' && role !== 'user') throw httpError(400, 'Vai trò không hợp lệ');
  const profile = sanitizeProfile(b.profile);
  const perms = role !== 'admin' && b.perms !== undefined && b.perms !== null ? normalizePerms(b.perms) : undefined;
  const hash = await bcrypt.hash(b.password, BCRYPT_COST);
  try {
    const u = await User.create({ username, hash, role, profile, perms });
    res.status(201).json({ user: userDto(u) });
  } catch (e) {
    if (e.code === 11000) throw httpError(409, 'Tên đăng nhập đã tồn tại');
    throw e;
  }
}));

r.put('/:id', wrap(async (req, res) => {
  const b = req.body || {};
  if (b.role !== undefined && b.role !== 'admin' && b.role !== 'user') throw httpError(400, 'Vai trò không hợp lệ');
  if (b.active !== undefined && typeof b.active !== 'boolean') throw httpError(400, 'Trường active phải là true/false');
  if (b.password !== undefined && !validPassword(b.password)) throw httpError(400, 'Mật khẩu phải có ít nhất 8 ký tự');
  const profile = b.profile !== undefined ? sanitizeProfile(b.profile) : undefined;
  const perms = b.perms !== undefined && b.perms !== null ? normalizePerms(b.perms) : undefined;
  const hash = b.password !== undefined ? await bcrypt.hash(b.password, BCRYPT_COST) : undefined;
  const user = await withLock(async () => {
    const u = await findTarget(req.params.id);
    const role = b.role !== undefined ? b.role : u.role;
    const active = b.active !== undefined ? b.active : u.active !== false;
    if (b.active === false && String(u._id) === String(req.user._id)) throw httpError(400, 'Không thể tự khoá tài khoản của chính mình');
    if (isActiveAdmin(u) && (role !== 'admin' || !active) && (await otherActiveAdmins(u)) === 0) {
      throw httpError(400, 'Phải còn ít nhất một quản trị viên đang hoạt động');
    }
    u.role = role;
    u.active = active;
    if (profile) u.profile = profile;
    if (perms && role !== 'admin') { u.perms = perms; u.markModified('perms'); }
    if (hash) { u.hash = hash; u.pv = (u.pv || 0) + 1; }
    await u.save();
    return u;
  });
  res.json({ user: userDto(user) });
}));

r.delete('/:id', wrap(async (req, res) => {
  await withLock(async () => {
    const u = await findTarget(req.params.id);
    if (String(u._id) === String(req.user._id)) throw httpError(400, 'Không thể xoá tài khoản của chính mình');
    if (isActiveAdmin(u) && (await otherActiveAdmins(u)) === 0) throw httpError(400, 'Phải còn ít nhất một quản trị viên đang hoạt động');
    await u.deleteOne();
  });
  res.json({ ok: true });
}));

export default r;
