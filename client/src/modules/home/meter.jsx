/* Thẻ tỷ lệ kiểm kê dạng "bảng đo" (app gốc dòng 8114–8194): đồng hồ cung, ngưỡng đạt 95–105%, độ lệch 6 tháng */
import { db, A, S, fmt, rerender } from '../../core';

export const HM = { m: null };
export const HM_N = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
let HM_C = { ok: '#7ef0c9', lo: '#ff9aa8', hi: '#ffd88a' };
let HM_P = '#1e3a6b';

export function hmKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
export function hmStats(m) {
  const ps = db.periods.filter((p) => p.createdAt && hmKey(new Date(p.createdAt)) === m);
  let act = 0; let exp = 0; let codes = 0; let done = 0;
  ps.forEach((p) => {
    p.items.forEach((i) => {
      exp += Number(i.close) || 0; codes++;
      if (i.counted && i.countQty !== null && i.countQty !== undefined) { act += Number(i.countQty) || 0; done++; }
    });
  });
  return { kyN: ps.length, act: Math.round(act * 100) / 100, exp: Math.round(exp * 100) / 100, codes, done, pct: exp > 0 ? act / exp * 100 : null };
}
export function hmPol(cx, cy, r, a) { a = a * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
export function hmArc(cx, cy, r, a0, a1) {
  const p = hmPol(cx, cy, r, a0); const q = hmPol(cx, cy, r, a1);
  return 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + ((a1 - a0) > 180 ? 1 : 0) + ' 1 ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
}
export function hmSt(p) { return p === null ? 'na' : p < 95 ? 'lo' : p > 105 ? 'hi' : 'ok'; }
export function hmDial(pct) {
  const r = 46; const v = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <svg viewBox="0 0 120 120" className="hdial" role="img" aria-label="Tỷ lệ kiểm kê">
      <defs><linearGradient id="hudg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="hg1" /><stop offset="1" className="hg2" /></linearGradient></defs>
      <circle className="htk" cx="60" cy="60" r={r} />
      {v > 0 ? <circle className="hval" cx="60" cy="60" r={r} pathLength="100" strokeDasharray={v.toFixed(1) + ' 100'} transform="rotate(-90 60 60)" /> : null}
    </svg>
  );
}
const pctLabel = (v) => (Math.round(v * 10) / 10).toLocaleString('vi-VN') + '%';
export function hmTrend(m, cur) {
  const st = Math.min(cur - 5, m); const D = window.innerWidth >= 900; const W = D ? 460 : 320; const Hh = D ? 156 : 128;
  const L = 32; const R = 14; const T = 16; const B = 22;
  const vs = []; const data = []; let lo = 80; let hi = 120; let s;
  for (let i = 0; i < 6; i++) { s = hmStats(st + i); data.push({ m: st + i, pct: s.pct }); if (s.pct !== null) vs.push(s.pct); }
  if (vs.length) { hi = Math.max(110, Math.ceil((Math.max.apply(null, vs) + 5) / 10) * 10); lo = Math.max(0, Math.min(90, Math.floor((Math.min.apply(null, vs) - 5) / 10) * 10)); }
  const XX = (i) => L + i * (W - L - R) / 5;
  const YY = (v) => T + (Hh - T - B) * (1 - (Math.max(lo, Math.min(v, hi)) - lo) / (hi - lo));
  let line = ''; let prev = null;
  data.forEach((d, i) => { if (d.pct === null) { prev = null; return; } const pt = XX(i) + ' ' + YY(d.pct); line += (prev === null ? 'M' : 'L') + pt + ' '; prev = 1; });
  return (
    <svg viewBox={'0 0 ' + W + ' ' + Hh} className="htr" role="img" aria-label="Độ lệch tỷ lệ kiểm kê 6 tháng so với mốc 100%">
      <rect x={L} y={YY(105)} width={W - L - R} height={YY(95) - YY(105)} rx="3" fill={HM_C.ok} fillOpacity=".14" />
      <line x1={L} x2={W - R} y1={Hh - B} y2={Hh - B} stroke="currentColor" strokeOpacity=".14" />
      <line x1={L} x2={W - R} y1={YY(100)} y2={YY(100)} stroke="#f5c04a" strokeOpacity=".8" strokeDasharray="3 3" />
      <text x="2" y={YY(100) + 3} fontSize="9" fontWeight="700" fill="#f5c04a">100%</text>
      <text x="2" y={Hh - B + 3} fontSize="8.5" fill="currentColor" fillOpacity=".45">{lo}%</text>
      <text x="2" y={T + 3} fontSize="8.5" fill="currentColor" fillOpacity=".45">{hi}%</text>
      {line ? <path d={line} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.2" strokeLinejoin="round" /> : null}
      {data.map((d, i) => {
        const sel = d.m === m; const x = XX(i); const mm = ((d.m % 12) + 12) % 12;
        let pt = null;
        if (d.pct !== null) {
          const y = YY(d.pct); const c = HM_C[hmSt(d.pct)]; const lb = pctLabel(d.pct);
          const ly = d.pct >= 100 ? y - (sel ? 11 : 9) : Math.min(y + (sel ? 17 : 14), Hh - B - 3);
          pt = (
            <>
              <line x1={x} x2={x} y1={YY(100)} y2={y} stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeOpacity=".85" />
              {sel ? <circle cx={x} cy={y} r="9" fill={c} fillOpacity=".18" /> : null}
              <circle cx={x} cy={y} r={sel ? 5 : 3.6} fill={sel ? c : HM_P} stroke={c} strokeWidth="2" />
              <text x={x} y={ly} textAnchor="middle" fontSize={sel ? 11 : 9.5} fontWeight={sel ? 800 : 600} fill="currentColor" fillOpacity={sel ? 1 : 0.75}>{lb}</text>
            </>
          );
        } else pt = <circle cx={x} cy={YY(100)} r="2" fill="currentColor" fillOpacity=".28" />;
        return (
          <g key={i}>
            {pt}
            <text x={x} y={Hh - 6} textAnchor="middle" fontSize="10" fontWeight={sel ? 800 : 500} fill="currentColor" fillOpacity={sel ? 1 : 0.55}>{HM_N[mm]}</text>
            <rect className="hit" x={x - 24} y="0" width="48" height={Hh} fill="transparent" onClick={() => A.hmSet(d.m)}>
              <title>{'Tháng ' + (mm + 1) + '/' + Math.floor(d.m / 12) + ': ' + (d.pct === null ? 'chưa có dữ liệu' : pctLabel(d.pct))}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
export function homeMonthCard() {
  const D = window.innerWidth >= 900;
  HM_C = D ? { ok: '#1a9b5f', lo: '#dc4a4a', hi: '#b8862b' } : { ok: '#7ef0c9', lo: '#ff9aa8', hi: '#ffd88a' }; HM_P = D ? '#fff' : '#1e3a6b';
  const cur = hmKey(new Date()); const m = HM.m === null ? cur : Math.min(HM.m, cur); const y = Math.floor(m / 12); const mo = m % 12; const s = hmStats(m);
  const st = hmSt(s.pct); const lab = s.pct === null ? '–' : pctLabel(s.pct); const df = Math.round((s.act - s.exp) * 100) / 100;
  const chip = { na: 'Chưa có dữ liệu', ok: 'Đạt ngưỡng 95–105%', lo: 'Thấp hơn sổ sách', hi: 'Vượt sổ sách' }[st];
  let cov = null;
  if (s.kyN) {
    const n = 24; const f = s.codes ? Math.round(s.done / s.codes * n) : 0; const sg = [];
    for (let i = 0; i < n; i++) sg.push(<i key={i} className={i < f ? 'on' : undefined} />);
    cov = (
      <div className="hcov"><div className="hcl"><span>Đã kiểm {s.done}/{s.codes} mã</span><b>{s.codes ? Math.round(s.done / s.codes * 100) : 0}%</b></div><div className="hseg">{sg}</div></div>
    );
  }
  return (
    <div id="mcard">
      <div className="mh"><div className="mt">Tỷ lệ kiểm kê</div><div className="mn"><button aria-label="Tháng trước" onClick={() => A.hmGo(-1)}>‹</button>{mo + 1}/{y}<button aria-label="Tháng sau" onClick={() => A.hmGo(1)} disabled={m >= cur}>›</button></div></div>
      <div className="hrow">
        <div className="hdw">{hmDial(s.pct)}<div className="hc"><b>{lab}</b><small>so với sổ sách</small></div></div>
        <dl className="hk"><span className={'hchip ' + st}>{chip}</span>
          <div><dt><i className="dot a" />SL kiểm kê thực tế</dt><dd>{fmt(s.act)}</dd></div>
          <div><dt><i className="dot b" />SL cuối kỳ (sổ sách)</dt><dd>{fmt(s.exp)}</dd></div>
          <div><dt><i className="dot c" />Chênh lệch</dt><dd style={{ color: df < 0 ? HM_C.lo : df > 0 ? HM_C.hi : HM_C.ok }}>{df > 0 ? '+' : ''}{fmt(df)}</dd></div>
        </dl>
      </div>
      {cov}
      {hmTrend(m, cur)}
      <div className="sub">{s.kyN ? s.kyN + ' kỳ vật tư · ' + s.done + '/' + s.codes + ' mã đã kiểm' + (s.pct !== null && s.pct > 100 ? ' · thực tế vượt sổ sách' : '') : 'Chưa có kỳ kiểm kê vật tư nào tạo trong tháng này'}</div>
    </div>
  );
}

/* Đổi giữa màn rộng/hẹp thì vẽ lại thẻ (bảng màu khác nhau) */
if (typeof window !== 'undefined') {
  let was = window.innerWidth >= 900; let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { const now = window.innerWidth >= 900; if (now !== was) { was = now; if (S.route.view === 'home') rerender(); } }, 200);
  });
}

export const actions = {
  /* bản vá 8178 / 8181: chỉ đổi tháng đang xem rồi vẽ lại */
  hmSet(m) { HM.m = Math.min(hmKey(new Date()), m); rerender(); },
  hmGo(d) { const cur = hmKey(new Date()); HM.m = Math.min(cur, (HM.m === null ? cur : HM.m) + d); rerender(); },
};
