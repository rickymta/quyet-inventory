/* Màn hình kiểm kê (view `period`) + bảng tồn kho chỉ xem (view `stock`).
   Mã gốc: dòng 4694–4940 (renderPeriod, renderChips, pgBar, pSortList, pTableHtml, renderList, renderStock, renderStockRows)
   cùng các hành động A trong khối `var A={` thuộc màn hình này. */
import React, { useEffect } from 'react';
import { db, S, A, X, per, norm, fmt, daysTo, diffOf, needsCount, st, I, H, rerender, render, modalOpen } from '../../core';
import { openSheet } from './sheet.jsx';
import { unmBannerHtml } from './unm.jsx';
import { invStats, v2Ring } from './stats.jsx';

/* hàm của phân hệ khác có thể trả chuỗi HTML hoặc JSX */
const frag = (v) => (typeof v === 'string' ? H(v) : (v === undefined ? null : v));
const callX = (name, ...a) => (typeof X[name] === 'function' ? frag(X[name](...a)) : null);
let pKeySeq = 0;
export const newPKey = () => ++pKeySeq;

/* ---------- Lọc ---------- */
const SKEY = new WeakMap();
export function skey(it) {
  let k = SKEY.get(it);
  if (!k || k.n !== it.name || k.c !== it.code) { k = { n: it.name, c: it.code, s: norm(it.name) + '\u0001' + norm(it.code) }; SKEY.set(it, k); }
  return k.s;
}
export function skeyWarm(p) {
  let i = 0; const its = p.items;
  const step = () => { const e = Math.min(its.length, i + 1500); for (; i < e; i++) skey(its[i]); if (i < its.length) (window.requestIdleCallback || setTimeout)(step); };
  (window.requestIdleCallback || setTimeout)(step);
}
export function baseList(p) {
  const P = S.P; const nq = norm(P.q);
  return p.items.filter((i) => {
    if (P.br !== 'all' && i.branch !== P.br) return false;
    if (nq && skey(i).indexOf(nq) < 0) return false;
    return true;
  });
}
function fltFn(k) {
  return (i) => {
    if (k === 'todo') return needsCount(i);
    if (k === 'done') return i.counted;
    if (k === 'diff') return i.counted && diffOf(i) !== 0;
    if (k === 'stock') return i.close > 0;
    return true;
  };
}
export function filteredList(p) { return baseList(p).filter(fltFn(S.P.flt)); }

/* ---------- Bộ nhớ đệm phần thân: khi sheet nhập đang mở, mỗi lần bấm phím số chỉ vẽ lại sheet, không lọc lại cả danh sách ---------- */
let bodyCache = null;
export function invalidateList() { bodyCache = null; }

/* ---------- Chip lọc ---------- */
export function renderChips(p, base) { rerender(); return null; }
function Chips({ p, base }) {
  const P = S.P;
  const branches = [];
  p.items.forEach((i) => { if (i.branch && branches.indexOf(i.branch) < 0) branches.push(i.branch); });
  const cnt = (k) => base.filter((i) => {
    if (k === 'todo') return needsCount(i);
    if (k === 'done') return i.counted;
    if (k === 'stock') return i.close > 0;
    return i.counted && diffOf(i) !== 0;
  }).length;
  return (
    <>
      {branches.length > 1 ? (
        <select className="chip" value={P.br} onChange={(e) => A.setBr(e.target.value)}>
          <option value="all">Tất cả kho</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      ) : null}
      {[['all', 'Tất cả ' + base.length], ['todo', 'Chưa kiểm ' + cnt('todo')], ['stock', 'Còn tồn ' + cnt('stock')], ['diff', 'Chênh lệch ' + cnt('diff')], ['done', 'Đã kiểm ' + cnt('done')]].map((c) => (
        <button key={c[0]} className={'chip' + (P.flt === c[0] ? ' chip-on' : '')} onClick={() => A.setFlt(c[0])}>{c[1]}</button>
      ))}
    </>
  );
}

/* ---------- Phân trang dùng chung (k='p' bảng kiểm kê, k='s' bảng tồn kho) ---------- */
export function pgBar(k, total, pg, ps) {
  if (total <= 50) return null;
  const pages = Math.max(1, Math.ceil(total / ps));
  const b = (lb, n, dis, t) => <button className="pill" disabled={dis} title={t} onClick={() => A.pgGo(k, n)}>{lb}</button>;
  return (
    <div className="pgbar">
      <label>Số dòng/trang <select className="chip" value={ps} onChange={(e) => A.pgSize(k, e.target.value)}>
        {[50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
      </select></label>
      {b('«', 0, pg <= 0, 'Trang đầu')}{b('‹ Trước', pg - 1, pg <= 0, 'Trang trước')}
      <span>Trang <b>{pg + 1}</b> / {pages}</span>
      {b('Sau ›', pg + 1, pg >= pages - 1, 'Trang sau')}{b('»', pages - 1, pg >= pages - 1, 'Trang cuối')}
    </div>
  );
}

/* ---------- Bảng kiểm kê (desktop) ---------- */
export function pSortList(list) {
  const P = S.P;
  if (!P || !P.sk) return list;
  const k = P.sk; const d = P.sd || 1;
  const g = (i) => {
    switch (k) {
      case 'code': return String(i.code || i.name || '');
      case 'name': return String(i.name || '');
      case 'unit': return String(i.unit || '');
      case 'branch': return String(i.branch || '');
      case 'close': return Number(i.close) || 0;
      case 'qty': return i.counted ? (Number(i.countQty) || 0) : -1e18;
      case 'diff': { const x = i.counted ? diffOf(i) : null; return x === null ? -1e18 : x; }
      default: return 0;
    }
  };
  return list.slice().sort((a, b) => {
    const x = g(a); const y = g(b);
    const c = (typeof x === 'number') ? (x - y) : String(x).localeCompare(String(y), 'vi', { numeric: true });
    return c * d;
  });
}
function worstDays(it) {
  let worst = null;
  (it.batches || []).forEach((b) => { const x = daysTo(b.exp); if (x !== null && (worst === null || x < worst)) worst = x; });
  return worst;
}
export function pTableHtml(list, multi) {
  const P = S.P;
  const rows = pSortList(list);
  const sig = [P.flt, P.q, P.br, P.sk, P.sd, P.ps].join('|'); if (P.sig !== sig) { P.sig = sig; P.pg = 0; }
  const ps = P.ps || 50; const pages = Math.max(1, Math.ceil(rows.length / ps)); if (!(P.pg >= 0)) P.pg = 0; if (P.pg >= pages) P.pg = pages - 1;
  const from = P.pg * ps; const shown = rows.slice(from, from + ps);
  const cols = [['code', 'Mã hàng', ''], ['name', 'Tên hàng', ''], ['unit', 'ĐVT', '']];
  if (multi) cols.push(['branch', 'Kho', '']);
  cols.push(['close', 'Tồn hệ thống', 'r'], ['qty', 'Thực tế', 'r'], ['diff', 'Chênh lệch', 'r'], [null, 'Trạng thái', '']);
  return (
    <div className="ptbl">
      <div className="ptn">Hiển thị <b>{rows.length ? from + 1 : 0}–{from + shown.length}</b> / <b>{rows.length}</b> mã{P.sk ? ' · sắp xếp theo cột (bấm lại để đổi chiều hoặc bỏ)' : ''}</div>
      <div className="stkwrap"><table className="stktable"><thead><tr>
        {cols.map((c, ci) => (
          <th key={ci} className={(c[2] || '') + (c[0] ? ' srt' : '')} onClick={c[0] ? () => A.pSort(c[0]) : undefined}>
            {c[1]}{(P.sk && P.sk === c[0]) ? <span className="ar">{(P.sd || 1) > 0 ? '▲' : '▼'}</span> : null}
          </th>
        ))}
      </tr></thead><tbody>
        {shown.map((it) => {
          const d = diffOf(it); const worst = worstDays(it);
          const stt = !it.counted ? <span className="pl">Chưa kiểm</span> : (d === null || d === 0) ? <span className="pl pl-ok">Khớp</span> : d > 0 ? <span className="pl pl-plus">Thừa</span> : <span className="pl pl-minus">Thiếu</span>;
          const hs = (worst !== null && worst <= 90) ? <span className={'hs' + (worst < 0 ? ' r' : '')}>HSD {worst < 0 ? 'quá hạn' : 'còn ' + worst + ' ngày'}</span> : null;
          const dc = (it.counted && d !== null) ? (d === 0 ? '0' : <span className={d > 0 ? 'dpos' : 'dneg'}>{d > 0 ? '+' : '−'}{fmt(Math.abs(d))}</span>) : '–';
          return (
            <tr key={it.id} onClick={() => A.openItem(it.id, false)}>
              <td><b>{it.code || it.name}</b></td><td className="stkname">{it.name}</td><td>{it.unit}</td>
              {multi ? <td>{it.branch}</td> : null}
              <td className="r tnum">{fmt(it.close)}</td><td className="r tnum">{it.counted ? fmt(it.countQty) : '–'}</td><td className="r tnum">{dc}</td><td>{stt}{hs}</td>
            </tr>
          );
        })}
        {!shown.length ? <tr><td colSpan={cols.length} style={st('text-align:center;color:var(--mut2);padding:24px 0')}>Không có vật tư nào khớp bộ lọc.</td></tr> : null}
      </tbody></table></div>
      {pgBar('p', rows.length, P.pg, ps)}
    </div>
  );
}

/* ---------- Danh sách thẻ (điện thoại) + bảng ---------- */
export function renderList() { rerender(); }
function ListBody({ p, list }) {
  const P = S.P;
  const seen = {};
  for (let i = 0; i < p.items.length; i++) seen[p.items[i].branch] = 1;
  const branchesMulti = Object.keys(seen).length > 1;
  return (
    <>
      {!list.length ? <div className="empty">Không có vật tư nào khớp bộ lọc.</div> : null}
      {list.slice(0, P.limit).map((it) => {
        const d = diffOf(it); const worst = worstDays(it);
        const stt = !it.counted ? <span className="pl">Chưa kiểm</span> : d === 0 ? <span className="pl pl-ok">Khớp</span> : d > 0 ? <span className="pl pl-plus">Thừa {fmt(d)}</span> : <span className="pl pl-minus">Thiếu {fmt(Math.abs(d))}</span>;
        const hs = (worst !== null && worst <= 90) ? <span className={'hs' + (worst < 0 ? ' r' : '')}>HSD {worst < 0 ? 'quá hạn' : 'còn ' + worst + ' ngày'}</span> : null;
        return (
          <div className="item v2i" key={it.id} onClick={() => A.openItem(it.id, false)}><div className="thumb">{it.photo ? <img src={it.photo} alt="" /> : I('box', 26)}</div>
            <div className="im"><div className="ihd"><b>{it.code || it.name}</b>{stt}</div><div className="inm">{it.name}</div>
              <div className="ift"><span>ĐVT: {it.unit}{branchesMulti ? ' · ' + it.branch : ''}</span><span>Tồn: {fmt(it.close)} <i>|</i> Thực tế: {it.counted ? fmt(it.countQty) : '-'}</span></div>{hs}</div>
            <span className="ich">{I('chev', 18)}</span></div>
        );
      })}
      {pTableHtml(list, branchesMulti)}
      {list.length > P.limit ? <button className="addbat" style={st('display:block;width:100%;text-align:center;padding:12px 0')} onClick={() => A.more()}>Xem thêm ({list.length - P.limit} mã còn lại)</button> : null}
    </>
  );
}

/* ---------- Màn hình kiểm kê ---------- */
export function renderPeriod() { rerender(); }
function buildPeriod(p) {
  const P = S.P;
  const base = baseList(p);
  const list = base.filter(fltFn(P.flt));
  const ist = invStats(p); const total = ist.tot; const done = ist.done; const ndiff = ist.diff; const pct = ist.pct;
  const fTodo = list.filter((i) => needsCount(i)).length;
  const allDone = list.length > 0 && fTodo === 0;
  return (
    <>
      <div className="topbar"><div className="trow wrap">
        <button className="back" onClick={() => A.periodBack()}>‹</button>
        <div className="ttl" style={{ cursor: 'text' }} title="Chạm để sửa tên" onClick={() => A.renamePeriod(p.id)}>{p.name}</div>
        <div style={st('display:flex;gap:6px;flex-shrink:0')}>
          <button className="pill" title="Gửi email kết quả kiểm kê" style={{ display: 'inline-flex' }} onClick={() => A.kiemKeEmail()}>{I('mail', 15)}</button>
          <button className="pill" style={st('display:inline-flex;align-items:center;gap:5px')} onClick={() => A.exportCur()}>{I('download', 15)}Excel</button><button className="pill" style={{ marginLeft: '6px' }} onClick={() => A.printCur()}>In</button></div></div>
      <div id="ringcard">{v2Ring(p)}</div>
      <div className="wrap" style={{ paddingTop: '10px' }}><div className="bar"><div className="fill" id="pfill" style={{ width: pct + '%' }} /></div>
        <div className="prow"><span id="pdone">Đã kiểm <b className="tnum" style={{ color: 'var(--ink)' }}>{done + '/' + total}</b> · {pct}%</span><span id="pdiff">{ndiff > 0 ? <b style={{ color: 'var(--red)' }}>{ndiff} mã chênh lệch</b> : 'Chưa có chênh lệch'}</span></div>
        <button className="stklink" style={st('display:flex;align-items:center;gap:7px')} onClick={() => A.openStock(p.id)}>{I('grid', 16)}Bảng tồn kho (chỉ mã còn tồn){I('chev', 16)}</button>
        <button className="stklink" style={st('display:flex;align-items:center;gap:7px')} onClick={() => A.periodTransfer()}>{I('users', 16)}Bàn giao vật tư cho HO / cơ sở khác{I('chev', 16)}</button>
        <button className="stklink" id="exlink" style={st('display:' + (ndiff > 0 ? 'flex' : 'none') + ';align-items:center;gap:7px;color:var(--red)')} onClick={() => A.periodExplain()}>{ndiff > 0 ? <>{I('edit', 16)}Làm phiếu giải trình ({ndiff} mã chênh lệch){I('chev', 16)}</> : null}</button>
        {callX('sigPeriodToggle', p)}{callX('lockBarHtml', p, 'vt')}{callX('zeroResetHtml', p)}</div>
      {unmBannerHtml(p)}
      <div className="wrap" style={st('padding-bottom:8px;display:flex;gap:8px')}>
        <input className="inp" style={st('background:var(--card);flex:1;min-width:0')} id="q" key={'q' + (P._k || '')} defaultValue={P.q} placeholder="Tìm tên hoặc mã vật tư (không dấu vẫn ra)…" onChange={(e) => A.qInput(e.target.value)} />
        <button className="pill" style={st('display:inline-flex;align-items:center;gap:5px;padding:0 14px;flex:none')} onClick={() => A.scanOpen()}>{I('scan', 18)}Quét</button></div>
      <div className="chips" id="chips"><Chips p={p} base={base} /></div></div>
      <div className="wrap" id="list" style={{ paddingTop: '12px', paddingBottom: '110px' }}><ListBody p={p} list={list} /></div>
      <div className="botbar"><div className="botin"><button className="btn btn-primary" id="seqbtn" onClick={() => A.seqStart()}>{allDone ? '✓ Hoàn tất — Xuất báo cáo Excel' : '▶ Kiểm tuần tự · còn ' + fTodo + ' mã'}</button></div></div>
    </>
  );
}
export function PeriodView() {
  const P = S.P; const p = P && per(P.id);
  useEffect(() => { if (!p) { S.route = { view: 'home' }; render(); } });
  useEffect(() => { if (p) skeyWarm(p); }, [p && p.id]);
  if (!p) return null;
  if (S.SB && modalOpen() && p.items.some((x) => x.id === S.SB.itemId) && bodyCache && bodyCache.P === P && bodyCache.pid === p.id) return bodyCache.el;
  const el = buildPeriod(p);
  bodyCache = { P, pid: p.id, el };
  return el;
}

/* ---------- Bảng tồn kho (chỉ xem) ---------- */
export function renderStock() { rerender(); }
export function renderStockRows() { rerender(); }
export function StockView() {
  const ST = S.ST; const p = ST && per(ST.id);
  useEffect(() => { if (!p) { S.route = { view: 'home' }; render(); } });
  if (!p) return null;
  const branches = [];
  p.items.forEach((i) => { if (i.branch && branches.indexOf(i.branch) < 0) branches.push(i.branch); });
  const multi = branches.length > 1;
  const nq = norm(ST.q);
  const rows = p.items.filter((i) => {
    if (!(i.close > 0)) return false;
    if (ST.br !== 'all' && i.branch !== ST.br) return false;
    if (nq && skey(i).indexOf(nq) < 0) return false;
    return true;
  });
  const ssig = [ST.q, ST.br, ST.ps].join('|'); if (ST.sig !== ssig) { ST.sig = ssig; ST.pg = 0; }
  const sps = ST.ps || 100; const spages = Math.max(1, Math.ceil(rows.length / sps)); if (!(ST.pg >= 0)) ST.pg = 0; if (ST.pg >= spages) ST.pg = spages - 1;
  const spFrom = ST.pg * sps;
  return (
    <>
      <div className="topbar"><div className="trow wrap">
        <button className="back" onClick={() => A.go('period')}>‹</button>
        <div className="ttl">Bảng tồn kho</div></div>
      <div className="wrap" style={{ paddingBottom: '6px' }}><div style={st('font-size:12px;color:var(--mut)')}>{p.name} · chỉ hiện mã còn tồn kho</div></div>
      <div className="wrap" style={{ paddingBottom: '8px' }}><input className="inp" style={{ background: 'var(--card)' }} id="stq" key={'s' + (ST._k || '')} defaultValue={ST.q} placeholder="Tìm tên hoặc mã vật tư…" onChange={(e) => A.stQ(e.target.value)} /></div>
      {multi ? (
        <div className="chips"><select className="chip" value={ST.br} onChange={(e) => A.stBr(e.target.value)}><option value="all">Tất cả kho</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select></div>
      ) : null}
      </div>
      <div className="wrap" id="stkarea" style={{ paddingTop: '12px', paddingBottom: '40px' }}>
        <div style={st('font-size:12px;color:var(--mut);padding-bottom:8px')}>{rows.length} mã còn tồn kho{rows.length > sps ? ' · hiển thị ' + (spFrom + 1) + '–' + Math.min(rows.length, spFrom + sps) : ''}</div>
        <div className="stkwrap"><table className="stktable"><thead><tr>
          {multi ? <th style={{ width: '22%' }}>Kho</th> : null}
          <th style={{ width: multi ? '18%' : '22%' }}>Mã hàng</th>
          <th>Tên hàng</th>
          <th style={{ width: '13%' }}>ĐVT</th>
          <th className="r" style={{ width: '17%' }}>Tồn cuối</th>
        </tr></thead><tbody>
          {rows.length ? rows.slice(spFrom, spFrom + sps).map((it) => (
            <tr key={it.id}>{multi ? <td>{it.branch}</td> : null}
              <td>{it.code}</td>
              <td className="stkname">{it.name}</td>
              <td>{it.unit}</td>
              <td className="r tnum" style={{ fontWeight: 700 }}>{fmt(it.close)}</td></tr>
          )) : <tr><td colSpan={multi ? 5 : 4} style={st('text-align:center;color:var(--mut2);padding:24px 0')}>Không có mã nào khớp.</td></tr>}
        </tbody></table></div>
        {pgBar('s', rows.length, ST.pg, sps)}
      </div>
    </>
  );
}

/* ---------- Hành động ---------- */
let scrollT = null;
export const actions = {
  periodExplain() {
    const p = per(S.P && S.P.id); if (!p) return;
    const diffs = p.items.filter((i) => i.counted && diffOf(i) !== 0);
    if (!diffs.length) { X.toast('Kỳ này chưa có mã chênh lệch'); return; }
    let old = null;
    db.explains.forEach((v) => { if (v.periodId === p.id && !old) old = v; });
    if (old && confirm('Kỳ này đã có phiếu giải trình số ' + (old.soPhieu || '(chưa đánh số)') + '.\nBấm OK để mở phiếu đó, Huỷ để tạo phiếu mới.')) {
      S.EX = old; S.route = { view: 'explainEdit' }; render(); return;
    }
    const o = X.newEX(true);
    const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
    o.periodId = p.id; o.folder = p.folder || '';
    o.phatHien = ['Kiểm kê định kỳ'];
    o.ngayPhatHien = 'ngày ' + pad(d.getDate()) + ' tháng ' + pad(d.getMonth() + 1) + ' năm ' + d.getFullYear();
    o.canCu = 'Biên bản kiểm kê: ' + p.name;
    if (p.folder) o.diaDiem = p.folder;
    o.vanDe = 'Qua kiểm kê "' + p.name + '", phát hiện ' + diffs.length + ' mã vật tư chênh lệch giữa sổ sách và thực tế (chi tiết tại bảng dưới).';
    diffs.forEach((i) => {
      o.items.push({ ma: i.code, ten: i.name, dvt: i.unit, slSoSach: fmt(i.close), slThucTe: fmt(i.countQty), chenh: fmt(diffOf(i)), donGia: '', thanhTien: '' });
    });
    S.EX = o;
    db.explains.unshift(o); X.store.save();
    S.route = { view: 'explainEdit' }; render();
    X.toast('Đã tạo phiếu giải trình · ' + diffs.length + ' mã chênh lệch');
  },
  periodTransfer() {
    const p = per(S.P && S.P.id); if (!p) return;
    S.TR = { pid: p.id, dest: '', destOther: '', q: '', sel: {}, qty: {}, limit: 60 };
    S.route = { view: 'transfer' }; render();
  },
  periodBack() {
    const p = per(S.P && S.P.id);
    const LS = X.LS || {};
    if (LS.back) { LS.folder = (p && p.folder) || ''; LS.kind = 'vt'; S.route = { view: 'lists' }; render(); return; }
    if (p && p.folder) { S.FD = { name: p.folder }; S.route = { view: 'folder' }; render(); } else A.go('home');
  },
  /* gồm bản vá đè dòng 7653: ghi nhớ đợt đang chọn cho UI v2 */
  openPeriod(id) {
    X.HS.pid = id;
    S.P = { id, q: '', flt: 'all', br: 'all', limit: 80, _k: newPKey() }; S.route = { view: 'period' }; render();
  },
  qInput(v) { clearTimeout(S.qT); S.qT = setTimeout(() => { S.P.q = v; S.P.limit = 80; rerender(); }, 150); },
  openStock(pid) { S.ST = { id: pid, q: '', br: 'all', limit: 150, _k: newPKey() }; S.route = { view: 'stock' }; render(); },
  stQ(v) { clearTimeout(S.stqT); S.stqT = setTimeout(() => { S.ST.q = v; S.ST.limit = 150; rerender(); }, 150); },
  stBr(v) { S.ST.br = v; S.ST.limit = 150; rerender(); },
  stMore() { S.ST.limit += 200; rerender(); },
  setFlt(k) { S.P.flt = k; S.P.limit = 80; rerender(); },
  setBr(v) { S.P.br = v; S.P.limit = 80; rerender(); },
  more() { S.P.limit += 100; rerender(); },
  pgGo(k, n) {
    const o = k === 'p' ? S.P : S.ST; o.pg = Math.max(0, parseInt(n, 10) || 0); rerender();
    clearTimeout(scrollT);
    scrollT = setTimeout(() => { const t = document.querySelector(k === 'p' ? '.ptbl' : '#stkarea'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' }); }, 0);
  },
  pgSize(k, v) { const o = k === 'p' ? S.P : S.ST; o.ps = parseInt(v, 10) || 50; o.pg = 0; rerender(); },
  pSort(k) { const P = S.P; if (P.sk !== k) { P.sk = k; P.sd = 1; } else if ((P.sd || 1) > 0) { P.sd = -1; } else { P.sk = null; P.sd = 1; } rerender(); },
  exportCur() {
    const p = per(S.P.id); if (!p) return;
    try { X.exportExcel(p); } catch (e) { console.error(e); X.toast('Không xuất được file trên thiết bị này'); }
  },
  kiemKeEmail() {
    const p = per(S.P.id); if (!p) return;
    X.exportKiemKeEmail(p);
  },
  openItem(id, seq) { openSheet(id, seq); },
  seqStart() {
    const p = per(S.P.id); if (!p) return;
    const flist = filteredList(p);
    const allDone = flist.length > 0 && flist.filter((i) => needsCount(i)).length === 0;
    if (allDone) { A.exportCur(); return; }
    for (let i = 0; i < flist.length; i++) {
      if (!flist[i].counted) { openSheet(flist[i].id, true); return; }
    }
    X.toast('Không còn mã nào chưa kiểm trong bộ lọc hiện tại');
  },
};
