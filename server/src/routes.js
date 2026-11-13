import { Router } from 'express';
import mongoose from 'mongoose';
import { DOC_COLS, Blob, Setting } from './models.js';
import { applyOps, getRev, snapshot, PER_USER_KV } from './dataset.js';
import { delBlob, getBlob, putBlob } from './blobs.js';
import { effectivePerms, can, COL_MODULE, branchOf, branchAllowed, byCreatedDesc, blobAllowed, moduleLabel, kvReadable, filterFolders } from './perms.js';

const isAdmin = (req) => req.user && req.user.role === 'admin';
const permsOf = (req) => effectivePerms(req.user);
const forbid = (msg = 'Bạn không có quyền thực hiện thao tác này') => Object.assign(new Error(msg), { status: 403 });
/* Chặn nếu không đủ quyền với store blob */
const needBlob = (level) => (req, res, next) => {
  if (blobAllowed(permsOf(req), req.params.store, level, isAdmin(req))) return next();
  res.status(403).json({ error: 'Bạn không có quyền với kho dữ liệu này' });
};
/* Hàm tra folder của kỳ theo id (periods rồi assets) — dùng cho biên bản / phiếu giải trình */
async function periodFolderLookup() {
  const [a, b] = await Promise.all([DOC_COLS.periods.model.find({}, { 'data.folder': 1 }).lean(), DOC_COLS.assets.model.find({}, { 'data.folder': 1 }).lean()]);
  const m = new Map();
  for (const d of [...a, ...b]) if (!m.has(d._id)) m.set(d._id, d.data && d.data.folder);
  return (pid) => m.get(pid);
}

const r = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

r.get('/health', (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1, db: mongoose.connection.readyState, time: Date.now() });
});

/* Số phiên bản dữ liệu: tăng sau mỗi lần ghi, client dùng để biết có thay đổi từ máy khác */
r.get('/rev', wrap(async (req, res) => res.json({ rev: await getRev() })));

/* Toàn bộ dữ liệu theo đúng cấu trúc `db` của app gốc */
r.get('/bootstrap', wrap(async (req, res) => {
  const { rev, db } = await snapshot(isAdmin(req) ? null : permsOf(req));
  res.set('Cache-Control', 'no-store').json({ rev, db });
}));

/* Lô thay đổi (kv / doc / item / audit) do client gửi lên */
r.post('/sync', wrap(async (req, res) => {
  const out = await applyOps(req.body && req.body.ops, isAdmin(req) ? null : permsOf(req));
  /* Không ghi gì (mọi op bị từ chối) thì rev không đổi: prev = rev */
  res.json({ ok: true, rev: out.rev, prev: out.written ? out.rev - 1 : out.rev, rejected: out.rejected });
}));

/* ---- REST chỉ đọc cho từng danh sách (tiện tra cứu / tích hợp) ---- */
for (const [col, cfg] of Object.entries(DOC_COLS)) {
  const mod = COL_MODULE[col];
  r.get(`/${col}`, wrap(async (req, res) => {
    const p = isAdmin(req) ? null : permsOf(req);
    if (p && !can(p, mod, 1)) throw forbid(`Bạn không có quyền xem phân hệ "${moduleLabel(mod)}"`);
    let docs = await cfg.model.find().lean();
    if (p) {
      const pf = await periodFolderLookup();
      docs = docs.filter((d) => branchAllowed(p, branchOf(col, d.data, pf)));
    }
    docs.sort(byCreatedDesc);
    res.json(docs.map((d) => ({ ...d.data, updatedAt: d.updatedAt })));
  }));
  r.get(`/${col}/:id`, wrap(async (req, res) => {
    const p = isAdmin(req) ? null : permsOf(req);
    if (p && !can(p, mod, 1)) throw forbid(`Bạn không có quyền xem phân hệ "${moduleLabel(mod)}"`);
    const d = await cfg.model.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'Không tìm thấy' });
    if (p && !branchAllowed(p, branchOf(col, d.data, await periodFolderLookup()))) return res.status(404).json({ error: 'Không tìm thấy' });
    const out = { ...d.data };
    if (cfg.items) out.items = (await cfg.items.find({ pid: d._id }).sort({ idx: 1 }).lean()).map((i) => i.data);
    res.json(out);
  }));
}
r.get('/settings/:key', wrap(async (req, res) => {
  if (PER_USER_KV.has(req.params.key)) return res.status(404).json({ error: 'Không tìm thấy' });
  const s = await Setting.findById(req.params.key).lean();
  if (!s) return res.status(404).json({ error: 'Không tìm thấy' });
  if (!isAdmin(req)) {
    const p = permsOf(req);
    if (!kvReadable(p, req.params.key)) throw forbid('Bạn không có quyền xem dữ liệu này');
    if (req.params.key === 'folders') return res.json(filterFolders(p, s.value));
  }
  res.json(s.value);
}));

/* ---- Kho ảnh / tệp lớn (thay IndexedDB của app gốc) ---- */
r.get('/blobs/:store', needBlob(1), wrap(async (req, res) => {
  const list = await Blob.find({ store: req.params.store, part: { $ne: true } }, { key: 1, size: 1, updatedAt: 1 }).lean();
  res.json(list.map((b) => ({ key: b.key, size: b.size || 0, updatedAt: b.updatedAt })));
}));
r.get('/blobs/:store/:key', needBlob(1), wrap(async (req, res) => {
  const b = await getBlob(req.params.store, req.params.key);
  if (!b) return res.status(404).json({ error: 'Không tìm thấy' });
  res.set('Cache-Control', 'no-store').json({ key: b.key, value: b.value });
}));
/* Trả thẳng nội dung nhị phân nếu giá trị là dataURL (dùng làm src ảnh / tải tệp) */
r.get('/blobs/:store/:key/raw', needBlob(1), wrap(async (req, res) => {
  const b = await getBlob(req.params.store, req.params.key);
  const m = b && typeof b.value === 'string' ? /^data:([^;,]+)?((?:;[^;,]+)*?)(;base64)?,/.exec(b.value.slice(0, 200)) : null;
  if (!m) return res.status(404).json({ error: 'Không tìm thấy' });
  const body = b.value.slice(m[0].length);
  res.set('Content-Type', m[1] || 'application/octet-stream').set('Cache-Control', 'private, max-age=60')
    .send(m[3] ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf8'));
}));
r.put('/blobs/:store/:key', needBlob(2), wrap(async (req, res) => {
  const { store, key } = req.params;
  const value = req.body ? req.body.value : undefined;
  if (value === undefined) return res.status(400).json({ error: 'Thiếu value' });
  res.json({ ok: true, size: await putBlob(store, key, value) });
}));
r.delete('/blobs/:store/:key', needBlob(2), wrap(async (req, res) => {
  await delBlob(req.params.store, req.params.key);
  res.json({ ok: true });
}));
r.delete('/blobs/:store', needBlob(2), wrap(async (req, res) => {
  const out = await Blob.deleteMany({ store: req.params.store });
  res.json({ ok: true, deleted: out.deletedCount });
}));

r.use((req, res) => res.status(404).json({ error: 'API không tồn tại' }));

export default r;
