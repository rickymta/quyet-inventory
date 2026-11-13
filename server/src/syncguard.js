import { DOC_COLS } from './models.js';
import { COL_MODULE, can, canBranch, branchOf, branchAllowed, kvWriteDenied, moduleLabel } from './perms.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v) => (typeof v === 'string' ? v : '');
/* So sánh sâu, không phụ thuộc thứ tự khoá */
const stable = (v) => (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : isObj(v) ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',')}}` : JSON.stringify(v === undefined ? null : v));
const LOCK_FIELDS = new Set(['locked', 'lockLog', 'items']);
const stripLock = (d) => stable(Object.fromEntries(Object.entries(d || {}).filter(([k]) => !LOCK_FIELDS.has(k))));
const snap = (d) => ({ exists: true, rest: isObj(d) ? stripLock(d) : '', hasFull: isObj(d), folder: str(d && d.folder), locked: !!(d && d.locked), periodId: d && d.periodId != null ? String(d.periodId) : null, data: { folder: d && d.folder, periodId: d && d.periodId } });

/* Kiểm tra từng op của một lô /api/sync theo quyền `p` (tài khoản không phải quản trị viên).
   Nạp trạng thái các bản ghi liên quan theo lô (không truy vấn từng op).
   Trả { ops: các op được phép (giữ thứ tự gốc), rejected: [{ i, reason }] }. `ignorable(op)` = op mà applyOps vốn bỏ qua (kv riêng từng người). */
export async function guardOps(ops, p, ignorable = () => false) {
  const need = { periods: new Set(), assets: new Set(), handovers: new Set(), explains: new Set() };
  const periodRefs = new Set();
  const colOf = (op) => (op && typeof op.c === 'string' && Object.hasOwn(DOC_COLS, op.c) ? op.c : null);

  for (const op of ops) {
    if (!isObj(op)) continue;
    const c = colOf(op);
    if (!c) continue;
    if ((op.t === 'doc' || op.t === 'docdel') && op.id != null) {
      need[c].add(String(op.id));
      if (op.t === 'doc' && isObj(op.d) && op.d.periodId != null && (c === 'handovers' || c === 'explains')) periodRefs.add(String(op.d.periodId));
    } else if ((op.t === 'item' || op.t === 'itemdel') && DOC_COLS[c].items && op.pid != null) need[c].add(String(op.pid));
  }

  /* rec[col]: id → trạng thái hiện có (và cập nhật theo các op được phép trong lô) */
  const rec = { periods: new Map(), assets: new Map(), handovers: new Map(), explains: new Map() };
  const load = async (col, ids) => {
    const want = [...ids].filter((id) => !rec[col].has(id));
    if (!want.length) return;
    const docs = await DOC_COLS[col].model.find({ _id: { $in: want } }, { data: 1 }).lean();
    const got = new Set();
    for (const d of docs) { rec[col].set(d._id, snap(d.data)); got.add(d._id); }
    for (const id of want) if (!got.has(id)) rec[col].set(id, { exists: false, folder: '', locked: false, periodId: null, data: {} });
  };
  await Promise.all([
    load('periods', new Set([...need.periods, ...periodRefs])),
    load('assets', new Set([...need.assets, ...periodRefs])),
    load('handovers', need.handovers),
    load('explains', need.explains),
  ]);
  /* kỳ mà các biên bản/phiếu đang lưu trỏ tới */
  const more = new Set();
  for (const col of ['handovers', 'explains']) for (const r of rec[col].values()) if (r.periodId) more.add(r.periodId);
  if (more.size) await Promise.all([load('periods', more), load('assets', more)]);

  const periodFolder = (pid) => {
    const a = rec.periods.get(pid);
    if (a && a.exists) return a.folder;
    const b = rec.assets.get(pid);
    if (b && b.exists) return b.folder;
    return undefined;
  };
  const recBranch = (col, r) => branchOf(col, r.data, periodFolder);

  const denied = new Map(); // i → reason
  const noBranch = (b) => (b ? `Không có quyền với chi nhánh "${b}"` : 'Chỉ tài khoản có quyền mọi chi nhánh mới thao tác được với dữ liệu chưa phân loại');

  const checkDoc = (c, op) => {
    const mod = COL_MODULE[c];
    const id = String(op.id);
    const old = rec[c].get(id) || { exists: false, folder: '', locked: false, periodId: null, data: {} };
    const d = op.d;
    if (c === 'periods' || c === 'assets') {
      const nf = str(d.folder);
      /* Chỉ khoá / mở khoá (d chỉ khác bản đang lưu ở locked, lockLog): cần `lock` + phân hệ mức ≥ 1 */
      if (old.exists && old.hasFull && p.lock && can(p, mod, 1) && stripLock(d) === old.rest) {
        if (!canBranch(p, nf)) return noBranch(nf);
        if (!canBranch(p, old.folder)) return noBranch(old.folder);
        return null;
      }
      if (!can(p, mod, 2)) return `Không có quyền sửa phân hệ "${moduleLabel(mod)}"`;
      if (!canBranch(p, nf)) return noBranch(nf);
      if (old.exists && !canBranch(p, old.folder)) return noBranch(old.folder);
      if (old.locked !== !!d.locked && !p.lock) return 'Không có quyền khoá / mở khoá kỳ';
    } else {
      if (!can(p, mod, 2)) return `Không có quyền sửa phân hệ "${moduleLabel(mod)}"`;
      const nb = branchOf(c, d, periodFolder);
      if (!branchAllowed(p, nb)) return noBranch(nb);
      if (old.exists) {
        const ob = recBranch(c, old);
        if (!branchAllowed(p, ob)) return noBranch(ob);
      }
    }
    return null;
  };
  const checkDocDel = (c, op) => {
    const mod = COL_MODULE[c];
    if (!can(p, mod, 2)) return `Không có quyền sửa phân hệ "${moduleLabel(mod)}"`;
    if (!p.del) return 'Không có quyền xoá dữ liệu';
    const old = rec[c].get(String(op.id));
    const b = old && old.exists ? recBranch(c, old) : (c === 'periods' || c === 'assets' ? '' : null);
    return branchAllowed(p, b) ? null : noBranch(b);
  };
  const checkItem = (c, op) => {
    const mod = COL_MODULE[c];
    if (!can(p, mod, 2)) return `Không có quyền sửa phân hệ "${moduleLabel(mod)}"`;
    const parent = rec[c].get(String(op.pid));
    const f = parent && parent.exists ? parent.folder : '';
    return canBranch(p, f) ? null : noBranch(f);
  };

  /* Lượt 1: mọi op trừ item (để kỳ mới trong lô được ghi nhận trước dòng của nó); lượt 2: item / itemdel */
  const keep = new Array(ops.length).fill(false);
  const pass = (itemPass) => {
    ops.forEach((op, i) => {
      if (!isObj(op)) return;
      const isItem = op.t === 'item' || op.t === 'itemdel';
      if (isItem !== itemPass) return;
      const c = colOf(op);
      let why = null;
      switch (op.t) {
        case 'kv':
        case 'kvdel':
          if (typeof op.k !== 'string' || ignorable(op)) return;
          why = kvWriteDenied(p, op.k);
          break;
        case 'doc':
          if (!c || op.id == null) return;
          if (op.d === undefined) return; // chỉ đổi thứ tự: bỏ qua êm
          if (!isObj(op.d)) return;
          why = checkDoc(c, op);
          if (!why) rec[c].set(String(op.id), snap(op.d));
          break;
        case 'docdel':
          if (!c || op.id == null) return;
          why = checkDocDel(c, op);
          break;
        case 'item':
        case 'itemdel':
          if (!c || !DOC_COLS[c].items || op.pid == null || op.id == null) return;
          why = checkItem(c, op);
          break;
        case 'audit':
          break;
        default:
          return;
      }
      if (why) denied.set(i, why);
      else keep[i] = true;
    });
  };
  pass(false);
  pass(true);

  const out = [];
  const rejected = [];
  ops.forEach((op, i) => {
    if (denied.has(i)) rejected.push({ i, reason: denied.get(i) });
    else if (keep[i]) out.push(op);
  });
  return { ops: out, rejected };
}
