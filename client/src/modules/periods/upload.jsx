/* Upload & khớp cột (dòng gốc 4565–4693). Trạng thái UP nằm ở S.UP (A.go('upload') của lõi khởi tạo). */
import { useEffect, useRef } from 'react';
import { db, S, A, X, per, fmt, I, H, rerender } from '../../core';
import { trAvail } from './transfer.jsx';
import { periodsIn } from './folders.jsx';

const J = (v) => (typeof v === 'string' ? H(v) : v);
const HEAD = ['Kho', 'Mã', 'Tên vật tư', 'ĐVT', 'Đầu', 'Nhập', 'Xuất', 'Cuối'];
const setUP = (k, v) => { S.UP[k] = v; rerender(); };
/* Ô nhập gốc dùng onchange (chỉ chốt khi rời ô / Enter) */
function ChgNum({ onCommit, ...rest }) {
  const ref = useRef(null); const cb = useRef(onCommit); cb.current = onCommit;
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const f = () => { if (cb.current) cb.current(el.value); };
    el.addEventListener('change', f);
    return () => el.removeEventListener('change', f);
  }, []);
  return <input ref={ref} {...rest} />;
}
/* khoá để ô tên kỳ được tạo lại khi S.UP khởi tạo mới */
const upIds = new WeakMap(); let upSeq = 0;
const upKey = (UP) => { let k = upIds.get(UP); if (!k) { k = ++upSeq; upIds.set(UP, k); } return 'pn' + k; };
/* memo buildItems/validateItems theo (rows, start, map, branchManual) */
let bmemo = null;
function builtOf(UP) {
  const sig = JSON.stringify([UP.start, UP.map, UP.branchManual]);
  if (bmemo && bmemo.rows === UP.rows && bmemo.hsd === db.hsd && bmemo.sig === sig) return bmemo;
  bmemo = { rows: UP.rows, hsd: db.hsd, sig, built: X.buildItems(UP.rows, UP.start, UP.map, UP.branchManual, db.hsd), val: null };
  return bmemo;
}

export function srcItemsOf(p, mode) {
  let n = 0;
  return p.items.map((i) => {
    let o = i.open; let inn = i['in']; let out = i.out; let cl = i.close;
    if (mode === 'next') { o = trAvail(i); inn = 0; out = 0; cl = o; }
    const zero = cl === 0;
    n++;
    return { id: 'i' + n + '_' + Math.random().toString(36).slice(2, 6), branch: i.branch, code: i.code, name: i.name, unit: i.unit,
      open: o, 'in': inn, out, close: cl, counted: zero, countQty: zero ? 0 : null, note: '',
      batches: (i.batches || []).map((b) => ({ qty: b.qty, exp: b.exp })) };
  });
}

export function upSrcCardHtml() {
  const UP = S.UP;
  if (!db.periods.length) return null;
  const m = UP.srcMode;
  return (
    <div className="card mt16">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Hoặc lấy từ hồ sơ kiểm kê có sẵn</div>
      <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 10 }}>Không cần upload lại file, dùng luôn dữ liệu của một kỳ đã tạo.</div>
      <select className="inp" value={UP.srcPid || ''} onChange={(e) => setUP('srcPid', e.target.value)}>
        <option value="">— Chọn kỳ nguồn —</option>
        {db.folders.concat(['']).map((f) => {
          const list = periodsIn(f); if (!list.length) return null;
          return (
            <optgroup key={f} label={f || 'Chưa phân loại'}>
              {list.map((p) => <option key={p.id} value={p.id}>{p.name + ' (' + p.items.length + ' mã)'}</option>)}
            </optgroup>
          );
        })}
      </select>
      {UP.srcPid && per(UP.srcPid) ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <label className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', ...(m === 'keep' ? { borderColor: 'var(--teal)' } : null) }}>
              <input type="radio" name="srcm" checked={m === 'keep'} onChange={() => setUP('srcMode', 'keep')} style={{ marginTop: 3 }} />
              <span><b>Giữ nguyên số liệu sổ sách</b><br /><span style={{ fontSize: 12, color: 'var(--mut)' }}>Kiểm kê lại từ đầu với cùng tồn đầu, nhập, xuất, tồn cuối.</span></span>
            </label>
            <label className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', ...(m === 'next' ? { borderColor: 'var(--teal)' } : null) }}>
              <input type="radio" name="srcm" checked={m === 'next'} onChange={() => setUP('srcMode', 'next')} style={{ marginTop: 3 }} />
              <span><b>Kỳ kế tiếp</b><br /><span style={{ fontSize: 12, color: 'var(--mut)' }}>Tồn đầu = số đã kiểm kê của kỳ nguồn (mã chưa kiểm lấy số sổ sách). Nhập, xuất đặt về 0.</span></span>
            </label>
          </div>
          <button className="btn btn-primary mt16" onClick={() => A.upUseSrc()}>Dùng dữ liệu kỳ này</button>
        </>
      ) : null}
    </div>
  );
}

function FolderSelect() {
  const UP = S.UP;
  return (
    <>
      <label className="lbl">Lưu vào thư mục chi nhánh *</label>
      <select className="inp" style={{ marginBottom: 12 }} value={UP.folder || ''} onChange={(e) => setUP('folder', e.target.value)}>
        <option value="">— Chọn chi nhánh —</option>
        {db.folders.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </>
  );
}
function PrevTable({ items }) {
  return (
    <div className="prev"><table><thead><tr>{HEAD.map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>
      {items.slice(0, 5).map((it, k) => (
        <tr key={k}><td>{it.branch}</td><td>{it.code}</td><td>{it.name}</td><td>{it.unit}</td><td className="r">{fmt(it.open)}</td><td className="r">{fmt(it['in'])}</td><td className="r">{fmt(it.out)}</td><td className="r" style={{ fontWeight: 700 }}>{fmt(it.close)}</td></tr>
      ))}
    </tbody></table></div>
  );
}

export function UploadFromSrc() {
  const UP = S.UP; const src = per(UP.srcPid); const items = UP.src.items;
  const ok = !!UP.folder && items.length > 0;
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.upSrcClear()}>‹</button><div className="ttl">Tạo kỳ từ hồ sơ có sẵn</div></div><div style={{ height: 10 }}></div></div>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div className="note-warn" style={{ marginBottom: 12 }}>Nguồn: <b>{src ? src.name : '(đã xóa)'}</b>{' · ' + (UP.srcMode === 'next' ? 'Kỳ kế tiếp (tồn đầu = số đã kiểm)' : 'Giữ nguyên số liệu sổ sách') + '. Kỳ nguồn không bị thay đổi.'}</div>
        <FolderSelect />
        <label className="lbl">Tên kỳ kiểm kê</label>
        <input className="inp" key={upKey(UP)} defaultValue={UP.pname || ''} onChange={(e) => { S.UP.pname = e.target.value; }} />
        <div className="lbl" style={{ marginTop: 16 }}>Xem trước · <b className="tnum" style={{ color: 'var(--ink)' }}>{items.length}</b> mã vật tư</div>
        <PrevTable items={items} />
        <button className="btn btn-primary mt20" disabled={!ok} onClick={() => A.createPeriod()}>{'Tạo kỳ kiểm kê (' + items.length + ' mã VT)'}</button>
        {!ok ? <div className="hint-red" style={{ textAlign: 'center' }}>Chọn thư mục chi nhánh để lưu kỳ kiểm kê.</div> : null}
      </div>
    </>
  );
}

export function UploadView() {
  const UP = S.UP;
  if (!UP) return null;
  if (UP.src) return <UploadFromSrc />;
  const top = <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.upBack()}>‹</button><div className="ttl">Tạo kỳ kiểm kê mới</div></div><div style={{ height: 10 }}></div></div>;
  if (!UP.rows) {
    return (
      <>
        {top}
        <div className="wrap" style={{ paddingTop: 24 }}>
          <input type="file" id="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => A.onFile(e.target)} />
          <button className="drop" onClick={() => document.getElementById('file').click()}>
            <div style={{ color: 'var(--teal-d)', display: 'flex', justifyContent: 'center' }}>{I('upload', 34)}</div>
            <div style={{ fontWeight: 800, color: 'var(--teal-d)', marginTop: 8 }}>Chọn file tồn kho</div>
            <div style={{ fontSize: 14, color: 'var(--teal)', marginTop: 4 }}>Excel xuất từ MISA (.xlsx, .xls, .csv)</div>
          </button>
          <div className="card mt16" style={{ fontSize: 14, color: 'var(--mut)' }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>File cần có các cột:</div>
            Chi nhánh/Kho, Mã VT, Tên VT, ĐVT, Tồn đầu, Nhập, Xuất, Tồn cuối. Hệ thống tự nhận diện cột, chỉnh tay được ở bước sau.
          </div>
          {upSrcCardHtml()}
        </div>
      </>
    );
  }
  const headers = (UP.rows[UP.hr] || []).map((x) => String(x));
  const bm = builtOf(UP); const built = bm.built;
  const inherited = built.filter((i) => i.batches.length > 0).length;
  const canCreate = UP.map.name !== undefined && built.length > 0 && !!UP.folder;
  UP._built = built;
  return (
    <>
      {top}
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <FolderSelect />
        <label className="lbl">Tên kỳ kiểm kê</label>
        <input className="inp" key={upKey(UP)} defaultValue={UP.pname || ''} onChange={(e) => { S.UP.pname = e.target.value; }} />
        {UP.wb && UP.wb.SheetNames.length > 1 ? (
          <>
            <label className="lbl" style={{ marginTop: 12 }}>Sheet dữ liệu</label>
            <select className="inp" value={UP.sheet} onChange={(e) => A.upSheet(e.target.value)}>
              {UP.wb.SheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div><label className="lbl">Dòng tiêu đề</label><ChgNum key={'hr' + UP.hr + '_' + UP.sheet} className="inp tnum" type="number" inputMode="numeric" style={{ textAlign: 'center' }} defaultValue={UP.hr + 1} onCommit={(v) => A.upHr(v)} /></div>
          <div><label className="lbl">Dữ liệu từ dòng</label><ChgNum key={'st' + UP.start + '_' + UP.hr + '_' + UP.sheet} className="inp tnum" type="number" inputMode="numeric" style={{ textAlign: 'center' }} defaultValue={UP.start + 1} onCommit={(v) => A.upStart(v)} /></div>
        </div>
        <div className="card mt16"><div className="lbl">Khớp cột dữ liệu</div>
          {X.FIELDS.map((f) => (
            <div className="maprow" key={f.k}>
              <div className="maplbl" style={f.k === 'name' ? { fontWeight: 700, color: 'var(--ink)' } : undefined}>{f.label + (f.k === 'name' ? ' *' : '')}</div>
              <select value={UP.map[f.k] === undefined ? '' : UP.map[f.k]} onChange={(e) => A.upMap(f.k, e.target.value)}>
                <option value="">— bỏ qua —</option>
                {headers.map((hd, i) => <option key={i} value={i}>{X.colName(i) + ' · ' + (String(hd).trim() || '(trống)')}</option>)}
              </select>
            </div>
          ))}
          {UP.map.branch === undefined ? (
            <>
              <label className="lbl" style={{ marginTop: 12 }}>Chi nhánh (file không có cột kho)</label>
              <ChgNum key={'bm' + UP.sheet} className="inp" placeholder="VD: Cát Linh" defaultValue={UP.branchManual} onCommit={(v) => A.upBranch(v)} />
            </>
          ) : null}
          {UP.map.close === undefined ? <div style={{ fontSize: 12, color: 'var(--mut2)', marginTop: 6 }}>Chưa chọn cột Tồn cuối → tự tính = Đầu + Nhập − Xuất.</div> : null}
        </div>
        <div className="lbl" style={{ marginTop: 16 }}>Xem trước · đọc được <b className="tnum" style={{ color: 'var(--ink)' }}>{built.length}</b> mã vật tư{inherited > 0 ? ' · kế thừa HSD ' + inherited + ' mã từ kỳ trước' : ''}</div>
        {J(X.validateHtml(bm.val || (bm.val = X.validateItems(built))))}
        <PrevTable items={built} />
        <button className="btn btn-primary mt20" disabled={!canCreate} onClick={() => A.createPeriod()}>{'Tạo kỳ kiểm kê (' + built.length + ' mã VT)'}</button>
        {!canCreate ? <div className="hint-red" style={{ textAlign: 'center' }}>{(!UP.folder ? 'Chọn thư mục chi nhánh để lưu kỳ kiểm kê. ' : '') + 'Cần chọn đúng cột "Tên vật tư" và có ít nhất 1 dòng dữ liệu.'}</div> : null}
      </div>
    </>
  );
}
export const renderUploadFromSrc = () => rerender();
export const renderUpload = () => rerender();
