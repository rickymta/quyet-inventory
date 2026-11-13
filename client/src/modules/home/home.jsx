/* Trang Tổng quan (view `home`): renderHomeOld (4536) + fcHello/fcMobTask/v2Hub (7778) + thẻ chèn thêm (8187) */
import { useEffect } from 'react';
import { db, A, X, S, I, H, FcIco, fcKey, BUCKETS, hsdEntries, klog, rerender, st, can, canEdit } from '../../core';
import { homeMonthCard } from './meter.jsx';

export const KIC = { expired: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>' };
export const KCAL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h2"/></svg>';

/* ---- Nhắc tài sản chưa xuất Excel ---- */
export function homeNoticesHtml() {
  const out = [];
  if (!can('assets')) return out;
  (db.assets || []).forEach((p) => {
    const q = typeof X.asPending === 'function' ? X.asPending(p) : { n: 0, last: 0 };
    if (q.n && Date.now() - q.last > 30 * 60000) {
      out.push(
        <div className="wrap mt12" key={'as' + p.id}><div className="note-warn" style={st('display:flex;gap:10px;align-items:center')} onClick={() => X.ASX.openP(p.id)}>{I('warn', 18)}<div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{p.name}: {q.n} tài sản chưa xuất Excel</div><div style={{ fontSize: 12 }}>Chạm để mở kỳ kiểm kê và xuất file.</div></div></div></div>,
      );
    }
  });
  return out;
}

/* ---- Chào, việc cần xử lý ---- */
export function fcAgo(t) { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); if (m < 1) return 'Vừa xong'; if (m < 60) return m + ' phút trước'; if (m < 1440) return Math.round(m / 60) + ' giờ trước'; return Math.round(m / 1440) + ' ngày trước'; }
const TOOTH = '<svg class="fc-tooth" viewBox="0 0 150 110" aria-hidden="true"><ellipse cx="75" cy="66" rx="66" ry="13" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" transform="rotate(-10 75 66)"/><path d="M52 14c-14 0-24 10-24 25 0 11 5 18 8 29 3 10 5 24 12 24 8 0 8-18 14-29 2-4 5-4 7 0 6 11 6 29 14 29 7 0 9-14 12-24 3-11 8-18 8-29 0-15-10-25-24-25-8 0-13 4-17 4s-9-4-17-4z" fill="#fff" stroke="#c9d4ea" stroke-width="1.5"/><ellipse cx="75" cy="66" rx="66" ry="13" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2.2" stroke-dasharray="70 200" stroke-dashoffset="-120" transform="rotate(-10 75 66)"/></svg>';
const AVATAR = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="9" r="3.6"/><path d="M5 20c.8-3.6 3.7-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>';
export function fcHello() {
  const pr = db.profile || {}; const nm = pr.ten || ''; const d = new Date(); const n = nm || 'bạn';
  return (
    <>
      <div className="fc-hero"><span className="fc-av">{H(AVATAR)}</span><div className="fc-hi"><small>Xin chào</small><b>{n}</b></div><span className="fc-dt">{d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span></div>
      <div className="fc-ban"><div><h2>Xin chào, <b>{n}</b> 👋</h2><p>Chào mừng bạn trở lại MedDental Prime</p></div>{H(TOOTH)}</div>
    </>
  );
}
export function v2Hub() { return null; /* đã bỏ banner Quét mã nhanh */ }

/* ---- Tỷ lệ tiêu hao vật tư ---- */
export function fcRatePts() {
  let o = []; const RC = X.RC; const cs = RC.cs; const th = RC.th; const cm = new Date().getMonth() + 1;
  try {
    S.RC_RES = X.rcCompute(); RC.cs = 'Tất cả';
    for (let k = 5; k >= 0; k--) { const m = (cm - 1 - k + 12) % 12 + 1; RC.th = String(m); const z = X.rcSum(); o.push({ m, v: z.rev > 0 ? z.val / z.rev * 100 : null }); }
  } catch (e) { o = []; }
  RC.cs = cs; RC.th = th; return o;
}
export function fcRate() {
  if (!can('recon')) return null;
  let C = window.__fcR; if (!C || Date.now() - C.t > 60000) C = window.__fcR = { t: Date.now(), p: fcRatePts() };
  const P = C.p; const V = P.filter((x) => x.v != null); const d = new Date(); const f = (v) => v.toFixed(1).replace('.', ',');
  const head = <div className="fc-ph">Tỷ lệ tiêu hao vật tư<span className="fcm">Tháng {d.getMonth() + 1}/{d.getFullYear()}</span></div>;
  if (V.length < 2) return <div className="fc-pn fc-rate">{head}<div className="fc-empty">Chưa đủ dữ liệu: nạp doanh thu và xuất kho ở mục Đối chiếu để xem xu hướng 6 tháng.</div></div>;
  const L = V[V.length - 1]; const B = V[V.length - 2]; const df = L.v - B.v; const W = 360; const Hh = 150; const x0 = 24; const x1 = W - 24; const y0 = 34; const y1 = Hh - 30;
  const lo = Math.min.apply(null, V.map((a) => a.v)); const hi = Math.max.apply(null, V.map((a) => a.v)); const sp = (hi - lo) || 1;
  const XX = (i) => x0 + (x1 - x0) * i / (P.length - 1); const YY = (v) => y1 - (y1 - y0) * (v - lo) / sp;
  let pa = ''; const pt = []; const lb = [];
  P.forEach((a, i) => {
    lb.push(<text key={'l' + i} x={XX(i)} y={Hh - 8} textAnchor="middle" className="fx">T{a.m}</text>);
    if (a.v == null) return;
    pa += (pa ? 'L' : 'M') + XX(i).toFixed(1) + ' ' + YY(a.v).toFixed(1);
    const last = a === L;
    if (last) {
      pt.push(<rect key={'r' + i} x={XX(i) - 27} y={YY(a.v) - 30} width="54" height="20" rx="6" fill="#1e3a6b" />);
      pt.push(<text key={'t' + i} x={XX(i)} y={YY(a.v) - 16} textAnchor="middle" className="fl">{f(a.v)}%</text>);
    } else pt.push(<text key={'t' + i} x={XX(i)} y={YY(a.v) - 10} textAnchor="middle" className="fx">{f(a.v)}%</text>);
    pt.push(<circle key={'c' + i} cx={XX(i)} cy={YY(a.v)} r="4" fill="#fff" stroke="#1e3a6b" strokeWidth="2" />);
  });
  return (
    <div className="fc-pn fc-rate">{head}
      <div className="fcbig"><b>{f(L.v)}%</b><span className={df <= 0 ? 'dn' : 'up'}>{df <= 0 ? '▼ −' : '▲ +'}{f(Math.abs(df))} điểm %</span></div>
      <svg viewBox={'0 0 ' + W + ' ' + Hh} className="fcsv" role="img" aria-label="Tỷ lệ tiêu hao 6 tháng"><path d={pa} fill="none" stroke="#1e3a6b" strokeWidth="2" strokeLinejoin="round" />{pt}{lb}</svg>
    </div>
  );
}

/* ---- Chênh lệch KPI so với snapshot (localStorage 'kk_kpi_snap'): tính khi vẽ, ghi snapshot trong effect ---- */
export function fcDelta(cur) {
  const td = new Date().toISOString().slice(0, 10); let Sn = {};
  try { Sn = JSON.parse(localStorage.getItem('kk_kpi_snap') || '{}'); } catch (e) { Sn = {}; }
  const deltas = cur.map((v, i) => {
    const p = Sn.date === td ? (Sn.prev && Sn.prev[i]) : (Sn.cur && Sn.cur[i]);
    if (p == null || p === v) return 0;
    return v - p;
  });
  const save = () => { try { localStorage.setItem('kk_kpi_snap', JSON.stringify(Sn.date === td ? { date: td, prev: Sn.prev || null, cur } : { date: td, prev: Sn.cur || null, cur })); } catch (e) { klog('kk_kpi_snap', e); } };
  return { deltas, save };
}
export function fcHdr() { /* lõi (Shell) đã lo tên chi nhánh và chuông thông báo */ }

/* ---- Lỗi báo nhập liệu/labo (db.err.items) ---- */
export function fcErrCnt() {
  let r = { en: 0, t: 0, o: 0 };
  try {
    const EI = (X.ER && X.ER.items) || (db.err && db.err.items) || []; const d0 = new Date();
    const td = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2);
    EI.forEach((x) => { if (x && x.nhac && x.st !== 'Đã xử lý') { r.en++; if (x.nhacNgay !== td) r.t++; if (x.han && x.han < td) r.o++; } });
  } catch (e) { r = { en: 0, t: 0, o: 0 }; }
  return r;
}
export function fcErrMsg(c) { return c.en + ' lỗi báo đang bật nhắc chưa xử lý' + (c.t ? ' · ' + c.t + ' chưa nhắc hôm nay' : '') + (c.o ? ' · ' + c.o + ' quá hạn' : ''); }
function goErr() { A.go('err'); if (X.ER && X.ER.nhacView) X.ER.nhacView(); }
export function fcMobTask() {
  if (!can('err')) return null;
  const c = fcErrCnt(); if (!c.en) return null;
  return <div className={'fc-mt' + (c.t || c.o ? ' hot' : '')} onClick={goErr}>{I('warn', 20)}<div><b>Công việc cần xử lý</b><span>{fcErrMsg(c)}</span></div><em>{c.en}</em></div>;
}

const svg16 = (d) => H('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>');
function payBad() {
  let nl = 0;
  try { if (db.pay && db.pay.mua && db.pay.mua.length) X.payCompute().forEach((g) => { if (g.bad) nl++; }); } catch (e) { klog('payCompute', e); }
  return nl;
}
export function fcPanels() {
  let en = []; let o = 0; const rows = []; const act = [];
  try { en = hsdEntries(); } catch (e) { /* bỏ qua */ }
  const ex = en.filter((e) => e.days < 0).length; const m1 = en.filter((e) => e.days >= 0 && e.days <= 30).length;
  try { o = db.periods.filter((p) => p.items.some((i) => !i.counted && i.close !== 0)).length; } catch (e) { /* bỏ qua */ }
  const nl = payBad();
  const ec = fcErrCnt(); const eN = ec.en; const eT = ec.t; const eO = ec.o;
  const row = (c, ic, tx, n, go, key) => <div className="fc-tr" key={key} onClick={go}><span className={'fc-ti ' + c}>{ic}</span><span className="fc-tx">{tx}</span><b className={'fc-tn ' + c}>{n}</b></div>;
  const I1 = svg16('<path d="M12 4 3 20h18Z"/><path d="M12 10v4M12 17v.5"/>');
  const I2 = svg16('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>');
  const I3 = svg16('<rect x="6" y="4" width="12" height="17" rx="3"/><path d="m9.5 12 1.8 1.8 3.2-3.6"/>');
  const I4 = svg16('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h5"/>');
  const cH = can('hsd'); const cK = can('kiemke'); const cP = can('pay'); const cE = can('err');
  if (cH && ex) rows.push(row('r', I1, 'Có ' + ex + ' vật tư đã hết hạn sử dụng', ex, () => A.go('hsd'), 'ex'));
  if (cH && m1) rows.push(row('a', I2, m1 + ' vật tư còn ≤ 1 tháng', m1, () => A.go('hsd'), 'm1'));
  if (cK && o) rows.push(row('i', I3, o + ' kỳ kiểm kê chưa hoàn thành', o, () => X.v2List(), 'o'));
  if (cP && nl) rows.push(row('p', I4, nl + ' đề nghị thanh toán NCC cần xử lý', nl, () => A.go('pay'), 'nl'));
  if (cE && eN) rows.push(row(eT || eO ? 'r' : 'a', I1, fcErrMsg(ec), eN, goErr, 'er'));
  const tot = (cH ? ex + m1 : 0) + (cK ? o : 0) + (cP ? nl : 0) + (cE ? eN : 0);
  (cK ? db.periods || [] : []).slice(0, 5).forEach((p, i) => {
    act.push(<div className="fc-tr" key={p.id || i}><span className="fc-ti i">{I3}</span><span className="fc-tx">Kiểm kê vật tư – {p.name || 'Kỳ kiểm kê'}</span><span className="fc-ago">{p.createdAt ? fcAgo(p.createdAt) : ''}</span></div>);
  });
  return (
    <>
      <div className="fc-pn"><div className="fc-ph">Công việc cần xử lý{tot ? <> <em>({tot})</em></> : null}</div>{rows.length ? rows : <div className="fc-empty">Không có công việc tồn đọng</div>}</div>
      <div className="fc-pn"><div className="fc-ph">Hoạt động gần đây</div>{act.length ? act : <div className="fc-empty">Chưa có hoạt động</div>}</div>
    </>
  );
}

/* ---- Màn hình ---- */
const tileS = 'display:flex;flex-direction:column;gap:8px;padding:13px 4px;line-height:1.25;font-size:13px';
function Tile({ ic, lb, act, bd }) {
  return (
    <button className="btn tile" style={st(tileS + ';position:relative')} onClick={act}>
      <span className="tic">{fcKey(lb) ? FcIco(fcKey(lb), 38) : I(ic, 24)}</span>{lb}
      {bd ? <b style={st('position:absolute;top:6px;right:8px;min-width:20px;padding:1px 6px;border-radius:99px;background:var(--red);color:#fff;font-size:11px')}>{bd}</b> : null}
    </button>
  );
}

const TILE_GROUPS = [
  { cap: 'Kiểm kê', cols: '1fr 1fr', tiles: [
    { m: 'kiemke', ed: 1, ic: 'box', lb: 'Kiểm kê vật tư', act: () => A.go('upload') },
    { m: 'assets', ic: 'monitor', lb: 'Kiểm kê CCDC & TSCĐ', act: () => A.go('assets') },
    { m: 'kiemke', ic: 'file', lb: 'Kỳ đang kiểm dở', act: () => X.v2List(), bd: 'open' },
    { m: 'kiemke', ic: 'qr', lb: 'Quét QR', act: () => X.v2Scan() },
  ] },
  { cap: 'Đối chiếu & thanh toán', cols: '1fr 1fr', tiles: [
    { m: 'recon', ic: 'swap', lb: 'Đối chiếu DT – xuất kho', act: () => A.go('recon') },
    { m: 'pay', ic: 'file', lb: 'Đề nghị thanh toán NCC', act: () => A.go('pay'), bd: 'nl' },
    { m: 'err', ic: 'warn', lb: 'Báo lỗi nhập liệu & labo', act: () => A.go('err') },
    { m: 'kiemke', ic: 'monitor', lb: 'Quản trị liên chi nhánh', act: () => A.go('mgmt') },
  ] },
  { cap: 'Kho & biểu mẫu', cols: '1fr 1fr 1fr', tiles: [
    { m: 'kiemke', ic: 'box', lb: 'Tồn kho', act: () => A.navStock() },
    { m: 'kiemke', ic: 'edit', lb: 'Biểu mẫu', act: () => A.go('reporthub') },
    { ic: 'gear', lb: 'Cài đặt', act: () => A.go('settings') },
  ] },
];

function homeData() {
  const entries = hsdEntries();
  const counts = BUCKETS.map((b) => entries.filter((e) => b.test(e.days)).length);
  const dl = fcDelta(counts);
  const open = db.periods.filter((p) => p.items.some((i) => !i.counted && i.close !== 0)).length;
  const nl = payBad();
  return { counts, dl, open, nl, entries };
}

export function Home() {
  const { counts, dl, open, nl } = homeData();
  useEffect(() => { dl.save(); });
  return (
    <>
      {fcHello()}
      {fcMobTask()}
      {v2Hub()}
      {homeNoticesHtml()}
      {can('hsd') ? (
      <div className="wrap mt20"><div style={st('display:flex;justify-content:space-between;align-items:center;margin-bottom:8px')}><span className="sec" style={{ margin: 0 }}>Cảnh báo hạn sử dụng</span><div style={st('display:flex;gap:14px;align-items:center')}><button className="addbat" style={st('color:var(--teal);display:flex;align-items:center;gap:5px')} onClick={() => X.showHsdEmailPicker()}>{I('mail', 15)}Email</button><button className="addbat" style={st('display:flex;align-items:center;gap:3px')} onClick={() => A.go('hsd')}>Xem chi tiết{I('chev', 15)}</button></div></div>
        <div className="hsdgrid">
          {BUCKETS.map((b, i) => {
            const n = counts[i]; const dd = dl.deltas[i];
            return (
              <div className={'hsdcard ' + b.cls + (n ? '' : ' z')} key={b.k} onClick={() => A.go('hsd')}>
                <span className={'kic k-' + b.k}>{H(KIC[b.k] || KCAL)}</span><div className="kb"><div className="t">{b.label}</div><div className="n tnum">{n}</div></div>
                {dd ? <span className={'kdl ' + (dd > 0 ? 'up' : 'dn')}>{(dd > 0 ? '▲ +' : '▼ −') + Math.abs(dd)}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      ) : null}
      <div className="fc-row">{can('kiemke') ? homeMonthCard() : null}{fcRate()}{fcPanels()}</div>
      <div className="wrap mt24">
        {TILE_GROUPS.map((g, gi) => {
          const ts = g.tiles.filter((t) => !t.m || (t.ed ? canEdit(t.m) : can(t.m)));
          if (!ts.length) return null;
          return (
            <div key={g.cap}>
              <div className="sec fc-cap" style={gi ? { marginTop: 22 } : undefined}>{g.cap}</div>
              <div style={st('display:grid;grid-template-columns:' + g.cols + ';gap:10px')}>
                {ts.map((t) => <Tile key={t.lb} ic={t.ic} lb={t.lb} act={t.act} bd={t.bd === 'open' ? (open || '') : t.bd === 'nl' ? (nl || '') : undefined} />)}
              </div>
            </div>
          );
        })}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
export const renderHome = () => rerender();
export const renderHomeOld = () => rerender();
