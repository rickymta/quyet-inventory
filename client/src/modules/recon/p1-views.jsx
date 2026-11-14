/* Màn hình đối chiếu (view `recon`) và các tab con (dòng gốc 8659–8946, phần dựng giao diện). */
import React from 'react';
import { A, S, I, st, rerender, norm, stok, smatch } from '../../core';
import {
  RC, RC_LD, RC_LX, RC_ST, RC_ONLY, RC_MAPS, RC_CF, RC_GO, RC_KYL, KY_BADGE, rcDb, rcK, rcF, rcNum, rcQ, rcCompute, rcSum, rcCsList,
  rcScopeTxt, rcNames, rcDm, rcListRows, rcDStr, kyKey, kyTime, rcKyStat, rcKyGet,
} from './p1-core.js';
import { rcChg, rcTbl, rcSel, rcScopePill, rcScopeLine, rcFilter, rcBadge, rcCmpD, rcCmpX, rcNav, rcSubNav, rcQuickBar, rcAcc } from './p1-ui.jsx';
import { rcViewMapX } from './p1-map.jsx';
import { X } from '../../core';

const Fr = React.Fragment;
/* ô tìm kiếm không kiểm soát (app gốc cập nhật DOM từng phần): đồng bộ lại giá trị khi không đang gõ */
const syncRef = (v) => (el) => { if (el && document.activeElement !== el && el.value !== (v || '')) el.value = v || ''; };

/* ===== Bước 5 · Trạng thái kỳ đối chiếu (Cơ sở × Tháng) ===== */
export function rcKyBadge(stt, stale) {
  return <><span className={'rcb rcb-' + (KY_BADGE[stt] || 'gray')}>{stt}</span>{stale ? <> <span className="rcb rcb-red" title="Dữ liệu của kỳ đã thay đổi kể từ lần cập nhật trạng thái gần nhất">Dữ liệu đã đổi</span></> : null}</>;
}
export function rcKyCard() {
  if (RC.cs === 'Tất cả' || RC.th === 'Tất cả') {
    return <div className="card kyc" style={st('margin-bottom:12px')}><div className="kyt">Trạng thái kỳ đối chiếu</div><div className="kym">Chọn 1 cơ sở và 1 tháng ở bộ lọc phía trên để cập nhật trạng thái kỳ (Chưa đối chiếu → Đang xử lý → Chờ xác nhận → Hoàn thành). Bảng “Các kỳ đối chiếu” bên dưới cho xem tất cả các kỳ.</div></div>;
  }
  const cs = RC.cs, mo = +RC.th, g = rcKyGet(cs, mo), rec = g.rec, KS = g.S, hist = (rec && rec.hist) || [];
  return (
    <div className="card kyc" style={st('margin-bottom:12px')}>
      <div className="kyh"><div className="kyt">Kỳ đối chiếu · {cs} · Tháng {mo}</div><div>{rcKyBadge(g.st, g.stale)}</div></div>
      <div className="kym">{KS.n} lượt doanh thu · {KS.x} phiếu xuất · <b>{KS.need}</b> ca cần xử lý{rec && rec.at ? ' · cập nhật ' + kyTime(rec.at) + (rec.by ? ' bởi ' + rec.by : '') : ''}</div>
      {g.stale ? <div className="kyw">Dữ liệu của kỳ đã thay đổi sau lần cập nhật trạng thái gần nhất. Hãy rà soát lại trước khi xác nhận.</div> : null}
      <div className="kyb">
        {g.st === 'Chưa đối chiếu' ? <span className="kym" style={st('margin:0')}>Chưa có dữ liệu của kỳ này. Nhập doanh thu và xuất kho ở mục Dữ liệu.</span> : null}
        {g.st === 'Đang xử lý' ? <><button className="btn btn-primary" disabled={KS.need > 0} onClick={() => A.kyAct('submit')}>Gửi xác nhận</button>{KS.need > 0 ? <span className="kym" style={st('margin:0;align-self:center')}>Còn {KS.need} ca cần xử lý nên chưa gửi xác nhận được.</span> : null}</> : null}
        {g.st === 'Chờ xác nhận' ? <><button className="btn btn-primary" disabled={KS.need > 0} onClick={() => A.kyAct('confirm')}>Xác nhận hoàn thành</button><button className="btn btn-outline" onClick={() => A.kyAct('return')}>Trả lại xử lý</button></> : null}
        {g.st === 'Hoàn thành' ? <>{g.stale ? <button className="btn btn-primary" disabled={KS.need > 0} onClick={() => A.kyAct('confirm')}>Xác nhận lại</button> : null}<button className="btn btn-outline" onClick={() => A.kyAct('reopen')}>Mở lại</button></> : null}
      </div>
      {hist.length ? <>
        <div className="kyf"><b>Lịch sử trạng thái</b></div>
        {rcTbl(['Thời gian', 'Từ', 'Sang', 'Người thực hiện', 'Ghi chú'], hist.slice(-8).reverse().map((e) => [kyTime(e.at), e.from || '', rcKyBadge(e.st), e.by || '', e.note || '']), 5)}
      </> : null}
    </div>
  );
}
export function rcKyTable() {
  const Z = S.RC_RES, seen = {}, L = [];
  function add(cs, mo) { if (!cs || !mo) return; const k = kyKey(cs, mo); if (seen[k]) return; seen[k] = 1; L.push({ cs, mo }); }
  Z.dt.forEach((o) => { add(o.cs, o.mo); }); Z.xk.forEach((x) => { add(x.cs, x.mo); });
  L.sort((a, b) => String(a.cs).localeCompare(String(b.cs), 'vi') || a.mo - b.mo);
  RC_KYL.length = 0; L.forEach((k) => RC_KYL.push(k));
  if (!L.length) return null;
  const c = { 'Chưa đối chiếu': 0, 'Đang xử lý': 0, 'Chờ xác nhận': 0, 'Hoàn thành': 0 };
  const rows = L.map((k, i) => {
    const g = rcKyGet(k.cs, k.mo); c[g.st] = (c[g.st] || 0) + 1;
    const rec = g.rec;
    return (
      <tr key={i} className="kyr" onClick={() => A.kyGo(i)}><td>{k.cs}</td><td>Tháng {k.mo}</td><td className="n">{g.S.n}</td><td className="n" style={st(g.S.need ? 'color:var(--red);font-weight:700' : '')}>{g.S.need}</td><td>{rcKyBadge(g.st, g.stale)}</td>
        <td>{rec && rec.by ? rec.by : ''}{rec && rec.at ? <><br /><span style={st('font-size:11px;color:var(--mut2)')}>{kyTime(rec.at)}</span></> : null}</td></tr>
    );
  });
  const body = (
    <>
      <div className="kym" style={st('margin:0 0 8px')}>Hoàn thành <b>{c['Hoàn thành']}</b> · Chờ xác nhận <b>{c['Chờ xác nhận']}</b> · Đang xử lý <b>{c['Đang xử lý']}</b> · Chưa đối chiếu <b>{c['Chưa đối chiếu']}</b> · bấm một dòng để chuyển bộ lọc sang kỳ đó</div>
      <div style={st('overflow-x:auto')}><table className="rct"><tbody><tr><th>Cơ sở</th><th>Tháng</th><th className="n">Lượt DT</th><th className="n">Cần xử lý</th><th>Trạng thái</th><th>Cập nhật</th></tr>{rows}</tbody></table></div>
    </>
  );
  return rcAcc('kyall', 'Các kỳ đối chiếu (' + L.length + ')', body, RC.cs === 'Tất cả' || RC.th === 'Tất cả');
}

/* ===== Tổng quan ===== */
export function rcViewSum() {
  const s = rcSum(), Z = S.RC_RES, n = s.F.length, nd = s.needD.length, nx = s.needX.length, need = nd + nx, pct = n ? (s.ok / n * 100) : 0;
  const rest = Math.max(0, n - s.ok - s.apprD - nd), fp = (x) => (Math.round(x * 10) / 10).toLocaleString('vi-VN'), sc = rcScopeTxt();
  const kp = (l, v, sub, c, go) => (
    <div className={'rck' + (go ? ' b' : '')} role={go ? 'button' : undefined} onClick={go ? () => A.rcTile(...go) : undefined}>
      <div className="l">{l}</div><div className="v tnum" style={c ? { color: 'var(--' + c + ')' } : undefined}>{v}</div>{sub ? <div className="s">{sub}</div> : null}
    </div>
  );
  const seg = (c, k) => (k > 0 ? <i className={c} style={{ flex: k }} /> : null);
  const cnt = (a, f) => a.filter(f).length;
  const stt = [['KHỚP', 'DT'], ['CHƯA XUẤT KHO', 'DT'], ['XUẤT SAI VẬT TƯ', 'DT'], ['XUẤT SAI SỐ LƯỢNG (THIẾU)', 'DT'], ['XUẤT SAI SỐ LƯỢNG (THỪA)', 'DT'], ['XUẤT CHƯA CÓ DOANH THU', 'XK'], ['XUẤT SAI VẬT TƯ', 'XK'], ['TRÙNG/THỪA XUẤT', 'XK'], ['THIẾU MÃ KH', 'XK']];
  const vr = [];
  Z.vids.forEach((g) => {
    const F = s.F.filter((o) => o.g && o.g.vid === g.vid); let q = 0; F.forEach((o) => { q += o.Q; });
    const xc = cnt(s.X, (x) => x.vid === g.vid && x.P === 'XUẤT CHƯA CÓ DOANH THU');
    if (!F.length && !xc) return;
    vr.push([g.ten, F.length, cnt(F, (o) => o.T === 'KHỚP'), cnt(F, (o) => o.T === 'CHƯA XUẤT KHO'), cnt(F, (o) => o.T === 'XUẤT SAI VẬT TƯ'), cnt(F, (o) => o.T.indexOf('SAI SỐ') === 0), xc, q, q < 0 ? 'THIẾU' : q > 0 ? 'THỪA' : '—']);
  });
  const mo = []; for (let m = 1; m <= 12; m++) { const XX = Z.xk.filter((x) => x.mo === m); let v = 0; XX.forEach((x) => { v += x.val; }); if (XX.length) mo.push(['Tháng ' + m, XX.length, rcF(v)]); }
  return (
    <>
      {rcFilter()}
      <section className="pxh rcH">
        <div style={st('display:flex;justify-content:space-between;align-items:flex-end;gap:12px')}>
          <div><div className="pxh-k">Tỷ lệ khớp</div><div className="pxh-n">{n ? fp(pct) + '%' : '–'}</div></div>
          <div style={st('text-align:right')}><div className="pxh-k">Cần xử lý</div><div className="pxh-n" style={{ color: need ? '#ff9a9a' : '#4ade80' }}>{need}</div></div>
        </div>
        <div className="pxbar" role="img" aria-label={s.ok + ' khớp, ' + s.apprD + ' đã duyệt, ' + nd + ' cần xử lý'}>{seg('g', s.ok)}{seg('b', s.apprD)}{seg('r', nd)}{seg('n', rest)}</div>
        <div className="rcl"><span><u className="g"></u>{s.ok} khớp</span><span><u className="b"></u>{s.apprD} đã duyệt hợp lệ</span><span><u className="r"></u>{nd} cần xử lý</span></div>
        <div className="pxh-m">{n} lượt đối chiếu · {sc.cs} · {sc.th}</div>
        {need
          ? <button className="pxst rcgo" onClick={() => A.rcGoList(nd ? 0 : 1)}><span><b>Xử lý {need} ca lệch</b><br /><span>{nd} ca doanh thu · {nx} phiếu xuất</span></span><i>›</i></button>
          : <button className="pxst rcgo" onClick={() => A.rcTab(5)}><span><b>✓ Đã xử lý hết — lập Phụ lục 01</b><br /><span>Bước tiếp theo: xuất báo cáo đối chiếu</span></span><i>›</i></button>}
      </section>
      {rcKyCard()}{rcKyTable()}
      <div className="rck-g">{kp('Tổng doanh thu (VND)', rcF(s.rev), '', '', [0, 2, ''])}{kp('Giá trị xuất kho (VND)', rcF(s.val), s.rev ? 'Bằng ' + fp(s.val / s.rev * 100) + '% doanh thu' : '', '', [1, 2, ''])}</div>
      <div className="rck-g q">{kp('Ca cần xử lý (DT)', nd, '', nd ? 'red' : 'green', [0, 1, ''])}{kp('Phiếu xuất cần xử lý', nx, '', nx ? 'red' : 'green', [1, 1, ''])}
        {kp('Phiếu xuất SAI VẬT TƯ', s.badVt, '', s.badVt ? 'red' : 'green', [1, 0, 'XUẤT SAI VẬT TƯ'])}{kp('Ca đã duyệt – hợp lệ', s.apprD, '', '', [0, 4, ''])}</div>
      {rcAcc('sum1', 'Phân loại trạng thái', rcTbl(['Trạng thái', 'Nguồn', 'Số lượt'], stt.map((t) => { const c = t[1] === 'DT' ? cnt(s.F, (o) => o.T === t[0]) : cnt(s.X, (x) => x.P.indexOf(t[0]) === 0); return [rcBadge(t[0]), t[1], c]; }), 2), 1)}
      {rcAcc('sum2', 'Theo cơ sở', rcTbl(['Cơ sở', 'Khớp', 'Lệch', 'Xuất chưa DT', 'Giá trị lệch'], rcCsList().map((c) => { const F = s.F.filter((o) => o.cs === c); let v = 0; F.forEach((o) => { v += o.R; }); return [c, cnt(F, (o) => o.T === 'KHỚP'), cnt(F, (o) => o.bad), cnt(s.X, (x) => x.cs === c && x.P === 'XUẤT CHƯA CÓ DOANH THU'), rcF(v)]; }), 1), 1)}
      {rcAcc('sum3', 'Theo vật tư', rcTbl(['Vật tư', 'Tổng ca', 'Khớp', 'Chưa xuất', 'Sai VT', 'Sai SL', 'Xuất chưa DT', 'Chênh SL', 'Đánh giá'], vr, 1), 0)}
      {rcAcc('sum4', 'Xuất kho theo tháng (toàn kỳ)', rcTbl(['Tháng', 'Số phiếu', 'Giá trị xuất (VND)'], mo, 1), 0)}
    </>
  );
}

/* ===== Ca lệch ===== */
export function rcSelN(side, j, k, opts, cur) {
  return (
    <select className="inp" value={cur || ''} onChange={(e) => A.rcNote(side, j, k, e.target.value)}>
      {opts.map((o, i) => <option key={i} value={i ? o : ''}>{o}</option>)}
    </select>
  );
}
export function rcChipsHtml(side, q) {
  return RC_ONLY.map((p) => <button key={p[0]} className={'rcchip' + (RC.only === p[0] ? ' on' : '')} onClick={() => A.rcS(4, p[0])}>{p[1]} <b>{rcListRows(side, p[0], q).length}</b></button>);
}
export function rcListBody(side, q) {
  const R = rcDb(), rows = rcListRows(side, RC.only, q);
  return (
    <>
      <div style={st('font-size:13px;color:var(--mut);margin-bottom:8px')}>{rows.length} ca{rows.length > RC.lim ? ' · đang hiện ' + RC.lim : ''}</div>
      {!rows.length ? <div className="card" style={st('text-align:center;color:var(--mut)')}>Không có ca nào trong bộ lọc này</div> : null}
      {rows.slice(0, RC.lim).map((o) => {
        const r = o.r, d = side == 0, jj = d ? o.j : o.i, n = R.notes[o.nid] || {}, ex = [];
        const AB = (key, args, label) => <button key={key} className="btn btn-outline" style={st('padding:7px;margin-top:6px;font-size:12.5px')} onClick={() => A.rcAcc(...args)}>{label}</button>;
        if (d && o.wrong && o.wrong.length && o.ri >= 0) o.wrong.forEach((w, k) => { ex.push(AB('w' + k, [0, jj, k], '✓ Cùng loại, chỉ khác tên → chấp nhận «' + (w.ten || w.ma) + '»')); });
        if (!d && o.exp && o.exp.length) o.exp.forEach((e, k) => { if (e.ri >= 0) ex.push(AB('e' + k, [1, jj, k], '✓ Cùng loại, chỉ khác tên → chấp nhận cho «' + e.ten + '»')); });
        const stt = o.ok ? 'Hợp lệ (đã duyệt)' : (d ? (o.none ? o.T : (o.first ? o.T : 'Đã gộp vào ca đầu')) : o.P);
        const has = n.r || n.g || n.st, sc = n.st === 'Đã duyệt' ? 'green' : n.st === 'Không duyệt' ? 'red' : 'amber';
        return (
          <div key={(d ? 'd' : 'x') + o.i + '|' + o.nid + '|' + o.j} className="card rccard" style={st('margin-bottom:10px;padding:12px;--c:var(--' + (o.ok || stt === 'KHỚP' || stt === 'Hợp lệ (đã duyệt)' ? 'green' : (o.need ? 'red' : 'amber')) + ')')}>
            <div style={st('display:flex;justify-content:space-between;gap:8px;align-items:flex-start')}><b style={st('font-size:14px')}>{d ? (r.kh || '—') : (r.so || r.ten)}</b>{rcBadge(stt)}</div>
            <div style={st('font-size:12.5px;color:var(--mut);margin-top:3px')}>{o.cs} · {o.pid || 'không có PID'} · {rcDStr(r.ngay) || r.ngay || ''}</div>
            {d ? rcCmpD(o) : rcCmpX(o)}{ex}
            {n.chg ? <div style={st('margin:8px 0;padding:8px 10px;border-radius:10px;background:var(--amber-bg);color:var(--amber);font-size:12.5px')}>⚠ Đã duyệt nhưng kết quả đối chiếu đổi sau khi nhập dữ liệu mới<br />{n.chg}<br /><a onClick={() => A.rcChgOk(side, jj)} style={st('color:var(--teal);font-weight:700')}>Giữ nguyên duyệt</a></div> : null}
            {!(d && o.none) ? (
              <details className="rcnt" open={!!(has || o.need)}><summary>✍ Giải trình / xử lý <span className={'rcb rcb-' + sc}>{n.st || 'Chưa xử lý'}</span></summary>
                <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px')}>{rcSelN(side, jj, 0, ['Mã lý do'].concat(d ? RC_LD : RC_LX), n.r)}{rcSelN(side, jj, 2, ['Trạng thái xử lý'].concat(RC_ST), n.st)}</div>
                <input key={'g' + side + '|' + jj + '|' + (n.g || '')} className="inp" placeholder="Giải trình" {...rcChg(n.g || '', (v) => A.rcNote(side, jj, 1, v))} />
                {n.by ? <div style={st('font-size:11.5px;color:var(--mut2);margin-top:4px')}>{n.by} · {n.at || ''}</div> : null}
              </details>
            ) : null}
            <div className="rcbtns"><button className="btn btn-outline" onClick={() => A.rcRow(side, o.i)}>{I('edit', 15)}Sửa / khớp tay</button><button className="btn rcdel" onClick={() => A.rcRowDel(side, o.i)}>{I('trash', 15)}Xóa</button></div>
          </div>
        );
      })}
      {rows.length > RC.lim ? <button className="btn btn-outline" onClick={() => A.rcMore()}>Xem thêm ({rows.length - RC.lim} ca còn lại)</button> : null}
    </>
  );
}
export function rcViewList() {
  const side = RC.side, q = rcK(RC.q);
  return (
    <>
      {RC.from ? <button className="btn btn-outline" style={st('margin-bottom:10px')} onClick={() => A.rcBackSum()}>‹ Về Tổng quan</button> : null}
      {rcFilter()}
      <div className="rcsubnav"><button className={side == 0 ? 'on' : ''} onClick={() => A.rcS(3, 0)}>Doanh thu → xuất kho</button><button className={side == 1 ? 'on' : ''} onClick={() => A.rcS(3, 1)}>Xuất kho → doanh thu</button></div>
      <input className="inp" id="rcq" type="search" placeholder="Tìm PID, khách hàng, vật tư, số CT…" defaultValue={RC.q} ref={syncRef(RC.q)} onChange={(e) => A.rcSearch(e.target.value)} style={st('margin-bottom:10px')} />
      <div className="rcchips" id="rcchips">{rcChipsHtml(side, q)}</div>
      <div className="rcact"><button className="btn btn-outline" onClick={() => A.rcRow(side, -1)}>{I('plus', 15)}{side ? 'Thêm phiếu xuất' : 'Thêm dòng DT'}</button><button className="btn btn-outline" onClick={() => A.rcExportDiff()}>{I('download', 15)}Xuất ca lệch</button></div>
      <div id="rclist">{rcListBody(side, q)}</div>
    </>
  );
}

/* ===== Kiểm tra dữ liệu ===== */
export function rcViewChk() {
  const Z = S.RC_RES, std = {}; Z.M.cs.forEach((r) => { std[rcK(r[1])] = 1; std[rcK(r[0])] = 1; });
  const c = (a, f) => a.filter(f).length;
  let nSvc = 0; Z.svcMiss.forEach((m) => { nSvc += m[1]; });
  const L = [['Phiếu xuất THIẾU mã PID', c(Z.xk, (x) => x.P.indexOf('THIẾU MÃ KH') === 0), 'Bổ sung PID vào cột Mã KH (hoặc diễn giải) của phiếu xuất, hoặc duyệt ca.'],
    ['Dòng doanh thu THIẾU mã KH (PID)', c(Z.dt, (o) => o.T === 'THIẾU MÃ KH (PID)'), 'Bổ sung mã KH ở file doanh thu — thiếu PID thì không đối chiếu được.'],
    ['Dịch vụ (doanh thu) CHƯA cấu hình vật tư', nSvc, 'Vào Cấu hình → thêm dịch vụ và vật tư xuất (hoặc để trống vật tư nếu dịch vụ không xuất kho).'],
    ['Vật tư xuất kho CHƯA có trong cấu hình', c(Z.xk, (x) => !x.skip && !x.vid), 'Thêm vật tư vào Cấu hình, hoặc nhập vào ô “Mã / tên thay thế” của dịch vụ liên quan.'],
    ['Cơ sở lạ ở Xuất kho', c(Z.xk, (x) => x.cs && !std[rcK(x.cs)]), 'Thêm cách viết cơ sở vào Cấu hình → Chuẩn hóa cơ sở.'],
    ['Cơ sở lạ ở Doanh thu', c(Z.rows, (o) => o.cs && !std[rcK(o.cs)]), 'Thêm cách viết cơ sở vào Cấu hình → Chuẩn hóa cơ sở.'],
    ['Xuất kho TRÙNG/THỪA', c(Z.xk, (x) => x.P === 'TRÙNG/THỪA XUẤT'), 'Rà chứng từ, kiểm tra xuất lặp.'],
    ['Phiếu xuất SAI VẬT TƯ', c(Z.xk, (x) => x.P === 'XUẤT SAI VẬT TƯ'), 'Khách có doanh thu nhưng vật tư xuất không thuộc định mức dịch vụ. Nếu chỉ khác tên → bấm “chấp nhận” ở tab Ca lệch.']];
  return (
    <div className="card"><div className="sec">Kiểm tra chất lượng dữ liệu (chạy trước khi chốt tháng)</div>
      {rcTbl(['Hạng mục', 'SL', 'Tình trạng'], L.map((r, k) => [
        <>{r[0]}<div style={st('font-size:11.5px;color:var(--mut2)')}>{r[2]}</div></>,
        r[1],
        r[1] ? <><span className="rcb rcb-red">⚠ Cần sửa</span> <a onClick={() => A.rcGo(k)} style={st('color:var(--teal);font-weight:700;white-space:nowrap')}>Xử lý ›</a></> : <span className="rcb rcb-green">✔ OK</span>,
      ]), 1)}
    </div>
  );
}

/* ===== Cấu hình ===== */
export function rcViewMap() {
  let m = RC.map; if (!RC_MAPS[m]) m = RC.map = 'cfg';
  return (
    <>
      <div className="card" style={st('margin-bottom:12px')}><div className="rcsec">Cấu hình đối chiếu</div>{rcSel(6, Object.keys(RC_MAPS).map((k) => [k, RC_MAPS[k][0]]), m)}</div>
      {m === 'cfg' ? rcViewCfg() : rcViewMapGen()}
    </>
  );
}
export function rcViewCfg() {
  const R = rcDb(), Z = S.RC_RES, O = R.opt, q = rcK(RC.q);
  const HUES = [210, 150, 28, 280, 350, 175, 45, 320], G = [], gm = {};
  R.cfg.forEach((c, i) => { const k = norm(c.dv) || '(trống)'; if (!gm[k]) { gm[k] = { k, dv: c.dv || '(chưa có tên)', ix: [] }; G.push(gm[k]); } gm[k].ix.push(i); });
  RC.cfgG = G.map((g) => g.k);
  const vis = G.filter((g) => !q || g.ix.some((i) => { const c = R.cfg[i]; return smatch(norm([c.dv, c.ma, c.ten, c.alt].join(' ')), stok(q)); }));
  const fld = (i, f, lab, span, extra, sty) => {
    const c = R.cfg[i], val = c[f] == null ? '' : c[f];
    return <div className="rcf" style={{ gridColumn: 'span ' + span }}><div className="l">{lab}</div><input key={i + '|' + f + '|' + val + '|' + (RC._rev || 0)} style={st(sty || '')} {...(extra || {})} {...rcChg(val, (v) => A.rcCfgEdit(i, f, v))} /></div>;
  };
  return (
    <>
      <div className="card" style={st('margin-bottom:12px')}><div className="rcsec">Quy tắc khớp</div><div className="rcnote" style={st('line-height:1.6')}>Một ca <b>KHỚP</b> khi đủ 3 điều kiện:<br />① đúng <b>mã khách hàng (PID)</b><br />② đúng <b>vật tư xuất</b> — mã hoặc tên đã cấu hình cho dịch vụ đó (kể cả mã/tên thay thế)<br />③ đúng <b>số lượng</b> = định mức × SL dịch vụ</div>
        <label style={st('display:flex;align-items:center;gap:8px;padding:8px 0 0')}><input type="checkbox" checked={!!O.cs} onChange={(e) => A.rcOpt('cs', e.target.checked)} /><span style={st('font-size:13px')}>Yêu cầu thêm: cùng cơ sở</span></label>
        <label style={st('display:flex;align-items:center;gap:8px;padding:6px 0 0')}><input type="checkbox" checked={!!O.th} onChange={(e) => A.rcOpt('th', e.target.checked)} /><span style={st('font-size:13px')}>Yêu cầu thêm: cùng tháng</span></label></div>
      <div className="card" style={st('margin-bottom:12px')}><div className="rcsec">Định mức dịch vụ → vật tư xuất ({R.cfg.length} dòng)</div>
        <div className="rcnote" style={st('margin-bottom:8px')}>Dịch vụ giống tên đầy đủ thì ưu tiên; không thì lấy từ khóa dài nhất nằm trong tên dịch vụ. Một dịch vụ cần nhiều vật tư → thêm nhiều dòng cùng dịch vụ. Để trống mã + tên vật tư = dịch vụ không đối chiếu vật tư.</div>
        <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px')}><button className="btn btn-outline" onClick={() => A.rcCfgTpl()}>{I('download', 16)}Tải file mẫu / xuất cấu hình</button><label className="btn btn-outline">{I('upload', 16)}Nhập – thay thế<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => A.rcCfgFile(e.target, 'replace')} /></label></div>
        <label className="btn btn-outline" style={st('margin-bottom:12px')}>{I('upload', 16)}Nhập – nối thêm (bỏ dòng trùng)<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => A.rcCfgFile(e.target, 'append')} /></label>
        <div style={st('font-weight:700;font-size:13px;margin-bottom:6px')}>Thêm dòng cấu hình</div>
        <div className="rcgrid" style={st('margin-bottom:10px')}>
          {[[0, 2], [2, 2], [1, 1], [3, 1], [4, 2], [5, 1]].map((o) => {
            const i = o[0], f = RC_CF[i];
            const ex = {}; if (f[0] === 'dm') { ex.inputMode = 'decimal'; ex.placeholder = '1'; } else if (f[0] === 'gia') ex.inputMode = 'decimal';
            if (f[0] === 'dv') ex.list = 'rcdl-dv'; else if (f[0] === 'ten') ex.list = 'rcdl-vt';
            return <div key={i} className="rcf" style={{ gridColumn: 'span ' + o[1] }}><div className="l">{f[1]}</div><input key={'rcm' + i + '|' + R.cfg.length} id={'rcm' + i} style={st('padding:8px 10px;font-size:13px')} {...ex} /></div>;
          })}
        </div>
        <datalist id="rcdl-dv">{Z.svcMiss.slice(0, 60).map((m) => <option key={m[0]} value={m[0]} />)}</datalist><datalist id="rcdl-vt">{rcNames().map((n) => <option key={n} value={n} />)}</datalist>
        <button className="btn btn-primary" onClick={() => A.rcCfgAdd()}>{I('plus', 16)}Thêm vào cấu hình</button></div>
      {Z.svcMiss.length ? (
        <div className="card" style={st('margin-bottom:12px')}><div className="rcsec">Dịch vụ trong doanh thu chưa có định mức ({Z.svcMiss.length})</div><div className="rcnote" style={st('margin-bottom:8px')}>Bấm để điền sẵn vào ô “Dịch vụ” ở form thêm phía trên.</div><div style={st('display:flex;flex-wrap:wrap;gap:6px')}>
          {Z.svcMiss.slice(0, 15).map((m, k) => <button key={k} className="pill" style={st('white-space:normal;text-align:left;font-size:12px')} onClick={() => A.rcPick(k)}>{m[0].length > 60 ? m[0].slice(0, 58) + '…' : m[0]} ({m[1]})</button>)}</div></div>
      ) : null}
      <div className="card" style={st('margin-bottom:14px')}><div className="rcsec">Danh sách dịch vụ · {G.length} dịch vụ / {R.cfg.length} dòng vật tư</div>
        <div className="rcnote" style={st('margin-bottom:8px')}>Mỗi khối = 1 dịch vụ (tiêu đề đậm, có số thứ tự). Bấm vào tiêu đề để mở và sửa vật tư xuất của dịch vụ đó.</div>
        <input className="inp" placeholder="Lọc theo dịch vụ / vật tư…" style={st('margin-bottom:8px')} key={'cfgq|' + RC.q} {...rcChg(RC.q, (v) => A.rcS(2, v))} />
        <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}><button className="btn btn-outline" style={st('padding:8px')} onClick={() => A.rcCfgAll(true)}>Mở tất cả</button><button className="btn btn-outline" style={st('padding:8px')} onClick={() => A.rcCfgAll(false)}>Thu gọn tất cả</button></div></div>
      <div className="rcl">
        {vis.slice(0, RC.lim).map((g) => {
          const gi = G.indexOf(g), hue = HUES[gi % HUES.length], open = !!RC.co[g.k] || (!!q && vis.length <= 8);
          return (
            <details key={g.k} className="rcg" open={open} onToggle={(e) => A.rcCfgOpen(gi, e.target.open)} style={st('--hc:hsl(' + hue + ',68%,44%);--hc-d:hsl(' + hue + ',55%,34%);--hbg:hsla(' + hue + ',75%,50%,.12)')}>
              <summary><div className="rcg-top"><span className="rcg-no">{gi + 1}</span><div className="rcg-t">{g.dv}</div></div><div className="rcg-sub"><span>Vật tư xuất:</span>
                {g.ix.map((i) => { const c = R.cfg[i], nm = c.ten || c.ma; return <span key={i} className="rcg-chip">{nm ? nm + ' ×' + rcDm(c) : <i style={st('font-weight:500')}>không dùng vật tư</i>}</span>; })}</div></summary>
              <div className="rcg-body">
                {g.ix.map((i, n) => (
                  <div key={i} className="rcg-vt"><div className="rcg-vh">Vật tư xuất {n + 1}/{g.ix.length}</div><div className="rcgrid">
                    {fld(i, 'ten', 'Tên vật tư xuất', 2, null, 'font-weight:700')}{fld(i, 'ma', 'Mã vật tư', 1)}{fld(i, 'dm', 'Định mức (SL / 1 dịch vụ)', 1, { inputMode: 'decimal' })}
                    {fld(i, 'alt', 'Mã / tên thay thế (cách nhau bằng ;)', 2)}{fld(i, 'gia', 'Đơn giá (tuỳ chọn)', 1, { inputMode: 'decimal' })}
                    <div style={st('display:flex;align-items:flex-end;justify-content:flex-end')}><a onClick={() => A.rcCfgDel(i)} style={st('color:var(--red);font-size:12px;padding:6px 0')}>Xóa vật tư này</a></div></div></div>
                ))}
                <div className="rcg-act"><button onClick={() => A.rcCfgAddIn(gi)}>+ Thêm vật tư</button><button onClick={() => A.rcCfgRen(gi)}>✎ Đổi tên</button><button style={st('color:var(--red)')} onClick={() => A.rcCfgDelG(gi)}>Xóa dịch vụ</button></div></div>
            </details>
          );
        })}
      </div>
      {!vis.length ? <div className="empty">Không có dịch vụ nào khớp bộ lọc.</div> : null}
      {vis.length > RC.lim ? <button className="btn btn-outline" onClick={() => A.rcMore()}>Xem thêm</button> : null}
      <button className="btn btn-outline" style={st('margin-top:14px')} onClick={() => A.rcCfgReset()}>Khôi phục cấu hình mặc định</button>
    </>
  );
}
export function rcViewMapGen() {
  const R = rcDb(), m = RC.map, L = RC_MAPS[m], q = rcK(RC.q), rows = [];
  R.maps[m].forEach((r, i) => {
    if (!q || smatch(norm(r.join(' ')), stok(q))) rows.push(r.map((x, j) => <input key={i + '|' + j + '|' + x + '|' + (RC._rev || 0)} className="inp" style={st('padding:7px 8px;font-size:13px;min-width:120px')} {...rcChg(x, (v) => A.rcMapEdit(i, j, v))} />).concat([<a key="del" onClick={() => A.rcMapDel(i)} style={st('color:var(--red)')}>Xóa</a>]));
  });
  const inputs = []; for (let i = 1; i < L.length; i++) inputs.push(<input key={'rcm' + (i - 1) + '|' + m + '|' + R.maps[m].length} className="inp" id={'rcm' + (i - 1)} placeholder={L[i]} />);
  return (
    <div className="card"><div className="rcsec">{L[0]}</div>
      {m === 'dm' ? <div className="rcnote" style={st('margin:0 0 8px')}>Dịch vụ chứa từ khóa → SL cần = số này (ví dụ All-on-4 = 4 trụ), thay cho định mức × SL dịch vụ. Dòng nằm DƯỚI thắng.</div> : <div className="rcnote" style={st('margin:0 0 8px')}>Gộp các cách viết khác nhau của cơ sở về một tên chuẩn.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + (L.length - 1) + ',1fr)', gap: '6px', marginBottom: '8px' }}>{inputs}</div>
      <button className="btn btn-primary" style={st('margin-bottom:12px')} onClick={() => A.rcMapAdd()}>{I('plus', 16)}Thêm dòng</button>
      <input className="inp" placeholder="Lọc…" style={st('margin-bottom:8px')} key={'mgq|' + RC.q} {...rcChg(RC.q, (v) => A.rcS(2, v))} />
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:6px')}>{rows.length} dòng</div>
      {rcTbl(L.slice(1).concat(['']), rows.slice(0, RC.lim), L.length)}
      {rows.length > RC.lim ? <button className="btn btn-outline" style={st('margin-top:8px')} onClick={() => A.rcMore()}>Xem thêm</button> : null}
      <button className="btn btn-outline" style={st('margin-top:12px')} onClick={() => A.rcMapReset()}>Khôi phục bảng này về bản gốc</button></div>
  );
}

/* ===== Nhập / Xuất ===== */
export function rcViewImp() {
  const R = rcDb();
  const tpl = (<><div style={st('font-size:12.5px;color:var(--mut);margin-bottom:10px')}>Tải mẫu, dán dữ liệu MISA vào đúng cột rồi nhập lại. App đọc theo <b>tên cột</b> nên không sợ lệch vị trí. Mẫu có sheet hướng dẫn và dòng “VÍ DỤ” (tự bỏ qua khi nhập).</div>
    <button className="btn btn-primary" onClick={() => A.rcTpl()}>{I('download', 17)}Tải mẫu nhập liệu (Doanh thu + Xuất kho)</button></>);
  const inp = (
    <>
      <div className="rcnote" style={st('margin-bottom:8px')}>Nhập file áp dụng cho <b>toàn bộ cơ sở</b>, không phụ thuộc phạm vi xuất ở trên: app đọc theo cột <b>Cơ sở</b> trong file.</div>
      <div style={st('font-size:12.5px;color:var(--mut);margin-bottom:10px')}>Đang có {R.dt.length} dòng doanh thu, {R.xk.length} dòng xuất kho.</div>
      {rcSel(5, [['replace', 'Thay thế dữ liệu cũ'], ['append', 'Nối thêm (bỏ dòng trùng)'], ['update', 'Bổ sung / điều chỉnh (sửa dòng đã có, thêm dòng mới)']], RC.mode)}
      <div className="rcnote" style={st('margin-top:8px;line-height:1.55')}>
        {RC.mode === 'update' ? <><b>Bổ sung / điều chỉnh</b>: dòng đã có (cùng khách + ngày + dịch vụ, hoặc cùng số CT + vật tư + ngày) được <b>sửa theo file</b>, dòng mới được thêm, dòng cũ không có trong file giữ nguyên. Giải trình và duyệt được giữ.</>
          : RC.mode === 'append' ? <><b>Nối thêm</b>: chỉ thêm dòng chưa có, không sửa dòng cũ. Nếu file là bản đã điều chỉnh số liệu, hãy dùng “Bổ sung / điều chỉnh”.</>
          : <><b>Thay thế</b>: dùng đúng dữ liệu trong file. Dòng trùng khóa (khách + ngày + dịch vụ / số CT + vật tư) vẫn giữ giải trình và duyệt cũ.</>}
        <br />Nhập xong app <b>tự đối chiếu lại</b>, hiện bảng so sánh trước → sau và cho phép <b>Hoàn tác</b>.</div>
      <label className="btn btn-primary" style={st('margin-top:10px')}>{I('upload', 17)}File mẫu chuẩn (cả 2 sheet)<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => A.rcFile(e.target, 0)} /></label>
      <label className="btn btn-outline" style={st('margin-top:8px')}>Chỉ Doanh thu<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => A.rcFile(e.target, 1)} /></label>
      <label className="btn btn-outline" style={st('margin-top:8px')}>Chỉ Xuất kho<input type="file" accept=".xlsx,.xls,.csv" style={st('display:none')} onChange={(e) => A.rcFile(e.target, 2)} /></label>
    </>
  );
  const out = (
    <>
      {rcScopeLine()}<button className="btn btn-primary" style={st('margin-bottom:8px')} onClick={() => A.rcExport()}>{I('download', 17)}Tải Excel kết quả đối chiếu</button><button className="btn btn-primary" style={st('margin-bottom:8px')} onClick={() => A.rcExportDiff()}>{I('download', 17)}Xuất Excel ca chênh lệch (để giải trình)</button><button className="btn btn-outline" onClick={() => A.rcPrint()}>{I('file', 17)}Biên bản (in / PDF)</button>
      <div style={st('font-size:12px;color:var(--mut);margin-top:8px')}>Mọi nút xuất / in đều theo phạm vi Cơ sở / Tháng đang chọn. Phụ lục có thêm bộ lọc Năm (hiện: {RC.yr && RC.yr !== 'Tất cả' ? 'Năm ' + RC.yr : 'Mọi năm'}), đổi tại Đối chiếu → Phụ lục 01.</div>
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px')}><button className="btn btn-outline" style={st('padding:10px')} onClick={() => A.rcApxXlsx()}>{I('download', 16)}Phụ lục từng kho (Excel)</button><button className="btn btn-outline" style={st('padding:10px')} onClick={() => A.rcApxPrint()}>{I('file', 16)}Phụ lục từng kho (in / PDF)</button></div>
    </>
  );
  const paste = (
    <>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:8px')}>Copy vùng dữ liệu KÈM DÒNG TIÊU ĐỀ (đúng tên cột như file mẫu) rồi dán vào ô dưới. Không kèm tiêu đề thì app hiểu theo thứ tự cột MISA cũ. Dùng chế độ Thay thế / Nối thêm ở trên.</div>
      <textarea id="rcpaste" className="inp" rows={5}></textarea>
      <div style={st('display:flex;gap:8px;margin-top:8px')}><button className="btn btn-primary" onClick={() => A.rcPaste(0)}>Dán vào Doanh thu</button><button className="btn btn-primary" onClick={() => A.rcPaste(1)}>Dán vào Xuất kho</button></div>
      <div style={st('display:flex;gap:8px;margin-top:8px')}><button className="btn btn-outline" style={st('color:var(--red)')} onClick={() => A.rcClear(0)}>Xóa hết doanh thu</button><button className="btn btn-outline" style={st('color:var(--red)')} onClick={() => A.rcClear(1)}>Xóa hết xuất kho</button></div>
    </>
  );
  return (
    <>
      {rcFilter('export')}{X.rcImpCard()}
      {rcAcc('imp-in', 'Nhập dữ liệu', inp, 1)}
      {rcAcc('imp-out', <>Xuất kết quả &amp; phụ lục{rcScopePill()}</>, out, 1)}
      {rcAcc('imp-tpl', 'File mẫu chuẩn', tpl, 0)}
      {rcAcc('imp-paste', 'Dán dữ liệu từ MISA / Excel', paste, 0)}
    </>
  );
}

/* ===== Màn hình chính (view `recon`) ===== */
export const renderRecon = () => rerender();
export function ReconView() {
  const R = rcDb();
  S.RC_RES = rcCompute();
  const T = RC.tab;
  let body;
  if (!R.dt.length && !R.xk.length && (T < 2 || T === 5 || T === 6)) {
    body = <div className="card" style={st('margin-bottom:12px')}><div style={st('font-weight:700;margin-bottom:4px')}>Chưa có dữ liệu</div><div style={st('font-size:13px;color:var(--mut);margin-bottom:10px')}>Vào Dữ liệu → Nhập / Xuất file: tải file mẫu chuẩn, điền doanh thu + xuất kho rồi nhập vào.</div><button className="btn btn-primary" onClick={() => A.rcTab(4)}>Nhập dữ liệu</button></div>;
  } else if (T === 0) body = rcViewSum();
  else if (T === 1) body = rcViewList();
  else if (T === 2) body = rcViewChk();
  else if (T === 3) body = rcViewMap();
  else if (T === 4) body = rcViewImp();
  else if (T === 5) body = X.rcViewApx();
  else if (T === 6) body = rcViewMapX();
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('dchub')}>‹</button><div className="ttl">Đối chiếu doanh thu – xuất kho</div></div>{rcNav()}</div>
      <div className="wrap" style={st('padding-top:12px;padding-bottom:50px')}>
        {rcSubNav()}
        {(T < 2 || T === 6) ? rcQuickBar() : null}
        {body}
      </div>
    </>
  );
}
