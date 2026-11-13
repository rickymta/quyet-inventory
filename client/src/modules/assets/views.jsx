/* Kiểm kê CCDC & TSCĐ: màn danh sách kỳ (view 'assets'), chi tiết kỳ (view 'asset'), hộp sửa, thẻ kết quả quét — dòng gốc 5812–6067, 6162–6229 */
import { db, S, A, X, fmt, norm, I, H, st, rerender, openLayer, closeLayer, canDel, canEdit } from '../../core';
import { AP, ASQ, ASST, asPer, asDiff, asDate, asStats, asRooms, asPending, asDefaults, asSummary, asApply } from './model.js';
import { phDelItem, phBurst, phSharpen, asPhotoSec, asShootRow } from './photos.jsx';
import { ASX } from './asx.jsx';

/* Hàm của phân hệ khác có thể trả chuỗi HTML (bản gốc) hoặc JSX (bản đã port): chấp nhận cả hai */
const N = (x) => (typeof x === 'string' ? H(x) : x);
const tsLabel = (t) => X.tsLabel(t);

/* renderAsset()/renderAssets()/asRenderBody() của app gốc → vẽ lại */
export const renderAssets = () => rerender();
export const renderAsset = () => rerender();
export const asRenderBody = () => rerender();

/* ---- Màn hình danh sách kỳ ---- */
export function AssetsView() {
  const list = db.assets || [];
  const u = AP.up;
  const upSet = (k) => (e) => { ASX.upSet(k, e.target.value); rerender(); };
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => X.LSX.assetsBack()}>‹</button><div className="ttl">Kiểm kê CCDC &amp; TSCĐ</div></div><div style={st('height:10px')} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:40px')}>
        {list.length ? <div className="sec">Các kỳ kiểm kê</div> : null}
        {list.map((p) => {
          const s = asStats(p); const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
          return (
            <div key={p.id} className="card" style={st('margin-bottom:10px;cursor:pointer')} onClick={() => ASX.openP(p.id)}>
              <div style={st('display:flex;justify-content:space-between;gap:10px;align-items:flex-start')}>
                <div style={st('min-width:0')}>
                  <div style={st('font-weight:700;word-break:break-word')}>{p.name}</div>
                  <div style={st('font-size:12px;color:var(--mut);margin-top:2px')}>{(p.branch ? p.branch + ' · ' : '') + (p.dateCount ? 'Kiểm kê ' + asDate(p.dateCount) + ' · ' : '') + s.total + ' tài sản'}</div>
                </div>
                {canDel() && canEdit('assets') ? <button className="pill" style={st('flex:none')} title="Xoá kỳ" onClick={(e) => { e.stopPropagation(); ASX.delP(p.id); }}>{I('trash', 15)}</button> : null}
              </div>
              <div className="bar" style={st('margin-top:10px')}><div className="fill" style={{ width: pct + '%' }} /></div>
              <div className="prow">
                <span>Đã kiểm <b className="tnum" style={st('color:var(--ink)')}>{s.done}/{s.total}</b> · {pct}%</span>
                <span>{s.ndiff ? <b style={st('color:var(--red)')}>{s.ndiff} chênh lệch</b> : 'Chưa có chênh lệch'}{s.extra ? <> · <b style={st('color:var(--green)')}>{s.extra} phát hiện thêm</b></> : null}</span>
              </div>
            </div>
          );
        })}
        {canEdit('assets') ? (
          <>
        <div className="sec" style={st('margin-top:20px')}>Tạo kỳ mới</div>
        <div className="card">
          {!u ? (
            <>
              {AP.pre ? <div className="note-warn" style={st('margin-bottom:10px;background:var(--teal-bg);color:var(--teal);border-color:var(--teal-ln)')}>Kỳ mới cho chi nhánh: <b>{AP.pre.folder || 'Chưa phân loại'}</b></div> : null}
              <div style={st('font-size:13px;color:var(--mut);margin-bottom:10px')}>Upload file Excel theo biểu mẫu <b>Biên bản kiểm kê TS&amp;CCDC</b>. Phần I (STT, Mã, Tên, ĐVT, Số lượng, Đơn vị cấp 1) được cố định làm số liệu kế toán, Phần II để app tự điền khi quét.</div>
              <label className="btn btn-primary" style={st('cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px')}>{I('upload', 18)}Chọn file Excel<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => ASX.upFile(e.target)} /></label>
            </>
          ) : (
            <>
              <div style={st('font-size:13px;color:var(--mut);margin-bottom:10px')}>Đọc được <b style={st('color:var(--ink)')}>{u.items.length}</b> dòng từ file <b style={st('color:var(--ink)')}>{u.fname}</b>{u.items.some((i) => i.counted) ? ' (có kèm kết quả kiểm kê cũ)' : ''}.</div>
              <label className="lbl">Thuộc chi nhánh (hiện trong Danh sách)</label>
              <select className="inp" style={st('margin-bottom:10px')} value={u.folder || ''} onChange={upSet('folder')}>
                {u.folder ? null : <option value="">— Chưa phân loại —</option>}
                {db.folders.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <label className="lbl">Tên kỳ kiểm kê</label><input className="inp" value={u.name || ''} onChange={upSet('name')} />
              <label className="lbl" style={st('margin-top:10px')}>Chi nhánh</label><input className="inp" value={u.branch || ''} onChange={upSet('branch')} />
              <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px')}>
                <div><label className="lbl">Thời điểm kiểm kê</label><input type="date" className="inp" value={u.dateCount || ''} onChange={upSet('dateCount')} /></div>
                <div><label className="lbl">Chốt số liệu đến ngày</label><input type="date" className="inp" value={u.cutoff || ''} onChange={upSet('cutoff')} /></div>
              </div>
              <div style={st('display:flex;gap:8px;margin-top:14px')}><button className="btn btn-primary" style={st('flex:1')} onClick={() => ASX.upCreate()}>Tạo kỳ kiểm kê</button><button className="btn btn-outline" style={st('width:auto;padding:0 16px')} onClick={() => ASX.upCancel()}>Huỷ</button></div>
            </>
          )}
        </div>
          </>
        ) : null}
      </div>
    </>
  );
}

/* ---- Màn hình chi tiết một kỳ ---- */
const AS_FLTS = {
  all: () => true,
  todo: (i) => !i.counted,
  done: (i) => i.counted,
  diff: (i) => i.counted && asDiff(i) !== 0,
  bad: (i) => i.counted && (i.quality !== 'Tốt' || i.status !== 'Đang sử dụng'),
  extra: (i) => i.extra,
  trace: (i) => i.trace,
};
const AS_CHIPS = [['all', 'Tất cả'], ['todo', 'Chưa kiểm'], ['done', 'Đã kiểm'], ['diff', 'Chênh lệch'], ['bad', 'Hỏng/Không dùng'], ['extra', 'Phát hiện thêm'], ['trace', 'Cần dò tìm']];

export function asExpBanner(p) {
  const q = asPending(p); if (!q.n) return null;
  return (
    <div className="note-warn" style={st('display:flex;gap:10px;align-items:center;margin-bottom:8px')}>{I('warn', 18)}
      <div style={st('flex:1;font-size:13px')}><b>{q.n} tài sản kiểm mới chưa xuất Excel</b><br /><span style={st('font-size:12px')}>{(p.lastExport ? 'Xuất lần cuối ' + tsLabel(p.lastExport) + '. ' : 'Chưa xuất file lần nào. ') + 'Dữ liệu và ảnh chỉ nằm trên trình duyệt này.'}</span></div>
      <button className="pill" style={st('display:inline-flex;align-items:center;gap:5px')} onClick={() => ASX.exportX()}>{I('download', 15)}Xuất</button>
    </div>
  );
}
export function asToolsRow(p) {
  let n = 0; X.SIG_KEYS.as.forEach((k) => { if (p.sig && p.sig[k]) n++; });
  const b = (l, f) => <button className="chip" style={st('flex:1;justify-content:center;text-align:center')} onClick={f}>{l}</button>;
  return (
    <>
      <div style={st('display:flex;gap:8px;margin-bottom:8px')}>{b('Tổng kết', () => ASX.sum())}{b('Nhật ký (' + (p.log || []).length + ')', () => ASX.logView())}{b('Chữ ký (' + n + '/3)', () => ASX.sigToggle())}</div>
      {AP.sigOpen ? N(X.sigSectionHtml('as')) : null}
    </>
  );
}

function AsItem({ it }) {
  const d = asDiff(it);
  const sub = [it.code, it.unit, it.counted && it.room ? it.room : null].filter((x) => x).join(' · ');
  return (
    <div className="item" onClick={() => ASX.edit(it.id)}>
      <div style={st('flex:1;min-width:0')}><div className="iname">{it.name}</div><div className="isub">{sub}</div>
        <div className="ibadges">
          {!it.counted ? <span className="bdg">Chưa kiểm</span>
            : d === 0 ? <span className="bdg bdg-ok" style={st('display:inline-flex;align-items:center;gap:3px')}>{I('check', 11)}Khớp</span>
              : d > 0 ? <span className="bdg bdg-plus">+{fmt(d)} Thừa</span>
                : <span className="bdg bdg-minus">−{fmt(Math.abs(d))} Thiếu</span>}
          {it.counted && it.quality && it.quality !== 'Tốt' ? <span className="bdg bdg-minus">{it.quality}</span> : null}
          {it.counted && it.status && it.status !== 'Đang sử dụng' ? <span className="bdg bdg-org">{it.status}</span> : null}
          {it.extra ? <span className="bdg bdg-plus">Phát hiện thêm</span> : null}
          {it.trace ? <span className="bdg bdg-org">Cần dò tìm</span> : null}
          {(it.imgs || []).length ? <span className="bdg" style={st('font-size:10px;display:inline-flex;align-items:center;gap:3px')}>{I('camera', 11)}{it.imgs.length} ảnh</span> : null}
        </div>
      </div>
      <div className="iright"><div className="iqty tnum">{fmt(it.counted ? it.cQty : it.qty)}</div><div className="ilab">{it.counted ? 'kiểm kê' : 'sổ sách'}</div></div>
    </div>
  );
}

export function AssetView() {
  const p = asPer(AP.pid);
  if (!p) { queueMicrotask(() => { S.route = { view: 'assets' }; X.render(); }); return null; }
  const c = p.cur || {};
  const lk = !!p.locked; /* vá đè dòng 8101–8107: kỳ đã khoá thì vô hiệu hoá các ô nhập ASX.cur / ASX.curAuto */
  const cur = (k) => (e) => { ASX.cur(k, e.target.value); rerender(); };
  const s = asStats(p); const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
  const nq = norm(AP.q || '');
  const flt = AS_FLTS[AP.flt] || AS_FLTS.all;
  const list = p.items.filter((i) => {
    if (!flt(i)) return false;
    return !nq || norm(i.name + ' ' + i.code + ' ' + i.room).indexOf(nq) >= 0;
  });
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => X.LSX.assetBack()}>‹</button>
        <div className="ttl" style={st('cursor:pointer')} onClick={() => ASX.info()}>{p.name}</div>
        <div style={st('display:flex;gap:6px;flex-shrink:0')}><button className="pill" style={st('display:inline-flex')} title="Thông tin biên bản" onClick={() => ASX.info()}>{I('gear', 15)}</button>
          <button className="pill" style={st('display:inline-flex')} title="In / PDF" onClick={() => ASX.print()}>{I('doc', 15)}</button>
          <button className="pill" style={st('display:inline-flex;align-items:center;gap:5px')} onClick={() => ASX.exportX()}>{I('download', 15)}Excel</button></div></div>
        <div className="wrap" style={st('padding-top:10px')}><div className="bar"><div className="fill" id="aspfill" style={{ width: pct + '%' }} /></div>
          <div className="prow"><span id="aspdone">Đã kiểm <b className="tnum" style={st('color:var(--ink)')}>{s.done}/{s.total}</b> · {pct}%</span>
            <span id="aspdiff">{s.ndiff ? <b style={st('color:var(--red)')}>{s.ndiff} chênh lệch</b> : 'Chưa có chênh lệch'}{s.extra ? <> · <b style={st('color:var(--green)')}>{s.extra} phát hiện thêm</b></> : null}</span></div></div></div>
      <div className="wrap" id="asxtop" style={st('padding-top:10px;padding-bottom:0')}>{N(X.lockBarHtml(p, 'as'))}{asExpBanner(p)}{asToolsRow(p)}</div>
      <div className="wrap" style={st('padding-top:10px')}><div className="card" style={st('padding:12px')}>
        <div style={st('font-size:12px;font-weight:700;color:var(--mut);margin-bottom:8px')}>ĐANG KIỂM TẠI (tự điền vào các tài sản quét tiếp theo)</div>
        <input className="inp" list="asrooms" placeholder="Phòng sử dụng thực tế, ví dụ: Phòng Implant 1 - Tầng 3" value={c.room || ''} disabled={lk} onChange={cur('room')} />
        <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px')}>
          <input className="inp" placeholder="Người sử dụng" value={c.user || ''} disabled={lk} onChange={cur('user')} />
          <input className="inp" placeholder="Vị trí (tự lấy Tầng…)" value={c.loc || ''} disabled={lk} onChange={cur('loc')} /></div>
        <label style={st('display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px')}><input type="checkbox" checked={!!c.auto} disabled={lk} onChange={(e) => { ASX.curAuto(e.target.checked); rerender(); }} /><span><b>Tự lưu khi quét</b> (nhanh nhất: quét là lưu luôn Tốt · Đang sử dụng, có nút Hoàn tác)</span></label>
        <datalist id="asrooms">{asRooms(p).map((r) => <option key={r} value={r} />)}</datalist></div></div>
      <div className="wrap">{N(X.unmBannerHtml(p))}</div>
      <div className="wrap" style={st('padding-bottom:8px;display:flex;gap:8px')}><input className="inp" style={st('background:var(--card);flex:1;min-width:0')} id="asq" placeholder="Tìm tên, mã hoặc phòng…" value={AP.q} onChange={(e) => ASX.q(e.target.value)} /></div>
      <div className="wrap"><div className="chips" id="aschips">
        {AS_CHIPS.map((ch) => {
          const n = p.items.filter(AS_FLTS[ch[0]]).length;
          if (ch[0] === 'trace' && !n) return null;
          return <button key={ch[0]} className={'chip' + (AP.flt === ch[0] ? ' chip-on' : '')} onClick={() => ASX.flt(ch[0])}>{ch[1]} {n}</button>;
        })}
      </div></div>
      <div className="wrap" id="aslist" style={st('padding-top:12px;padding-bottom:110px')}>
        {list.length ? null : <div className="empty">Không có tài sản nào khớp bộ lọc.</div>}
        {list.slice(0, AP.limit).map((it) => <AsItem key={it.id} it={it} />)}
        {list.length > AP.limit ? <button className="addbat" style={st('display:block;width:100%;text-align:center;padding:12px 0')} onClick={() => ASX.more()}>Xem thêm ({list.length - AP.limit} tài sản còn lại)</button> : null}
      </div>
      <div className="botbar"><div className="botin" style={st('display:flex;gap:8px')}><button className="btn btn-primary" style={st('flex:1')} onClick={() => ASX.scan()}>{I('scan', 18)}Quét mã QR / số</button>
        <button className="btn btn-outline" style={st('width:auto;padding:0 16px')} onClick={() => ASX.addExtra()}>{I('plus', 18)}Phát hiện thêm</button></div></div>
    </>
  );
}

/* ---- Hộp sửa chi tiết (lớp phủ riêng #asmodal của app gốc, không bị render() đóng) ---- */
let MK = 0;
export function asModal(content) {
  const key = ++MK;
  const fn = typeof content === 'function' ? content : () => content;
  openLayer('asmodal', () => (
    <div id="asmodal" key={key} style={st('position:fixed;inset:0;z-index:140;background:rgba(16,24,40,.45);display:flex;align-items:flex-end;justify-content:center')}>
      <div style={st('background:var(--card);color:var(--ink);width:100%;max-width:560px;max-height:92%;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)')}>{fn()}</div>
    </div>
  ));
}
export function asModalClose() {
  closeLayer('asmodal');
  const p = asPer(AP.pid);
  if (AP.editNew && AP.editing && p && p.items.indexOf(AP.editing) < 0) phDelItem(AP.editing);
  AP.editing = null;
}
const Lb = ({ t }) => <label className="lbl" style={st('margin-top:10px')}>{t}</label>;
const Opts = ({ arr, sel }) => { const a = arr.slice(); if (sel && a.indexOf(sel) < 0) a.push(sel); return a.map((o) => <option key={o} value={o}>{o}</option>); };

export function asEdit(id, seed) {
  const p = asPer(AP.pid); if (!p) return;
  let it = null;
  if (id === 'new') it = seed; else p.items.forEach((x) => { if (x.id === id) it = x; });
  if (!it) return;
  AP.editing = it; AP.editNew = (id === 'new');
  const v = asDefaults(p, it);
  const nt = it.note || '';
  const isNew = AP.editNew;
  asModal(() => (
    <>
      <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:8px')}><div style={st('min-width:0')}><div style={st('font-weight:800;font-size:17px;word-break:break-word')}>{isNew ? 'Thêm tài sản phát hiện thêm' : it.name}</div>
        {isNew ? <div style={st('font-size:12px;color:var(--mut)')}>Không có trong số liệu kế toán, ghi nhận là tài sản thừa.</div> : <div style={st('font-size:12px;color:var(--mut)')}>{it.code} · {it.unit} · Sổ sách: {fmt(it.qty)}{it.unit1 ? ' · ' + it.unit1 : ''}</div>}
      </div><button className="pill" onClick={() => asModalClose()}>✕</button></div>
      {it.extra ? (
        <>
          <Lb t="Tên tài sản / CCDC" /><input className="inp" id="e_name" defaultValue={it.name} />
          <div style={st('display:grid;grid-template-columns:2fr 1fr;gap:10px')}><div><Lb t="Mã (nếu có)" /><input className="inp" id="e_code" defaultValue={it.code} /></div><div><Lb t="ĐVT" /><input className="inp" id="e_unit" defaultValue={it.unit || 'Cái'} /></div></div>
        </>
      ) : null}
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:10px')}><div><Lb t="Số lượng kiểm kê" /><input className="inp" id="e_qty" inputMode="decimal" defaultValue={v.cQty == null ? '' : v.cQty} /></div>
        <div><Lb t="Phẩm chất" /><select className="inp" id="e_quality" defaultValue={v.quality}><Opts arr={ASQ} sel={v.quality} /></select></div></div>
      <Lb t="Tình trạng" /><select className="inp" id="e_status" defaultValue={v.status}><Opts arr={ASST} sel={v.status} /></select>
      <Lb t="Phòng sử dụng thực tế" /><input className="inp" id="e_room" list="asrooms" defaultValue={v.room} />
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:10px')}><div><Lb t="Người sử dụng thực tế" /><input className="inp" id="e_user" defaultValue={v.user} /></div><div><Lb t="Vị trí" /><input className="inp" id="e_loc" defaultValue={v.loc} /></div></div>
      <Lb t="Đơn vị quản lý" /><input className="inp" id="e_mgmt" defaultValue={v.mgmt || ''} />
      <Lb t="Ghi chú" /><textarea className="inp" id="e_note" rows={2} defaultValue={nt} />
      <div id="asphsec">{asPhotoSec(it)}</div>
      <datalist id="asrooms">{asRooms(p).map((r) => <option key={r} value={r} />)}</datalist>
      <button className="btn btn-primary" style={st('margin-top:14px')} onClick={() => ASX.editSave()}>Lưu kết quả</button>
      <div style={st('display:flex;gap:8px;margin-top:8px;flex-wrap:wrap')}>
        {isNew ? null : <button className="btn btn-outline" style={st('flex:1;width:auto;padding:11px')} onClick={() => ASX.editMissing()}>Không tìm thấy</button>}
        {it.counted && !isNew ? <button className="btn btn-outline" style={st('flex:1;width:auto;padding:11px')} onClick={() => ASX.editReset()}>Bỏ kết quả</button> : null}
        {it.extra && !isNew ? <button className="btn btn-outline" style={st('flex:1;width:auto;padding:11px;color:var(--red)')} onClick={() => ASX.editDel()}>Xoá</button> : null}
      </div>
    </>
  ));
}

/* ---- Tổng kết / Nhật ký (JSX cho hộp thoại) ---- */
export function asSumHtml(p) {
  const s = asSummary(p);
  const card = (l, v, c, f) => <div key={l} onClick={() => ASX.sumGo(f)} style={{ background: 'var(--card2)', borderRadius: 12, padding: '10px 12px' }}><div style={st('font-size:11px;color:var(--mut)')}>{l}</div><div className="tnum" style={{ fontSize: 20, fontWeight: 800, color: c || 'var(--ink)' }}>{v}</div></div>;
  return (
    <>
      <div style={st('display:flex;justify-content:space-between;align-items:center')}><div style={st('font-weight:800;font-size:17px')}>Tổng kết kiểm kê</div><button className="pill" onClick={() => asModalClose()}>✕</button></div>
      <div className="bar" style={st('margin-top:12px')}><div className="fill" style={{ width: s.pct + '%' }} /></div>
      <div style={st('font-size:12px;color:var(--mut);margin:4px 0 10px')}>Đã kiểm {s.done}/{s.tot} tài sản theo sổ · {s.pct}% · chạm từng ô để xem danh sách</div>
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
        {card('Khớp', s.ok, 'var(--green)', 'done')}{card('Chưa kiểm', s.todo, '', 'todo')}{card('Thiếu', s.less, 'var(--red)', 'diff')}{card('Thừa', s.more, 'var(--green)', 'diff')}
        {card('Không tìm thấy', s.miss, 'var(--red)', 'diff')}{card('Hỏng / không dùng', s.bad, '#f59e0b', 'bad')}{card('Phát hiện thêm', s.extra, 'var(--green)', 'extra')}{card('Cần dò tìm', s.trace, '#f59e0b', 'trace')}
      </div>
      {s.floors.length ? (
        <>
          <div style={st('font-weight:700;font-size:13px;margin:14px 0 6px')}>Theo vị trí</div>
          <div style={st('overflow-x:auto')}><table style={st('width:100%;border-collapse:collapse;font-size:12px')}><tbody>
            <tr style={st('color:var(--mut);text-align:right')}><th style={st('text-align:left;padding:4px')}>Vị trí</th><th>Tổng</th><th>Đã kiểm</th><th>Thiếu</th><th>Thừa</th><th>K.thấy</th><th>Thêm</th></tr>
            {s.floors.map((f) => { const g = f[1]; return (
              <tr key={f[0]} style={st('text-align:right;border-top:1px solid var(--line)')}><td style={st('text-align:left;padding:6px 4px')}>{f[0]}</td><td className="tnum">{g.tot}</td><td className="tnum">{g.done}</td><td className="tnum" style={st('color:var(--red)')}>{g.less || ''}</td><td className="tnum" style={st('color:var(--green)')}>{g.more || ''}</td><td className="tnum" style={st('color:var(--red)')}>{g.miss || ''}</td><td className="tnum">{g.ext || ''}</td></tr>
            ); })}
          </tbody></table></div>
        </>
      ) : null}
    </>
  );
}
export function asLogHtml(p) {
  const L = (p.log || []).slice(-300).reverse();
  return (
    <>
      <div style={st('display:flex;justify-content:space-between;align-items:center')}><div style={st('font-weight:800;font-size:17px')}>Nhật ký thao tác</div><button className="pill" onClick={() => asModalClose()}>✕</button></div>
      <div style={st('font-size:12px;color:var(--mut);margin:4px 0 8px')}>{(p.log || []).length} thao tác (hiện 300 gần nhất). Đầy đủ nằm trong sheet NHẬT KÝ của file Excel.</div>
      {!L.length ? <div className="empty">Chưa có thao tác nào.</div> : L.map((e, i) => (
        <div key={i} style={st('padding:8px 0;border-top:1px solid var(--line);font-size:13px')}>
          <div style={st('display:flex;justify-content:space-between;gap:8px')}><b>{e.a}</b><span style={st('color:var(--mut);font-size:11px;white-space:nowrap')}>{new Date(e.t).toLocaleString('vi-VN')}</span></div>
          {e.n || e.c ? <div>{e.n || ''}{e.c ? <> <span style={st('color:var(--mut)')}>({e.c})</span></> : null}</div> : null}
          {e.d || e.by ? <div style={st('color:var(--mut);font-size:12px')}>{(e.d || '') + (e.d && e.by ? ' · ' : '') + (e.by || '')}</div> : null}
        </div>
      ))}
    </>
  );
}

/* ---- Thẻ kết quả quét (dùng chung bộ quét của vật tư): ghi hàm dựng JSX vào S.SC.res, màn quét hiển thị trong #scres ---- */
export const ASD = 'background:#1b1b24;color:#e5e7eb;border:1px solid #33333d;border-radius:10px;padding:9px 10px;font:inherit;font-size:14px;width:100%;min-width:0';
const BTN_DK = 'background:#23232c;color:#e5e7eb;border:1px solid #33333d';
const Sel = ({ arr, s, ...r }) => <select defaultValue={s} {...r}>{arr.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
function setRes(fn) { const SC = S.SC; if (!SC) return; SC.res = fn; SC.shootTxt = null; rerender(); }

export function asShowMatched(m) {
  const SC = S.SC;
  const p = X.per(SC.pid); const it = m.item;
  SC.hold = true; X.scBeep();
  if (it.counted) return asShowDup(it);
  if (p.cur && p.cur.auto && !it.counted) {
    const prev = JSON.parse(JSON.stringify(it));
    asApply(p, it, asDefaults(p, it));
    SC.undo = { id: it.id, prev };
    SC.log = SC.log || []; SC.log.push({ name: it.name, qty: it.cQty });
    SC.res = () => (
      <div style={st('background:#16231b;border:1px solid #1f6b3a;border-radius:14px;padding:12px 14px')}>
        <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#4ade80;text-transform:uppercase')}>{I('check', 13)} Đã lưu tự động</div>
        <div style={st('font-weight:700;font-size:16px;margin-top:4px;word-break:break-word')}>{it.name}</div>
        <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>{it.code} · SL {fmt(it.cQty)} · {it.room || '(chưa nhập phòng)'}</div>
        <div style={st('display:flex;gap:8px;margin-top:10px')}><button className="btn" style={st('flex:1;padding:10px;' + BTN_DK)} onClick={() => ASX.scUndo()}>Hoàn tác</button>
          <button className="btn" style={st('flex:1;padding:10px;' + BTN_DK)} onClick={() => ASX.scDetail(it.id)}>Sửa chi tiết</button></div>
        {asShootRow(it)}
      </div>
    );
    SC.shootTxt = null;
    if (X.scLogRender) X.scLogRender();
    rerender();
    SC.hold = false; SC.last = SC.last || '';
    return undefined;
  }
  const v = asDefaults(p, it); const ex = !!it.extra;
  setRes(() => (
    <div style={st((ex ? 'background:#2a1f12;border:1px solid #8a5a1a' : 'background:#16231b;border:1px solid #1f6b3a') + ';border-radius:14px;padding:12px 14px')}>
      {ex ? <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>⚑ Phát hiện tài sản chưa có trong danh mục</div>
        : <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#4ade80;text-transform:uppercase')}>{I('check', 13)} Đã khớp{m.how === 'learned' ? ' (mã đã học)' : m.how === 'ocr' ? ' (đọc số)' : ''}</div>}
      <div style={st('font-weight:700;font-size:16px;margin-top:4px;word-break:break-word')}>{it.name}</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>{it.code} · {it.unit} · {ex ? 'Không có trong sổ sách' : 'Sổ sách ' + fmt(it.qty)}{it.counted ? <> · <span style={st('color:#fbbf24')}>Đã kiểm, lưu sẽ ghi đè</span></> : null}</div>
      <input id="asq_room" key={'r' + it.id} list="asrooms" placeholder="Phòng sử dụng thực tế" defaultValue={v.room} style={st(ASD + ';margin-top:10px')} />
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px')}><input id="asq_user" key={'u' + it.id} placeholder="Người sử dụng" defaultValue={v.user} style={st(ASD)} /><input id="asq_loc" key={'l' + it.id} placeholder="Vị trí" defaultValue={v.loc} style={st(ASD)} /></div>
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px')}><input id="asq_qty" key={'q' + it.id} inputMode="decimal" placeholder="SL kiểm kê" defaultValue={v.cQty == null ? '' : v.cQty} style={st(ASD)} /><Sel id="asq_quality" key={'ql' + it.id} arr={ASQ} s={v.quality} style={st(ASD)} /></div>
      <Sel id="asq_status" key={'st' + it.id} arr={ASST} s={v.status} style={st(ASD + ';margin-top:8px')} />
      <datalist id="asrooms">{asRooms(p).map((r) => <option key={r} value={r} />)}</datalist>
      <div style={st('display:flex;gap:8px;margin-top:10px')}><button className="btn btn-primary" style={st('flex:1;padding:12px')} onClick={() => ASX.scSave(it.id)}>Lưu &amp; quét tiếp</button>
        <button className="btn" style={st('width:auto;padding:12px 14px;' + BTN_DK)} onClick={() => ASX.scDetail(it.id)}>Chi tiết</button>
        <button className="btn" style={st('width:auto;padding:12px 14px;' + BTN_DK)} onClick={() => A.scNext()}>Bỏ qua</button></div>
      {asShootRow(it)}
    </div>
  ));
  return undefined;
}

/* ---- Quét trúng tài sản đã kiểm kê: báo trùng, người kiểm tự quyết lưu đè hay không ---- */
export function asShowDup(it) {
  const when = it.at ? new Date(it.at).toLocaleString('vi-VN') : '';
  setRes(() => (
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>⚠ Trùng mã · đã kiểm kê</div>
      <div style={st('font-weight:700;font-size:16px;margin-top:4px;word-break:break-word')}>{it.name}</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:2px')}>{it.code}{it.extra ? ' · Ngoài danh mục (cần dò tìm)' : ' · Sổ sách ' + fmt(it.qty)}</div>
      <div style={st('font-size:13px;margin-top:6px')}>Đã kiểm: SL <b>{fmt(it.cQty)}</b>{it.room ? ' · ' + it.room : ''}
        {when ? <><br /><span style={st('color:#9ca3af;font-size:12px')}>Lúc {when}{it.by ? ' · ' + it.by : ''}</span></> : null}</div>
      <div style={st('display:flex;gap:8px;margin-top:10px')}><button className="btn" style={st('flex:1;padding:11px;' + BTN_DK)} onClick={() => A.scNext()}>Không lưu, quét tiếp</button>
        <button className="btn" style={st('flex:1;padding:11px;background:#23232c;color:#fbbf24;border:1px solid #8a5a1a')} onClick={() => ASX.scDetail(it.id)}>Lưu lại / ghi đè</button></div>
      <button className="btn" style={st('margin-top:8px;padding:10px;background:#14203a;color:#a9bde0;border:1px solid #2c4f8f')} onClick={() => ASX.dupAdd(it.id)}>Cộng thêm +1 (có thêm 1 cái cùng mã)</button>
    </div>
  ));
}
/* ---- Số đọc bằng OCR chưa chắc chắn: hiện số để đối chiếu với tem, sửa nếu sai rồi mới thêm ---- */
export function asConfirmNum(code) {
  const SC = S.SC; if (!SC) return;
  SC.hold = true; X.scBeep();
  phBurst(document.getElementById('scvid'), 3, 90, 1600).then((r) => {
    if (!S.SC || !r.cv) return; phSharpen(r.cv, 0.5); S.SC.snap = { d: r.cv.toDataURL('image/jpeg', 0.88), w: r.cv.width, h: r.cv.height };
  });
  setRes(() => (
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>⚑ Số chưa có trong danh mục · kiểm tra số đọc</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Đối chiếu với tem, sửa nếu app đọc sai:</div>
      <input id="scnum" key={code} inputMode="numeric" defaultValue={code} style={st(ASD + ';margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:20px;font-weight:700')} />
      <div style={st('display:flex;gap:8px;margin-top:10px')}><button className="btn btn-primary" style={st('flex:1;padding:12px')} onClick={() => ASX.confirmNum()}>Đúng số — thêm vào danh mục</button>
        <button className="btn" style={st('width:auto;padding:12px 14px;' + BTN_DK)} onClick={() => A.scNext()}>Quét lại</button></div>
    </div>
  ));
}
export function asShowUnmatched(text, m) {
  const SC = S.SC;
  SC.hold = true; SC.pending = { text, canon: m.canon, gs1: m.gs1 };
  const shown = String(text).replace(/\u001d/g, ' ');
  setRes(() => (
    <div style={st('background:#2a1f12;border:1px solid #8a5a1a;border-radius:14px;padding:12px 14px')}>
      <div style={st('font-size:11px;font-weight:800;letter-spacing:.08em;color:#fbbf24;text-transform:uppercase')}>Chưa có trong danh sách TS/CCDC</div>
      <div style={st('font-size:12px;color:#9ca3af;margin-top:6px')}>Nội dung đọc được:</div>
      <div style={st('font-family:ui-monospace,Menlo,monospace;font-size:12px;background:#1b1b24;border:1px solid #33333d;border-radius:8px;padding:8px;margin-top:4px;max-height:84px;overflow:auto;word-break:break-all')}>{shown}</div>
      {N(X.scOcrNear(text))}
      <div style={st('font-size:12px;color:#9ca3af;margin-top:8px')}>Chọn đúng tài sản để liên kết (lần sau quét mã này app tự nhận):</div>
      <input id="scpick" className="inp" placeholder="Gõ tên hoặc mã tài sản…" style={st('margin-top:6px;background:#1b1b24;color:#e5e7eb;border-color:#33333d')} onChange={(e) => A.scPickQ(e.target.value)} />
      <div id="scpicklist" />
      <div style={st('display:flex;gap:8px;margin-top:8px')}><button className="btn" style={st('flex:1;padding:11px;background:#23232c;color:#fbbf24;border:1px solid #8a5a1a')} onClick={() => ASX.autoAddManual(shown.slice(0, 60).replace(/\\/g, ''))}>Thêm vào danh mục (cần dò tìm)</button>
        <button className="btn" style={st('flex:1;padding:11px;' + BTN_DK)} onClick={() => A.scNext()}>Bỏ qua</button></div>
    </div>
  ));
}
