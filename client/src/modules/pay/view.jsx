/* Đề nghị thanh toán NCC — giao diện (dòng gốc 10227–10484). Mỗi hàm xxxHtml() gốc → hàm cùng tên trả JSX. */
/* eslint-disable */
import { Fragment } from 'react';
import { A, db, S, st, H, I, soThanhChu, rerender, smatch } from '../../core';
import {
  PAY, PAY_LOI, PAY_ST, PAY_NGUONG_BK, PAY_ZALO_MAX,
  payDb, payCsCodes, payCsName, payCsLabel, payCsFull, payF, payDs, payMLab, payHn,
  payK, payCompute, payNoteErrs, payOkGet, payEcOk, payHits, payMonths, payAttn, payErrAll, payNguoiLap,
  payContent, paySoHd, payCheck,
} from './logic.js';

const flat = (arr) => arr.filter((v, j, a) => a.indexOf(v) === j).join('; ');

export function payScopeLine() {
  return PAY.m === 'all' ? null : <div className="rcscope-l">Đang lọc: <b>tháng {payMLab(PAY.m)}</b> · mọi nút xuất / in đều theo tháng này</div>;
}
export function payTag(t, c) {
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'var(--' + c + '-bg)', color: 'var(--' + c + ')' }}>{t}</span>;
}
export function pxIc(n, s) {
  const P = {
    print: '<path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    files: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    compare: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  };
  return H('<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>');
}

/* ----- ghi chú lỗi cơ sở theo phiếu ----- */
export function payNoteEdHtml(gk, i, n, mg) {
  const T = (n && n.t) || [], Xt = (n && n.x) || '';
  return (
    <div style={{ margin: mg || '8px 0 2px 30px', padding: 10, background: 'var(--card2)', borderRadius: 10 }}>
      <div style={st('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px')}>
        {PAY_LOI.map((t, ti) => <button key={ti} className={'rcchip' + (T.indexOf(t) >= 0 ? ' on' : '')} onClick={() => A.payNoteTag(gk, i, ti)}>{t}</button>)}
      </div>
      <input className="inp" style={st('margin-bottom:8px')} placeholder="Ghi chú thêm (vd: thiếu PNK ngày 12/10)…" key={gk + '#' + i} defaultValue={Xt}
        onChange={(e) => A.payNoteTxt(gk, i, e.target.value)} onBlur={() => rerender()} />
      <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
        <button className="btn btn-outline" style={st('padding:8px;font-size:13px;margin:0')} onClick={() => A.payNoteClr(gk, i)}>Xóa ghi chú</button>
        <button className="btn btn-primary" style={st('padding:8px;font-size:13px;margin:0')} onClick={() => A.payNoteEd()}>Xong</button>
      </div>
    </div>
  );
}

export function payHitHtml(z) {
  const g = z.g, x = z.x, i = z.i, r = x.r, gk = g.key, open = PAY.ed === gk + '#' + i, nt = x.note, er = nt ? payNoteErrs(nt) : [], ok = payOkGet(r), s = PAY_ST[x.st];
  const bs = 'padding:9px;font-size:13px;margin:0;';
  return (
    <div className="card" style={{ marginBottom: 10 }} key={gk + '#' + i}>
      <div style={st('display:flex;gap:10px;align-items:flex-start')}>
        <div style={st('flex:1;min-width:0')}>
          <div style={st('font-weight:700;font-size:14px;word-break:break-word')}>{g.short}</div>
          <div style={st('font-size:12px;color:var(--mut);word-break:break-word')}>Phiếu {r[1] || '—'} · HĐ {r[2] || r[6] || '—'}</div>
          <div style={st('font-size:12px;color:var(--mut)')}>{payDs(x.d) || '—'} · CS {r[7] || '?'}</div>
        </div>
        <div style={st('text-align:right;flex:none')}>
          <div style={st('font-weight:800;font-variant-numeric:tabular-nums')}>{payF(x.tong)}</div>
          <div style={{ marginTop: 4 }}>{x.st === 'ok' ? payTag('Khớp', 'green') : payTag(s[0], s[1])}</div>
        </div>
      </div>
      <div style={st('margin-top:10px;padding-top:10px;border-top:1px solid var(--line)')}>
        <div style={st('font-size:11px;font-weight:700;color:var(--mut2);margin-bottom:6px')}>CHỨNG TỪ</div>
        <div style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          <button className="btn btn-outline" style={st(bs + (ok ? 'background:var(--green);border-color:var(--green);color:#fff' : ''))} onClick={() => A.payCdOk(gk, i)}>✔ Chứng từ đủ</button>
          <button className="btn btn-outline" style={st(bs + (er.length ? 'background:var(--red);border-color:var(--red);color:#fff' : ''))} onClick={() => A.payCdMiss(gk, i)}>✖ Thiếu chứng từ</button>
        </div>
        {er.length ? (
          <div style={st('margin-top:8px;color:var(--orange);font-weight:600;font-size:12.5px')}>
            ⚠ {flat(er.map((q) => q.d))}{nt.imp ? <> <span style={st('font-weight:400;color:var(--mut2)')}>(từ file Excel)</span></> : null}
          </div>
        ) : null}
        {er.length && !open ? (
          <button style={st('border:none;background:none;padding:4px 0 0;font:inherit;font-size:12px;font-weight:700;color:var(--teal);cursor:pointer')} onClick={() => A.payNoteEd(gk, i)}>✎ Sửa ghi chú</button>
        ) : null}
        {open ? payNoteEdHtml(gk, i, nt, '8px 0 0 0') : null}
      </div>
    </div>
  );
}

/* ----- bổ sung dữ liệu / nạp file ----- */
export function payAddHtml(P) {
  const l = P.last;
  const dup = l ? (l.mua.dup || 0) + (l.hd.dup || 0) : 0;
  return (
    <div style={st('margin-top:12px;padding-top:12px;border-top:1px solid var(--line)')}>
      <div style={st('font-weight:700;font-size:13px;margin-bottom:3px')}>Bổ sung dữ liệu mua hàng / hóa đơn MISA</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:8px;line-height:1.5')}>Chỉ <b>thêm dòng mới</b>, không xóa dữ liệu đang có. Dòng trùng (cùng số CT + số HĐ + NCC + số tiền) tự bỏ qua. Xong app tự đối chiếu lại. File cần sheet <b>MUA_HANG</b> và/hoặc <b>HOA_DON_MISA</b>.</div>
      <label className="btn btn-primary" style={{ marginBottom: 8 }}>{I('upload', 16)}Bổ sung từ file Excel<input type="file" accept=".xlsx,.xlsm,.xls" style={{ display: 'none' }} onChange={(e) => A.payAdd(e.target, 0)} /></label>
      <div className="rcact">
        <label className="btn btn-outline">Chỉ Mua hàng<input type="file" accept=".xlsx,.xlsm,.xls" style={{ display: 'none' }} onChange={(e) => A.payAdd(e.target, 1)} /></label>
        <label className="btn btn-outline">Chỉ HĐ MISA<input type="file" accept=".xlsx,.xlsm,.xls" style={{ display: 'none' }} onChange={(e) => A.payAdd(e.target, 2)} /></label>
      </div>
      {l ? (
        <>
          <div style={st('font-size:12px;color:var(--mut);margin-top:2px')}>Lần bổ sung gần nhất: <b>{l.file || ''}</b> · +{l.mua.add} phiếu mua, +{l.hd.add} HĐ MISA{l.ncc.add ? ', +' + l.ncc.add + ' NCC' : ''}{dup ? ' · bỏ qua ' + dup + ' dòng trùng' : ''}</div>
          {P.undo ? <button className="btn btn-outline" style={st('padding:8px;font-size:12.5px;margin-top:8px;color:var(--red)')} onClick={() => A.payUndoAdd()}>Hoàn tác lần bổ sung này</button> : null}
        </>
      ) : null}
    </div>
  );
}

function PayFileInput() {
  return <input type="file" id="payin" accept=".xlsx,.xlsm,.xls" style={{ display: 'none' }} onChange={(e) => A.payFile(e.target)} />;
}

export function payHomeHtml() {
  const P = payDb();
  if (!P.mua.length) {
    return (
      <div className="card">
        <PayFileInput />
        <div style={st('font-weight:700;margin-bottom:4px')}>Nhập file Excel đối chiếu công nợ</div>
        <div style={st('font-size:13px;color:var(--mut);margin-bottom:12px')}>Chọn file có các sheet <b>DANH MUC NCC</b>, <b>MUA_HANG</b>, <b>HOA_DON_MISA</b> (đúng mẫu file Đề nghị thanh toán). App tự đối chiếu theo số HĐ, lập Giấy đề nghị thanh toán, Bảng kê hóa đơn và Danh sách thanh toán; xuất Excel đúng bố cục file mẫu.</div>
        <button className="btn btn-primary" style={{ marginBottom: 8 }} onClick={() => document.getElementById('payin').click()}>{I('upload', 17)}Chọn file Excel</button>
        <button className="btn btn-outline" onClick={() => A.payTemplate()}>{I('download', 17)}Tải file Excel mẫu</button>
      </div>
    );
  }
  const L = payCompute();
  let ch = 0, nk = 0, np = 0, nOk = 0, giu = 0;
  L.forEach((g) => { ch += g.chot; if (g.chot > 0) nk++; if (g.bad) np++; if (g.khop) nOk++; giu += g.tong - g.chot + g.extraSum; });
  const tot = ch + giu, pct = tot > 0 ? ch / tot * 100 : 100, pcs = (Math.round(pct * 10) / 10).toLocaleString('vi-VN');
  const go = (f) => { A.payFilter(f); setTimeout(() => { const e = document.getElementById('paylist-h'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); };
  const chip = (on, fn, lab, n, dot, key) => (
    <button key={key} className={'pxch' + (on ? ' on' : '')} onClick={fn}>{dot ? <u className={dot} /> : null}{lab}<b>{n}</b></button>
  );
  const tl = [['payXlsxDs', 'list', 'DS thanh toán', 'Danh sách chi trả'], ['payXlsxAll', 'files', 'Phiếu hàng loạt', 'Mỗi NCC một phiếu'], ['payXlsxRecon', 'compare', 'Đối chiếu MISA', 'Từng phiếu mua']];
  const ms = payMonths();
  if (PAY.m !== 'all' && !ms.some((m) => m[0] === PAY.m)) PAY.m = 'all';
  let monthRow = null;
  if (ms.length > 1 || PAY.m !== 'all') {
    let mt = 0; ms.forEach((m) => { mt += m[1]; });
    monthRow = (
      <>
        <div className="pxfk">Tháng (dữ liệu có {ms.length} tháng)</div>
        <div className="pxrow">{[['all', 'Tất cả', mt]].concat(ms.map((m) => [m[0], payMLab(m[0]), m[1]])).map((f) => chip(PAY.m === f[0], () => A.payMonth(f[0]), f[1], f[2], null, f[0]))}</div>
      </>
    );
  }
  const ccs = {}; let ctot = 0; const cC = payCsCodes();
  L.forEach((g) => { g.rows.forEach((x) => { const c = x.r[7] || '?'; ccs[c] = (ccs[c] || 0) + 1; ctot++; }); });
  const cOrd = cC.filter((c) => ccs[c]).concat(Object.keys(ccs).filter((c) => c !== '?' && cC.indexOf(c) < 0).sort());
  if (ccs['?']) cOrd.push('?');
  if (PAY.ec !== 'all' && !ccs[PAY.ec]) PAY.ec = 'all';
  const cnt = { all: L.length, ok: 0, bad: 0, stk: 0, note: 0 };
  L.forEach((g) => { if (g.khop) cnt.ok++; if (g.bad) cnt.bad++; if (!g.stk && g.chot > 0) cnt.stk++; if (g.nNote) cnt.note++; });
  return (
    <>
      <PayFileInput />
      <div className="pxtop">
        <section className="pxh">
          <div className="pxh-k">Tổng chốt được</div>
          <div className="pxh-n">{payF(ch)}<small>đ</small></div>
          <div className="pxbar" role="img" aria-label={'Chốt được ' + pcs + '% tổng công nợ'}>
            {giu > 0 ? <><i className="g" style={{ flex: pct }} /><i className="r" style={{ flex: 100 - pct }} /></> : <i className="g" style={{ flex: 1 }} />}
          </div>
          <div className="pxh-s">{giu > 0 ? <>Giữ lại <b>{payF(giu)} đ</b> do lệch · chốt được {pcs}% công nợ</> : 'Không có khoản nào bị giữ lại — sẵn sàng trình ký'}</div>
          <div className="pxst2">
            <button className="pxst" onClick={() => go('ok')}><b>{nOk}</b><span>NCC khớp toàn bộ</span></button>
            <button className="pxst" onClick={() => go('bad')}><b>{np}</b><span>NCC lệch, cần xử lý</span></button>
          </div>
          <div className="pxh-m">{P.file || 'File Excel'} · {L.length} NCC · {P.mua.length} phiếu mua · {P.hd.length} HĐ MISA</div>
        </section>
        <section className="pxact">
          {payScopeLine()}
          <button className="pxa-main" onClick={() => A.payPrintAll()} disabled={!nOk}>{pxIc('print', 26)}<span><b>In phiếu + bảng kê</b><small>{nOk ? nOk + ' NCC khớp toàn bộ' : 'Chưa có NCC nào khớp'}</small></span></button>
          <div className="pxa-k">Hoặc xuất Excel</div>
          <div className="pxa-g">{tl.map((t) => <button key={t[0]} className="pxa" onClick={() => A[t[0]]()}>{pxIc(t[1], 20)}<b>{t[2]}</b><small>{t[3]}</small></button>)}</div>
        </section>
      </div>
      <div className="pxq">{pxIc('search', 18)}<input className="inp" placeholder="Tìm NCC, số HĐ, số phiếu, số tiền, cơ sở…" defaultValue={PAY.q} ref={(el) => { if (el && document.activeElement !== el && el.value !== (PAY.q || '')) el.value = PAY.q || ''; }} onChange={(e) => A.paySearch(e.target.value)} /></div>
      {monthRow}
      <div className="pxfk">Cơ sở <span style={{ fontWeight: 500 }}>(số phiếu mua)</span></div>
      <div className="pxrow">{[['all', 'Tất cả', ctot]].concat(cOrd.map((c) => [c, c === '?' ? 'Chưa rõ' : c, ccs[c]])).map((f) => chip(PAY.ec === f[0], () => A.payEc(f[0]), f[1], f[2], null, f[0]))}</div>
      <div className="pxfk">Trạng thái</div>
      <div className="pxrow">{[['all', 'Tất cả', ''], ['ok', 'Khớp', 'g'], ['bad', 'Lệch', 'r'], ['stk', 'Thiếu STK', 'a'], ['note', 'Có ghi chú lỗi', 'o']].map((f) => chip(PAY.f === f[0], () => A.payFilter(f[0]), f[1], cnt[f[0]], f[2], f[0]))}</div>
      <div id="paylist-h" /><div id="paylist">{payListHtml(L)}</div>
    </>
  );
}

export function payNccListHtml(L) {
  const q = payK(PAY.q), A1 = [], R1 = [];
  L.filter((g) => {
    if (PAY.f === 'ok' && !g.khop) return false; if (PAY.f === 'bad' && !g.bad) return false; if (PAY.f === 'stk' && !(!g.stk && g.chot > 0)) return false; if (PAY.f === 'note' && !g.nNote) return false; if (PAY.ec !== 'all' && !g.rows.some((x) => payEcOk(x.r[7]))) return false;
    return !q || smatch(payK(g.full + ' ' + g.short), q.split(' '));
  }).forEach((g) => { (payAttn(g) ? A1 : R1).push(g); });
  const card = (g) => {
    const held = g.tong - g.chot + g.extraSum, cls = g.khop ? 'ok' : (g.chot > 0 ? 'pt' : 'bd'),
      stt = g.khop ? payTag('Khớp toàn bộ', 'green') : (g.chot > 0 ? payTag('Chốt 1 phần · lệch ' + g.bad, 'amber') : payTag('Lệch · ' + g.bad, 'red'));
    return (
      <div key={g.key} className={'pxc ' + cls} onClick={() => A.paySel(g.key)}>
        <div><div className="pxc-n">{g.short}</div><div className="pxc-f">{g.full}</div></div>
        <div className="pxc-a"><b>{payF(g.tong)}</b><span>{g.khop ? g.rows.length + ' HĐ' : g.nOk + '/' + g.rows.length + ' HĐ khớp'}</span>{!g.khop && held > 0 ? <em>Giữ lại {payF(held)}</em> : null}</div>
        <div className="pxc-t">{stt}{g.chot > 0 ? payTag(g.pri, 'sky') : null}{g.stk ? null : payTag('Thiếu STK', 'red')}{g.nNote ? payTag('Ghi chú lỗi · ' + g.nNote, 'orange') : null}</div>
      </div>
    );
  };
  const grp = PAY.f === 'all' && A1.length && R1.length;
  const sec = (t, arr, c) => (arr.length ? (
    <>
      {grp ? <div className={'pxg ' + c}><b>{t}</b><span>{arr.length}</span></div> : null}
      {arr.map(card)}
    </>
  ) : null);
  if (!A1.length && !R1.length) return null;
  return <>{sec('Cần xử lý', A1, 'r')}{sec('Sẵn sàng trình ký', R1, 'g')}</>;
}

export function payListHtml(L) {
  const qs = String(PAY.q || '').trim(), Hh = (qs.length >= 2 || PAY.ec !== 'all') ? payHits(L, qs.length >= 2 ? qs : '') : [], lim = 40;
  const list = payNccListHtml(L);
  if (!list && !Hh.length) {
    return (
      <div className="pxe"><b>Không có kết quả phù hợp</b>Thử bỏ bớt bộ lọc hoặc gõ từ khóa khác.<br />
        <button className="btn btn-outline" style={{ display: 'inline-flex', width: 'auto', padding: '9px 18px', marginTop: 12 }} onClick={() => A.payClr()}>Xóa bộ lọc</button></div>
    );
  }
  return (
    <>
      {list}
      {Hh.length ? (
        <>
          <div style={st('font-size:12.5px;font-weight:800;margin:14px 2px 8px')}>{qs.length >= 2 ? 'Phiếu mua khớp “' + qs + '”' : 'Phiếu mua'}{PAY.ec !== 'all' ? ' · cơ sở ' + (PAY.ec === '?' ? 'chưa rõ' : PAY.ec) : ''} · {Hh.length}</div>
          {Hh.slice(0, lim).map(payHitHtml)}
          {Hh.length > lim ? <div className="card" style={st('color:var(--mut);text-align:center;font-size:13px')}>Còn {Hh.length - lim} phiếu — gõ thêm ký tự để thu hẹp</div> : null}
        </>
      ) : null}
    </>
  );
}

/* ----- Rà soát lỗi nhập liệu → báo cơ sở qua Zalo ----- */
export function payErrCard() {
  const E = payErrAll(); let n = 0; E.forEach((B) => { n += B.items.length; });
  if (!n) return <div className="card" style={{ marginBottom: 12 }}><div style={st('font-weight:700;margin-bottom:2px')}>Rà soát lỗi nhập liệu</div><div style={st('font-size:13px;color:var(--green);font-weight:600')}>✓ Không phát hiện lỗi nhập liệu cần báo cơ sở</div></div>;
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={st('font-weight:700;margin-bottom:2px')}>Rà soát lỗi nhập liệu</div>
      <div style={st('font-size:13px;color:var(--mut);margin-bottom:10px')}><b style={{ color: 'var(--red)' }}>{n} dòng</b> cần báo cơ sở: {E.map((B) => (B.cs || 'Chưa rõ cơ sở') + ' ' + B.items.length).join(' · ')}</div>
      <div className="rcact" style={{ marginBottom: 0 }}>
        <button className="btn btn-primary" onClick={() => A.payView('err')}>{I('edit', 16)}Lỗi & tin Zalo</button>
        <button className="btn btn-outline" onClick={() => A.payXlsxErr()}>{I('download', 16)}{PAY.ec === 'all' ? 'Xuất Excel tổng hợp' : 'Xuất Excel ' + (PAY.ec === '?' ? 'chưa rõ' : PAY.ec)}</button>
      </div>
    </div>
  );
}

export function payErrHtml() {
  const E = payErrAll(), P = payDb(); let n = 0; E.forEach((B) => { n += B.items.length; });
  const head = (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={st('font-size:12.5px;color:var(--mut);line-height:1.5')}>Lỗi lấy từ sheet <b>MUA_HANG</b> khi đối chiếu với <b>HOA_DON_MISA</b> (file: {P.file || '—'}). Mỗi cơ sở một tin Zalo; tin dài hơn {payF(PAY_ZALO_MAX)} ký tự được tự tách thành nhiều tin.</div>
      {n ? <div style={st('margin-top:8px;font-weight:800')}>{n} dòng lỗi · {E.length} nhóm</div> : null}
    </div>
  );
  if (!n) return <>{head}<div className="card" style={st('text-align:center;color:var(--green);font-weight:700')}>✓ Không phát hiện lỗi nhập liệu</div></>;
  const cc = [['all', 'Tất cả', n]].concat(E.map((B) => [B.cs || '?', B.cs || 'Chưa rõ', B.items.length]));
  if (!cc.some((f) => f[0] === PAY.ec)) PAY.ec = 'all';
  return (
    <>
      {head}
      <button className="btn btn-outline" style={{ marginBottom: 10 }} onClick={() => A.payXlsxErr()}>{I('download', 16)}{PAY.ec === 'all' ? 'Xuất Excel báo lỗi — tất cả cơ sở' : 'Xuất Excel báo lỗi — ' + payCsLabel(PAY.ec === '?' ? '' : PAY.ec)}</button>
      <div className="rcchips">{cc.map((f) => <button key={f[0]} className={'rcchip' + (PAY.ec === f[0] ? ' on' : '')} onClick={() => A.payErrFilter(f[0])}>{f[1]}<b>{f[2]}</b></button>)}</div>
      {E.map((B, bi) => {
        if (PAY.ec !== 'all' && PAY.ec !== (B.cs || '?')) return null;
        const nm = B.cs ? 'Cơ sở ' + payCsFull(B.cs) : 'Chưa xác định cơ sở (gửi nhóm chung)', pt = B.parts;
        return (
          <div className="card" style={{ marginBottom: 12 }} key={B.cs || '?'}>
            <div style={st('display:flex;justify-content:space-between;align-items:center;gap:8px')}><div style={st('font-weight:800;font-size:15px')}>{nm}</div>{payTag(B.items.length + ' dòng lỗi', 'red')}</div>
            <details open={B.items.length <= 5} style={{ margin: '8px 0' }}>
              <summary style={st('font-size:13px;font-weight:700;cursor:pointer;color:var(--teal)')}>Danh sách lỗi</summary>
              {B.items.map((it, i) => (
                <div key={i} style={st('padding:8px 0;border-top:1px solid var(--line);font-size:12.5px')}>
                  <b>{i + 1}. {it.ncc}</b>
                  {it.l2 ? <div style={st('color:var(--mut);font-size:11.5px')}>{it.l2}</div> : null}
                  <div style={st('color:var(--red);margin-top:2px')}>{it.e.map((z) => z.d).join('; ')}</div>
                </div>
              ))}
            </details>
            <details style={{ marginBottom: 6 }}>
              <summary style={st('font-size:13px;font-weight:700;cursor:pointer;color:var(--teal)')}>Xem nội dung tin Zalo ({pt.length} tin)</summary>
              {pt.map((t, ti) => <div key={ti} style={st('white-space:pre-wrap;word-break:break-word;font-size:12.5px;background:var(--card2);border-radius:10px;padding:10px;margin-top:6px;line-height:1.5')}>{t}</div>)}
            </details>
            {pt.map((t, pi) => (
              <div key={pi} style={st('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px')}>
                <button className="btn btn-primary" style={{ padding: 10 }} onClick={() => A.payErrCopy(bi, pi, 0)}>{I('file', 15)}{pt.length > 1 ? 'Sao chép tin ' + (pi + 1) + '/' + pt.length : 'Sao chép tin Zalo'}</button>
                <button className="btn btn-outline" style={{ padding: 10 }} onClick={() => A.payErrCopy(bi, pi, 1)}>Chia sẻ → Zalo</button>
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop: 10, padding: 10 }} onClick={() => A.payXlsxErr(B.cs || '?')}>{I('download', 15)}Xuất Excel báo lỗi cơ sở này</button>
          </div>
        );
      })}
    </>
  );
}

/* ----- cấu hình ----- */
export function payCfgHtml() {
  const C = payDb().cfg;
  const f = (k, l) => (
    <Fragment key={k}>
      <label className="lbl">{l}</label>
      <input className="inp" style={{ marginBottom: 8 }} value={C[k]} onChange={(e) => { A.payCfg(k, e.target.value); rerender(); }} />
    </Fragment>
  );
  return (
    <details className="card" style={{ marginBottom: 12 }}>
      <summary style={st('font-weight:700;cursor:pointer')}>Thông tin in trên phiếu</summary>
      <div style={{ marginTop: 10 }}>
        {f('nlap', 'Người dự trù (để trống = tên trong Cài đặt)')}{f('pb', 'Phòng/Ban')}{f('dv', 'Đơn vị')}{f('dvcp', 'ĐVCP')}{f('tgd', 'Tổng giám đốc')}{f('ktt', 'Kế toán thanh toán')}{f('ql', 'Quản lý khoa/phòng')}
      </div>
    </details>
  );
}
export function payCsCfgHtml() {
  const L = payDb().csl;
  return (
    <details className="card" style={{ marginBottom: 12 }} open={PAY.csOpen ? true : undefined}>
      <summary style={st('font-weight:700;cursor:pointer')}>Danh mục cơ sở</summary>
      <div style={{ marginTop: 10 }}>
        <div style={st('font-size:12.5px;color:var(--mut);margin-bottom:10px;line-height:1.5')}>App lấy mã cơ sở từ số phiếu: <b>NK-BTX-10-001</b> → BTX → Bùi Thị Xuân. Thêm cơ sở mới: nhập mã đúng như trong số phiếu và tên cơ sở.</div>
        {L.map((c, i) => (
          <div key={c[0]} style={st('display:flex;gap:8px;align-items:center;margin-bottom:8px')}>
            <div style={st('flex:0 0 54px;font-weight:800')}>{c[0]}</div>
            <input className="inp" style={st('flex:1;min-width:0;margin:0')} value={c[1]} onChange={(e) => { A.payCsName(i, e.target.value); rerender(); }} />
            <button className="btn btn-outline" style={st('flex:none;width:auto;padding:8px 12px;margin:0')} onClick={() => A.payCsDel(i)}>Xóa</button>
          </div>
        ))}
        <div style={st('display:flex;gap:8px;margin-top:10px')} key={L.length}>
          <input id="paycsc" className="inp" style={st('flex:0 0 74px;min-width:0;margin:0')} placeholder="Mã" autoCapitalize="characters" />
          <input id="paycsn" className="inp" style={st('flex:1;min-width:0;margin:0')} placeholder="Tên cơ sở" />
          <button className="btn btn-primary" style={st('flex:none;width:auto;padding:8px 14px;margin:0')} onClick={() => A.payCsAdd()}>Thêm</button>
        </div>
      </div>
    </details>
  );
}

/* ----- chi tiết NCC ----- */
export function payDetailHtml(key) {
  const g = payCompute().filter((x) => x.key === key)[0];
  if (!g) { PAY.sel = ''; return payHomeHtml(); }
  const C = payDb().cfg, ck = payCheck(g);
  const row = (l, v) => <div style={st('display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px')} key={l}><div style={st('flex:0 0 112px;color:var(--mut)')}>{l}</div><div style={st('flex:1;word-break:break-word')}>{v}</div></div>;
  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={st('font-weight:800;font-size:16px;margin-bottom:2px')}>{g.short}</div>
        <div style={st('font-size:12px;color:var(--mut);margin-bottom:8px')}>GIẤY ĐỀ NGHỊ THANH TOÁN · tháng {g.thang}/{g.nam}</div>
        {row('Người dự trù', payNguoiLap())}{row('Phòng/Ban', C.pb)}{row('Lý do', payContent(g))}{row('Hình thức', C.ht + ' · ' + C.dv)}
        {row('Thành tiền', <><b>{payF(g.tong)}</b> · ĐVCP {C.dvcp}</>)}{row('Bằng chữ', <i>{soThanhChu(g.tong)}./.</i>)}{row('Số HĐ', paySoHd(g))}
        {row('Người thụ hưởng', g.full)}{row('Số tài khoản', g.stk ? g.stk : <span style={{ color: 'var(--red)' }}>Chưa có — bổ sung ở sheet DANH MUC NCC</span>)}{row('Ngân hàng', g.bank + (g.cn ? ' · ' + g.cn : ''))}
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => A.payPrintOne(g.key)}>{I('file', 17)}In phiếu + bảng kê</button>
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => A.payXlsxOne(g.key)}>{I('download', 17)}Xuất Excel (phiếu{g.rows.length >= PAY_NGUONG_BK ? ' + bảng kê' : ''})</button>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={st('font-weight:700;margin-bottom:6px')}>Kiểm tra trước khi trình ký</div>
        {ck.items.map((c, i) => <div key={i} style={st('display:flex;gap:8px;font-size:13px;padding:3px 0')}><div style={st('flex:0 0 130px;color:var(--mut)')}>{c[1]}</div><div style={{ flex: 1, color: c[0] ? 'var(--green)' : 'var(--red)' }}>{c[2]}</div></div>)}
        <div style={{ marginTop: 8, fontWeight: 800, color: ck.ok ? 'var(--green)' : 'var(--red)' }}>{ck.end}</div>
      </div>
      <div className="card">
        <div style={st('font-weight:700;margin-bottom:2px')}>Bảng kê hóa đơn ({g.rows.length})</div>
        <div style={st('font-size:11.5px;color:var(--mut);margin-bottom:8px')}>Bấm “✎ Ghi lỗi cơ sở” ở từng phiếu để ghi: thiếu nhập kho, thiếu phiếu giao hàng…</div>
        <div className="bk-head"><span>#</span><span>Số hóa đơn</span><span>Trạng thái</span><span>Ghi chú chứng từ</span><span>Thao tác</span><span className="r">Số tiền</span></div>
        {g.rows.map((x, i) => {
          const s = PAY_ST[x.st], ek = key + '#' + i, open = PAY.ed === ek, nt = x.note, er = nt ? payNoteErrs(nt) : [];
          return (
            <div className="bk-row" style={st('padding:7px 0;border-top:1px solid var(--line);font-size:12.5px')} key={ek}>
              <div className="bk-main" style={st('display:flex;gap:8px;align-items:center')}>
                <div className="bk-n" style={st('flex:0 0 22px;color:var(--mut2)')}>{i + 1}</div>
                <div className="bk-id" style={{ flex: 1 }}><b>{x.r[2]}</b><div className="bk-sub" style={st('color:var(--mut);font-size:11px')}>{payDs(x.d)} · {x.r[7] || '?'}</div></div>
                <div className="bk-amt" style={{ textAlign: 'right' }}><div style={{ fontVariantNumeric: 'tabular-nums' }}>{payF(x.tong)}</div><span className="bk-st">{x.st === 'ok' ? '' : payTag(s[0], s[1])}</span></div>
              </div>
              {er.length ? <div className="bk-note" style={st('margin:4px 0 0 30px;color:var(--orange);font-weight:600;font-size:12px')}>⚠ {flat(er.map((z) => z.d))}{nt.imp ? <> <span style={st('font-weight:400;color:var(--mut2)')}>(từ file Excel)</span></> : null}</div> : null}
              {!er.length && payOkGet(x.r) ? <div className="bk-note" style={st('margin:4px 0 0 30px;color:var(--green);font-weight:600;font-size:12px')}>✔ Chứng từ đủ</div> : null}
              <div className="bk-act" style={st('margin:4px 0 0 30px')}><button style={st('border:none;background:none;padding:2px 0;font:inherit;font-size:12px;font-weight:700;color:var(--teal);cursor:pointer')} onClick={() => A.payNoteEd(key, i)}>{open ? '▾ Đóng' : '✎ ' + (er.length ? 'Sửa ghi chú lỗi' : 'Ghi lỗi cơ sở')}</button></div>
              {open ? payNoteEdHtml(key, i, nt) : null}
            </div>
          );
        })}
        {g.extra.map((e, ei) => (
          <div className="bk-row bk-x" style={st('padding:7px 0;border-top:1px solid var(--line);font-size:12.5px;background:var(--amber-bg)')} key={'x' + ei}>
            <div className="bk-main" style={st('display:flex;gap:8px;align-items:center')}>
              <div className="bk-n" style={st('flex:0 0 22px')}>+</div>
              <div className="bk-id" style={{ flex: 1 }}><b>{e[2]}</b><div className="bk-sub" style={st('color:var(--mut);font-size:11px')}>{e[0] ? payDs(e[0]) + ' · ' : ''}có trong MISA, không có phiếu mua</div></div>
              <div className="bk-amt" style={{ textAlign: 'right' }}><div>{payF(e[6])}</div><span className="bk-st">{payTag('HĐ MISA thừa', 'amber')}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function payStep1Html() {
  const P = payDb(), L = payCompute();
  return (
    <>
      <PayFileInput />
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={st('font-weight:700;margin-bottom:2px')}>Dữ liệu đã nạp</div>
        <div style={st('font-size:12.5px;color:var(--mut)')}>{P.file || 'File Excel'} · {L.length} NCC · {P.mua.length} phiếu mua · {P.hd.length} HĐ MISA</div>
        {payAddHtml(P)}
        <button className="btn btn-outline" style={st('padding:9px;font-size:13px;margin-top:10px')} onClick={() => document.getElementById('payin').click()}>{I('upload', 16)}Nạp lại file Excel (thay toàn bộ dữ liệu cũ)</button>
        <button className="btn btn-outline" style={st('padding:9px;font-size:13px;margin-top:8px')} onClick={() => A.payTemplate()}>{I('download', 16)}Tải file Excel mẫu</button>
      </div>
      {payCfgHtml()}{payCsCfgHtml()}
    </>
  );
}

export function payStepsHtml(step, has, nErr) {
  const d = [has, has && nErr === 0, false], lb = ['Nạp dữ liệu', 'Rà lỗi', 'Xuất / In'];
  return (
    <div className="pxs">{lb.map((t, i) => {
      const on = step === i + 1, dis = !has && i > 0, dn = d[i] && !on;
      return (
        <button key={i} className={(on ? 'on ' : '') + (dn ? 'done ' : '') + (i > 0 && d[i - 1] ? 'lk' : '')} disabled={dis} onClick={dis ? undefined : () => A.payStep(i + 1)} aria-current={on ? 'step' : undefined}>
          <i>{dn ? '✓' : (i + 1)}</i><span>{t}{i === 1 && nErr && has ? <em>{nErr}</em> : null}</span>
        </button>
      );
    })}</div>
  );
}
export function payNextBtn(n, t) { return <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={() => A.payStep(n)}>{t} →</button>; }

/* ----- Báo cáo chi tiêu: theo tháng / cơ sở / NCC + NCC hay sai chứng từ ----- */
export function payRepHtml() {
  const m0 = PAY.m; let L; PAY.m = 'all'; try { L = payCompute(); } finally { PAY.m = m0; }
  let T = 0, TOK = 0, N = 0; const M = {}, C = {}, V = [];
  L.forEach((g) => {
    const v = { n: g.short || g.full, full: g.full, t: 0, k: 0, r: 0, bad: 0, mo: {} };
    g.rows.forEach((x) => {
      const t = +x.tong || 0, ym = x.d ? Math.floor(x.d / 100) : 0, cs = x.r[7] || '', bad = x.st !== 'ok' || !!x.note;
      T += t; N++; if (x.st === 'ok') TOK += t; M[ym] = (M[ym] || 0) + t; C[cs] = (C[cs] || 0) + t;
      v.t += t; v.r++; if (bad) v.bad++; v.mo[ym] = (v.mo[ym] || 0) + t;
    });
    v.bad += g.extra.length; v.k = g.extra.length; V.push(v);
  });
  const bar = (p, c) => <div style={{ height: 6, borderRadius: 3, background: 'var(--line)', marginTop: 4 }}><div style={{ height: 6, borderRadius: 3, width: Math.max(2, Math.min(100, p)) + '%', background: c || 'var(--teal)' }} /></div>;
  const pc = (a, b) => (b ? Math.round(100 * a / b) + '%' : '–');
  const row = (key, l, r, p, sub) => (
    <div key={key} style={st('padding:9px 0;border-bottom:1px solid var(--line)')}>
      <div style={st('display:flex;justify-content:space-between;gap:10px;font-size:13.5px')}><span>{l}</span><b style={{ whiteSpace: 'nowrap' }}>{r}</b></div>
      {sub ? <div style={st('font-size:12px;color:var(--mut);margin-top:2px')}>{sub}</div> : null}
      {p != null ? bar(p) : null}
    </div>
  );
  const card = (t, b) => <div className="card" style={{ marginBottom: 12 }}><div style={st('font-weight:700;margin-bottom:4px')}>{t}</div>{b}</div>;
  const ms = Object.keys(M).map(Number).sort((a, b) => b - a), mx = Math.max.apply(null, ms.map((k) => M[k]).concat([1]));
  const cs = Object.keys(C).sort((a, b) => C[b] - C[a]);
  const top = V.slice().sort((a, b) => b.t - a.t).slice(0, 15), cur = ms.filter(Boolean)[0], prv = ms.filter(Boolean)[1];
  const er = V.filter((v) => v.bad > 0).sort((a, b) => b.bad / (b.r + b.k || 1) - a.bad / (a.r + a.k || 1) || b.bad - a.bad).slice(0, 10);
  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={st('font-size:12.5px;color:var(--mut)')}>Tổng chi theo phiếu mua (mọi tháng)</div>
        <div style={st('font-size:24px;font-weight:800')}>{payF(T)} đ</div>
        <div style={st('font-size:12.5px;color:var(--mut)')}>{L.length} NCC · {N} phiếu · đã khớp HĐ {pc(TOK, T)}</div>
      </div>
      {card('Theo tháng', ms.length ? ms.map((k, i) => {
        const pv = M[ms[i + 1]], d = pv ? Math.round(100 * (M[k] - pv) / pv) : null;
        return row('m' + k, k ? payMLab(k) : 'Chưa rõ ngày', payF(M[k]), 100 * M[k] / mx, d === null ? '' : (d >= 0 ? '▲ +' : '▼ ') + d + '% so với ' + payMLab(ms[i + 1]));
      }) : <div style={{ color: 'var(--mut)' }}>Chưa có dữ liệu</div>)}
      {card('Theo cơ sở', cs.map((k) => row('c' + k, payCsLabel(k), payF(C[k]), 100 * C[k] / (T || 1), pc(C[k], T) + ' tổng chi')))}
      {card('Top NCC theo chi tiêu', <>
        {top.map((v, i) => { let sub = pc(v.t, T) + ' tổng chi'; if (cur && prv) sub += ' · ' + payMLab(cur) + ': ' + payF(v.mo[cur] || 0) + ' / ' + payMLab(prv) + ': ' + payF(v.mo[prv] || 0); return row('t' + i, v.n, payF(v.t), 100 * v.t / (top[0].t || 1), sub); })}
        {V.length > 15 ? <div style={st('font-size:12px;color:var(--mut);padding-top:6px')}>Hiện 15/{V.length} NCC.</div> : null}
      </>)}
      {card('NCC hay sai chứng từ', er.length ? er.map((v, i) => { const tl = Math.round(100 * v.bad / (v.r + v.k || 1)); return row('e' + i, v.n, v.bad + ' lỗi', tl, tl + '% trên ' + (v.r + v.k) + ' dòng · lỗi gồm lệch/thiếu HĐ, trùng, ghi chú chứng từ'); }) : <div style={{ color: 'var(--mut)' }}>Chưa phát hiện NCC nào có lỗi.</div>)}
    </>
  );
}

/* ----- màn hình `pay` (renderPay) ----- */
export function PayView() {
  const P = payDb(), has = P.mua.length > 0;
  if (PAY.v === 'err' && has) { PAY.step = 2; PAY.v = ''; }
  const E = has ? payErrAll() : []; let nErr = 0; E.forEach((B) => { nErr += B.items.length; });
  const step = !has ? 1 : (PAY.sel ? 3 : (PAY.step || 3));
  const rep = PAY.v === 'rep' && has && !PAY.sel;
  const back = () => (PAY.sel ? A.paySel('') : rep ? A.payView('') : A.go('dchub'));
  const body = rep ? payRepHtml() : PAY.sel ? payDetailHtml(PAY.sel)
    : step === 1 ? (has ? <>{payStep1Html()}{payNextBtn(2, 'Tiếp: Rà lỗi')}</> : payHomeHtml())
      : step === 2 ? <>{payErrHtml()}{payNextBtn(3, 'Tiếp: Xuất / In')}</> : payHomeHtml();
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={back}>‹</button><div className="ttl">Đề nghị thanh toán</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={{ paddingTop: 12, paddingBottom: 40 }}>
        {PAY.sel ? null : (
          <>
            {rep ? null : payStepsHtml(step, has, nErr)}
            {has ? <button className="btn btn-outline" style={st('padding:9px;font-size:13px;margin:0 0 12px')} onClick={() => A.payView(rep ? '' : 'rep')}>{rep ? '‹ Về Đề nghị thanh toán' : 'Báo cáo chi tiêu'}</button> : null}
          </>
        )}
        {body}
      </div>
    </>
  );
}
export const renderPay = () => rerender();
