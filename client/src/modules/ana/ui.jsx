/* Phân tích mua hàng – tiêu hao vật tư: giao diện (port từ khối script#ana-ui, dòng gốc 11594–11896).
   Dữ liệu sổ đã nạp KHÔNG được lưu (như app gốc). Cấu hình lưu trong db.ana = { opt:{excl,km0,dc,exMua}, kho:{MÃ_KHO:'tên'} }
   (app gốc: localStorage kk_ana_opt / kk_ana_kho; bản cũ trong localStorage được dùng làm giá trị khởi tạo). */
import { Fragment, cloneElement, createElement } from 'react';
import { db, X, store, rerender, toast, klog, kkNeed, I } from '../../core';
import { ANA } from './logic.js';

/* ---- cấu hình trong db.ana ---- */
function legacy(key) { let o = {}; try { o = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { o = {}; } return o; }
function anaCfg() { return db.ana && typeof db.ana === 'object' ? db.ana : null; }
function ensureAna() {
  if (!anaCfg()) {
    const lo = legacy('kk_ana_opt'); const lk = legacy('kk_ana_kho');
    db.ana = { opt: { excl: lo.excl != null ? lo.excl : ANA.DEFAULT_EXCL, km0: lo.km0 !== false, dc: lo.dc !== false, exMua: !!lo.exMua }, kho: lk };
  }
  const a = db.ana;
  if (!a.opt || typeof a.opt !== 'object') a.opt = { excl: ANA.DEFAULT_EXCL, km0: true, dc: true, exMua: false };
  if (!a.kho || typeof a.kho !== 'object' || Array.isArray(a.kho)) a.kho = {};
  return a;
}
function optGet(k) {
  const a = anaCfg(); const o = (a && a.opt) || (a ? {} : legacy('kk_ana_opt'));
  if (k === 'excl') return o.excl != null ? o.excl : ANA.DEFAULT_EXCL;
  if (k === 'km0') return o.km0 !== false;
  if (k === 'dc') return o.dc !== false;
  return !!o.exMua;
}
function optSet(k, v) { ensureAna().opt[k] = v; store.save(); }
function khoGet() { const a = anaCfg(); return (a && a.kho) || (a ? {} : legacy('kk_ana_kho')); }
function svKho() { store.save(); }

/* opt: excl/km0/dc/exMua đọc-ghi thẳng vào db.ana (luôn lấy lại tham chiếu); m1/m2 chỉ nằm trong bộ nhớ */
const opt = { m1: '', m2: '' };
['excl', 'km0', 'dc', 'exMua'].forEach((k) => {
  Object.defineProperty(opt, k, { enumerable: true, get() { return optGet(k); }, set(v) { optSet(k, v); } });
});

export const AN = {
  P: null, R: null, file: '', tab: 'sum', opt, err: '', khoOpen: false, ver: 0,
  get kho() { return khoGet(); },
  set kho(v) { ensureAna().kho = v; },
};
if (typeof window !== 'undefined') window.AN = AN;

/* ---- định dạng: số đầy đủ (không làm tròn), phần trăm 2 chữ số ---- */
function fv(n) { n = Math.round(n || 0); const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (n < 0 ? '-' : '') + s; }
function sg(n) { return (n > 0 ? '+' : '') + fv(n); }
function pcv(a, b) { if (!b) return null; return (a / b - 1) * 100; }
function pt(p) { if (p === null || p === undefined) return '—'; return (p > 0 ? '+' : '') + p.toFixed(2).replace('.', ',') + '%'; }
function rt(a, b) { return b ? (a / b).toFixed(2).replace('.', ',') : '—'; }
function lb(m) { return 'T' + Number(String(m).slice(5)); }
function lbf(m) { return 'T' + Number(String(m).slice(5)) + '/' + String(m).slice(0, 4); }
function up(v) { return v > 0 ? ' an-up' : (v < 0 ? ' an-dn' : ''); }

/* ---- bảng ---- */
function tbl(head, body) {
  return (
    <div className="an-sc"><table className="an-t"><thead><tr>{head.map((x, i) => <th key={i}>{x}</th>)}</tr></thead>
      <tbody>{body.map((r, i) => cloneElement(r, { key: i }))}</tbody></table></div>
  );
}
function tr(cells, cls) {
  return (
    <tr className={cls || undefined}>{cells.map((c, i) => {
      if (c && typeof c === 'object' && !c.$$typeof) return <td key={i} className={c.c || undefined}>{c.t}</td>;
      return <td key={i}>{c}</td>;
    })}</tr>
  );
}
function ct(t, c) { return { t, c }; }
function note(t) { return <div className="an-note">{t}</div>; }
function h2(t) { return <div className="an-h">{t}</div>; }
function sec(out, ...els) { out.push(createElement(Fragment, { key: out.length }, ...els)); }
function top(t, back) {
  return (
    <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => X.A.go(back || 'dchub')}>‹</button><div className="ttl">{t}</div></div><div style={{ height: '10px' }} /></div>
  );
}

/* ô nhập kiểu "change" của DOM: chỉ chốt khi rời ô / Enter */
function ChangeInput({ value, onCommit, ...rest }) {
  const v = value == null ? '' : String(value);
  return (
    <input defaultValue={v} {...rest}
      ref={(el) => { if (el && document.activeElement !== el && el.value !== v) el.value = v; }}
      onBlur={(e) => { if (e.target.value !== v) onCommit(e.target.value); }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
  );
}

/* ---- nạp file ---- */
AN.onFile = function (input) {
  const f = input.files && input.files[0]; if (!f) return;
  AN.load(f); input.value = '';
};
AN.drop = function (e) { e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) AN.load(f); };
AN.load = function (f) {
  if (!kkNeed(['xlsx'], function () { AN.load(f); })) return;
  const XLSX = window.XLSX;
  const isCsv = /\.csv$/i.test(f.name); const rd = new FileReader();
  rd.onload = function (e) {
    try {
      const wb = isCsv ? XLSX.read(e.target.result, { type: 'string' }) : XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); let P = null; let last = '';
      for (let i = 0; i < wb.SheetNames.length && !P; i++) {
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[i]], { header: 1, raw: true, defval: null }); const r = ANA.parse(aoa, XLSX.SSF, AN.kho);
        if (r.error) last = r.error; else P = r;
      }
      if (!P) { AN.err = last || 'File không đúng định dạng'; AN.R = null; AN.P = null; toast(AN.err); rAna(); return; }
      if (P.months.length < 2) { AN.err = 'Sổ chỉ có 1 tháng (' + P.months[0] + ') — cần ít nhất 2 tháng để so sánh.'; AN.R = null; AN.P = null; toast(AN.err); rAna(); return; }
      AN.err = ''; AN.P = P; AN.file = f.name; AN.opt.m1 = P.months[P.months.length - 2]; AN.opt.m2 = P.months[P.months.length - 1]; AN.tab = 'sum';
      AN.run(); toast('Đã đọc ' + P.rows.length + ' dòng · ' + P.months.length + ' tháng · ' + Object.keys(P.khos).length + ' kho');
    } catch (err) { console.error(err); klog('ana.load', err); toast('Không đọc được file — kiểm tra định dạng .xlsx/.csv'); }
  };
  rd.onerror = function () { toast('Không đọc được file'); };
  if (isCsv) rd.readAsText(f); else rd.readAsArrayBuffer(f);
};
AN.run = function () {
  try { AN.R = ANA.calc(AN.P, AN.opt); } catch (e) { console.error(e); klog('ana.calc', e); AN.R = null; toast('Lỗi khi tính — xem lại file'); }
  rAna();
};
AN.set = function (k, v) {
  if (k === 'm1' || k === 'm2') {
    AN.opt[k] = v; if (AN.opt.m1 === AN.opt.m2) { toast('Chọn hai tháng khác nhau'); }
    if (AN.opt.m1 > AN.opt.m2) { const t = AN.opt.m1; AN.opt.m1 = AN.opt.m2; AN.opt.m2 = t; }
  } else { AN.opt[k] = v; }
  if (AN.opt.m1 === AN.opt.m2) { rAna(); return; }
  AN.run();
};
AN.setKho = function (mk, val) {
  const key = String(mk).trim().toUpperCase(); const kho = ensureAna().kho; const old = kho[key]; const v = String(val == null ? '' : val).trim();
  if (v) kho[key] = v; else delete kho[key];
  const d = ANA.dupNames(AN.P, kho);
  if (d.length) { if (old == null) delete kho[key]; else kho[key] = old; toast('Tên kho bị trùng: ' + d.join(', ') + ' — chọn tên khác'); AN.ver++; rAna(); return; }
  svKho(); ANA.rename(AN.P, kho); AN.ver++; AN.run();
};
AN.setKhoI = function (ix, val) { const k = AN.P && AN.P.khoList && AN.P.khoList[ix]; if (k) AN.setKho(k.mk, val); };
AN.khoReset = function () { ensureAna().kho = {}; svKho(); ANA.rename(AN.P, db.ana.kho); AN.ver++; AN.run(); toast('Đã khôi phục tên kho mặc định'); };
AN.tab_ = function (t) { AN.tab = t; rAna(); window.scrollTo(0, 0); };
AN.reset = function () { AN.P = null; AN.R = null; AN.file = ''; AN.err = ''; rAna(); };

/* ---- giao diện ---- */
function upCard() {
  return (
    <div className="card an-up-card" onDragOver={(e) => e.preventDefault()} onDrop={(e) => AN.drop(e)}>
      {AN.P ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ fontWeight: 800 }}>{AN.file}</div>
            <div className="an-note" style={{ margin: '2px 0 0' }}>{AN.P.rows.length} dòng · {AN.P.months.map(lbf).join(', ')} · {Object.keys(AN.P.khos).length} kho</div>
          </div>
          <label className="pill" style={{ cursor: 'pointer' }}>Tải file khác<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => AN.onFile(e.target)} /></label>
          <button className="pill" onClick={() => AN.xls()}>Tải Excel kết quả</button>
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Phân tích mua hàng – tiêu hao vật tư</div>
          <div className="an-note" style={{ margin: '0 0 12px' }}>Tải file <b>Sổ chi tiết vật tư hàng hóa</b> xuất từ MISA (gồm 2 tháng trở lên). App tự tách mua hàng, điều chuyển nội bộ và xuất tiêu hao theo từng cơ sở rồi so sánh 2 tháng.</div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>{I('upload', 18)} Chọn file Excel (.xlsx)<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => AN.onFile(e.target)} /></label>
          <div className="an-note" style={{ marginTop: '10px' }}>Có thể kéo thả file vào khung này. Dữ liệu chỉ xử lý trên máy của cậu và không được lưu lại — mỗi lần mở lại cần tải file.</div>
          {AN.err ? <div className="an-err">{AN.err}</div> : null}
        </>
      )}
    </div>
  );
}
function sw(k, t, d) {
  return (
    <label className="an-sw" key={k}><input type="checkbox" checked={!!AN.opt[k]} onChange={(e) => AN.set(k, e.target.checked)} /><span><b>{t}</b><small>{d}</small></span></label>
  );
}
function khoCard() {
  const P = AN.P; const kho = AN.kho; const custom = Object.keys(kho).length;
  return (
    <details className="card an-kho" style={{ marginTop: '12px' }} open={AN.khoOpen} onToggle={(e) => { AN.khoOpen = e.target.open; }}>
      <summary>Cấu hình tên kho{custom ? <> <span className="an-badge">{custom} tên đã đổi</span></> : null}</summary>
      <div className="an-note" style={{ margin: '8px 0 10px' }}>Đặt tên hiển thị cho từng kho theo mã kho trong sổ. Để trống = dùng tên mặc định (hiện trong ô). Tên được lưu trên máy chủ và áp dụng cho các lần tải file sau; bảng và file Excel xuất ra dùng đúng tên này.</div>
      <div className="an-sc"><table className="an-t an-kt2"><thead><tr><th>Mã kho</th><th>Tên trong sổ</th><th>Tên hiển thị</th><th>Số dòng</th></tr></thead><tbody>
        {P.khoList.map((k, ix) => (
          <tr key={k.mk}><td>{k.mk}</td><td>{k.tenSo}</td>
            <td><ChangeInput className="inp" style={{ padding: '8px 10px' }} value={kho[k.mk.toUpperCase()] || ''} placeholder={k.def} onCommit={(v) => AN.setKhoI(ix, v)} /></td>
            <td style={{ textAlign: 'right' }}>{k.n}</td></tr>
        ))}
      </tbody></table></div>
      {custom ? <button className="pill" style={{ marginTop: '10px' }} onClick={() => AN.khoReset()}>Khôi phục tên mặc định</button> : null}
    </details>
  );
}
function optCard() {
  const P = AN.P;
  const sel = (k) => (
    <select className="inp" value={AN.opt[k]} onChange={(e) => AN.set(k, e.target.value)}>
      {P.months.map((m) => <option key={m} value={m}>{lbf(m)}</option>)}
    </select>
  );
  return (
    <div className="card" style={{ marginTop: '12px' }}>
      <div className="an-opt">
        <div><div className="an-lab">Tháng trước</div>{sel('m1')}</div>
        <div><div className="an-lab">Tháng sau</div>{sel('m2')}</div>
        <div style={{ flex: '2 1 260px' }}><div className="an-lab">Mặt hàng loại khỏi tiêu hao (cách nhau dấu phẩy)</div>
          <ChangeInput className="inp" value={AN.opt.excl} onCommit={(v) => AN.set('excl', v)} placeholder="súc miệng, tăm nước, kem đánh răng" /></div>
      </div>
      {sw('km0', 'Hàng khuyến mại (TK 711) tính 0 đồng', 'Bỏ giá trị hàng nhận khuyến mại khỏi phần mua')}
      {sw('dc', 'Tính vật tư nhận điều chuyển là mua của cơ sở nhận', 'Cơ sở chuyển đi không bị trừ')}
      {sw('exMua', 'Loại cả các mặt hàng trên khỏi phần mua', 'Mặc định chỉ loại khỏi tiêu hao')}
    </div>
  );
}
const TABS = [['sum', 'Tổng hợp'], ['grp', 'Nhóm hàng'], ['mv', 'Biến động mặt hàng'], ['stk', 'Tồn kho'], ['idl', 'Mã không xuất'], ['chk', 'Cách tính & kiểm tra']];
function tabsHtml() {
  return <div className="an-tabs">{TABS.map((t) => <span key={t[0]} className={'chip' + (AN.tab === t[0] ? ' chip-on' : '')} onClick={() => AN.tab_(t[0])}>{t[1]}</span>)}</div>;
}
/* ---- Tab: Tổng hợp ---- */
function kpi(t, v, s, c) { return <div className="an-k" key={t}><div className="an-kt">{t}</div><div className="an-kv">{v}</div><div className={'an-ks' + (c || '')}>{s}</div></div>; }
function tabSum(R) {
  const t = R.tot; const c = t.cs; const L1 = lb(R.m1); const L2 = lb(R.m2); const n = R.csList.length; const out = [];
  sec(out,
    <div className="an-kg">
      {kpi('Mua thực toàn hệ thống ' + L2, fv(t.muaThuc2), pt(pcv(t.muaThuc2, t.muaThuc1)) + ' so với ' + L1)}
      {kpi('Mua ' + n + ' cơ sở ' + L2 + (R.opt.dc ? ' (gồm ĐC)' : ''), fv(c.t2), pt(pcv(c.t2, c.t1)) + ' so với ' + L1)}
      {kpi('Tiêu hao ' + n + ' cơ sở ' + L2, fv(c.th2), pt(pcv(c.th2, c.th1)) + ' so với ' + L1)}
      {kpi('Mua − tiêu hao ' + L2, sg(c.ch2), (c.th2 ? 'Mua = ' + rt(c.t2, c.th2) + ' lần tiêu hao' : ''), up(c.ch2))}
    </div>,
    alertsHtml(R));
  /* Bảng mua */
  let b = [];
  R.rows.forEach((r) => { b.push(tr([r.kho, fv(r.d1), fv(r.c1), <b>{fv(r.t1)}</b>, fv(r.d2), fv(r.c2), <b>{fv(r.t2)}</b>, ct(pt(pcv(r.t2, r.t1)), up(pcv(r.t2, r.t1)))], r.isCs ? '' : 'oth')); });
  b.push(tr([n + ' cơ sở', fv(c.d1), fv(c.c1), fv(c.t1), fv(c.d2), fv(c.c2), fv(c.t2), pt(pcv(c.t2, c.t1))], 'tot'));
  b.push(tr(['Mua thực toàn hệ thống (không tính điều chuyển)', '', '', fv(t.muaThuc1), '', '', fv(t.muaThuc2), pt(pcv(t.muaThuc2, t.muaThuc1))], 'tot'));
  b.push(tr(['Cộng các dòng (có tính trùng điều chuyển)', '', '', fv(t.cong1), '', '', fv(t.cong2), pt(pcv(t.cong2, t.cong1))], 'oth'));
  sec(out, h2('1. Mua hàng theo cơ sở (đồng) — ' + lbf(R.m1) + ' so với ' + lbf(R.m2)),
    tbl(['Cơ sở', 'Mua trực tiếp ' + L1, 'Nhận ĐC ' + L1, 'Tổng mua ' + L1, 'Mua trực tiếp ' + L2, 'Nhận ĐC ' + L2, 'Tổng mua ' + L2, '%'], b),
    note('Mua trực tiếp = chứng từ mua hàng nhập kho' + (R.opt.km0 ? ', hàng khuyến mại (TK 711) tính 0 đồng — bỏ ' + fv(t.km1) + ' (' + L1 + ') và ' + fv(t.km2) + ' (' + L2 + ')' : ', gồm cả hàng khuyến mại') + '. Nhận ĐC = vật tư nhận điều chuyển từ kho/cơ sở khác' + (R.opt.dc ? '' : ' (đang TẮT, không tính)') + '. Cơ sở chuyển đi không bị trừ nên cộng các dòng sẽ trùng phần điều chuyển; mua thực toàn hệ thống không bị trùng.'));
  /* Bảng mua vs tiêu hao */
  b = [];
  R.rows.forEach((r) => {
    if (r.isCs) b.push(tr([r.kho, fv(r.t1), fv(r.th1), ct(sg(r.ch1), up(r.ch1)), fv(r.t2), fv(r.th2), ct(sg(r.ch2), up(r.ch2)), rt(r.t2, r.th2)]));
    else b.push(tr([r.kho + ' (xuất QLDN, không tính vào cơ sở)', '', '', fv(r.th1), '', '', fv(r.th2), ''], 'oth'));
  });
  b.push(tr([n + ' cơ sở', fv(c.t1), fv(c.th1), ct(sg(c.ch1), up(c.ch1)), fv(c.t2), fv(c.th2), ct(sg(c.ch2), up(c.ch2)), rt(c.t2, c.th2)], 'tot'));
  b.push(tr(['Tiêu hao toàn hệ thống (gồm QLDN)', '', fv(t.th1), '', '', fv(t.th2), '', pt(pcv(t.th2, t.th1))], 'tot'));
  sec(out, h2('2. Mua so với tiêu hao (đồng)'), tbl(['Cơ sở', 'Tổng mua ' + L1, 'Tiêu hao ' + L1, 'Chênh ' + L1, 'Tổng mua ' + L2, 'Tiêu hao ' + L2, 'Chênh ' + L2, 'Mua/tiêu hao ' + L2], b),
    note('Tiêu hao = xuất kho khác đối ứng TK 632x, loại điều chuyển nội bộ' + (R.ex.length ? ' và loại các mặt hàng: ' + R.opt.excl + ' (đã loại ' + fv(R.exTH.a) + ' ở ' + L1 + ', ' + fv(R.exTH.b) + ' ở ' + L2 + ')' : '') + '. Chênh dương = mua nhiều hơn tiêu hao.'));
  /* Tiêu hao % riêng */
  b = [];
  R.rows.filter((r) => r.isCs).forEach((r) => { b.push(tr([r.kho, fv(r.th1), fv(r.th2), ct(sg(r.th2 - r.th1), ''), ct(pt(pcv(r.th2, r.th1)), up(pcv(r.th2, r.th1)))])); });
  b.push(tr([n + ' cơ sở', fv(c.th1), fv(c.th2), sg(c.th2 - c.th1), pt(pcv(c.th2, c.th1))], 'tot'));
  sec(out, h2('3. Biến động tiêu hao theo cơ sở (đồng)'), tbl(['Cơ sở', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, 'Chênh', '%'], b));
  /* Xếp hạng */
  const cs = R.rows.filter((r) => r.isCs);
  function rank(f, asc) { return cs.slice().sort((a, b2) => (asc ? f(a) - f(b2) : f(b2) - f(a))); }
  const A1 = rank((r) => r.t2); const A2 = rank((r) => r.th2);
  const A3 = rank((r) => { const p = pcv(r.t2, r.t1); return p === null ? -1e9 : p; });
  const A4 = rank((r) => { const p = pcv(r.th2, r.th1); return p === null ? -1e9 : p; });
  b = [];
  for (let i = 0; i < cs.length; i++) {
    b.push(tr([String(i + 1),
      <>{A1[i].kho}<br /><small>{fv(A1[i].t2)}</small></>,
      <>{A2[i].kho}<br /><small>{fv(A2[i].th2)}</small></>,
      <>{A3[i].kho}<br /><small>{pt(pcv(A3[i].t2, A3[i].t1))}</small></>,
      <>{A4[i].kho}<br /><small>{pt(pcv(A4[i].th2, A4[i].th1))}</small></>], 'an-rk'));
  }
  sec(out, h2('4. Xếp hạng cơ sở'), tbl(['Hạng', 'Giá trị mua ' + L2, 'Giá trị tiêu hao ' + L2, 'Biến động mua', 'Biến động tiêu hao'], b));
  return out;
}
function alertsHtml(R) {
  const a = []; const L1 = lb(R.m1); const L2 = lb(R.m2); const cs = R.rows.filter((r) => r.isCs);
  cs.forEach((r) => {
    if (r.th2 > 0 && r.t2 / r.th2 > 1.1) a.push(['w', r.kho + ': tổng mua ' + L2 + ' vượt tiêu hao ' + fv(r.ch2) + ' đ (' + rt(r.t2, r.th2) + ' lần).']);
    const pm = pcv(r.t2, r.t1); const pth = pcv(r.th2, r.th1);
    if (pm !== null && Math.abs(pm) >= 10) a.push(['i', r.kho + ': mua ' + (pm > 0 ? 'tăng ' : 'giảm ') + pt(Math.abs(pm)).replace('+', '') + ' so với ' + L1 + '.']);
    if (pth !== null && pth >= 10) a.push(['w', r.kho + ': tiêu hao tăng ' + pt(pth).replace('+', '') + ' so với ' + L1 + ' (+' + fv(r.th2 - r.th1) + ' đ).']);
  });
  const Id = R.idleEx;
  if (Id.n) a.push(['w', Id.n + ' mã (tồn ' + fv(Id.v) + ' đ) không có xuất nào trong cả 2 tháng — xem tab "Mã không xuất".']);
  if (R.ex.length && !R.opt.exMua) { let s = 0; Object.keys(R.m4Mua).forEach((k) => { s += (R.m4Mua[k][R.m2] || 0); }); if (s) a.push(['i', 'Các mặt hàng đã loại khỏi tiêu hao vẫn nằm trong phần mua ' + L2 + ': ' + fv(s) + ' đ — làm chênh mua − tiêu hao cao hơn thực tế.']); }
  if (!a.length) return null;
  return (
    <div className="card an-al"><div className="an-lab" style={{ marginBottom: '6px' }}>Lưu ý nhanh</div>
      {a.slice(0, 10).map((x, i) => <div key={i} className={'an-ai ' + x[0]}>{x[1]}</div>)}</div>
  );
}
/* ---- Tab: Nhóm hàng ---- */
function tabGrp(R) {
  const L1 = lb(R.m1); const L2 = lb(R.m2); const b = []; const s = { a: 0, b: 0, ma: 0, mb: 0 };
  R.nhom.forEach((n) => { s.a += n.a; s.b += n.b; s.ma += n.ma; s.mb += n.mb; b.push(tr([n.nhom, fv(n.a), fv(n.b), ct(sg(n.b - n.a), ''), ct(pt(pcv(n.b, n.a)), up(pcv(n.b, n.a))), fv(n.ma), fv(n.mb)])); });
  b.push(tr(['Tổng', fv(s.a), fv(s.b), sg(s.b - s.a), pt(pcv(s.b, s.a)), fv(s.ma), fv(s.mb)], 'tot'));
  return [h2('Tiêu hao và mua trực tiếp theo nhóm hàng (đồng)'), tbl(['Nhóm hàng', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, 'Chênh', '%', 'Mua ' + L1, 'Mua ' + L2], b),
    note('Nhóm hàng suy từ 2 số đầu của mã hàng: 10 vật tư chung, 11 dụng cụ, 12 labo/phục hình/abutment, 13 implant/ghép xương, 14 chỉnh nha, 16 nội nha, 88 thuốc, 90 HHTM. Riêng "Răng sứ Lava Plus" xếp vào labo, "Phí xử lý đơn hàng Invi" xếp vào chỉnh nha. Chỉ tính cơ sở (TK 632x), chưa tính xuất QLDN. Implant và chỉnh nha tiêu hao theo ca bệnh nên cần đối chiếu số ca trước khi kết luận bất thường.')];
}
/* ---- Tab: Biến động mặt hàng ---- */
function itRows(a) { return a.map((i) => tr([i.ten, i.nhom, fv(i.a), fv(i.b), ct(sg(i.d), up(i.d))])); }
function tabMv(R) {
  const L1 = lb(R.m1); const L2 = lb(R.m2); const H = ['Mặt hàng', 'Nhóm', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, 'Chênh']; const out = [];
  sec(out, h2('Tăng mạnh nhất (toàn bộ cơ sở)'), tbl(H, itRows(R.movers.all.up)), h2('Giảm mạnh nhất (toàn bộ cơ sở)'), tbl(H, itRows(R.movers.all.down)));
  R.csList.forEach((c) => {
    const m = R.movers.byCs[c]; if (!m || (!m.up.length && !m.down.length)) return;
    sec(out, h2(c), tbl(H, itRows(m.up).concat(itRows(m.down))));
  });
  sec(out, note('Mỗi cơ sở hiển thị tối đa 3 mặt hàng tăng và 3 mặt hàng giảm nhiều nhất. Danh sách đầy đủ có trong file Excel.'));
  return out;
}
/* ---- Tab: Tồn kho ---- */
function tabStk(R) {
  const L1 = lb(R.m1); const L2 = lb(R.m2); const b = []; const T = R.stT;
  R.stockKho.forEach((s) => {
    const r = R.rows.filter((x) => x.kho === s.kho)[0]; const th = r && r.isCs ? r.th2 : 0;
    b.push(tr([s.kho, fv(s.t1), fv(s.t2), ct(sg(s.t2 - s.t1), up(s.t2 - s.t1)), ct(pt(pcv(s.t2, s.t1)), up(pcv(s.t2, s.t1))), th ? fv(th) : '—', th ? rt(s.t2, th) : '—'], r && r.isCs ? '' : 'oth'));
  });
  b.push(tr(['Tổng', fv(T.t1), fv(T.t2), sg(T.t2 - T.t1), pt(pcv(T.t2, T.t1)), fv(R.tot.cs.th2), rt(T.t2, R.tot.th2)], 'tot'));
  return [h2('Tồn cuối kỳ theo kho (đồng)'), tbl(['Kho', 'Tồn cuối ' + L1, 'Tồn cuối ' + L2, 'Chênh', '%', 'Tiêu hao ' + L2, 'Tồn/tiêu hao (tháng)'], b),
    note('Tồn lấy theo số dư ghi trên sổ. Sổ chỉ gồm mã có phát sinh trong kỳ nên tồn thực tế còn cao hơn. Tồn/tiêu hao cho biết kho đủ dùng khoảng bao nhiêu tháng theo mức tiêu hao tháng sau. Hàng bán (HHTM) xuất bán không nằm trong sổ nên tồn nhóm này chỉ để tham khảo.')];
}
/* ---- Tab: Mã không xuất ---- */
function tabIdl(R) {
  const Id = R.idle; const E = R.idleEx; const out = []; let b = []; const tot = R.stT.t2;
  sec(out, <div className="an-kg">{kpi('Mã không xuất nào trong 2 tháng', String(Id.n), fv(Id.v) + ' đ · ' + (tot ? (Id.v / tot * 100).toFixed(2).replace('.', ',') : '0') + '% tồn cuối ' + lb(R.m2))}
    {kpi('Nếu loại các mặt hàng đã loại khỏi tiêu hao', String(E.n), fv(E.v) + ' đ')}</div>);
  Object.keys(Id.byKho).sort((a, b2) => Id.byKho[b2].v - Id.byKho[a].v).forEach((k) => { b.push(tr([k, String(Id.byKho[k].n), fv(Id.byKho[k].v)])); });
  sec(out, h2('Theo kho'), tbl(['Kho', 'Số mã', 'Giá trị tồn'], b));
  b = []; Object.keys(Id.byNhom).sort((a, b2) => Id.byNhom[b2] - Id.byNhom[a]).forEach((k) => { b.push(tr([k, fv(Id.byNhom[k])])); });
  sec(out, h2('Theo nhóm hàng'), tbl(['Nhóm hàng', 'Giá trị tồn'], b));
  b = []; Id.top.forEach((s) => { b.push(tr([s.kho, s.ma, s.ten, s.nhom, fv(s.t2)])); });
  sec(out, h2('20 mã tồn lớn nhất'), tbl(['Kho', 'Mã', 'Tên hàng', 'Nhóm', 'Tồn cuối ' + lb(R.m2)], b),
    note('"Không xuất" tính cả xuất tiêu hao lẫn chuyển kho. Sổ chỉ có 2 tháng nên chưa xét được mốc tồn ≥3 tháng hoặc ≥6 tháng không xuất — cần sổ chi tiết dài hơn. Hàng HHTM có thể đang bán ra nhưng xuất bán không nằm trong sổ này.'));
  return out;
}
/* ---- Tab: Cách tính & kiểm tra ---- */
function tabChk(R) {
  const out = []; const c = R.chk;
  const tkm = Object.keys(R.tkMap).sort().map((t) => t + ' → ' + R.tkMap[t]).join(' · ');
  sec(out, h2('Cách tính'), (
    <div className="card an-how"><ol>
      <li><b>Mua</b>: chứng từ “Mua hàng…nhập kho”, cộng cột Nhập – Giá trị theo kho và tháng hạch toán.</li>
      <li><b>Hàng khuyến mại</b> (đối ứng TK 711): {R.opt.km0 ? 'tính 0 đồng, tách riêng để theo dõi.' : 'đang được tính theo giá trị ghi sổ.'}</li>
      <li><b>Điều chuyển nội bộ</b>: không tính vào tiêu hao. {R.opt.dc ? 'Phần nhập về được tính là mua của cơ sở nhận; kho đi xác định theo số chứng từ; bên chuyển đi không trừ.' : 'Đang TẮT nên không tính vào mua.'}</li>
      <li><b>Tiêu hao</b>: “Xuất kho khác” đối ứng TK 632x, gán cơ sở theo TK: {tkm || '(không có)'}. Xuất đối ứng TK khác (vd 6422F – chi phí QLDN) tách riêng.</li>
      <li><b>Mặt hàng loại khỏi tiêu hao</b>: {R.ex.length ? R.opt.excl : '(không có)'}{R.opt.exMua ? ' — cũng loại khỏi phần mua.' : ' — chỉ loại khỏi tiêu hao.'}</li>
      <li>Giá xuất trong sổ là giá bình quân đã gồm cả giá trị hàng khuyến mại, nên tiêu hao và giá trị điều chuyển lấy nguyên theo sổ, chưa định giá lại theo “khuyến mại = 0”.</li>
      <li>Sổ không có chứng từ xuất bán, xuất trả, điều chỉnh nên app không tách được các loại này.</li></ol></div>
  ));
  const b = []; R.dcm.sort((a, b2) => b2.v - a.v).forEach((d) => { b.push(tr([d.from, d.to, lb(d.ym), fv(d.v)])); });
  sec(out, h2('Điều chuyển nội bộ (kho đi → kho nhận)'), tbl(['Kho đi', 'Kho nhận', 'Tháng', 'Giá trị'], b.length ? b : [tr(['Không có', '', '', ''])]));
  const rows = [];
  const oth = Object.keys(c.other);
  rows.push(['Loại chứng từ khác ngoài mua / chuyển kho / xuất kho khác', oth.length ? oth.map((k) => k + ': ' + c.other[k] + ' dòng').join('; ') : 'Không có']);
  rows.push(['Dòng tồn âm (số lượng hoặc giá trị)', c.neg.length ? c.neg.length + ' dòng, ví dụ: ' + c.neg.slice(0, 3).map((x) => x.ten + ' (' + x.kho + ', ' + x.ngay.split('-').reverse().join('/') + ')').join('; ') : 'Không có']);
  rows.push(['Chứng từ điều chuyển nhập ≠ xuất', c.vmis.length ? c.vmis.length + ' chứng từ: ' + c.vmis.slice(0, 3).map((x) => x.sct).join(', ') : 'Khớp hết']);
  rows.push(['Xuất 632x ghi lệch kho so với TK cơ sở (không tính kho CCDC)', c.tkLech.n ? c.tkLech.n + ' dòng, ' + fv(c.tkLech.v) + ' đ — đang tính theo TK đối ứng' : 'Không có']);
  rows.push(['Mua mã 90xxx (HHTM) hạch toán ngoài TK 1561', Object.keys(c.hhtmTk).length ? Object.keys(c.hhtmTk).sort().map((k) => lb(k) + ': ' + fv(c.hhtmTk[k])).join('; ') : 'Không có']);
  rows.push(['Dòng xuất có số lượng nhưng giá trị 0', c.zeroX ? c.zeroX + ' dòng' : 'Không có']);
  sec(out, h2('Kiểm tra dữ liệu'), <div className="card an-chk">{rows.map((r, i) => <div key={i}><b>{r[0]}</b><span>{r[1]}</span></div>)}</div>);
  return out;
}
const TAB_FN = { sum: tabSum, grp: tabGrp, mv: tabMv, stk: tabStk, idl: tabIdl, chk: tabChk };

function rAna() { rerender(); }
export const renderAna = rAna;

/* View `ana` (window.renderAna của app gốc) */
export function AnaView() {
  const body = AN.P && AN.R ? (TAB_FN[AN.tab] || tabSum)(AN.R) : null;
  return (
    <>
      {top('Phân tích mua – tiêu hao')}
      <div className="wrap an-full" style={{ paddingTop: '16px', paddingBottom: '100px' }}>
        {upCard()}
        {AN.P && AN.R ? (
          <>
            {optCard()}{khoCard()}{tabsHtml()}
            <div id="anBody">{body}</div>
          </>
        ) : null}
      </div>
    </>
  );
}

/* ---- xuất Excel ---- */
function mk(aoa, pct, rat) {
  const XLSX = window.XLSX;
  const ws = XLSX.utils.aoa_to_sheet(aoa); const w = [];
  for (let i = 0; i < aoa.length; i++) {
    for (let j = 0; j < (aoa[i] || []).length; j++) {
      const v = aoa[i][j]; const l = v == null ? 0 : String(v).length; if (w[j] == null || l > w[j]) w[j] = Math.min(l, 60);
      const a = XLSX.utils.encode_cell({ r: i, c: j });
      if (ws[a] && ws[a].t === 'n') ws[a].z = (pct && pct.indexOf(j) >= 0) ? '0.00%' : ((rat && rat.indexOf(j) >= 0) ? '0.00' : '#,##0');
    }
  }
  ws['!cols'] = w.map((x) => ({ wch: Math.max(10, (x || 8) + 2) }));
  return ws;
}
function fr(a, b) { return b ? (a / b - 1) : ''; }
AN.xls = function () {
  if (!AN.R) return;
  if (!kkNeed(['xlsx'], AN.xls)) return;
  const XLSX = window.XLSX;
  const R = AN.R; const L1 = lb(R.m1); const L2 = lb(R.m2); const wb = XLSX.utils.book_new(); const t = R.tot; const c = t.cs; const AO = [];
  AO.push(['Cơ sở / kho', 'Mua trực tiếp ' + L1, 'Nhận điều chuyển ' + L1, 'Tổng mua ' + L1, 'Mua trực tiếp ' + L2, 'Nhận điều chuyển ' + L2, 'Tổng mua ' + L2, '% mua', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, '% tiêu hao', 'Chênh mua − tiêu hao ' + L1, 'Chênh mua − tiêu hao ' + L2, 'Mua/tiêu hao ' + L2]);
  R.rows.forEach((r) => { AO.push([r.kho + (r.isCs ? '' : ' (xuất QLDN)'), r.d1, r.c1, r.t1, r.d2, r.c2, r.t2, fr(r.t2, r.t1), r.th1, r.th2, fr(r.th2, r.th1), r.isCs ? r.ch1 : '', r.isCs ? r.ch2 : '', r.isCs && r.th2 ? r.t2 / r.th2 : '']); });
  AO.push([R.csList.length + ' cơ sở', c.d1, c.c1, c.t1, c.d2, c.c2, c.t2, fr(c.t2, c.t1), c.th1, c.th2, fr(c.th2, c.th1), c.ch1, c.ch2, c.th2 ? c.t2 / c.th2 : '']);
  AO.push(['Mua thực toàn hệ thống (không tính điều chuyển)', '', '', t.muaThuc1, '', '', t.muaThuc2, fr(t.muaThuc2, t.muaThuc1), '', '', '', '', '', '']);
  AO.push(['Cộng các dòng (có trùng điều chuyển)', '', '', t.cong1, '', '', t.cong2, fr(t.cong2, t.cong1), '', '', '', '', '', '']);
  AO.push(['Tiêu hao toàn hệ thống (gồm QLDN)', '', '', '', '', '', '', '', t.th1, t.th2, fr(t.th2, t.th1), '', '', '']);
  AO.push(['Hàng khuyến mại TK 711 ' + (R.opt.km0 ? '(đã tính 0 đồng)' : '(đã tính vào mua)'), '', '', t.km1, '', '', t.km2, '', '', '', '', '', '', '']);
  XLSX.utils.book_append_sheet(wb, mk(AO, [7, 10], [13]), 'Mua - Tiêu hao');
  const G = [['Nhóm hàng', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, 'Chênh', '%', 'Mua ' + L1, 'Mua ' + L2]];
  R.nhom.forEach((n) => { G.push([n.nhom, n.a, n.b, n.b - n.a, fr(n.b, n.a), n.ma, n.mb]); });
  XLSX.utils.book_append_sheet(wb, mk(G, [4]), 'Nhóm hàng');
  const M = [['Mặt hàng', 'Nhóm', 'Tiêu hao ' + L1, 'Tiêu hao ' + L2, 'Chênh']];
  R.items.forEach((i) => { M.push([i.ten, i.nhom, i.a, i.b, i.d]); });
  XLSX.utils.book_append_sheet(wb, mk(M), 'Biến động mặt hàng');
  const D = [['Kho đi', 'Kho nhận', 'Tháng', 'Giá trị']];
  R.dcm.forEach((d) => { D.push([d.from, d.to, lbf(d.ym), d.v]); });
  XLSX.utils.book_append_sheet(wb, mk(D), 'Điều chuyển');
  const SK = [['Kho', 'Tồn cuối ' + L1, 'Tồn cuối ' + L2, 'Chênh', '%']];
  R.stockKho.forEach((s) => { SK.push([s.kho, s.t1, s.t2, s.t2 - s.t1, fr(s.t2, s.t1)]); });
  SK.push(['Tổng', R.stT.t1, R.stT.t2, R.stT.t2 - R.stT.t1, fr(R.stT.t2, R.stT.t1)]);
  SK.push([]); SK.push(['Kho', 'Mã hàng', 'Tên hàng', 'Nhóm', 'Tồn cuối ' + L1, 'Tồn cuối ' + L2, 'Xuất 2 tháng (mọi loại)']);
  R.stock.slice().sort((a, b) => b.t2 - a.t2).forEach((s) => { SK.push([s.kho, s.ma, s.ten, s.nhom, s.t1, s.t2, s.xall]); });
  XLSX.utils.book_append_sheet(wb, mk(SK, [4]), 'Tồn kho');
  const ID = [['Kho', 'Mã hàng', 'Tên hàng', 'Nhóm', 'Tồn cuối ' + L2]];
  R.idle.all.forEach((s) => { ID.push([s.kho, s.ma, s.ten, s.nhom, s.t2]); });
  XLSX.utils.book_append_sheet(wb, mk(ID), 'Mã không xuất');
  const HW = [['Cách tính'], ['Mua: chứng từ "Mua hàng…nhập kho"; hàng khuyến mại TK 711 ' + (R.opt.km0 ? 'tính 0 đồng.' : 'tính theo giá trị ghi sổ.')],
    ['Điều chuyển nội bộ không tính vào tiêu hao. ' + (R.opt.dc ? 'Vật tư nhận về tính là mua của cơ sở nhận, bên chuyển đi không trừ.' : 'Không tính vào mua.')],
    ['Tiêu hao: xuất kho khác đối ứng TK 632x, gán cơ sở theo TK: ' + Object.keys(R.tkMap).sort().map((k) => k + ' → ' + R.tkMap[k]).join('; ')],
    ['Mặt hàng loại khỏi tiêu hao: ' + (R.ex.length ? R.opt.excl : '(không)') + (R.opt.exMua ? ' (cũng loại khỏi mua)' : '')],
    ['Giá xuất trong sổ là giá bình quân đã gồm giá trị hàng khuyến mại; tiêu hao và giá trị điều chuyển lấy nguyên theo sổ.'],
    ['Tồn kho chỉ gồm mã có phát sinh trong kỳ. Sổ không có xuất bán/xuất trả/điều chỉnh.'], ['File nguồn: ' + AN.file]];
  XLSX.utils.book_append_sheet(wb, mk(HW), 'Cách tính');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const fn = 'PhanTich_Mua_TieuHao_' + R.m1 + '_' + R.m2 + '.xlsx';
  if (typeof X.shareOrDownload === 'function') X.shareOrDownload(blob, fn); else X.dlAnchor(blob, fn);
};
