import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from './config.js';
import { Meta, Setting, User } from './models.js';
import { presetsPayload } from './perms.js';
import { userDto, sanitizeProfile, validUsername, validPassword, httpError } from './userutil.js';

export const COOKIE = 'kk_session';
export const BCRYPT_COST = 10;
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---- JWT secret: env, hoặc sinh ngẫu nhiên và lưu vào meta để lần khởi động sau dùng lại ---- */
let secret = null;
export async function initAuth() {
  await User.init();
  if (config.jwtSecret) { secret = config.jwtSecret; return; }
  const m = await Meta.findOneAndUpdate(
    { _id: 'jwtSecret' },
    { $setOnInsert: { value: crypto.randomBytes(48).toString('hex') } },
    { upsert: true, new: true }
  ).lean();
  secret = m.value;
}

/* Tạo tài khoản quản trị đầu tiên nếu chưa có tài khoản nào */
export async function ensureAdmin() {
  if (await User.exists({})) return;
  const username = config.adminUsername;
  if (!validUsername(username) || !validPassword(config.adminPassword)) {
    console.error('[auth] ADMIN_USERNAME/ADMIN_PASSWORD không hợp lệ (tên 3–32 ký tự [a-z0-9._-], mật khẩu ≥ 8 ký tự); chưa tạo tài khoản quản trị');
    return;
  }
  const s = await Setting.findById('profile').lean();
  let profile;
  try { profile = sanitizeProfile(s && s.value); } catch { profile = sanitizeProfile(null); }
  try {
    await User.create({ username, hash: await bcrypt.hash(config.adminPassword, BCRYPT_COST), role: 'admin', profile });
    console.log(`[auth] Đã tạo tài khoản quản trị "${username}"`);
  } catch (e) { if (e.code !== 11000) throw e; }
}

/* ---- Cookie ---- */
function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k || k in out) continue;
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* bỏ qua */ }
  }
  return out;
}
const cookieOpts = (req) => ({ httpOnly: true, sameSite: 'lax', path: '/', secure: !!req.secure });
export function issueSession(req, res, user) {
  const token = jwt.sign({ uid: String(user._id), pv: user.pv || 0 }, secret, { algorithm: 'HS256', expiresIn: config.sessionDays * 86400 });
  res.cookie(COOKIE, token, { ...cookieOpts(req), maxAge: config.sessionDays * 86400 * 1000 });
}
const clearSession = (req, res) => res.clearCookie(COOKIE, cookieOpts(req));

/* Nạp user theo token trong cookie; trả null nếu không hợp lệ */
async function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token || !secret) return null;
  let p;
  try { p = jwt.verify(token, secret, { algorithms: ['HS256'] }); } catch { return null; }
  if (!p || typeof p.uid !== 'string' || !mongoose.isValidObjectId(p.uid)) return null;
  const u = await User.findById(p.uid);
  if (!u || u.active === false || (u.pv || 0) !== p.pv) return null;
  return u;
}

export const requireAuth = wrap(async (req, res, next) => {
  const u = await userFromRequest(req);
  if (!u) return res.status(401).json({ error: 'Chưa đăng nhập' });
  req.user = u;
  next();
});
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Cần quyền quản trị' });
  next();
}

/* Cổng chung cho /api: mọi đường dẫn đều cần đăng nhập, trừ /health và đăng nhập/đăng xuất */
export function apiGate(req, res, next) {
  if (req.path === '/health') return next();
  if (req.method === 'POST' && (req.path === '/auth/login' || req.path === '/auth/logout')) return next();
  return requireAuth(req, res, next);
}

/* Chống CSRF tối thiểu: ghi dữ liệu phải là JSON */
export function jsonOnly(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const hasBody = Number(req.headers['content-length']) > 0 || req.headers['transfer-encoding'];
    if (hasBody && !req.is('application/json')) return res.status(415).json({ error: 'Content-Type phải là application/json' });
  }
  next();
}

/* ---- Giới hạn đăng nhập sai: 8 lần / 10 phút theo cặp IP + username (trong bộ nhớ) ---- */
const MAX_FAILS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const fails = new Map();
const failKey = (req, username) => `${req.ip}|${username}`;
function blocked(key) {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { fails.delete(key); return false; }
  return f.n >= MAX_FAILS;
}
function addFail(key) {
  const f = fails.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) fails.set(key, { n: 1, first: Date.now() });
  else f.n++;
}
setInterval(() => { const t = Date.now(); for (const [k, f] of fails) if (t - f.first > WINDOW_MS) fails.delete(k); }, 60_000).unref();

const DUMMY_HASH = bcrypt.hashSync('khong-ton-tai', BCRYPT_COST);

/* ---- /api/auth ---- */
export const authRouter = Router();

authRouter.post('/login', wrap(async (req, res) => {
  const b = req.body || {};
  const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  const key = failKey(req, username);
  if (blocked(key)) return res.status(429).json({ error: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 10 phút' });
  const u = username ? await User.findOne({ username }) : null;
  const ok = await bcrypt.compare(password, u ? u.hash : DUMMY_HASH);
  if (!u || !ok) { addFail(key); return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }); }
  if (u.active === false) return res.status(403).json({ error: 'Tài khoản đã bị khoá' });
  fails.delete(key);
  u.lastLoginAt = new Date();
  await u.save();
  issueSession(req, res, u);
  res.json({ user: userDto(u) });
}));

authRouter.post('/logout', (req, res) => { clearSession(req, res); res.json({ ok: true }); });

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: userDto(req.user) }));

/* Bảng phân hệ + vai trò mẫu: nguồn duy nhất cho giao diện */
authRouter.get('/presets', requireAuth, (req, res) => res.json(presetsPayload()));

authRouter.put('/profile', requireAuth, wrap(async (req, res) => {
  req.user.profile = sanitizeProfile(req.body && req.body.profile);
  await req.user.save();
  res.json({ user: userDto(req.user) });
}));

authRouter.put('/password', requireAuth, wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (typeof current !== 'string' || !(await bcrypt.compare(current, req.user.hash))) throw httpError(400, 'Mật khẩu hiện tại không đúng');
  if (!validPassword(next)) throw httpError(400, 'Mật khẩu mới phải có ít nhất 8 ký tự');
  req.user.hash = await bcrypt.hash(next, BCRYPT_COST);
  req.user.pv = (req.user.pv || 0) + 1;
  await req.user.save();
  issueSession(req, res, req.user);
  res.json({ ok: true });
}));
