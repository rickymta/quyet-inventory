/* ASX: đối tượng thao tác của Kiểm kê CCDC & TSCĐ (dòng gốc 6258–6454). App gốc gọi ASX.xxx() trong onclick → giữ là object. */
import { db, S, A, X, store, saveSoon, toast, fmt, qtyCheck, klog, kkNeed, icon, esc, per, render, rerender } from '../../core';
import { AP, resetAP, asPer, asRid, asLog, asLocOf, asNextStt, asTeam, asApply, asParseSheet } from './model.js';
import { PH, phAdd, phDelItem, phCam, phShoot, phNote, asPhotoRefresh } from './photos.jsx';
import { asModal, asModalClose, asEdit, asSumHtml, asLogHtml } from './views.jsx';
import { asFileName, buildAssetXlsx, asPrintHtml } from './export.js';

const Lb = ({ t }) => <label className="lbl" style={{ marginTop: 10 }}>{t}</label>;
const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };

/* nút #scshoot có thể nằm ở root React riêng (thẻ "Phát hiện thêm" của count/unm.jsx) nên cập nhật chữ trực tiếp như app gốc */
function shootBtn(t, withIcon) {
  const b = document.getElementById('scshoot'); if (!b || !b.hasAttribute('data-raw')) return; /* nút trong cây chính do React tự vẽ từ SC.shootTxt */
  if (withIcon) b.innerHTML = icon('camera', 16) + esc(t); else b.textContent = t;
}

export const ASX = {
  openP(id) { resetAP({ pid: id }); S.route = { view: 'asset' }; render(); },
  delP(id) {
    const p = asPer(id); if (!p) return;
    if (!window.confirm('Xoá kỳ "' + p.name + '" và toàn bộ kết quả kiểm kê?')) return;
    p.items.forEach(phDelItem);
    { const ix = db.assets.findIndex((x) => x.id === id); if (ix >= 0) db.assets.splice(ix, 1); } store.save(); rerender();
  },
  upFile(inp) {
    const f = inp.files && inp.files[0]; if (!f) return;
    if (!kkNeed(['xlsx'], () => { ASX.upFile(inp); })) return;
    const fr = new FileReader();
    fr.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        const isCsv = /\.csv$/i.test(f.name);
        const wb = isCsv ? XLSX.read(e.target.result, { type: 'string' }) : XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        let res = null;
        for (let k = 0; k < wb.SheetNames.length && !res; k++) {
          res = asParseSheet(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[k]], { header: 1, defval: '' }));
        }
        if (!res || !res.items.length) { toast('Không tìm thấy bảng có cột "Mã" và "Tên" trong file'); return; }
        const now = new Date();
        const pre = AP.pre || {}; const fo = pre.folder !== undefined && pre.folder !== null ? pre.folder : X.LSX.folderGuess(res.info.branch || f.name);
        AP.up = { fname: f.name, items: res.items, folder: fo, name: 'Kiểm kê CCDC & TSCĐ ' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear(),
          branch: res.info.branch || fo, dateCount: res.info.dateCount, cutoff: res.info.cutoff };
        rerender();
      } catch (err) { console.error(err); toast('Không đọc được file này'); }
    };
    if (/\.csv$/i.test(f.name)) fr.readAsText(f); else fr.readAsArrayBuffer(f);
  },
  upSet(k, v) { if (AP.up) AP.up[k] = v; },
  upCancel() { AP.up = null; rerender(); },
  upCreate() {
    const u = AP.up; if (!u) return;
    if (!db.assets) db.assets = [];
    const p = { id: 'as_' + Date.now().toString(36) + asRid(), folder: u.folder || '', name: u.name || 'Kiểm kê CCDC & TSCĐ', branch: u.branch, dateCount: u.dateCount, cutoff: u.cutoff,
      team: { dauMoi: '', toKiemKe: '', lanhDao: '' }, cur: { room: '', user: 'Sử dụng chung', loc: '', auto: false }, createdAt: Date.now(), items: u.items };
    db.assets.unshift(p); store.save(); AP.up = null; AP.pre = null; ASX.openP(p.id);
  },
  q(v) { AP.q = v; AP.limit = 60; rerender(); },
  flt(f) { AP.flt = f; AP.limit = 60; rerender(); },
  more() { AP.limit += 120; rerender(); },
  cur(k, v) { const p = asPer(AP.pid); if (!p) return; p.cur = p.cur || {}; p.cur[k] = v; if (k === 'room' && !p.cur._locManual) p.cur.loc = asLocOf(v); if (k === 'loc') p.cur._locManual = true; saveSoon(); },
  curAuto(on) { const p = asPer(AP.pid); if (!p) return; p.cur = p.cur || {}; p.cur.auto = !!on; saveSoon(); toast(on ? 'Bật tự lưu: quét là lưu luôn' : 'Tắt tự lưu'); },
  edit(id) { asEdit(id); },
  addExtra(text) {
    const p = asPer(AP.pid); if (!p) return;
    asEdit('new', { id: 'x_' + asRid(), stt: String(asNextStt(p)), code: typeof text === 'string' ? text : '', name: '', unit: 'Cái', qty: 0, unit1: (p.items[0] && p.items[0].unit1) || '', counted: false, cQty: null, extra: true, note: 'Phát hiện thêm' });
  },
  editSave() {
    const p = asPer(AP.pid); const it = AP.editing; if (!p || !it) return;
    const g = val;
    if (it.extra) {
      const nm = g('e_name'); if (!nm) { toast('Nhập tên tài sản'); return; }
      it.name = nm; it.code = g('e_code'); it.unit = g('e_unit') || 'Cái';
      if (it.trace && nm.indexOf('(Chưa rõ tên)') !== 0) it.trace = false;
    }
    const qs = g('e_qty'); const qc = qtyCheck(qs); if (!qc.ok) { toast(qc.err); return; }
    if (AP.editNew) { p.items.push(it); asLog(p, 'Thêm tài sản ngoài sổ', it); }
    asApply(p, it, { cQty: qc.n, mgmt: g('e_mgmt'), room: g('e_room'), user: g('e_user'), loc: g('e_loc'), quality: g('e_quality'), status: g('e_status'), note: g('e_note') });
    asModalClose(); rerender();
    if (S.SC && S.SC.kind === 'asset') A.scNext();
    toast('Đã lưu');
  },
  editMissing() {
    const p = asPer(AP.pid); const it = AP.editing; if (!p || !it) return;
    const g = val;
    asApply(p, it, { cQty: 0, mgmt: g('e_mgmt'), room: g('e_room'), user: g('e_user'), loc: g('e_loc'), quality: g('e_quality'), status: 'Không tìm thấy', note: g('e_note') });
    asModalClose(); rerender(); if (S.SC && S.SC.kind === 'asset') A.scNext(); toast('Đã ghi nhận: không tìm thấy');
  },
  editReset() {
    const it = AP.editing; if (!it) return;
    asLog(asPer(AP.pid), 'Bỏ kết quả kiểm kê', it);
    it.counted = false; it.cQty = null; it.mgmt = it.room = it.user = it.loc = it.quality = it.status = '';
    saveSoon(); asModalClose(); rerender(); toast('Đã bỏ kết quả kiểm kê');
  },
  editDel() {
    const p = asPer(AP.pid); const it = AP.editing; if (!p || !it) return;
    if (!window.confirm('Xoá tài sản ngoài sổ này?')) return;
    asLog(p, 'Xoá tài sản ngoài sổ', it); phDelItem(it); { const ix = p.items.indexOf(it); if (ix >= 0) p.items.splice(ix, 1); } saveSoon(); asModalClose(); rerender();
  },
  scan() {
    const p = asPer(AP.pid); if (!p) return;
    if (S.SC) A.scClose();
    S.SC = { pid: p.id, kind: 'asset', hold: false, busy: false, auto: true };
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { S.SC.actx = new AC(); if (S.SC.actx.resume) S.SC.actx.resume(); } } catch (e) { klog('var AC=window.AudioContext||window.webkitAudioCo', e); }
    X.scMount();
  },
  scSave(id) {
    const SC = S.SC; if (!SC) return;
    const p = per(SC.pid); let it = null; p.items.forEach((x) => { if (x.id === id) it = x; }); if (!it) return;
    const g = val;
    const qs = g('asq_qty'); const qc = qtyCheck(qs); if (!qc.ok) { toast(qc.err); return; }
    const prev = JSON.parse(JSON.stringify(it));
    asApply(p, it, { cQty: qc.n, room: g('asq_room'), user: g('asq_user'), loc: g('asq_loc'), quality: g('asq_quality'), status: g('asq_status') });
    SC.undo = { id: it.id, prev };
    SC.log = SC.log || []; SC.log.push({ name: it.name, qty: it.cQty });
    X.scBeep(); A.scNext(); if (X.scLogRender) X.scLogRender(); rerender();
    toast('Đã lưu: ' + it.name);
  },
  scUndo() {
    const SC = S.SC; if (!SC || !SC.undo) return;
    const p = per(SC.pid); const u = SC.undo;
    for (let i = 0; i < p.items.length; i++) if (p.items[i].id === u.id) { p.items[i] = u.prev; break; }
    if (SC.log && SC.log.length) SC.log.pop();
    SC.undo = null; saveSoon(); A.scNext(); if (X.scLogRender) X.scLogRender(); rerender(); toast('Đã hoàn tác');
  },
  scDetail(id) { asEdit(id); },
  dupAdd(id) {
    const SC = S.SC; if (!SC) return;
    const p = per(SC.pid); let it = null; p.items.forEach((x) => { if (x.id === id) it = x; }); if (!it) return;
    const o = it.cQty || 0; it.cQty = o + 1; it.at = Date.now(); it.by = (db.profile && db.profile.ten) || '';
    asLog(p, 'Cộng thêm +1 (trùng mã)', it, 'SL ' + fmt(o) + ' → ' + fmt(it.cQty));
    saveSoon(); X.scBeep(); A.scNext(); rerender(); toast('Đã cộng thêm: ' + it.name + ' → ' + fmt(it.cQty));
  },
  sum() { const p = asPer(AP.pid); if (p) asModal(() => asSumHtml(asPer(AP.pid) || p)); },
  sumGo(f) { AP.flt = f; AP.limit = 60; asModalClose(); rerender(); window.scrollTo(0, 0); },
  logView() { const p = asPer(AP.pid); if (p) asModal(() => asLogHtml(asPer(AP.pid) || p)); },
  sigToggle() { AP.sigOpen = !AP.sigOpen; rerender(); },
  confirmNum() {
    const SC = S.SC; if (!SC) return;
    const e = document.getElementById('scnum'); const v = e ? e.value.replace(/\s+/g, '').trim() : '';
    if (!v) { toast('Nhập số trên tem'); return; }
    const p = per(SC.pid); const m = X.scMatch(p, v);
    if (m.item) { X.scShowMatched(m); return; }
    const r = X.asAutoAdd(p, v, 'code'); X.asAddedNotice(r.it, r.isNew);
  },
  phShoot(k) {
    const it = AP.editing; if (!it) return;
    if ((it.imgs || []).length >= 8) { toast('Mỗi tài sản tối đa 8 ảnh'); return; }
    phCam(k === 'tem' ? 'Chụp ảnh tem' : 'Chụp ảnh tài sản', (d, w, h) => { phAdd(it, k, d, w, h); asPhotoRefresh(); rerender(); toast('Đã lưu ảnh'); });
  },
  phDel(id) {
    const it = AP.editing; if (!it || !window.confirm('Xoá ảnh này?')) return;
    it.imgs = (it.imgs || []).filter((m) => m.id !== id); PH.del(id); asLog(asPer(AP.pid), 'Xoá ảnh', it); saveSoon(); asPhotoRefresh(); rerender();
  },
  scShoot(id, k) {
    const SC = S.SC; if (!SC || SC.shooting) return;
    const p = per(SC.pid); let it = null; p.items.forEach((x) => { if (x.id === id) it = x; }); if (!it) return;
    if ((it.imgs || []).length >= 8) { toast('Mỗi tài sản tối đa 8 ảnh'); return; }
    const v = document.getElementById('scvid');
    if (!v || !v.videoWidth) { toast('Camera chưa sẵn sàng — mở Chi tiết để chụp'); return; }
    SC.shooting = true; SC.shootId = id; SC.shootTxt = { t: 'Đang chụp — giữ yên máy…' }; shootBtn('Đang chụp — giữ yên máy…'); rerender();
    phShoot(v, SC.track, 2000).then((r) => {
      if (S.SC) S.SC.shooting = false;
      if (!r) { toast('Không chụp được ảnh'); if (S.SC) { S.SC.shootId = id; S.SC.shootTxt = { t: 'Thử chụp lại' }; } shootBtn('Thử chụp lại'); rerender(); return; }
      phAdd(it, k || 'ts', r.d, r.w, r.h);
      if (S.SC) { S.SC.shootId = id; S.SC.shootTxt = { icon: true, t: 'Đã lưu · chụp thêm (' + it.imgs.length + ' ảnh)' }; }
      shootBtn('Đã lưu · chụp thêm (' + it.imgs.length + ' ảnh)', true);
      rerender();
      if (k === 'tem') phNote();
      toast('Đã lưu ảnh');
    });
  },
  autoUndo(id) {
    const p = asPer((S.SC && S.SC.pid) || AP.pid); if (!p) return;
    p.items.forEach((x) => { if (x.id === id) { asLog(p, 'Hoàn tác: xoá tài sản phát hiện thêm', x); phDelItem(x); } });
    { const ix = p.items.findIndex((x) => x.id === id); if (ix >= 0) p.items.splice(ix, 1); }
    saveSoon(); A.scNext(); X.scUnmChip(); rerender(); toast('Đã hoàn tác');
  },
  autoAddManual(text) {
    const p = per(S.SC.pid); if (!p) return;
    const r = X.asAutoAdd(p, text, 'code'); X.asAddedNotice(r.it, r.isNew);
  },
  info() {
    const p0 = asPer(AP.pid); if (!p0) return;
    const t = asTeam(p0);
    asModal(() => {
      const p = asPer(AP.pid) || p0;
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 800, fontSize: 17 }}>Thông tin biên bản</div><button className="pill" onClick={() => asModalClose()}>✕</button></div>
          <Lb t="Tên kỳ" /><input className="inp" id="i_name" defaultValue={p.name} />
          <Lb t="Chi nhánh" /><input className="inp" id="i_branch" defaultValue={p.branch || ''} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div><Lb t="Thời điểm kiểm kê" /><input type="date" className="inp" id="i_date" defaultValue={p.dateCount || ''} /></div><div><Lb t="Chốt số liệu đến ngày" /><input type="date" className="inp" id="i_cut" defaultValue={p.cutoff || ''} /></div></div>
          <Lb t="Đầu mối kiểm kê tại đơn vị" /><input className="inp" id="i_dm" defaultValue={t.dauMoi || ''} />
          <Lb t="Tổ kiểm kê" /><input className="inp" id="i_tk" defaultValue={t.toKiemKe || ''} />
          <Lb t="Lãnh đạo đơn vị" /><input className="inp" id="i_ld" defaultValue={t.lanhDao || ''} />
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => ASX.infoSave()}>Lưu</button>
        </>
      );
    });
  },
  infoSave() {
    const p = asPer(AP.pid); if (!p) return;
    const g = val;
    p.name = g('i_name') || p.name; p.branch = g('i_branch'); p.dateCount = g('i_date'); p.cutoff = g('i_cut');
    p.team = { dauMoi: g('i_dm'), toKiemKe: g('i_tk'), lanhDao: g('i_ld') };
    asLog(p, 'Sửa thông tin biên bản');
    store.save(); asModalClose(); rerender(); toast('Đã lưu thông tin biên bản');
  },
  exportX() {
    const p = asPer(AP.pid); if (!p) return;
    if (!kkNeed(['exceljs'], () => { ASX.exportX(); })) return;
    PH.preload(p).then(() => buildAssetXlsx(p).xlsx.writeBuffer()).then((buf) => { X.shareOrDownload(new Blob([buf], { type: X.XLSX_MIME }), asFileName(p)); p.lastExport = Date.now(); asLog(p, 'Xuất Excel'); store.save(); rerender(); }).catch((e) => { console.error(e); toast('Không xuất được file'); });
  },
  print() {
    const p = asPer(AP.pid); if (!p) return;
    const w = window.open('', '_blank');
    if (!w) { toast('Trình duyệt chặn cửa sổ in — hãy dùng nút Excel'); return; }
    w.document.write(asPrintHtml(p)); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) { klog('w.focus();w.print();', e); } }, 500);
  },
};
void icon;
