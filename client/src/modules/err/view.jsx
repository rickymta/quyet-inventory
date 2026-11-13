/* Màn hình "Báo lỗi" (window.renderErr, dòng gốc 11065–11272) — phần giao diện JSX */
import { useEffect } from 'react';
import { db, A, st, rerender } from '../../core';
import {
  ER, STS, LNL, LK, NT, TOUCH, E, ymd, kyOf, nz, qm, hay, lnTxt, imT, idbGet, chk, cur, stat, due, cn, dnN, pend, csList, labosList, uniqList, exTxt, tgt, setForm,
} from './data.jsx';

const lineKeys = new WeakMap(); let lineSeq = 0;
const lineKey = (l) => { let k = lineKeys.get(l); if (!k) { k = ++lineSeq; lineKeys.set(l, k); } return k; };
const tried = new Set();

function Fld({ id, lab, v, ph, list }) {
  return <div className="er-f"><label>{lab}</label><input className="inp" id={id} defaultValue={v || ''} placeholder={ph || ''} list={list} autoComplete="off" /></div>;
}

function Slot({ s, t, hint }) {
  const ids = ER.form[s];
  return (
    <div className={'er-slot' + (ER.slot === s ? ' on' : '')} id={'erS_' + s} tabIndex={0} onClick={() => ER.pick(s)} onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); ER.pick(s); ER.addImg(e.dataTransfer.files); }}>
      <div style={st('font-weight:700')}>{t}</div>
      <div style={st('font-size:12px;color:var(--mut)')}>{hint}{TOUCH ? ' · lấy ảnh chụp màn hình từ Thư viện (nút Chọn ảnh) hoặc bấm “Dán ảnh”' : ' · bấm vào ô rồi Ctrl+V để dán'}</div>
      <div style={st('display:flex;gap:8px;margin-top:8px;flex-wrap:wrap')}>
        <button type="button" className="btn btn-outline" onClick={(e) => { e.stopPropagation(); ER.pick(s); ER.paste(); }}>Dán ảnh</button>
        <label className="btn btn-outline" style={st('cursor:pointer')} onClick={(e) => { e.stopPropagation(); ER.pick(s); }}>Chọn ảnh<input type="file" accept="image/*" multiple hidden onChange={(e) => { ER.addImg(e.target.files); e.target.value = ''; }} /></label>
      </div>
      <div className="er-th">{ids.map((i, k) => (
        <div key={i}><img src={ER.cache[i] || undefined} title={imT(i)} onClick={() => ER.zoom(i)} alt="" /><b onClick={() => ER.rmImg(s, k)}>×</b></div>
      ))}</div>
    </div>
  );
}

function Lines() {
  const f = ER.form; if (!f.lines) f.lines = [];
  return (
    <div className="er-f"><label>Dòng hàng bị lỗi (copy từ chứng từ MISA)</label>
      <textarea className="inp" id="erPaste" rows={2} placeholder="Bôi đen dòng bị đỏ trong MISA, Ctrl+C rồi dán vào đây" />
      <div style={st('display:flex;gap:14px;margin:6px 0')}><button type="button" className="addbat" onClick={() => ER.pasteLn()}>Nhận dòng đã dán</button><button type="button" className="addbat" onClick={() => ER.addLn()}>+ Nhập tay 1 dòng</button></div>
      <div id="erLines">{f.lines.map((l, i) => (
        <div className="card" key={lineKey(l)} style={st('margin-bottom:8px;padding:10px')}>
          <div style={st('display:flex;justify-content:space-between;font-weight:700;font-size:13px')}><span>Dòng {i + 1}</span><button type="button" className="addbat" style={st('color:var(--red)')} onClick={() => ER.rmLn(i)}>Xoá dòng</button></div>
          <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px')}>{LK.map((k) => (
            <div className="er-f" key={k[0]} style={k[0] === 'ten' ? st('margin:0;grid-column:1/-1') : st('margin:0')}><label>{k[1]}</label><input className="inp" id={'erL' + i + k[0]} defaultValue={l[k[0]] || ''} autoComplete="off" /></div>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}

function FormView() {
  const f = ER.form; const nl = f.type === 'nl'; let a = ((db && db.folders) || []).slice(); if (f.cs && a.indexOf(f.cs) < 0) a = a.concat(f.cs);
  useEffect(() => {
    const ids = f.bad.concat(f.ok).filter((i) => !ER.cache[i] && !tried.has(i));
    if (!ids.length) return;
    ids.forEach((i) => tried.add(i));
    idbGet(ids, () => rerender());
  });
  useEffect(() => { window.scrollTo(0, 0); }, [ER._fk]);
  return (
    <div className="card" style={st('padding:14px')} key={ER._fk}>
      <div style={st('font-weight:800;margin-bottom:10px')}>{nl ? 'Lỗi nhập liệu (phiếu nhập kho MISA)' : 'Lỗi công nợ labo'}</div>
      <div className="er-f"><label>Cơ sở</label><select className="inp" id="erCs" defaultValue={f.cs || ''}><option value="">— Chọn cơ sở —</option>{a.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
      {nl ? (
        <>
          <div className="er-f"><label>Số chứng từ (phiếu nhập kho)</label><input className="inp" id="erSct" defaultValue={f.sct || ''} placeholder="VD: NK-BTX-11-005" list="erDlS" autoComplete="off" onInput={() => ER.sctCh()} /></div>
          <datalist id="erDlS">{ER.misa.map((r, i) => <option key={i} value={r.sct} />)}</datalist>
          <Fld id="erNcc" lab="Nhà cung cấp" v={f.ncc} />
          <div className="er-f"><label>Loại lỗi (chọn nhiều)</label><div style={st('display:flex;flex-wrap:wrap;gap:6px')}>{LNL.map((x) => <span key={x} className={'chip' + (f.loai.indexOf(x) >= 0 ? ' chip-on' : '')} onClick={() => ER.tgLoai(x)}>{x}</span>)}</div></div>
        </>
      ) : (
        <>
          <Fld id="erLabo" lab="Tên labo (gõ tên mới để tạo, lần sau chọn lại)" v={f.labo} list="erDlL" />
          <datalist id="erDlL">{labosList().map((v) => <option key={v} value={v} />)}</datalist>
          <div style={st('display:grid;grid-template-columns:2fr 1fr;gap:8px')}><Fld id="erKh" lab="Tên khách hàng" v={f.kh} /><Fld id="erPid" lab="Mã KH (PID)" v={f.pid} /></div>
          <div className="card" style={st('padding:10px;margin-bottom:12px')}><div style={st('font-weight:700;margin-bottom:8px')}>Labo báo</div><Fld id="erDvLb" lab="Dịch vụ" v={f.dvLabo} list="erDlD" />
            <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}><Fld id="erSlLb" lab="Số lượng" v={f.slLabo} /><Fld id="erRLb" lab="Số răng" v={f.rLabo} /></div></div>
          <div className="card" style={st('padding:10px;margin-bottom:12px')}><div style={st('display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px')}><span>Trên phần mềm VT</span><button type="button" className="addbat" onClick={() => ER.cpVT()}>Sao chép từ Labo báo</button></div><Fld id="erDvVT" lab="Dịch vụ" v={f.dvVT} list="erDlD" /><Fld id="erSlVT" lab="Số lượng" v={f.slVT} /></div>
          <datalist id="erDlD">{uniqList(['dvVT', 'dvLabo']).map((v) => <option key={v} value={v} />)}</datalist>
          <div className="er-f"><label>Ghi chú: lỗi gì, cần bổ sung gì, yêu cầu gì</label><div style={st('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px')}>{NT.map((x, i) => <span key={i} className="chip" onClick={() => ER.tpl(i)}>{x[0]}</span>)}</div><textarea className="inp" id="erNoteLb" rows={3} defaultValue={f.note || ''} /></div>
          <label style={st('display:flex;gap:8px;align-items:center;margin-bottom:12px;font-weight:600')}><input type="checkbox" id="erNhac" defaultChecked={!!f.nhac} /> Nhắc hàng ngày đến khi xử lý xong</label>
        </>
      )}
      <Slot s="bad" t="Ảnh bằng chứng lỗi" hint={nl ? 'Màn hình MISA đang nhập sai' : 'Màn hình VT / dòng labo báo'} />
      {nl || (f.ok && f.ok.length) ? <Slot s="ok" t="Ảnh đúng" hint="Chứng từ / hóa đơn / màn hình có thông tin đúng" /> : null}
      {nl ? <Lines /> : null}
      <details style={st('margin-bottom:12px')} ref={(el) => { if (el && !el._i) { el._i = 1; el.open = !!f.id; } }}><summary style={st('font-weight:700;cursor:pointer;margin-bottom:8px')}>Tùy chọn thêm (kỳ, trạng thái)</summary>
        <div className="er-f"><label>Kỳ (tháng)</label><input className="inp" type="month" id="erKy" defaultValue={f.ky || kyOf()} /></div>
        <div className="er-f"><label>Trạng thái</label><select className="inp" id="erSt" defaultValue={f.st}>{STS.map((x) => <option key={x}>{x}</option>)}</select></div></details>
      <div style={st('position:sticky;bottom:0;background:#fff;padding:10px 0 calc(10px + env(safe-area-inset-bottom));display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--line)')}>
        <button className="btn btn-primary" style={st('flex:1')} onClick={() => ER.save()}>Lưu lỗi</button>
        {f.id ? <button className="btn btn-outline" onClick={() => ER.dup(f.id)}>Nhân bản</button> : <button className="btn btn-outline" onClick={() => ER.save(1)}>Lưu &amp; ghi tiếp</button>}
        <button className="btn btn-outline" onClick={() => ER.cancel()}>Hủy</button>
      </div>
    </div>
  );
}

/* ---- danh sách ---- */
function HanTxt({ x }) {
  if (x.st === STS[2]) return null; const t = ymd(new Date()); const out = [];
  if (x.han) { const od = x.han < t; out.push(<span key="h"> · <span style={{ color: od ? '#dc2626' : 'inherit', fontWeight: od ? 700 : undefined }}>Hạn {x.han.slice(8)}/{x.han.slice(5, 7)}{od ? ' (quá hạn)' : ''}</span></span>); }
  if (x.type === 'lb' && x.nhac) out.push(<span key="n"> · <span style={{ color: (x.soNhac || 0) >= 3 ? '#dc2626' : 'inherit' }}>Nhắc hàng ngày, đã nhắc {x.soNhac || 0} lần</span></span>);
  return out;
}
function ActRow({ x }) {
  const done = x.st === STS[2]; const lb = x.type === 'lb'; const t = ymd(new Date()); const ack = lb && x.nhac && !done && x.nhacNgay !== t;
  return (
    <div className="er-ft">
      <button type="button" role="switch" aria-checked={done ? 'true' : 'false'} className={'er-sw done' + (done ? ' on' : '')} onClick={(e) => ER.tg(x.id, 'done', e.currentTarget)}><i />Đã xử lý</button>
      <span className="er-sp" />
      {ack ? <button className="btn btn-primary" onClick={() => ER.ack(x.id)}>Đã nhắc hôm nay</button> : null}
      <button className="btn" onClick={() => ER.edit(x.id)}>Sửa</button>
      <details className="er-mn"><summary>⋯</summary><div className="er-pop">
        <button className="addbat" onClick={() => ER.dup(x.id)}>Nhân bản</button>
        {lb ? <button className="addbat" onClick={() => ER.dupImg(x.id)}>Nhân bản kèm ảnh</button> : null}
        {!done ? <button className="addbat" onClick={() => ER.tg(x.id, 'sent')}>{x.st === STS[0] ? 'Đánh dấu đã gửi cơ sở' : 'Bỏ đánh dấu đã gửi cơ sở'}</button> : null}
        {lb && !done ? <button className="addbat" onClick={() => ER.nhac(x.id)}>{x.nhac ? 'Tắt nhắc hàng ngày' : 'Bật nhắc hàng ngày'}</button> : null}
        {lb && x.bad.length ? <button className="addbat" onClick={() => ER.share(x.id)}>Gửi ảnh cho labo</button> : null}
        <button className="addbat" style={st('color:var(--red)')} onClick={() => ER.del(x.id)}>Xoá</button>
      </div></details>
    </div>
  );
}
function Card({ x }) {
  const nl = x.type === 'nl';
  const t = nl ? x.sct + ' · ' + x.ncc : (x.kh || x.labo) + (x.pid ? ' · ' + x.pid : '');
  const hasEb = nl ? ((x.loai && x.loai.length) || x.sai || x.dung) : !!x.loai1;
  const k = STS.indexOf(x.st); const od = x.han && x.st !== STS[2] && x.han < ymd(new Date());
  const lines = nl && x.lines && x.lines.length ? x.lines.map((l, i) => <span key={i}>{i ? <br /> : null}{lnTxt(l)}</span>) : null;
  const d = nl ? lines : <><b>Labo báo:</b> {x.dvLabo || '–'}{x.slLabo ? ' · SL ' + x.slLabo : ''}{x.rLabo ? ' · ' + x.rLabo + ' răng' : ''}<br /><b>VT:</b> {x.dvVT || '–'}{x.slVT ? ' · SL ' + x.slVT : ''}</>;
  return (
    <div className={'card er-c s' + k + (od ? ' od' : '')}>
      <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:8px')}><div className="er-ttl">{t}</div>{k === 1 ? <span className="er-st">{x.st}</span> : null}</div>
      <div className="er-chips">{!nl && x.labo ? <span className="er-ch lb">Labo: {x.labo}</span> : null}{x.cs ? <span className="er-ch cs">Kho: {x.cs}</span> : null}</div>
      {hasEb || x.note ? (
        <div className="er-err">
          {nl ? <>
            {x.loai && x.loai.length ? x.loai.map((l) => <span key={l} className="er-tag">{l}</span>) : null}
            {x.sai || x.dung ? <div><span className="er-bad">{x.sai || '–'}</span> → <span className="er-good">{x.dung || '–'}</span></div> : null}
          </> : (x.loai1 ? <span className="er-tag">{x.loai1}</span> : null)}
          {x.note ? <div>{x.note}</div> : null}
        </div>
      ) : null}
      {d ? <div className="er-d">{d}</div> : null}
      <div className="er-sub">{x.ky}{x.tien ? ' · ' + x.tien + 'đ' : ''}<HanTxt x={x} /> · {x.cl && !x.bad.length && !x.ok.length ? 'Ảnh đã xoá sau khi xuất file' : 'Ảnh: ' + x.bad.length + ' bằng chứng, ' + x.ok.length + ' đúng'}{x.by ? ' · ' + x.by : ''}</div>
      <ActRow x={x} />
    </div>
  );
}
function StatView() {
  const S0 = stat();
  return (
    <>
      <div className="card" style={st('margin-bottom:12px;overflow-x:auto')}><div style={st('font-weight:700;margin-bottom:6px')}>Theo cơ sở{ER.ky ? ' · ' + ER.ky : ''}</div>
        <table className="er-tb"><tbody><tr><th>Cơ sở</th><th className="n">Lỗi NK</th><th className="n">Phiếu lỗi</th><th className="n">Tỷ lệ</th><th className="n">Lỗi labo</th></tr>
          {Object.keys(S0.T).map((c) => { const t = S0.T[c]; const p = Object.keys(t.ps).length; const n = S0.N[c]; return <tr key={c}><td>{c}</td><td className="n">{t.nl}</td><td className="n">{p}{n ? '/' + n : ''}</td><td className="n">{n ? (p / n * 100).toFixed(1) + '%' : '–'}</td><td className="n">{t.lb}</td></tr>; })}
        </tbody></table>
        <div style={st('font-size:12px;color:var(--mut);margin-top:6px')}>Tỷ lệ = số phiếu có lỗi / tổng phiếu nhập kho trong file MISA đã nạp (cần nạp file MISA của kỳ đó).</div></div>
      <div className="card"><div style={st('font-weight:700;margin-bottom:6px')}>Theo loại lỗi</div><table className="er-tb"><tbody>
        {Object.keys(S0.L).sort((a, b) => S0.L[b] - S0.L[a]).map((l) => <tr key={l}><td>{l}</td><td className="n">{S0.L[l]}</td></tr>)}
      </tbody></table></div>
    </>
  );
}
function ResView() {
  if (ER.f === 'stat') return <StatView />;
  const C = ER._c || []; const q = ER.q; const Cs = q ? C.filter((c) => qm(c.r.sct + ' ' + c.r.ncc + ' ' + (ER.map[c.r.c] || '') + ' ' + (c.r.c || '') + ' ' + c.k)) : C;
  let L = cur(); const dn = ER.f === 'done'; let hid = 0;
  if (!dn && ER.st !== STS[2]) { const L0 = L.length; L = L.filter((x) => x.st !== STS[2]); hid = L0 - L.length; }
  const sh = L.slice(0, ER.n);
  return (
    <>
      {Cs.length && ER.f !== 'lb' && ER.f !== 'done' ? (
        <details className="card" style={st('margin-bottom:12px')} open={q ? true : undefined}><summary style={st('font-weight:700;cursor:pointer')}>Nghi vấn từ file MISA ({Cs.length}{q ? '/' + C.length : ''} mục)</summary>
          {Cs.map((c, i) => <div key={i} className="er-sus" style={st('padding:6px 8px;margin-top:8px;font-size:13px')}><b>{c.r.sct}</b> {c.r.ncc}<br />{c.k} <button className="addbat" onClick={() => ER.fromChk(C.indexOf(c))}>Ghi lỗi</button></div>)}
        </details>
      ) : null}
      {L.length ? <>{sh.map((x) => <Card key={x.id} x={x} />)}{L.length > ER.n ? <button className="btn btn-outline" onClick={() => { ER.n += 30; ER.res(); }}>Xem thêm ({L.length - ER.n})</button> : null}</>
        : <div className="card" style={st('color:var(--mut);text-align:center')}>{q ? 'Không có kết quả cho “' + q + '”.' : (dn ? 'Chưa có công việc nào đã xử lý.' : hid ? 'Không còn lỗi chưa xử lý. ' + hid + ' lỗi đã xử lý nằm ở tab “Công việc đã xử lý”.' : 'Chưa có lỗi nào. Bấm “+ Lỗi nhập liệu” hoặc “+ Lỗi labo” để ghi.')}</div>}
    </>
  );
}

function DueBox() {
  const d = due(); if (!d.length) return null; const g = {}; d.forEach((x) => { g[x.labo] = (g[x.labo] || 0) + 1; });
  return <div className="card" style={st('margin-bottom:12px;border-left:3px solid #dc2626;font-size:13px')}><b>Hôm nay cần nhắc {d.length} lỗi labo</b><br />{Object.keys(g).map((k) => k + ': ' + g[k]).join(' · ')}<div style={st('margin-top:6px')}><button className="addbat" onClick={() => ER.set('f', 'lb')}>Xem danh sách</button></div></div>;
}
function Banners() {
  return <DueBox />;
}
function CleanBox() {
  const T = ER.ky ? tgt() : []; let n = 0; T.forEach((x) => { n += x.bad.length + x.ok.length; });
  const w = exTxt('w'); const xl = exTxt('x'); const no = <b style={{ color: 'var(--red)' }}>chưa xuất</b>;
  return (
    <div className="card" style={st('margin-bottom:12px;border-left:3px solid #f59e0b')}><div style={st('font-weight:700')}>Dọn dữ liệu sau khi xuất file</div>
      {ER.ky ? <><div style={st('font-size:13px;margin:6px 0 8px')}>Kỳ {ER.ky}: {T.length} lỗi, {n} ảnh.<br />Xuất Word kèm ảnh: {w || no}<br />Xuất Excel: {xl || no}</div>
        <div style={st('display:flex;gap:14px;flex-wrap:wrap')}><button className="addbat" style={st('font-weight:700')} onClick={() => ER.pack()}>Xuất gói báo cáo tháng (Excel + Word)</button><button className="addbat" onClick={() => ER.clImg()}>Xoá ảnh, giữ số liệu thống kê</button><button className="addbat" style={st('color:var(--red)')} onClick={() => ER.clAll()}>Xoá cả lỗi của kỳ</button></div></>
        : <div style={st('font-size:13px;margin-top:6px')}>Chọn tháng ở ô tháng bên dưới trước, rồi xuất Word kèm ảnh và Excel của tháng đó.</div>}
    </div>
  );
}
function Tools() {
  return (
    <details className="er-mn"><summary>Công cụ</summary><div className="er-pop">
      <label className="addbat" style={st('cursor:pointer')}>Nạp file MISA{ER.misa.length ? ' (' + ER.misa.length + ' phiếu NK)' : ''}<input type="file" accept=".xlsx,.xls" hidden onChange={(e) => ER.misaUp(e.target)} /></label>
      <button className="addbat" onClick={() => ER.xls()}>Xuất Excel</button>
      <button className="addbat" onClick={() => ER.doc()}>Xuất Word kèm ảnh</button>
      <button className="addbat" style={st('color:var(--red)')} onClick={() => ER.cl()}>Dọn dữ liệu</button>
    </div></details>
  );
}

export function ErrView() {
  const form = ER.v === 'form' && ER.form;
  const top = (
    <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => (ER.v === 'form' ? ER.cancel() : A.go('home'))}>‹</button><div className="ttl">Báo lỗi</div></div><div style={st('height:10px')} /></div>
  );
  if (form) return <>{top}<div className="wrap" style={st('padding-top:16px;padding-bottom:100px')}><FormView /></div></>;
  ER._c = ER.misa.length ? chk() : [];
  const chips = [['all', 'Tất cả' + (pend() ? ' (' + pend() + ' chưa xử lý)' : '')], ['nl', 'Nhập liệu' + cn('nl')], ['lb', 'Labo' + cn('lb')], ['done', 'Công việc đã xử lý' + dnN()], ['stat', 'Thống kê']];
  const cs = csList();
  return (
    <>
      {top}
      <div className="wrap" style={st('padding-top:16px;padding-bottom:100px')}>
        <Banners />
        <div style={st('display:flex;gap:8px;margin-bottom:10px')}><button className="btn btn-primary" style={st('flex:1')} onClick={() => ER.new('nl')}>+ Lỗi nhập liệu</button><button className="btn btn-primary" style={st('flex:1')} onClick={() => ER.new('lb')}>+ Lỗi labo</button><Tools /></div>
        {ER.clean ? <CleanBox /> : null}
        <div style={st('display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px')}>{chips.map((x) => <span key={x[0]} className={'chip' + (ER.f === x[0] ? ' chip-on' : '')} onClick={() => ER.set('f', x[0])}>{x[1]}</span>)}</div>
        {ER.f !== 'stat' ? <input className="inp" id="erQ" type="search" placeholder="Tìm số phiếu, tên cơ sở, nhà cung cấp, labo, khách hàng, PID…" value={ER.q} onChange={(e) => { ER.q = e.target.value; ER.n = 30; rerender(); }} style={st('margin-bottom:10px;width:100%;box-sizing:border-box')} /> : null}
        <div style={st('display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px')}>
          <input className="inp" type="month" value={ER.ky} onChange={(e) => ER.set('ky', e.target.value)} style={st('flex:1 1 140px')} />
          <select className="inp" value={ER.cs} onChange={(e) => ER.set('cs', e.target.value)} style={st('flex:1 1 140px')}><option value="">Mọi cơ sở</option>{cs.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          <select className="inp" value={ER.st} onChange={(e) => ER.set('st', e.target.value)} style={st('flex:1 1 140px')}><option value="">Mọi trạng thái</option>{STS.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        </div>
        {ER.nh ? <div style={st('margin-bottom:10px')}><span className="chip chip-on" onClick={() => ER.set('nh', false)}>Đang lọc: lỗi bật nhắc chưa xử lý (mọi tháng) ✕</span></div> : null}
        <div id="erRes"><ResView /></div>
      </div>
    </>
  );
}
