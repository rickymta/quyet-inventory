/* Tab Map: xem ngay trên màn hình (dòng gốc 8602–8658). Phần dựng dữ liệu (rcMapBuild, rcMapB, MP_COLS, MP_BANDS) ở p1-core.js */
import React from 'react';
import { A, I, st } from '../../core';
import { RC, rcF, rcQ, rcMapB, MP_COLS, MP_BANDS } from './p1-core.js';
import { rcFilter } from './p1-ui.jsx';
import { norm, stok, smatch } from '../../core';

export function mpCell(j, v) {
  if (v === '' || v == null) return '';
  if (j === 7) return typeof v === 'number' ? rcF(v) : v;
  if (j === 9 || j === 15) return typeof v === 'number' ? rcQ(v) : v;
  if (j === 17) return typeof v === 'number' ? ((v > 0 ? '+' : '') + rcQ(v)) : v;
  return v;
}
export function rcMapBody(B) {
  const onlyBad = RC.mf !== 0, q = norm(RC.mq || ''), hit = {}, first = {}; let sec = null; const rows = []; let secDone = false;
  B.M.forEach((w) => { if (w.t === 'sec') { sec = w; return; } if (!first[w._k]) first[w._k] = w; if (q && !hit[w._k] && smatch(norm(w.v.join(' ')), stok(q))) hit[w._k] = 1; });
  secDone = !sec;
  B.M.forEach((w) => {
    if (w.t === 'sec') return;
    if ((onlyBad && w.t !== 'bad') || (q && !hit[w._k])) return;
    if (!secDone && w.v[0] === '—') { rows.push(sec); secDone = true; }
    rows.push(w);
  });
  const lim = RC.mlim || 60, show = rows.slice(0, lim), nc = MP_COLS.length;
  if (!show.length) return <div className="card" style={st('text-align:center;color:var(--mut)')}>{q ? 'Không tìm thấy dòng nào khớp “' + RC.mq + '”.' : onlyBad ? 'Không còn ca lệch nào trong phạm vi đang xem.' : 'Không có dữ liệu trong phạm vi đang xem.'}</div>;
  const body = [];
  show.forEach((w, wi) => {
    if (w.t === 'sec') { body.push(<tr key={'s' + wi} className="mps"><td colSpan={nc}>{w.v[0]}</td></tr>); return; }
    const open = RC.mx === w._k;
    body.push(
      <tr key={'r' + wi} className={'mp-' + w.t + (w.f ? ' f' : '')} onClick={() => A.rcMapX(w._k)}>{MP_COLS.map((k) => {
        const j = k[0]; let v = w.v[j]; if (j === 3 && (v === '' || v == null)) v = w.v[2];
        const cl = (j === 7 || j === 9 || j === 15 || j === 17) ? 'n' : (j === 19 ? 'rs' : undefined);
        return <td key={j} className={cl}>{mpCell(j, v)}</td>;
      })}</tr>
    );
    if (open && w.f) {
      const v = w.v, L = [];
      if (v[2]) L.push(<><b>PID:</b> {v[2]}{v[4] ? <> · <b>Ngày DV:</b> {v[4]}</> : null}</>);
      if (v[20]) L.push(<>{v[20]}</>);
      if (v[12]) L.push(<><b>Phiếu xuất:</b> {v[12]}</>);
      if (v[21] || v[22] || v[23]) L.push(<><b>Giải trình:</b> {[v[21], v[22], v[23]].filter(Boolean).join(' · ')}</>);
      const sd = (w.t === 'bad') ? (w.v[0] === '—' ? 1 : 0) : -1;
      body.push(
        <tr key={'x' + wi} className="mpx"><td colSpan={nc}><div className="mpxd">
          {L.length ? L.map((e, i) => <React.Fragment key={i}>{i ? <br /> : null}{e}</React.Fragment>) : 'Không có thêm chi tiết.'}
          {sd >= 0 ? <button className="btn btn-primary" style={st('margin-top:8px;padding:9px')} onClick={(e) => { e.stopPropagation(); A.rcTile(sd, 1, String(v[2] || v[3] || '').replace(/'/g, '')); }}>Xử lý / giải trình ca này →</button> : null}
        </div></td></tr>
      );
    }
  });
  return (
    <>
      <div className="mpw"><table className="mpt"><thead>
        <tr className="b">{MP_BANDS.map((b, i) => <th key={i} colSpan={b[1]} style={{ background: b[2] }}>{b[0]}</th>)}</tr>
        <tr className="c">{MP_COLS.map((k, i) => { const bi = i < 2 ? 0 : i < 6 ? 1 : i < 9 ? 2 : 3; return <th key={i} style={{ background: MP_BANDS[bi][2] }}>{k[1]}</th>; })}</tr>
      </thead><tbody>{body}</tbody></table></div>
      {rows.length > show.length ? <button className="btn btn-outline" style={st('margin-top:10px')} onClick={() => A.rcMapMore()}>Xem thêm ({rows.length - show.length} dòng)</button> : null}
      <button className="btn btn-primary" style={st('margin-top:10px')} onClick={() => A.rcExport()}>{I('download', 15)}Tải file Excel (sheet MAP)</button>
    </>
  );
}
export function rcViewMapX() {
  const B = rcMapB(), c = B.cnt, nBad = c.bad + c.xbad;
  return (
    <>
      {rcFilter()}
      <div className="rcsubnav"><button className={RC.mf !== 0 ? 'on' : ''} onClick={() => A.rcMapF(1)}>Chỉ ca lệch ({nBad})</button><button className={RC.mf === 0 ? 'on' : ''} onClick={() => A.rcMapF(0)}>Tất cả ({B.nG})</button></div>
      <input className="inp" type="search" placeholder="Tìm PID, khách hàng, dịch vụ, vật tư, số CT…" key={'mpq' + RC.tab} defaultValue={RC.mq || ''} onChange={(e) => A.rcMapQ(e.target.value)} style={st('margin-bottom:10px')} />
      <div className="mpleg"><span className="r">Đỏ: lệch / phiếu xuất chưa khớp</span><span className="g">Xanh: đã duyệt</span><span className="y">Vàng: thiếu PID / chưa cấu hình</span></div>
      <div className="mpsum">Khớp <b>{c.match}</b> · Lệch <b className="rd">{c.bad}</b> · Hợp lệ <b>{c.ok}</b> · Chưa đối chiếu <b>{c.warn}</b> · Xuất chưa gắn DT <b className="rd">{c.xbad}</b> · <i>Chạm một dòng để xem chi tiết</i></div>
      <div id="mpbody">{rcMapBody(B)}</div>
    </>
  );
}
