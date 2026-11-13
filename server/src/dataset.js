import crypto from 'node:crypto';
import { DOC_COLS, Setting, AuditLog, Meta } from './models.js';
import { putBlob } from './blobs.js';
import { COL_MODULE, byCreatedDesc, can, branchOf, branchAllowed, kvReadable, filterFolders } from './perms.js';
import { guardOps } from './syncguard.js';

/* Các khoá không lưu vào settings: mảng có collection riêng, nhật ký, và metadata của file sao lưu */
const SKIP_KV = new Set([...Object.keys(DOC_COLS), 'audit', '__sync', '__photos']);

/* Khoá kv gắn với từng tài khoản / thiết bị, không phải dữ liệu dùng chung: không trả cho client, bỏ qua khi client ghi.
   (Bản ghi settings `profile` do seed nạp vẫn nằm trong CSDL để làm hồ sơ cho tài khoản quản trị đầu tiên.) */
export const PER_USER_KV = new Set(['profile', 'lastBackup', 'backupSnooze']);

/* Khoá tuần tự trong tiến trình: applyOps, importDataset và cặp (getRev + exportDataset) chạy lần lượt, không xen kẽ. */
let chain = Promise.resolve();
export function withLock(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});
  return run;
}
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const AUDIT_MAX = 3000;
const AUDIT_KEEP = 2500;

export async function getRev() {
  const m = await Meta.findById('rev').lean();
  return m ? m.n : 0;
}
async function bumpRev() {
  const m = await Meta.findByIdAndUpdate('rev', { $inc: { n: 1 } }, { upsert: true, new: true }).lean();
  return m.n;
}

function splitDoc(col, doc) {
  if (!DOC_COLS[col].items) return { meta: doc, items: null };
  const { items, ...meta } = doc;
  return { meta, items: Array.isArray(items) ? items : [] };
}
const itemKey = (pid, id) => `${pid}:${id}`;

export async function isEmpty() {
  const [p, s] = await Promise.all([DOC_COLS.periods.model.estimatedDocumentCount(), Setting.estimatedDocumentCount()]);
  return p === 0 && s === 0;
}

/* Dựng lại đúng cấu trúc `db` của app gốc từ các collection. Bản ghi "ma" (data không phải object / thiếu id) bị bỏ qua và dọn khỏi CSDL.
   `p` (quyền hiệu lực) = null → đủ dữ liệu (quản trị viên); ngược lại lọc theo quyền: phân hệ mức 0 → rỗng, ngoài chi nhánh → bỏ,
   kv theo kvReadable, audit → rỗng. Collection sắp theo data.createdAt giảm dần rồi ord. */
async function exportRaw(p = null) {
  const db = {};
  const settings = await Setting.find().lean();
  for (const s of settings) {
    if (PER_USER_KV.has(s._id)) continue;
    if (p && !kvReadable(p, s._id)) continue;
    db[s._id] = p && s._id === 'folders' ? filterFolders(p, s.value) : s.value;
  }

  const docsBy = {};
  for (const [col, cfg] of Object.entries(DOC_COLS)) {
    const allDocs = await cfg.model.find().sort({ ord: 1 }).lean();
    const bad = allDocs.filter((d) => !isObj(d.data) || d.data.id == null);
    if (bad.length) await cfg.model.deleteMany({ _id: { $in: bad.map((d) => d._id) } });
    docsBy[col] = allDocs.filter((d) => isObj(d.data) && d.data.id != null);
  }
  /* folder của kỳ theo id (periods rồi assets), để xác định chi nhánh của biên bản / phiếu giải trình */
  let periodFolder = null;
  if (p) {
    const fm = new Map();
    for (const col of ['periods', 'assets']) for (const d of docsBy[col]) if (!fm.has(d._id)) fm.set(d._id, d.data.folder);
    periodFolder = (pid) => fm.get(pid);
  }

  for (const [col, cfg] of Object.entries(DOC_COLS)) {
    let docs = docsBy[col];
    const total = docs.length;
    if (p) docs = can(p, COL_MODULE[col], 1) ? docs.filter((d) => branchAllowed(p, branchOf(col, d.data, periodFolder))) : [];
    docs = docs.slice().sort(byCreatedDesc);
    let byPid = null;
    if (cfg.items) {
      byPid = new Map();
      const q = docs.length < total ? { pid: { $in: docs.map((d) => d._id) } } : {};
      const items = docs.length || !p ? await cfg.items.find(q).sort({ pid: 1, idx: 1 }).lean() : [];
      const badIt = items.filter((it) => !isObj(it.data) || it.data.id == null);
      if (badIt.length) await cfg.items.deleteMany({ _id: { $in: badIt.map((d) => d._id) } });
      for (const it of items) {
        if (!isObj(it.data) || it.data.id == null) continue;
        if (!byPid.has(it.pid)) byPid.set(it.pid, []);
        byPid.get(it.pid).push(it.data);
      }
    }
    db[col] = docs.map((d) => (byPid ? { ...d.data, items: byPid.get(d._id) || [] } : d.data));
  }

  if (p) db.audit = [];
  else {
    const logs = await AuditLog.find().sort({ seq: 1 }).lean();
    db.audit = logs.map((l) => l.data);
  }
  return db;
}
export function exportDataset() { return withLock(() => exportRaw(null)); }
/* rev và dữ liệu nhất quán với nhau (không có lô ghi nào chen giữa); lọc theo quyền `p` ngay trong khoá */
export function snapshot(p = null) { return withLock(async () => { const rev = await getRev(); return { rev, db: await exportRaw(p) }; }); }

/* ---- Nhật ký audit idempotent ---- */
const auditKey = (data) => (data && typeof data === 'object' && typeof data.k === 'string' && data.k ? data.k : crypto.createHash('sha1').update(JSON.stringify(data)).digest('hex'));
async function auditCounter() {
  const m = await Meta.findById('auditSeq').lean();
  if (m) return;
  const last = await AuditLog.findOne().sort({ seq: -1 }).lean();
  try { await Meta.updateOne({ _id: 'auditSeq' }, { $setOnInsert: { n: last ? last.seq : 0 } }, { upsert: true }); } catch (e) { if (e.code !== 11000) throw e; }
}
async function auditAdd(list) {
  const seen = new Set();
  const rows = [];
  for (const data of list) {
    if (data === undefined || data === null) continue;
    const key = auditKey(data);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, data });
  }
  if (!rows.length) return 0;
  await auditCounter();
  const m = await Meta.findByIdAndUpdate('auditSeq', { $inc: { n: rows.length } }, { new: true }).lean();
  const first = m.n - rows.length + 1;
  rows.forEach((r, i) => { r.seq = first + i; });
  let inserted = rows.length;
  try { await AuditLog.insertMany(rows, { ordered: false }); }
  catch (e) {
    const errs = e.writeErrors || (e.code === 11000 ? [e] : null);
    if (!errs || !errs.every((x) => (x.code || (x.err && x.err.code)) === 11000)) throw e;
    inserted -= errs.length;
  }
  const total = await AuditLog.estimatedDocumentCount();
  if (total > AUDIT_MAX) {
    const cut = await AuditLog.find({}, { seq: 1 }).sort({ seq: -1 }).skip(AUDIT_KEEP - 1).limit(1).lean();
    if (cut.length) await AuditLog.deleteMany({ seq: { $lt: cut[0].seq } });
  }
  return inserted;
}

/* Nạp một file sao lưu của app gốc: chỉ mode 'replace' (xoá sạch rồi nạp lại).
   Dựng và kiểm tra xong toàn bộ thao tác TRƯỚC khi xoá. */
export function importDataset(src, { mode = 'replace' } = {}) {
  return withLock(async () => {
    if (mode !== 'replace') throw Object.assign(new Error('Chỉ hỗ trợ mode=replace'), { status: 400 });
    if (!src || typeof src !== 'object' || !Array.isArray(src.periods)) {
      throw Object.assign(new Error('Không phải file dữ liệu của app (thiếu mảng periods)'), { status: 400 });
    }
    const stats = { settings: 0, audit: 0, photos: 0, dupItems: 0 };

    const kvOps = [];
    for (const [k, v] of Object.entries(src)) {
      if (SKIP_KV.has(k) || v === undefined) continue;
      kvOps.push({ replaceOne: { filter: { _id: k }, replacement: { _id: k, value: v }, upsert: true } });
    }
    stats.settings = kvOps.length;

    const colOps = [];
    for (const [col, cfg] of Object.entries(DOC_COLS)) {
      const list = Array.isArray(src[col]) ? src[col].filter((x) => isObj(x) && x.id != null) : [];
      stats[col] = list.length;
      const docOps = [];
      const itemOps = [];
      list.forEach((doc, ord) => {
        const id = String(doc.id);
        const { meta, items } = splitDoc(col, doc);
        docOps.push({ replaceOne: { filter: { _id: id }, replacement: { _id: id, ord, data: meta }, upsert: true } });
        if (items) {
          const seen = new Set();
          items.forEach((it, idx) => {
            if (!isObj(it) || it.id == null) return;
            const iid = String(it.id);
            if (seen.has(iid)) stats.dupItems++;
            seen.add(iid);
            const _id = itemKey(id, iid);
            itemOps.push({ replaceOne: { filter: { _id }, replacement: { _id, pid: id, iid, idx, data: it }, upsert: true } });
          });
        }
      });
      if (cfg.items) stats[col + 'Items'] = itemOps.length;
      colOps.push({ cfg, docOps, itemOps });
    }

    const auditList = Array.isArray(src.audit) ? src.audit.filter((x) => x !== undefined && x !== null) : [];
    const photos = src.__photos && typeof src.__photos === 'object' ? Object.entries(src.__photos) : [];

    try {
      await Promise.all([
        Setting.deleteMany({}),
        AuditLog.deleteMany({}),
        Meta.deleteOne({ _id: 'auditSeq' }),
        ...Object.values(DOC_COLS).flatMap((c) => [c.model.deleteMany({}), c.items ? c.items.deleteMany({}) : null].filter(Boolean)),
      ]);
      if (kvOps.length) await Setting.bulkWrite(kvOps, { ordered: false });
      for (const { cfg, docOps, itemOps } of colOps) {
        if (docOps.length) await cfg.model.bulkWrite(docOps, { ordered: false });
        for (let i = 0; i < itemOps.length; i += 500) await cfg.items.bulkWrite(itemOps.slice(i, i + 500), { ordered: false });
      }
      if (auditList.length) stats.audit = await auditAdd(auditList);
      /* File sao lưu "kèm ảnh" của app gốc để ảnh ở __photos (khoá → dataURL) */
      for (const [key, value] of photos) {
        if (value === undefined || value === null) continue;
        await putBlob('kk_photos', key, value);
        stats.photos++;
      }
    } finally {
      stats.rev = await bumpRev();
    }
    return stats;
  });
}

/* Áp một lô thay đổi do client gửi lên (client tự so khác biệt rồi chỉ gửi phần đã đổi). Trả rev mới. */
export function applyOps(ops, p = null) {
  if (!Array.isArray(ops)) return Promise.reject(Object.assign(new Error('ops phải là mảng'), { status: 400 }));
  return withLock(async () => {
    /* p = null: quản trị viên, không kiểm tra. Ngược lại kiểm tra từng op và chỉ áp các op được phép. */
    if (!p) return { rev: await applyOpsLocked(ops), written: true, rejected: [] };
    const ignorable = (op) => typeof op.k === 'string' && (SKIP_KV.has(op.k) || PER_USER_KV.has(op.k));
    const g = await guardOps(ops, p, ignorable);
    if (!g.ops.length && g.rejected.length) return { rev: await getRev(), written: false, rejected: g.rejected };
    return { rev: await applyOpsLocked(g.ops), written: true, rejected: g.rejected };
  });
}
async function applyOpsLocked(ops) {
  const bulk = { kv: [] };
  let countersVal = null;
  const audit = [];
  const byModel = new Map();
  const push = (model, op) => {
    if (!byModel.has(model)) byModel.set(model, []);
    byModel.get(model).push(op);
  };

  for (const op of ops) {
    if (!op || typeof op !== 'object') continue;
    const cfg = op.c ? DOC_COLS[op.c] : null;
    switch (op.t) {
      case 'kv':
        if (typeof op.k !== 'string' || SKIP_KV.has(op.k) || PER_USER_KV.has(op.k)) break;
        /* Bộ đếm số văn bản: gộp theo từng khoá, lấy giá trị lớn nhất, để hai máy không ghi đè lần tăng của nhau */
        if (op.k === 'counters' && op.v && typeof op.v === 'object' && !Array.isArray(op.v)) { countersVal = op.v; break; }
        bulk.kv.push({ replaceOne: { filter: { _id: op.k }, replacement: { _id: op.k, value: op.v }, upsert: true } });
        break;
      case 'kvdel':
        if (typeof op.k === 'string' && !PER_USER_KV.has(op.k)) bulk.kv.push({ deleteOne: { filter: { _id: op.k } } });
        break;
      case 'doc': {
        if (!cfg || op.id == null) break;
        const id = String(op.id);
        const ord = Number(op.ord) || 0;
        if (op.d !== undefined) {
          if (!isObj(op.d)) break;
          push(cfg.model, { replaceOne: { filter: { _id: id }, replacement: { _id: id, ord, data: op.d }, upsert: true } });
        } else push(cfg.model, { updateOne: { filter: { _id: id }, update: { $set: { ord } }, upsert: false } });
        break;
      }
      case 'docdel': {
        if (!cfg || op.id == null) break;
        const id = String(op.id);
        push(cfg.model, { deleteOne: { filter: { _id: id } } });
        if (cfg.items) push(cfg.items, { deleteMany: { filter: { pid: id } } });
        break;
      }
      case 'item': {
        if (!cfg || !cfg.items || op.pid == null || op.id == null) break;
        const pid = String(op.pid);
        const iid = String(op.id);
        const _id = itemKey(pid, iid);
        const idx = Number(op.idx) || 0;
        if (op.d !== undefined) {
          if (!isObj(op.d)) break;
          push(cfg.items, { replaceOne: { filter: { _id }, replacement: { _id, pid, iid, idx, data: op.d }, upsert: true } });
        } else push(cfg.items, { updateOne: { filter: { _id }, update: { $set: { idx } }, upsert: false } });
        break;
      }
      case 'itemdel':
        if (!cfg || !cfg.items || op.pid == null || op.id == null) break;
        push(cfg.items, { deleteOne: { filter: { _id: itemKey(String(op.pid), String(op.id)) } } });
        break;
      case 'audit':
        /* `replace` không còn: coi như `add` (idempotent theo khoá) */
        if (Array.isArray(op.add)) audit.push(...op.add);
        else if (Array.isArray(op.replace)) audit.push(...op.replace);
        break;
      default:
        break;
    }
  }

  let rev;
  try {
    if (countersVal) {
      const cur = await Setting.findById('counters').lean();
      const merged = cur && cur.value && typeof cur.value === 'object' && !Array.isArray(cur.value) ? { ...cur.value } : {};
      for (const [k, v] of Object.entries(countersVal)) merged[k] = Math.max(Number(merged[k]) || 0, Number(v) || 0);
      bulk.kv.push({ replaceOne: { filter: { _id: 'counters' }, replacement: { _id: 'counters', value: merged }, upsert: true } });
    }
    if (bulk.kv.length) await Setting.bulkWrite(bulk.kv, { ordered: true });
    for (const [model, list] of byModel) {
      for (let i = 0; i < list.length; i += 500) await model.bulkWrite(list.slice(i, i + 500), { ordered: true });
    }
    if (audit.length) await auditAdd(audit);
  } finally {
    /* đã ghi dở thì vẫn tăng rev để máy khác thấy */
    rev = await bumpRev();
  }
  return rev;
}
