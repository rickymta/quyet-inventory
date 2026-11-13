/* Sheet nhập kiểm kê: bàn phím số tự vẽ, lô/HSD, hộp QR, ảnh vật tư, ghi chú nhanh.
   Mã gốc: dòng 4942–5080 (compressImg, keypadHtml, bx*, renderBoxes, renderBatches, applyItem), 7494–7527 (thao tác hộp QR),
   7846–7917 (renderPhotoSec, v2Tags, v2Keys, openSheet + vá đè A.calc), 1620–1628 (quickNoteChipsHtml) và A.key, A.calc, A.bat..., A.sheet..., A.photo..., A.noteQuick.
   Giao diện chạy theo kiểu "immediate mode": trạng thái nằm trong S.SB (số lượng, lô, ghi chú, ảnh), mọi thay đổi gọi rerender(). */
import React, { useRef, useEffect } from 'react';
import { db, S, A, X, per, esc, fmt, fmtDate, daysTo, parseNum, qtyCheck, normKey, QUICK_NOTES, st, I, rerender, openModal, saveSoon, audit, toast } from '../../core';
import { filteredList, invalidateList } from './list.jsx';

/* ---------- Ô nhập "chốt khi rời ô" (tương đương sự kiện onchange gốc của trình duyệt) ---------- */
export function ChgInput({ value, onCommit, ...rest }) {
  const ref = useRef(null); const cb = useRef(onCommit); cb.current = onCommit;
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const f = () => { if (cb.current) cb.current(el.value); };
    el.addEventListener('change', f);
    return () => el.removeEventListener('change', f);
  }, []);
  useEffect(() => {
    const el = ref.current; const v = value == null ? '' : String(value);
    if (el && document.activeElement !== el && el.value !== v) el.value = v;
  });
  return <input ref={ref} defaultValue={value == null ? '' : value} {...rest} />;
}

/* ---------- Ảnh vật tư ---------- */
export function compressImg(file, maxPx, quality, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / img.width, maxPx / img.height);
      const w = Math.round(img.width * scale); const h = Math.round(img.height * scale);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- Bàn phím số ---------- */
export function keypadHtml() {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];
  return keys.map((k) => {
    const action = k === '⌫' ? 'back' : k;
    return <button className="kkey" key={k} onClick={() => A.key(action)}>{k}</button>;
  });
}

/* ---------- Theo dõi từng hộp (QR nhà sản xuất) ---------- */
export function bxList(it) { return it.boxes || (it.boxes = []); }
export function bxLeft(it) { return bxList(it).filter((b) => b.st !== 'out'); }
export function bxQtyOf(b) { const q = parseFloat(String(b.qty).replace(',', '.')); return isNaN(q) || q < 0 ? 1 : q; }
export function bxSeenQty(it) { let n = 0; bxLeft(it).forEach((b) => { if (b.seen) n += bxQtyOf(b); }); return Math.round(n * 1000) / 1000; }
export function bxTotalQty(it) { let n = 0; bxLeft(it).forEach((b) => { n += bxQtyOf(b); }); return Math.round(n * 1000) / 1000; }
export function bxQtyInp(it, b, i, scan) {
  const oc = (v) => { if (scan) A.scBoxQty(it.id, i, v); else A.boxSet(i, 'qty', v); };
  return (
    <div className="bxqty"><span>Số lượng</span>
      <ChgInput className="sinp" type="text" inputMode="decimal" value={String(bxQtyOf(b))} onFocus={(e) => e.target.select()} onCommit={oc} />
      <span>{it.unit || ''}</span></div>
  );
}
export function bxExpHtml(b) {
  const d = b.exp ? daysTo(b.exp) : null;
  if (d === null) return <span style={{ color: 'var(--mut2)' }}>chưa có HSD</span>;
  const col = d < 0 ? 'var(--red)' : d <= 30 ? 'var(--orange)' : d <= 90 ? 'var(--amber)' : 'var(--green)';
  return <b style={{ color: col }}>{fmtDate(b.exp)} · {d < 0 ? 'quá ' + (-d) + ' ngày' : 'còn ' + d + ' ngày'}</b>;
}
export function bxRecord(it, g) {
  const l = bxList(it); const k = [g.gtin, g.lot, g.ser].join('|'); let b = null; const now = Date.now();
  l.forEach((x) => { if (x.k === k) b = x; });
  if (g.plain) {
    const c = l.filter((x) => x.gtin === g.gtin && x.st !== 'out'); let u = c.filter((x) => !x.seen)[0];
    if (!u && !c.length) u = l.filter((x) => x.gtin === g.gtin)[0];
    if (u) { u.st = 'in'; u.seen = true; u.last = now; delete u.outAt; saveSoon(); return { box: u, isNew: false, dup: false }; }
    if (c.length && !g.force) return { box: c[c.length - 1], isNew: false, dup: true };
    b = { k: g.gtin + (c.length ? '#' + now.toString(36) : ''), gtin: g.gtin, lot: '', ser: '', exp: '', label: (db.boxref && db.boxref[g.gtin]) || '', qty: 1, st: 'in', seen: true, plain: true, first: now, last: now };
    l.push(b); audit('Thêm hộp (mã vạch)', it.code, null, g.gtin); saveSoon(); return { box: b, isNew: true, dup: false };
  }
  const res = { box: b, isNew: !b, dup: !!(b && b.seen && b.st !== 'out') };
  if (!b) {
    b = { k, gtin: g.gtin, lot: g.lot, ser: g.ser, exp: g.expIso, label: (db.boxref && db.boxref[g.gtin]) || '', qty: 1, st: 'in', seen: true, first: now, last: now };
    l.push(b); res.box = b; audit('Thêm hộp QR', it.code, null, b.lot || b.gtin);
  } else { b.seen = true; b.st = 'in'; b.last = now; delete b.outAt; if (!b.exp && g.expIso) b.exp = g.expIso; }
  saveSoon(); return res;
}
/* Kỳ này quét thấy N hộp = SL kiểm → hộp kỳ trước không còn quét thấy được coi là đã xuất kho */
export function bxAutoOut(it) {
  if (!it.counted || it.countQty === null || !it.boxes) return;
  const seen = bxSeenQty(it);
  if (!(seen > 0 || it.countQty === 0) || it.countQty > seen) return;
  it.boxes.forEach((b) => { if (b.st !== 'out' && !b.seen) { b.st = 'out'; b.outAt = Date.now(); audit('Hộp QR không còn, ghi nhận đã xuất', it.code, b.lot || b.gtin, null); } });
}
/* khối hộp QR hiện trong lớp quét (nền tối); trả JSX */
export function scBoxHtml(it, bx) {
  if (!bx) return null;
  const b = bx.box; const i = bxList(it).indexOf(b);
  return (
    <div style={st('margin-top:6px;padding:8px 10px;border-radius:10px;background:#1b1b24;border:1px solid #33333d;font-size:12px')}>
      {bx.dup ? <b style={{ color: '#fbbf24' }}>Hộp này đã quét rồi</b> : <b style={{ color: '#4ade80' }}>{bx.isNew ? 'Ghi nhận hộp mới' : 'Hộp cũ còn tồn'}</b>}
      {' · '}{b.label ? b.label + ' · ' : ''}{b.lot ? 'Lô ' + b.lot + ' · ' : ''}{bxExpHtml(b)}
      <div style={st('color:#9ca3af;margin-top:3px')}>Kỳ này đã quét {bxSeenQty(it)} / {bxTotalQty(it)}{it.unit ? ' ' + it.unit : ''} đang theo dõi</div>
      <div style={{ marginTop: '6px' }}>{bxQtyInp(it, b, i, true)}</div>
      {b.plain ? (
        <>
          <div style={st('color:#9ca3af;margin-top:6px')}>Mã vạch {b.gtin} · nhập HSD 1 lần, kỳ sau quét lại app tự điền:</div>
          <ChgInput type="date" className="inp" value={b.exp} style={st('margin-top:4px;padding:8px 10px;background:#23232c;color:#e5e7eb;border-color:#33333d')} onCommit={(v) => A.scBoxExp(it.id, i, v)} />
        </>
      ) : null}
      {bx.dup && b.plain ? <button onClick={() => A.scBoxNew()} style={st('margin-top:6px;padding:7px 10px;border-radius:999px;border:1px solid #8a5a1a;background:#2a1f12;color:#fbbf24;font:inherit;font-size:12px;font-weight:700')}>Đây là hộp khác (HSD khác)</button> : null}
      {b.label ? null : <ChgInput className="inp" placeholder="Nhãn / kích thước (VD 3.5×11) — nhớ cho lần sau" value="" style={st('margin-top:6px;padding:8px 10px;background:#23232c;color:#e5e7eb;border-color:#33333d')} onCommit={(v) => A.scBoxLabel(it.id, i, v)} />}
    </div>
  );
}
export function isTracked(it) { return !!(db.track && db.track[normKey(it.branch, it.code, it.name)]); }
export function bxListHtml(it) {
  const l = bxList(it);
  if (!l.length) return <div className="v2mt" style={{ marginTop: 0 }}>Chưa có hộp nào. Bấm “Quét QR trên hộp”: app tự ghi lô + HSD và nhớ sang kỳ sau.</div>;
  const n = bxSeenQty(it);
  return (
    <>
      {l.map((b, i) => {
        const gone = b.st === 'out'; const pend = !gone && !b.seen;
        return (
          <div className={'bxrow' + (gone ? ' gone' : '')} key={(b.k || '') + '#' + i}><div className="bxtop"><ChgInput className="sinp" placeholder="Nhãn / kích thước" value={b.label || ''} onCommit={(v) => A.boxSet(i, 'label', v)} /><span className={'bxst ' + (gone ? 'o' : pend ? 'p' : 'k')}>{gone ? 'Đã xuất' : pend ? 'Chưa quét' : 'Đã quét'}</span></div>
            <div className="bxmeta">{b.lot ? 'Lô ' + b.lot + ' · ' : ''}{b.ser ? 'Seri ' + b.ser + ' · ' : ''}{b.gtin || 'nhập tay'} · theo dõi {Math.max(0, Math.round((Date.now() - (b.first || Date.now())) / 86400000))} ngày</div>
            {gone ? null : bxQtyInp(it, b, i, false)}
            <div className="bxbot"><ChgInput className="sinp" type="date" value={b.exp || ''} onCommit={(v) => A.boxSet(i, 'exp', v)} /><span className="bxd">{bxExpHtml(b)}</span>
              {pend ? <button className="batx" title="Vẫn còn" onClick={() => A.boxKeep(i)}>✓</button> : null}<button className="batx" onClick={() => A.boxDel(i)}>✕</button></div></div>
        );
      })}
      <div className="v2mt" style={{ marginTop: 0 }}>Tổng đã quét kỳ này: <b>{n}{it.unit ? ' ' + it.unit : ''}</b>. Nhập số lượng cho từng mã quét ở ô “Số lượng”. Mã "Chưa quét" sẽ tự ghi nhận <b>đã xuất</b> khi lưu, nếu số kiểm = tổng đã quét. Bấm ✓ nếu hộp vẫn còn.</div>
      {n ? <button className="addbat" style={{ marginBottom: '8px' }} onClick={() => A.boxUseQty()}>Dùng tổng đã quét ({n}) làm số kiểm</button> : null}
    </>
  );
}
export function renderBoxes() { rerender(); }
function BoxesSec({ it }) {
  if (!isTracked(it)) {
    return <button className="matchbtn" onClick={() => A.boxTrack()}>{I('scan', 20)} Bật theo dõi từng hộp (vật tư đắt / tồn lâu)</button>;
  }
  return (
    <>
      <div className="v2lb">Theo dõi từng hộp<button className="addbat" onClick={() => A.boxAdd()}>+ Thêm tay</button></div>
      <button className="matchbtn" style={{ marginTop: 0 }} onClick={() => A.boxScan()}>{I('scan', 20)} Quét QR trên hộp</button>
      <div style={{ marginTop: '10px' }}>{bxListHtml(it)}</div>
      <button className="addbat" style={st('margin:4px 0 8px;color:var(--mut)')} onClick={() => A.boxTrack()}>Tắt theo dõi vật tư này</button>
    </>
  );
}

/* ---------- Lô / HSD ---------- */
export function renderBatches() { rerender(); }
function Batches() {
  const SB = S.SB;
  return SB.batches.map((b, i) => {
    const d = daysTo(b.exp);
    const dTxt = d === null ? '' : (d < 0 ? 'quá ' + Math.abs(d) + 'd' : d + 'd');
    const dCol = d === null ? '#a8a29e' : (d < 0 ? 'var(--red)' : d <= 30 ? 'var(--orange)' : d <= 90 ? 'var(--amber)' : '#a8a29e');
    return (
      <div className="batrow" key={i}>
        <input className="sinp batqty" inputMode="decimal" placeholder="SL" value={b.qty == null ? '' : b.qty} onChange={(e) => A.bat(i, 'qty', e.target.value)} />
        <input className="sinp batdate" type="date" value={b.exp || ''} onChange={(e) => A.bat(i, 'exp', e.target.value)} />
        <span className="batd" style={{ color: dCol }}>{dTxt}</span>
        <button className="batx" onClick={() => A.batDel(i)}>✕</button></div>
    );
  });
}

/* ---------- Ảnh ---------- */
export function renderPhotoSec() { rerender(); }
function PhotoSec() {
  const SB = S.SB;
  return (
    <div className="v2ph">{SB.photo ? <div className="pt"><img src={SB.photo} alt="" /><button onClick={() => A.photoClear()} aria-label="Xóa ảnh">{I('x', 14)}</button></div> : null}
      <button className="padd" onClick={() => document.getElementById('photoin').click()}>{I('camera', 24)}<span>{SB.photo ? 'Chụp lại' : 'Thêm ảnh'}</span></button></div>
  );
}
/* nhãn "· N lô", "· đã nhập", "· đã có ảnh" nay được tính khi vẽ; giữ hàm để nơi khác gọi */
export function v2Tags() { if (S.SB) rerender(); }
export function v2Keys() { if (!S.SB) return; S.SB._keys = S.SB._keys === false ? true : false; rerender(); }

/* ---------- Áp dụng kết quả một mã ---------- */
export function applyItem(item) {
  const p = per(S.P.id); if (!p) return;
  bxAutoOut(item);
  for (let i = 0; i < p.items.length; i++) {
    if (p.items[i].id === item.id) {
      const o = p.items[i];
      if (o.counted !== item.counted || o.countQty !== item.countQty) audit('Số lượng kiểm kê', p.name + ' · ' + item.code, o.counted ? o.countQty : null, item.counted ? item.countQty : null);
      p.items[i] = item; break;
    }
  }
  const key = normKey(item.branch, item.code, item.name);
  const dated = (item.batches || []).filter((b) => b.exp);
  const live = (item.boxes || []).filter((b) => b.st !== 'out');
  if (dated.length || live.length) db.hsd[key] = { branch: item.branch, code: item.code, name: item.name, unit: item.unit, batches: dated, boxes: live.map((b) => Object.assign({}, b)), updatedAt: Date.now() };
  else delete db.hsd[key];
  saveSoon();
  invalidateList();
  rerender();
}

/* ---------- Ghi chú nhanh ---------- */
export function quickNoteChipsHtml() {
  return QUICK_NOTES.map((t, i) => <button className="qchip" key={i} onClick={() => A.noteQuick(i)}>{t}</button>);
}

/* ---------- Sheet ---------- */
let sheetSeq = 0;
export function openSheet(itemId, seq) {
  const P = S.P; const p = per(P.id); if (!p) return;
  let it = null;
  for (let i = 0; i < p.items.length; i++) if (p.items[i].id === itemId) { it = p.items[i]; break; }
  if (!it) return;
  const done = p.items.filter((x) => x.counted).length; const total = p.items.length;
  const left = filteredList(p).filter((x) => !x.counted && x.id !== itemId).length;
  S.SB = {
    itemId, seq: !!seq, qtyStr: (it.counted && it.countQty !== null) ? String(it.countQty) : '',
    batches: (it.batches || []).map((b) => ({ qty: (b.qty === null || b.qty === undefined) ? '' : String(b.qty), exp: b.exp || '' })),
    note: it.note || '',
    _close: it.close, _unit: it.unit, photo: it.photo || null, _n0: it.note || '',
    _done: done, _total: total, _left: left, _n: ++sheetSeq,
    _open: { bat: !!(it.batches && it.batches.length), note: !!it.note, ph: !!it.photo },
  };
  S.SB._q0 = S.SB.qtyStr;
  openModal(() => (S.SB ? <SheetView /> : null));
}
export function SheetView() {
  const SB = S.SB; const P = S.P;
  const p = P && per(P.id);
  const it = p && p.items.filter((x) => x.id === SB.itemId)[0];
  const noteRef = useRef(null); const needRef = useRef(false);
  needRef.current = false;
  useEffect(() => { const el = noteRef.current; if (needRef.current && el && !el.open) el.open = true; });
  if (!it) {
    setTimeout(() => { if (S.SB === SB) A.closeSheet(); }, 0);
    return null;
  }
  const u = it.unit || '';
  const qv = (SB.qtyStr || '').trim();
  const note = (SB.note || '').trim();
  const qn = (qv === '' || !qtyCheck(qv).ok) ? null : parseNum(qv);
  const diff = qn === null ? null : Math.round((qn - SB._close) * 100) / 100;
  const needNote = diff !== null && diff !== 0 && !note;
  const can = qn !== null && !needNote;
  needRef.current = needNote;
  const nb = SB.batches.filter((b) => b.exp).length;
  /* thống kê đầu dòng "Đã kiểm / Chênh lệch" (bản vá đè A.calc dòng 7903) */
  let cnt = '–'; let dif = '–'; let difCls = '';
  if (qv !== '') {
    const q = parseNum(qv); const d = Math.round((q - SB._close) * 100) / 100;
    cnt = fmt(q); dif = (d > 0 ? '+' : d < 0 ? '−' : '') + fmt(Math.abs(d)); difCls = d === 0 ? 'g' : d > 0 ? 'a' : 'r';
  }
  const setOpen = (k) => (e) => { SB._open[k] = e.currentTarget.open; };
  return (
    <div className="ovl v2o" id="ovl" key={SB._n} onClick={(e) => { if (e.target === e.currentTarget) A.closeSheet(); }}><div className="sheet v2s" onClick={(e) => e.stopPropagation()}>
      <div className="v2hd"><button className="v2bk" onClick={() => A.closeSheet()} aria-label="Quay lại">{I('back', 26)}</button>
        <div className="v2tt">Thông tin vật tư{SB.seq ? <small>Kiểm tuần tự · {SB._done}/{SB._total}</small> : null}</div>
        <button className="v2bk" onClick={() => A.closeSheet()} aria-label="Trang chủ">{I('home', 24)}</button></div>
      <div className="v2bd">
        <div className="v2it"><div className="thumb">{it.photo ? <img src={it.photo} alt="" /> : I('box', 32)}</div>
          <div className="v2in"><b>{it.name}</b>Mã: {it.code}<br />Kho: {it.branch}<br />Đơn vị tính: {u}</div>
          <span className={'stbadge' + (it.counted ? ' ok' : '')}>{it.counted ? 'Đã kiểm' : 'Chưa kiểm'}</span></div>
        <div className="v2st"><div><small>Tồn hệ thống</small><b>{fmt(it.close)}</b><em>{u}</em></div>
          <div><small>Đã kiểm</small><b className="g" id="v2cnt">{cnt}</b><em>{u}</em></div>
          <div><small>Chênh lệch</small><b id="v2dif" className={difCls || undefined}>{dif}</b><em>{u}</em></div></div>
        <div className="v2mt">Đầu kỳ {fmt(it.open)} · Nhập {fmt(it['in'])} · Xuất {fmt(it.out)}</div>
        <div className="v2lb">Số lượng thực tế</div>
        <div className="v2q"><button className="v2m" onClick={() => A.key('-1')} aria-label="Giảm 1">−</button><div className={'qtydisp' + (qv === '' ? ' qtydisp-empty' : '')} id="sqtydisp">{qv === '' ? '0' : qv}</div><button className="v2p1" onClick={() => A.key('+1')} aria-label="Tăng 1">+</button>
          <button className="v2k" onClick={() => v2Keys()}>{I('keyboard', 20)}Nhập trực tiếp</button></div>
        <div id="v2keys" style={{ display: SB._keys === false ? 'none' : 'block' }}><div className="keypad">{keypadHtml()}</div></div>
        <button className="matchbtn" onClick={() => A.key('match')}>✓ Bằng tồn cuối · {fmt(it.close)} {u}</button>
        <div id="sban">
          {diff === null ? null : diff === 0 ? <div className="ban ban-ok">✓ Khớp tồn kho sổ sách</div>
            : diff > 0 ? <div className="ban ban-plus">▲ THỪA {fmt(diff)} {SB._unit || ''} so với sổ sách</div>
              : <div className="ban ban-minus">▼ THIẾU {fmt(Math.abs(diff))} {SB._unit || ''} so với sổ sách</div>}
        </div>
        <details className="v2dt" id="sdtbat" open={SB._open.bat} onToggle={setOpen('bat')}><summary>Lô hàng / hạn dùng <span className="tg" id="sbattg">{nb ? '· ' + nb + ' lô' : ''}</span></summary><div className="dtb"><button className="addbat" onClick={() => A.batAdd()}>+ Thêm lô</button>
          <div id="sbat"><Batches /></div><div className="v2mt" style={{ marginTop: 0 }}>Hạn sử dụng được lưu và tự kế thừa sang kỳ sau.</div><div id="sbox"><BoxesSec it={it} /></div></div></details>
        <details className="v2dt" id="sdtnote" ref={noteRef} open={SB._open.note || needNote} onToggle={setOpen('note')}><summary><span id="snotelbl" style={needNote ? { color: '#f87171' } : undefined}>{'Ghi chú / giải trình' + (diff !== null && diff !== 0 ? ' (bắt buộc)' : '')}</span><span className="tg" id="snotetg">{note ? '· đã nhập' : ''}</span></summary><div className="dtb"><div className="qchips">{quickNoteChipsHtml()}</div>
          <textarea className="sinp" id="snote" rows={3} maxLength={200} placeholder="Nhập ghi chú (nếu có)..." value={SB.note} onChange={(e) => { SB.note = e.target.value; A.calc(); }} />
          <div className="v2mt" id="snc" style={{ textAlign: 'right' }}>{(SB.note || '').length}/200</div><div id="snotehint">{needNote ? <div className="hint-red">Có chênh lệch — bắt buộc nhập nguyên nhân trước khi lưu.</div> : null}</div></div></details>
        <details className="v2dt" id="sdtph" open={SB._open.ph} onToggle={setOpen('ph')}><summary>Ảnh minh chứng <span className="tg" id="sphtg">{SB.photo ? '· đã có ảnh' : ''}</span></summary><div className="dtb"><div id="sphotosec"><PhotoSec /></div>
          <input type="file" id="photoin" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => A.photoTake(e.target)} /></div></details>
        {it.counted ? <button className="reset" onClick={() => A.sheetReset()}>Xóa kết quả, đưa về "chưa kiểm"</button> : <div style={{ height: '14px' }} />}
      </div>
      <div className="v2ft2"><button className="nx" id="snext" disabled={!can} onClick={() => A.sheetSave(true)}>{SB._left ? 'Lưu & kiểm mã tiếp theo →' : 'Lưu & hoàn tất ✓'}<small>{SB._left ? 'Còn ' + SB._left + ' mã chưa kiểm' : 'Đây là mã cuối cùng'}</small></button><div className="sec"><button onClick={() => A.sheetCancel()}>Hủy</button><button onClick={() => A.sheetSkip()} disabled={!SB._left}>Bỏ qua →</button><button id="ssave" disabled={!can} onClick={() => A.sheetSave(false)}>{I('save', 17)}Lưu & đóng</button></div></div>
    </div></div>
  );
}

/* ---------- Hành động ---------- */
function bxCur() {
  const p = per(S.P && S.P.id); if (!p || !S.SB) return null;
  if (p.locked) { toast('Kỳ này đã khoá, mở khoá để chỉnh sửa'); return null; }
  return p.items.filter((x) => x.id === S.SB.itemId)[0] || null;
}
export function bxSaveLabel(b, v) { if (!b.gtin) return; if (!db.boxref) db.boxref = {}; if (v) db.boxref[b.gtin] = v; else delete db.boxref[b.gtin]; }
const scItem = (id) => { const p = per(S.SC && S.SC.pid); return p && p.items.filter((x) => x.id === id)[0]; };

export const actions = {
  key(k) {
    const SB = S.SB; if (!SB) return;
    let s = SB.qtyStr || '';
    if (k === 'back') { s = s.slice(0, -1); }
    else if (k === 'clear') { s = ''; }
    else if (k === 'match') { s = String(Math.round(SB._close * 100) / 100); }
    else if (k === '+1' || k === '-1') {
      const base = s === '' ? SB._close : parseNum(s);
      let nv = base + (k === '+1' ? 1 : -1);
      if (nv < 0) nv = 0;
      s = String(Math.round(nv * 100) / 100);
    } else if (k === '.') {
      if (s.indexOf('.') < 0) s = (s === '' ? '0' : s) + '.';
    } else if (s === '0') s = k;
    else if (s.length < 12) {
      const dot = s.indexOf('.');
      if (!(dot >= 0 && s.length - dot - 1 >= 2)) s = s + k;
    }
    SB.qtyStr = s;
    A.calc();
  },
  /* A.calc (gốc dòng 7377) + bản vá v2 (dòng 7903): mọi thứ suy ra khi vẽ */
  calc() { if (!S.SB) return; rerender(); },
  bat(i, k, v) { S.SB.batches[i][k] = v; rerender(); },
  noteQuick(i) {
    const text = QUICK_NOTES[i];
    if (text === undefined || !S.SB) return;
    const cur = (S.SB.note || '').trim();
    if (!cur) S.SB.note = text;
    else if (cur.indexOf(text) < 0) S.SB.note = cur + '; ' + text;
    A.calc();
  },
  sheetDirty() { const SB = S.SB; return !!SB && ((SB.qtyStr || '').trim() !== (SB._q0 || '') || (SB.note || '').trim() !== (SB._n0 || '')); },
  sheetCancel() { if (A.sheetDirty() && !confirm('Bỏ số liệu vừa nhập cho mã này?')) return; A.closeSheet(); },
  sheetSkip() {
    const SB = S.SB; if (!SB) return; const p = per(S.P.id); if (!p) return;
    if (A.sheetDirty() && !confirm('Bỏ số liệu vừa nhập và chuyển sang mã khác?')) return;
    const fl = filteredList(p); const id = SB.itemId; let ix = -1; let j; let nx = null;
    for (j = 0; j < fl.length; j++) if (fl[j].id === id) { ix = j; break; }
    for (j = 1; j <= fl.length; j++) { const c = fl[(ix + j) % fl.length]; if (!c.counted && c.id !== id) { nx = c; break; } }
    if (nx) openSheet(nx.id, true); else toast('Không còn mã nào chưa kiểm');
  },
  batAdd() { S.SB.batches.push({ qty: '', exp: '' }); rerender(); },
  batDel(i) { S.SB.batches.splice(i, 1); rerender(); },
  photoTake(input) {
    const f = input.files && input.files[0]; if (!f) return;
    input.value = '';
    /* app gốc giới hạn theo dung lượng localStorage (4,3 MB cho cả db); bản máy chủ chỉ giới hạn từng ảnh */
    const TOO_BIG = 'Ảnh quá lớn — hãy chụp lại gần hơn hoặc giảm độ phân giải';
    compressImg(f, 1280, 0.8, (b64) => {
      if (b64.length > 400000) {
        compressImg(f, 800, 0.6, (b2) => {
          if (b2.length > 1500000) { toast(TOO_BIG); return; }
          if (S.SB) { S.SB.photo = b2; rerender(); }
        });
      } else if (S.SB) { S.SB.photo = b64; rerender(); }
    });
  },
  photoClear() { S.SB.photo = null; rerender(); },
  sheetSave(advance) {
    const SB = S.SB; if (!SB) return;
    const p = per(S.P.id); if (!p) return;
    let it = null;
    for (let i = 0; i < p.items.length; i++) if (p.items[i].id === SB.itemId) { it = p.items[i]; break; }
    if (!it) return;
    const qv = (SB.qtyStr || '').trim();
    const qc = qtyCheck(qv);
    if (!qc.ok) { toast(qc.err); return; }
    const qn = qc.n;
    const note = (SB.note || '').trim();
    const diff = Math.round((qn - it.close) * 100) / 100;
    if (diff !== 0 && !note) { toast('Bắt buộc nhập giải trình khi có chênh lệch'); return; }
    const batches = SB.batches.filter((b) => b.exp).map((b) => ({ qty: (b.qty === '' ? null : parseNum(b.qty)), exp: b.exp }));
    const updated = {};
    Object.keys(it).forEach((k) => { updated[k] = it[k]; });
    updated.counted = true; updated.countQty = qn; updated.note = note; updated.batches = batches;
    updated.photo = SB.photo || null;
    updated.by = (db.profile && db.profile.ten) || ''; updated.at = Date.now();
    const savedId = SB.itemId;
    applyItem(updated);
    if (advance) {
      const flist = filteredList(p);
      let idx = -1;
      for (let j = 0; j < flist.length; j++) if (flist[j].id === savedId) { idx = j; break; }
      let next = null;
      for (let k2 = 1; k2 <= flist.length; k2++) {
        const cand = flist[(idx + k2) % flist.length];
        if (!cand.counted && cand.id !== savedId) { next = cand; break; }
      }
      if (next) { openSheet(next.id, true); } else {
        A.closeSheet();
        toast('Đã kiểm xong 100% ✓ — xuất Excel để lưu hồ sơ');
      }
    } else {
      A.closeSheet();
      toast('Đã lưu');
    }
  },
  sheetReset() {
    const SB = S.SB; if (!SB) return;
    if (!confirm('Xoá kết quả kiểm của mã này và đưa về "chưa kiểm"?\nThay đổi được ghi vào nhật ký.')) return;
    const p = per(S.P.id); if (!p) return;
    let it = null;
    for (let i = 0; i < p.items.length; i++) if (p.items[i].id === SB.itemId) { it = p.items[i]; break; }
    if (!it) return;
    const updated = {};
    Object.keys(it).forEach((k) => { updated[k] = it[k]; });
    updated.counted = false; updated.countQty = null;
    applyItem(updated);
    A.closeSheet();
    toast('Đã đưa về "chưa kiểm"');
  },

  /* ---- thao tác hộp QR (dòng 7494–7575, khối thứ nhất) ---- */
  boxSet(i, k, v) { const it = bxCur(); if (!it || !it.boxes[i]) return; if (k === 'qty') { const q = parseFloat(String(v).replace(',', '.')); v = (isNaN(q) || q < 0) ? 1 : q; } it.boxes[i][k] = v; if (k === 'label') bxSaveLabel(it.boxes[i], v); saveSoon(); rerender(); },
  boxKeep(i) { const it = bxCur(); if (!it || !it.boxes[i]) return; it.boxes[i].seen = true; it.boxes[i].last = Date.now(); saveSoon(); rerender(); },
  boxDel(i) { const it = bxCur(); if (!it || !it.boxes[i]) return; if (!confirm('Xoá hộp này khỏi theo dõi?')) return; const b = it.boxes.splice(i, 1)[0]; audit('Xoá hộp QR', it.code, b.lot || b.gtin, null); saveSoon(); rerender(); },
  boxAdd() { const it = bxCur(); if (!it) return; const n = Date.now(); bxList(it).push({ k: 'm' + n.toString(36), gtin: '', lot: '', ser: '', exp: '', label: '', qty: 1, st: 'in', seen: true, first: n, last: n }); saveSoon(); rerender(); },
  boxScan() {
    const it = bxCur(); if (!it) return;
    if (S.SC) A.scClose();
    S.SC = { pid: per(S.P.id).id, bind: it.id, hold: false, busy: false, auto: false };
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { S.SC.actx = new AC(); if (S.SC.actx.resume) S.SC.actx.resume(); } } catch (e) { X.klog('AudioContext', e); }
    X.scMount(); /* nhãn "Quét từng hộp cho…" và nút "Tự đọc số" do ScanOverlay vẽ từ S.SC.bind / S.SC.auto */
  },
  boxTrack() {
    const it = bxCur(); if (!it) return;
    const k = normKey(it.branch, it.code, it.name); if (!db.track) db.track = {};
    if (db.track[k]) { if (bxLeft(it).length && !confirm('Tắt theo dõi? Các hộp đã ghi vẫn được giữ và vẫn cảnh báo HSD.')) return; delete db.track[k]; }
    else db.track[k] = 1;
    saveSoon(); rerender();
  },
  scTrackOn(id) {
    const it = scItem(id);
    if (!it) return; if (!db.track) db.track = {};
    db.track[normKey(it.branch, it.code, it.name)] = 1; saveSoon();
    X.scShowMatched({ item: it, how: 'code', gs1: S.SC.mgs });
  },
  boxUseQty() { const it = bxCur(); if (!it) return; S.SB.qtyStr = String(bxSeenQty(it)); A.calc(); },
  scBoxExp(id, i, v) {
    const it = scItem(id);
    if (!it || !it.boxes || !it.boxes[i]) return;
    it.boxes[i].exp = v; saveSoon(); toast(v ? 'Đã lưu HSD ' + fmtDate(v) : 'Đã xoá HSD');
  },
  scBoxNew() {
    if (!S.SC || !S.SC.bindText) return;
    S.SC.forceNew = true; X.scBindCode(per(S.SC.pid), S.SC.bindText);
  },
  scBoxQty(id, i, v) {
    const it = scItem(id);
    if (!it || !it.boxes || !it.boxes[i]) return;
    let q = parseFloat(String(v).replace(',', '.')); if (isNaN(q) || q < 0) q = 1;
    it.boxes[i].qty = q; saveSoon(); toast('Đã lưu số lượng ' + q);
  },
  scBoxLabel(id, i, v) {
    const it = scItem(id);
    if (!it || !it.boxes || !it.boxes[i]) return;
    it.boxes[i].label = v.trim(); bxSaveLabel(it.boxes[i], v.trim()); saveSoon(); toast('Đã nhớ nhãn cho mã hộp này');
  },
};
