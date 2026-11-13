/* Trung tâm: hubCards, mgmt (Quản trị liên chi nhánh), dchub, reporthub + thẻ Cài đặt in (prCardHtml) — app gốc 5276–5364 */
import { db, A, X, I, FcIco, fcKey, norm, fmt, diffOf, klog, rerender, st, can, canEdit } from '../../core';

export function hubCards(title, back, cards) {
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go(back)}>‹</button><div className="ttl">{title}</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        {cards.filter((c) => !c.m || can(c.m)).map((c) => (
          <div className="card" key={c.route} style={st('margin-bottom:12px;cursor:pointer;display:flex;gap:14px;align-items:flex-start')} onClick={() => A.go(c.route)}>
            <span style={{ flex: 'none', display: 'flex' }}>{fcKey(c.title) ? FcIco(fcKey(c.title), 38) : I(c.icon, 20)}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, marginBottom: 3 }}>{c.title}{c.badge ? <> <span style={st('font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--red-bg);color:var(--red)')}>{c.badge}</span></> : null}</div><div style={st('font-size:13px;color:var(--mut)')}>{c.desc}</div></div>
            <div style={st('color:var(--mut2);display:flex;align-items:center')}>{I('chev', 18)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ===== Giá trị quản trị: dashboard liên chi nhánh · gợi ý điều chuyển tồn >3/6 tháng · đối chiếu 3 chiều ===== */
export function mgData() {
  const P = (db.periods || []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); const now = Date.now(); const MO = 30.4 * 864e5; const B = {};
  P.forEach((p) => {
    const t = p.createdAt || 0;
    (p.items || []).forEach((it) => {
      const bn = it.branch || 'Kho chính'; const o = B[bn] = B[bn] || { n: bn, first: t, last: t, m: {} };
      if (t < o.first) o.first = t; if (t > o.last) o.last = t;
      const k = norm(it.code) || norm(it.name); const r = o.m[k] = o.m[k] || { k, code: it.code, name: it.name, unit: it.unit, o3: 0, o6: 0 };
      r.close = it.close; r.name = it.name; r.unit = it.unit; r.counted = !!it.counted; r.diff = diffOf(it);
      if (t >= now - 3 * MO) r.o3 += (+it.out || 0); if (t >= now - 6 * MO) r.o6 += (+it.out || 0);
    });
  });
  const br = Object.keys(B).map((n) => {
    const o = B[n]; const a = Object.keys(o.m).map((k) => o.m[k]); const stk = a.filter((r) => r.close !== 0);
    o.cov = Math.floor((now - o.first) / MO); o.nMa = a.length; o.nTon = stk.length; o.nKiem = stk.filter((r) => r.counted).length;
    o.nLech = a.filter((r) => r.diff !== null && r.diff !== 0).length;
    o.d3 = o.cov >= 3 ? stk.filter((r) => r.close > 0 && r.o3 === 0) : null;
    o.d6 = o.cov >= 6 ? stk.filter((r) => r.close > 0 && r.o6 === 0) : null; return o;
  });
  const sug = [];
  br.forEach((Ab) => {
    [[6, Ab.d6], [3, Ab.d3]].forEach((x) => {
      if (!x[1]) return;
      x[1].forEach((r) => {
        if (x[0] === 3 && Ab.d6 && Ab.d6.indexOf(r) >= 0) return;
        br.forEach((Bn) => { if (Bn === Ab) return; const q = Bn.m[r.k]; if (q && q.o3 > 0) sug.push({ m: x[0], from: Ab.n, to: Bn.n, code: r.code, name: r.name, unit: r.unit, have: r.close, need: q.o3, qty: Math.min(r.close, Math.ceil(q.o3)) }); });
      });
    });
  });
  sug.sort((a, b) => b.m - a.m || b.qty - a.qty);
  return { br, sug };
}

const Mut = ({ children }) => <span style={{ color: 'var(--mut)' }}>{children}</span>;
const Red = ({ children }) => <b style={{ color: 'var(--red)' }}>{children}</b>;
function T({ hd, rows }) {
  return (
    <div style={st('overflow-x:auto;margin:8px 0 18px')}>
      <table style={st('border-collapse:collapse;font-size:13px;min-width:100%;white-space:nowrap')}>
        <tbody>
          <tr>{hd.map((x) => <th key={x} style={st('text-align:left;padding:6px 10px;border-bottom:1px solid var(--line);color:var(--mut)')}>{x}</th>)}</tr>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={st('padding:6px 10px;border-bottom:1px solid var(--line)')}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function Mgmt() {
  const D = mgData();
  const top = <div className="topbar"><button className="btn ghost" onClick={() => A.go('home')}>‹</button><div style={{ fontWeight: 800, fontSize: 17 }}>Quản trị liên chi nhánh</div></div>;
  if (!D.br.length) return <>{top}<div className="wrap"><div style={{ color: 'var(--mut)', padding: '20px 0' }}>Chưa có kỳ kiểm kê nào. Tạo kỳ ở mục Kiểm kê vật tư để xem số liệu liên chi nhánh.</div></div></>;
  let R = null; try { R = X.rcCompute(); } catch (e) { klog('mgmt rcCompute', e); }
  let sec4;
  if (!R || !R.dt || !R.dt.length) sec4 = <div style={{ color: 'var(--mut)' }}>Chưa có dữ liệu doanh thu/xuất kho. Nạp ở mục Đối chiếu DT – xuất kho để hiện đủ 3 chiều.</div>;
  else {
    const C = {};
    R.dt.forEach((c) => { const k = norm(c.cs || ''); if (!C[k]) C[k] = { n: c.cs || '(không rõ)', dt: 0, xk: 0, v: 0, bad: 0 }; if (!c.none && c.first !== false) C[k].dt++; });
    (R.xk || []).forEach((x) => { const k = norm(x.cs || ''); if (!C[k]) C[k] = { n: x.cs || '(không rõ)', dt: 0, xk: 0, v: 0, bad: 0 }; C[k].xk++; C[k].v += (x.val || 0); if (x.need) C[k].bad++; });
    sec4 = (
      <>
        <T hd={['Cơ sở', 'Dòng DT', 'Dòng xuất', 'Giá trị xuất (ĐM)', 'Cần xử lý', 'Lệch kiểm kê']} rows={Object.keys(C).map((k) => {
          const c = C[k];
          const b = D.br.filter((o) => { const nb = norm(o.n); return nb && k && (nb === k || nb.indexOf(k) >= 0 || k.indexOf(nb) >= 0); })[0];
          return [c.n, c.dt, c.xk, fmt(Math.round(c.v)), c.bad ? <Red>{c.bad}</Red> : '0', b ? (b.nLech ? <Red>{b.nLech} mã</Red> : '0') : <Mut>chưa khớp tên kho</Mut>];
        })} />
        <div style={{ fontSize: 12, color: 'var(--mut)' }}>Cột kiểm kê khớp theo tên cơ sở với tên chi nhánh/kho trong kỳ kiểm kê.</div>
      </>
    );
  }
  return (
    <>
      {top}
      <div className="wrap">
        <div className="sec">1. Dashboard liên chi nhánh</div>
        <T hd={['Chi nhánh', 'Số mã', 'Còn tồn', 'Đã kiểm', 'Lệch kiểm', 'Dữ liệu']} rows={D.br.map((o) => [o.n, o.nMa, o.nTon, o.nTon ? Math.round(100 * o.nKiem / o.nTon) + '%' : '–', o.nLech ? <Red>{o.nLech}</Red> : '0', o.cov + ' tháng'])} />
        <div className="sec">2. Tồn không xuất ≥ 3 / 6 tháng</div>
        <T hd={['Chi nhánh', 'Tồn ≥3 tháng', 'Tồn ≥6 tháng']} rows={D.br.map((o) => [o.n, o.d3 ? o.d3.length + ' mã' : <Mut>chưa đủ 3 tháng dữ liệu</Mut>, o.d6 ? o.d6.length + ' mã' : <Mut>chưa đủ 6 tháng dữ liệu</Mut>])} />
        <div style={st('font-size:12px;color:var(--mut);margin:-10px 0 12px')}>Tính theo các kỳ đã lưu: mã còn tồn dương và tổng xuất = 0 trong cửa sổ 3/6 tháng gần nhất. Chỉ xét khi chi nhánh có dữ liệu phủ đủ cửa sổ.</div>
        <div className="sec">3. Gợi ý điều chuyển (nơi thừa → nơi đang xuất)</div>
        {D.sug.length ? (
          <>
            <T hd={['Mức', 'Mã', 'Vật tư', 'Từ', 'Đến', 'Tồn nguồn', 'Xuất 3T đích', 'Đề xuất']} rows={D.sug.slice(0, 60).map((s) => [s.m + 'T+', s.code, s.name, s.from, s.to, fmt(s.have), fmt(s.need), <b>{fmt(s.qty)} {s.unit || ''}</b>])} />
            {D.sug.length > 60 ? <div style={{ fontSize: 12, color: 'var(--mut)' }}>Hiện 60/{D.sug.length} gợi ý.</div> : null}
          </>
        ) : <div style={st('color:var(--mut);margin:8px 0 18px')}>Chưa có gợi ý: cần ≥2 chi nhánh, một nơi tồn không xuất và nơi kia đang xuất cùng mã.</div>}
        <div className="sec">4. Đối chiếu 3 chiều: doanh thu – xuất kho – kiểm kê</div>
        {sec4}
      </div>
    </>
  );
}

export function DcHub() {
  let n = 0;
  try { if (db.pay && db.pay.mua && db.pay.mua.length) X.payCompute().forEach((g) => { if (g.bad) n++; }); } catch (e) { klog('payCompute', e); }
  return hubCards('Đối chiếu & thanh toán', 'home', [
    { icon: 'swap', title: 'Đối chiếu doanh thu – xuất kho', desc: 'Đối chiếu doanh thu với phiếu xuất kho, xuất Excel kèm sheet map, bôi đỏ phần lệch.', route: 'recon', m: 'recon' },
    { icon: 'swap', title: 'Phân tích mua hàng – tiêu hao', desc: 'Tải sổ chi tiết vật tư MISA, so mua hàng với tiêu hao 2 tháng theo cơ sở, cảnh báo tồn kho, xuất Excel.', route: 'ana', m: 'ana' },
    { icon: 'monitor', title: 'Quản trị liên chi nhánh', desc: 'Dashboard chi nhánh, tồn ≥3/6 tháng, gợi ý điều chuyển, đối chiếu doanh thu – xuất kho – kiểm kê.', route: 'mgmt', m: 'kiemke' },
    { icon: 'file', title: 'Đề nghị thanh toán NCC', desc: 'Nạp / bổ sung mua hàng và hóa đơn MISA, rà lỗi, lập giấy đề nghị, bảng kê, danh sách thanh toán.', route: 'pay', m: 'pay', badge: n ? n + ' NCC lệch' : '' },
  ]);
}

export function ReportHub() {
  const cards = [
    { icon: 'file', title: 'Báo cáo kiểm kê', desc: 'Tổng hợp số liệu kiểm kê nhiều chi nhánh thành báo cáo Word.', route: 'baocao', m: 'kiemke' },
    { icon: 'swap', title: 'Biên bản bàn giao', desc: 'Lập biên bản bàn giao tài sản, CCDC, vật tư.', route: 'handover', m: 'handover' },
    { icon: 'edit', title: 'Giải trình chênh lệch', desc: 'Giải trình thất thoát, chênh lệch khi kiểm kê.', route: 'explain', m: 'explain' },
    { icon: 'edit', title: 'Ký số PDF', desc: 'Ký PDF, chọn vị trí ký, xác nhận bằng mật khẩu / Face ID, lưu bản đã ký vào thư mục riêng.', route: 'sign', m: 'sign' },
  ];
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('home')}>‹</button><div className="ttl">Biểu mẫu</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        {cards.filter((c) => !c.m || can(c.m)).map((c) => (
          <div className="card" key={c.route} style={st('margin-bottom:12px;cursor:pointer;display:flex;gap:14px;align-items:flex-start')} onClick={() => A.go(c.route)}>
            <span style={{ flex: 'none', display: 'flex' }}>{fcKey(c.title) ? FcIco(fcKey(c.title), 38) : I(c.icon, 20)}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, marginBottom: 3 }}>{c.title}</div><div style={st('font-size:13px;color:var(--mut)')}>{c.desc}</div></div>
            <div style={st('color:var(--mut2);display:flex;align-items:center')}>{I('chev', 18)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* Thẻ "Cài đặt in" (dùng trong Cài đặt). PR() và A.prSet/A.prTest thuộc phân hệ docs. */
export function prCardHtml() {
  const o = X.PR();
  const sel = (k, opts) => (
    <select className="inp" style={{ marginBottom: 10 }} value={String(o[k])} onChange={(e) => { A.prSet(k, e.target.value); rerender(); }}>
      {opts.map((x) => <option key={x[0]} value={x[0]}>{x[1]}</option>)}
    </select>
  );
  return (
    <div className="card" style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, marginBottom: 2 }}>Cài đặt in</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:12px')}>Biên bản kiểm kê in ngang; biên bản bàn giao, giải trình, báo cáo kiểm kê in dọc. Khổ giấy, lề, phông chữ áp dụng cho tất cả.</div>
      <label className="lbl">Khổ giấy</label>{sel('paper', [['A4', 'A4'], ['A5', 'A5'], ['A3', 'A3']])}
      <label className="lbl">Căn lề</label>{sel('margin', [[10, 'Hẹp (10 mm)'], [15, 'Vừa (15 mm)'], [20, 'Chuẩn (20 mm)'], [25, 'Rộng (25 mm)']])}
      <label className="lbl">Phông chữ</label>{sel('font', [['Times New Roman', 'Times New Roman'], ['Arial', 'Arial'], ['Tahoma', 'Tahoma']])}
      <label className="lbl">Cỡ chữ</label>{sel('size', [[11, '11 pt'], [12, '12 pt'], [13, '13 pt'], [14, '14 pt']])}
      <label className="lbl">Kiểu tiêu đề</label>{sel('title', [['center', 'Giữa, IN HOA'], ['left', 'Trái, IN HOA'], ['box', 'Giữa, có khung']])}
      <button className="btn btn-outline" onClick={() => A.prTest()}>In thử trang mẫu</button>
      <div style={st('font-size:12px;color:var(--mut);margin-top:8px')}>Kết nối máy in: app chạy trên trình duyệt nên không ghép trực tiếp với máy in. Bấm “In / Lưu PDF” rồi chọn máy in trong hộp thoại của điện thoại (AirPrint trên iPhone, dịch vụ in trên Android), hoặc chọn Lưu PDF.</div></div>
  );
}

export const renderMgmt = () => rerender();
export const renderDcHub = () => rerender();
export const renderReportHub = () => rerender();
