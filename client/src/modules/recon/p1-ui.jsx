/* Mảnh giao diện dùng chung của phần 1 (dòng gốc 8443–8548): trả JSX thay cho chuỗi HTML. */
import React from 'react';
import { A, X, I, st } from '../../core';
import {
  RC, rcK, rcF, rcQ, rcSgn, rcSgnF, rcNum, rcDStr, rcCsList, rcScopeTxt, rcSvcRows, rcDtByPid, rcGi, rcSum,
  RC_GRP, RC_SUBN,
} from './p1-core.js';

const Fr = React.Fragment;

/* Ô nhập "onchange" của app gốc (chỉ kích hoạt khi rời ô / Enter): ô không kiểm soát + key theo giá trị nền */
export function rcChg(value, handler) {
  const v = value == null ? '' : String(value);
  return {
    defaultValue: v,
    onBlur: (e) => { if (e.target.value !== v) handler(e.target.value, e); },
    onKeyDown: (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.target.blur(); },
  };
}

export function rcTbl(hd, rows, nc) {
  return (
    <div style={st('overflow-x:auto')}><table className="rct"><tbody>
      <tr>{hd.map((x, i) => <th key={i} className={i >= nc ? 'n' : undefined}>{x}</th>)}</tr>
      {rows.map((r, ri) => <tr key={ri}>{r.map((x, i) => <td key={i} className={i >= nc ? 'n' : undefined}>{x}</td>)}</tr>)}
    </tbody></table></div>
  );
}
export function rcSel(k, opts, cur, cls) {
  return (
    <select className={'inp' + (cls ? ' ' + cls : '')} value={String(cur)} onChange={(e) => A.rcS(k, e.target.value)}>
      {opts.map((o) => {
        const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
        return <option key={String(v)} value={String(v)}>{l}</option>;
      })}
    </select>
  );
}
export function rcScopePill() { const t = rcScopeTxt(); return <span className={'rcpill' + (t.all ? ' all' : '')}>{t.cs} · {t.th}</span>; }
export function rcScopeLine() { const t = rcScopeTxt(); return <div className={'rcscope-l' + (t.all ? ' all' : '')}>Đang xuất: <b>{t.cs}</b> · <b>{t.th}</b></div>; }
export function rcFilter(mode) {
  const ms = [['Tất cả', 'Tất cả tháng']]; for (let i = 1; i <= 12; i++) ms.push([String(i), 'Tháng ' + i]);
  const onC = RC.cs !== 'Tất cả', onT = RC.th !== 'Tất cả', on = onC || onT, ex = mode === 'export', t = rcScopeTxt();
  return (
    <div className={'rcscope' + (ex ? ' ex' : on ? ' on' : '')}>
      <div className="rcscope-h"><span className="rcscope-t">{ex ? 'Phạm vi xuất file' : on ? 'Đang lọc theo' : 'Đang xem'}</span>{on ? <button className="rcscope-x" onClick={() => A.rcClr()}>Xóa lọc</button> : null}</div>
      <div className="rcscope-g"><div><label>Cơ sở</label>{rcSel(0, [['Tất cả', 'Tất cả cơ sở']].concat(rcCsList()), RC.cs, onC ? 'on' : '')}</div><div><label>Tháng</label>{rcSel(1, ms, RC.th, onT ? 'on' : '')}</div></div>
      {ex ? <div className="rcscope-s">Các file Excel, biên bản và phụ lục bên dưới chỉ gồm dữ liệu của <b>{t.cs}</b> · <b>{t.th}</b>.</div> : null}
      {ex && t.all ? <div className="rcscope-w">Đang chọn tất cả cơ sở. Chọn một cơ sở ở trên nếu chỉ muốn xuất riêng cơ sở đó.</div> : null}
    </div>
  );
}
export function rcBadge(t) { const c = /KHỚP|OK|✓|Hợp lệ|Khớp/.test(t) ? 'green' : /CHƯA|THIẾU|✗|TRÙNG|THỪA|SAI/.test(t) ? 'red' : 'amber'; return <span className={'rcb rcb-' + c}>{t}</span>; }

/* ----- Ô so sánh 2 bên (V8) ----- */
export function rcCell(t, m, ql, qv, cls, key) {
  return (
    <div key={key} className={'rcx-i' + (cls ? ' ' + cls : '')}>
      <div className="rcx-t">{t}</div>
      {m ? <div className="rcx-m">{m}</div> : null}
      {ql ? <div className="rcx-q"><span>{ql}</span><b>{qv}</b></div> : null}
    </div>
  );
}
export function rcEmpty(t, red, key) { return <div key={key} className={'rcx-e' + (red ? ' rcx-red' : '')}>{t}</div>; }
export function rcSvcBlk(g, r0) {
  const rows = g ? rcSvcRows(g) : [r0], m = {}, ord = [];
  rows.forEach((r) => { const k = rcK(r.dv); if (!m[k]) { m[k] = { dv: r.dv, sl: 0, dt: 0 }; ord.push(k); } m[k].sl += rcNum(r.sl) || 1; m[k].dt += rcNum(r.dt); });
  return (
    <div className="rcx-sv">
      {ord.slice(0, 4).map((k) => {
        const v = m[k];
        return <div key={k}><b>{v.dv || '—'}</b> <span style={st('color:var(--mut)')}>× {rcQ(v.sl)}</span>{v.dt ? <div style={st('color:var(--sky);font-weight:700')}>Doanh thu {rcF(v.dt)} đ</div> : null}</div>;
      })}
      {ord.length > 4 ? <div style={st('color:var(--mut)')}>… +{ord.length - 4} dịch vụ khác</div> : null}
      {rows.length > 1 ? <div style={st('color:var(--mut);margin-top:4px')}>Đã gộp <b>{rows.length}</b> dòng doanh thu cùng khách + cùng vật tư</div> : null}
    </div>
  );
}
export function rcXCell(x, cls, key) {
  const m = [];
  if (x.ma) m.push(<Fr key="ma">Mã <b>{x.ma}</b></Fr>);
  if (x.r.so) m.push(<Fr key="so">CT {x.r.so}</Fr>);
  const d = rcDStr(x.r.ngay); if (d) m.push(<Fr key="d">{d}</Fr>);
  const mm = []; m.forEach((e, i) => { if (i) mm.push(' · '); mm.push(e); });
  return rcCell(x.ten || x.ma || '(không tên)', mm.length ? <>{mm}</> : '', 'SL xuất', rcQ(x.sl), cls, key);
}
export function rcFoot(need, got, cls, msg) {
  const q = Math.round((got - need) * 1000) / 1000, lb = q === 0 ? 'Khớp' : q > 0 ? 'Thừa' : 'Thiếu';
  return (
    <>
      <div className={'rcx-f rcx-' + cls}><div><i>Cần</i><b>{rcQ(need)}</b></div><div><i>Xuất</i><b>{rcQ(got)}</b></div><div><i>Chênh lệch</i><b className="d">{rcSgn(q)}</b><em>{lb}</em></div></div>
      {msg ? <div className={'rcx-fm rcx-' + cls}>{msg}</div> : null}
    </>
  );
}
export function rcFootMsg(cls, msg) { return <div className={'rcx-fm rcx-' + cls} style={st('border-top:2px solid var(--fc)')}>{msg}</div>; }
export function rcCmpBox(l, r, foot) {
  return (
    <div className="rcx"><div className="rcx-h"><div>Doanh thu · định mức</div><div>Xuất kho thực tế</div></div><div className="rcx-b"><div className="rcx-c">{l}</div><div className="rcx-c">{r}</div></div>{foot}</div>
  );
}
/* Phía doanh thu: trái = doanh thu + định mức, phải = phiếu xuất kho, dưới = chênh lệch */
export function rcCmpD(o) {
  const g = o.g, r = o.r;
  if (o.none) return rcCmpBox(rcSvcBlk(null, r), rcEmpty('Không đối chiếu được'), rcFootMsg('a', o.why || o.T));
  if (!o.first) return rcCmpBox(<>{rcSvcBlk(null, r)}{rcCell(o.ten || '—', 'Vật tư theo định mức', 'SL cần (dòng này)', rcQ(o.nd))}</>, rcEmpty('Đã tính chung ở dòng gộp đầu tiên của nhóm'), rcFootMsg('n', <>Tổng cần của nhóm: <b>{rcQ(g.need)}</b></>));
  const l = <>{rcSvcBlk(g, r)}{rcCell(o.ten || '—', 'Vật tư theo định mức', 'SL cần', rcQ(g.need))}</>;
  let rt;
  if (g.xs.length) rt = g.xs.map((x, i) => rcXCell(x, undefined, i));
  else if (o.wrong && o.wrong.length) rt = o.wrong.map((w, i) => rcCell(w.ten || w.ma || '—', <>{w.ma ? <>Mã <b>{w.ma}</b></> : null}{w.so ? ' · CT ' + w.so : ''}<br /><span className="rcx-red">⚠ Vật tư khác định mức</span></>, 'SL xuất', rcQ(w.sl), 'rcx-bad', i));
  else rt = rcEmpty('Chưa có phiếu xuất của khách này', 1);
  const cls = o.T === 'KHỚP' ? 'g' : (o.ok ? 'a' : 'r');
  const msg = (o.T === 'KHỚP' && !o.R) ? null : <><b>{X.RC_KQ[o.T] || o.T}</b>{o.ok ? ' · đã duyệt hợp lệ' : ''}{o.R ? <> · Giá trị lệch <b>{rcSgnF(o.R)} đ</b></> : null}</>;
  return rcCmpBox(l, rt, rcFoot(g.need, g.got, cls, msg));
}
/* Phía xuất kho: phải = phiếu này (và phiếu cùng ca), trái = doanh thu/định mức tương ứng, dưới = chênh lệch */
export function rcCmpX(x) {
  const g = x.g; let l = null, rt, need = 0, got = 0, L = [];
  if (x.skip) return rcCmpBox(rcEmpty('Phiếu chuyển kho / hủy — không đối chiếu'), rcXCell(x), rcFootMsg('n', x.P));
  if (g) { l = <>{rcSvcBlk(g, null)}{rcCell(g.ten, 'Vật tư theo định mức', 'SL cần', rcQ(g.need))}</>; need = g.need; got = g.got; }
  else if (x.pid) {
    L = rcDtByPid(x.pid);
    if (L.length) {
      l = (<>
        {L.slice(0, 3).map((c, i) => <Fr key={i}>{rcSvcBlk(c.g, c.r)}{rcCell(c.ten || '—', 'Vật tư đúng định mức', 'SL cần', rcQ(c.O))}</Fr>)}
        {L.length > 3 ? <div className="rcx-m" style={st('padding:4px 8px')}>… +{L.length - 3} vật tư khác</div> : null}
      </>);
      L.forEach((c) => { need += c.O; got += c.P; });
    } else { l = rcEmpty('Không có doanh thu của khách này', 1); got = x.sl; }
  } else { l = rcEmpty('Chưa có mã KH (PID) nên chưa gắn được doanh thu', 1); got = x.sl; }
  rt = rcXCell(x, x.bad ? 'rcx-bad' : 'rcx-me');
  if (g && g.xs.length > 1) {
    const oth = g.xs.filter((y) => y !== x);
    rt = (<>{rt}<div className="rcx-lb">Phiếu khác cùng ca</div>
      {oth.slice(0, 3).map((y, i) => rcXCell(y, 'rcx-dim', i))}
      {oth.length > 3 ? <div className="rcx-m" style={st('padding:4px 8px')}>… +{oth.length - 3} phiếu</div> : null}</>);
  }
  const cls = x.bad ? (x.ok ? 'a' : 'r') : 'g';
  const msg = <><b>{x.P}</b>{x.ok ? ' · đã duyệt hợp lệ' : ''}{g && g.xs.length > 1 ? ' · tổng ' + g.xs.length + ' phiếu cùng ca' : ''}{!g && L.length ? ' · SL phiếu này (' + rcQ(x.sl) + ') không tính vào số xuất của ca' : ''}{x.val ? ' · Giá trị ' + rcF(x.val) + ' đ' : ''}</>;
  return rcCmpBox(l, rt, rcFoot(need, got, cls, msg));
}

/* ----- Điều hướng ----- */
export function rcNav() {
  const gi = rcGi(), s = rcSum(), bd = [0, s.needD.length + s.needX.length, 0, 0, 0];
  return (
    <div className="rcnav wrap">{RC_GRP.map((g, i) => (
      <button key={i} className={i === gi ? 'on' : ''} onClick={() => A.rcTab(i === gi ? RC.tab : g[1][0])}>{g[0]}{bd[i] ? <em>{bd[i]}</em> : null}</button>
    ))}</div>
  );
}
export function rcSubNav() {
  const g = RC_GRP[rcGi()][1]; if (g.length < 2) return null;
  return <div className="rcsubnav">{g.map((t) => <button key={t} className={RC.tab === t ? 'on' : ''} onClick={() => A.rcTab(t)}>{RC_SUBN[t]}</button>)}</div>;
}
export function rcQuickBar() {
  return (
    <>
      <div className="rctool"><button className="btn btn-outline" onClick={() => A.rcRefresh()}>↻ Đối chiếu lại</button><label className="btn btn-primary">{I('upload', 15)}Cập nhật từ file<input type="file" accept=".xlsx,.xls" style={st('display:none')} onChange={(e) => A.rcQuick(e.target)} /></label></div>
      <details className="rcnote-d"><summary>Cập nhật từ file hoạt động thế nào?</summary><div className="rcnote">Sửa dòng đã có, thêm dòng mới, giữ giải trình và duyệt; có so sánh trước → sau và Hoàn tác. Chi tiết ở Dữ liệu → Nhập / Xuất file.</div></details>
    </>
  );
}
export function rcAcc(key, title, body, def) {
  const o = RC.co[key] !== undefined ? RC.co[key] : !!def;
  return <details key={key} className="rcacc" open={o} onToggle={(e) => A.rcOpenK(key, e.target.open)}><summary>{title}</summary><div className="rcacc-b">{body}</div></details>;
}
