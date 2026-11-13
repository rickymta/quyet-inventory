/* Chữ ký điện tử vẽ trên màn hình, hộp thoại sửa tên, WebAuthn (dòng gốc 2638–2821) + A.sigOpen/sigClear/sigPanelToggle.
   Các hàm sigBoxHtml/sigSectionHtml/sigPeriodToggle trả JSX (chỉ được nhúng vào giao diện, không dùng trong in/Word).
   Biến gán lại SIGP, RENAME_CB nằm ở S.SIGP, S.RENAME_CB. */
import { useEffect } from 'react';
import { S, A, db, esc, st, I, store, saveSoon, toast, per, rerender, openLayer, closeLayer, X } from '../../core';

/* Hàm của phân hệ khác gọi lúc chạy qua X: ensureBCMeta (baocao), asPer/AP/asLog/asTeam (assets), sgOf (settings) */
const sgOf = (...a) => X.sgOf(...a);

S.SIGP = null;
S.RENAME_CB = null;

export function deviceLabel() {
  var u = navigator.userAgent || '';
  var os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS X/.test(u) ? 'Mac' : 'thiết bị khác';
  var br = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : /Firefox\//.test(u) ? 'Firefox' : '';
  return os + (br ? ', ' + br : '');
}
export function nowLabel() {
  var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ngày ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}
export var SIG_TITLES = { 'hv.benGiao': 'Bên bàn giao', 'hv.benNhan': 'Bên nhận bàn giao', 'ex.nguoiGiaiTrinh': 'Người giải trình', 'ex.lanhDao': 'Lãnh đạo đơn vị', 'bc.keToan': 'Phòng Kế toán HO', 'bc.hanhChinh': 'Phòng Hành chính HO', 'pe.giamDoc': 'Giám đốc cơ sở', 'pe.thuKho': 'Thủ kho cơ sở', 'pe.hanhChinh': 'Phòng Hành chính Hậu cần' };
export var SIG_KEYS = { hv: ['benGiao', 'benNhan'], ex: ['nguoiGiaiTrinh', 'lanhDao'], bc: ['keToan', 'hanhChinh'], pe: ['giamDoc', 'thuKho', 'hanhChinh'], as: ['dauMoi', 'toKiemKe', 'lanhDao'] };
SIG_TITLES['as.dauMoi'] = 'Đầu mối kiểm kê tại đơn vị'; SIG_TITLES['as.toKiemKe'] = 'Tổ kiểm kê'; SIG_TITLES['as.lanhDao'] = 'Lãnh đạo đơn vị';

export function sigStore(kind) {
  if (kind === 'hv') return S.HV;
  if (kind === 'ex') return S.EX;
  if (kind === 'bc') { X.ensureBCMeta(); return S.BCMETA; }
  if (kind === 'as') return X.asPer(X.AP.pid);
  return per(S.P.id);
}
export function sigRerender(kind) {
  /* renderHandoverEdit / renderExplainEdit / renderBaoCao / renderAsset / renderPeriod đều là vẽ lại màn hiện tại */
  rerender();
}
export function sigPersist(kind) {
  if (kind === 'hv') A.hvSave(false);
  else if (kind === 'ex') A.exSave(false);
  else if (kind === 'pe' || kind === 'as') store.save();
}

/* Khối ký (JSX) */
export function sigBoxHtml(kind, key) {
  var sg = sigStore(kind); sg.sig = sg.sig || {};
  var s = sg.sig[key], label = SIG_TITLES[kind + '.' + key];
  return (
    <div key={kind + '.' + key} style={st('flex:1 1 140px;min-width:0;border:1px solid var(--line);border-radius:14px;padding:10px;background:var(--card)')}>
      <div style={st('font-weight:700;font-size:13px;margin-bottom:8px')}>{label}</div>
      {s ? (
        <>
          <div style={st('height:84px;display:flex;align-items:center;justify-content:center;background:var(--card2);border-radius:10px')}><img src={s.img} style={st('max-width:100%;max-height:76px')} alt="" /></div>
          <div style={st('font-size:13px;font-weight:600;margin-top:6px')}>{s.ten}</div>
          <div style={st('font-size:11px;color:var(--mut)')}>{s.time}</div>
          {s.auth ? <div style={st('font-size:11px;color:var(--green)')}>{'🔒 ' + s.auth}</div> : null}
          <div style={st('display:flex;gap:14px;margin-top:6px')}>
            <button className="addbat" style={st('color:var(--teal)')} onClick={() => sigOpen(kind, key)}>Ký lại</button>
            <button className="addbat" style={st('color:var(--red)')} onClick={() => sigClear(kind, key)}>Xoá</button>
          </div>
        </>
      ) : (
        <>
          <div style={st('height:84px;display:flex;align-items:center;justify-content:center;border:1.5px dashed var(--line);border-radius:10px;color:var(--mut2);font-size:12px')}>Chưa ký</div>
          <button className="btn btn-outline" style={st('margin-top:8px;padding:10px;font-size:13px')} onClick={() => sigOpen(kind, key)}>{I('edit', 15)}Ký tại đây</button>
        </>
      )}
    </div>
  );
}
export function sigSectionHtml(kind) {
  var where = kind === 'pe' ? 'file Excel biên bản (áp dụng cho mọi sheet chi nhánh trong kỳ này)' : kind === 'as' ? 'sheet BBKK của file Excel và bản in' : 'file Word và bản in';
  return (
    <>
      <div className="bcsec" style={st('margin-top:20px')}>Chữ ký điện tử (tuỳ chọn)</div>
      <div style={st('font-size:12px;color:var(--mut);margin-bottom:8px')}>{'Ký bằng ngón tay ngay trên màn hình, mực xanh. Chữ ký được chèn vào ' + where + ', kèm họ tên, thời gian và thiết bị. Không ký thì ô ký vẫn để trống cho ký tay. Nếu sửa nội dung sau khi ký, nên ký lại.'}</div>
      <div style={st('display:flex;gap:10px;flex-wrap:wrap')}>
        {SIG_KEYS[kind].map(function (k) { return sigBoxHtml(kind, k); })}
      </div>
    </>
  );
}
export function sigPeriodToggle(p) {
  p.sig = p.sig || {};
  var n = SIG_KEYS.pe.filter(function (k) { return p.sig[k]; }).length;
  return (
    <>
      <button className="stklink" style={st('display:flex;align-items:center;gap:7px')} onClick={() => A_sigPanelToggle()}>{I('edit', 16)}{'Chữ ký điện tử cho biên bản Excel (' + n + '/3)'}{I('chev', 16)}</button>
      {S.P && S.P.sigOpen ? sigSectionHtml('pe') : null}
    </>
  );
}

/* Bảng ký: lớp phủ + canvas. Phần vẽ là thao tác DOM mệnh lệnh, gắn lúc component được dựng. */
function SigPad({ title, defName }) {
  useEffect(() => {
    var SIGP = S.SIGP; if (!SIGP) return;
    var cv = document.getElementById('sigcv'); if (!cv || SIGP.cv === cv) return;
    var dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d4ed8';
    SIGP.cv = cv; SIGP.ctx = ctx; SIGP.dpr = dpr;
    function pos(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    function box(p) { SIGP.minx = Math.min(SIGP.minx, p.x); SIGP.miny = Math.min(SIGP.miny, p.y); SIGP.maxx = Math.max(SIGP.maxx, p.x); SIGP.maxy = Math.max(SIGP.maxy, p.y); }
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault(); if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
      var p = pos(e); SIGP.drawing = true; SIGP.last = p; box(p);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y + 0.01); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!S.SIGP || !S.SIGP.drawing) return; e.preventDefault();
      var p = pos(e), m = { x: (SIGP.last.x + p.x) / 2, y: (SIGP.last.y + p.y) / 2 };
      ctx.quadraticCurveTo(SIGP.last.x, SIGP.last.y, m.x, m.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.x, m.y); SIGP.last = p; box(p); SIGP.ink = true;
    });
    var stop = function () { if (S.SIGP) S.SIGP.drawing = false; };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('pointerleave', stop);
  }, []);
  return (
    <div id="sigovl">
      <div className="sigcard">
        <div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>{'Ký xác nhận: ' + title}</div>
        <label className="lbl">Họ tên người ký</label>
        <input className="inp" id="signame" defaultValue={defName || ''} style={st('margin-bottom:10px')} />
        <canvas id="sigcv"></canvas>
        <div style={st('font-size:12px;color:var(--mut);margin:6px 0 12px')}>Dùng ngón tay vẽ chữ ký vào khung. Chữ ký sẽ được lưu kèm họ tên, thời gian và thiết bị.</div>
        {waOk() ? (
          <label style={st('display:flex;gap:8px;align-items:flex-start;font-size:13px;margin-bottom:12px')}>
            <input type="checkbox" id="sigwa" defaultChecked={db.waPref !== false} style={st('margin-top:3px')} />
            <span><b>Xác thực bằng Face ID / vân tay</b><br /><span style={st('color:var(--mut);font-size:12px')}>Chỉ ai mở khoá được thiết bị này mới ký được. Lần đầu app tạo khoá xác thực trên máy.</span></span>
          </label>
        ) : null}
        <div style={st('display:flex;gap:8px')}>
          <button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => sigPadClear()}>Vẽ lại</button>
          <button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => sigPadClose()}>Huỷ</button>
          <button className="btn btn-primary" style={st('flex:1.3;padding:12px')} onClick={() => sigConfirm()}>{I('check', 16)}Xác nhận</button>
        </div>
      </div>
    </div>
  );
}
export function sigPadOpen(kind, key, title, defName) {
  S.SIGP = { kind: kind, key: key, ink: false, drawing: false, minx: 1e9, miny: 1e9, maxx: -1e9, maxy: -1e9 };
  document.body.style.overflow = 'hidden';
  openLayer('sigovl', () => <SigPad title={title} defName={defName} />);
}
export function sigPadClear() {
  var SIGP = S.SIGP;
  if (!SIGP || !SIGP.cv) return;
  var cv = SIGP.cv; SIGP.ctx.clearRect(0, 0, cv.width, cv.height);
  SIGP.ink = false; SIGP.minx = 1e9; SIGP.miny = 1e9; SIGP.maxx = -1e9; SIGP.maxy = -1e9;
}
export function sigPadClose() {
  document.body.style.overflow = ''; S.SIGP = null;
  closeLayer('sigovl');
}
export function sigExport() {
  var SIGP = S.SIGP;
  var d = SIGP.dpr, pad = 10, cv = SIGP.cv;
  var x = Math.max(0, SIGP.minx - pad), y = Math.max(0, SIGP.miny - pad);
  var w = Math.min(cv.width / d - x, SIGP.maxx - SIGP.minx + pad * 2), h = Math.min(cv.height / d - y, SIGP.maxy - SIGP.miny + pad * 2);
  var ow = Math.min(Math.round(w * d), 600), oh = Math.max(1, Math.round(h * d * (ow / (w * d))));
  var oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
  oc.getContext('2d').drawImage(cv, x * d, y * d, w * d, h * d, 0, 0, ow, oh);
  return { url: oc.toDataURL('image/png'), w: ow, h: oh };
}

/* Hộp thoại sửa tên (dùng cho tên kỳ kiểm kê) */
function RenameBox({ title, value }) {
  useEffect(() => {
    var t = document.getElementById('nmin');
    if (t && t.focus) { t.focus(); if (t.select) t.select(); }
  }, []);
  return (
    <div id="nmovl">
      <div className="sigcard">
        <div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>{title}</div>
        <textarea className="inp" id="nmin" rows="3" style={st('resize:none')} defaultValue={value}></textarea>
        <div style={st('display:flex;gap:8px;margin-top:12px')}>
          <button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => renameClose()}>Huỷ</button>
          <button className="btn btn-primary" style={st('flex:1;padding:12px')} onClick={() => renameSave()}>{I('check', 16)}Lưu</button>
        </div>
      </div>
    </div>
  );
}
export function renameModal(title, value, cb) {
  S.RENAME_CB = cb;
  openLayer('nmovl', () => <RenameBox title={title} value={value} />);
}
export function renameClose() {
  S.RENAME_CB = null;
  closeLayer('nmovl');
}
export function renameSave() {
  var t = document.getElementById('nmin');
  var v = ((t && t.value) || '').replace(/\s+/g, ' ').trim();
  if (!v) { toast('Tên không được để trống'); return; }
  var cb = S.RENAME_CB;
  renameClose();
  if (cb) cb(v);
}

/* Xác thực chữ ký bằng Face ID / vân tay (WebAuthn, khoá nằm trên thiết bị) */
export function waOk() { return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && window.isSecureContext); }
export function waRand(n) { return crypto.getRandomValues(new Uint8Array(n)); }
export function waB64(b) { var a = new Uint8Array(b), s = '', i; for (i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function waUn(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var r = atob(s), a = new Uint8Array(r.length), i; for (i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
export function waEnroll(ten) {
  var nm = ten || 'Người kiểm kê';
  return navigator.credentials.create({ publicKey: { challenge: waRand(32), rp: { name: 'Kiểm kê kho MedDental', id: location.hostname }, user: { id: waRand(16), name: nm, displayName: nm },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' }, timeout: 60000, attestation: 'none' } })
    .then(function (c) { db.webauthn = { id: waB64(c.rawId), at: Date.now() }; store.save(); });
}
export function waSign(ten) {
  if (!db.webauthn) return waEnroll(ten);
  return navigator.credentials.get({ publicKey: { challenge: waRand(32), rpId: location.hostname, allowCredentials: [{ type: 'public-key', id: waUn(db.webauthn.id), transports: ['internal'] }], userVerification: 'required', timeout: 60000 } });
}
export function sigConfirm() {
  if (!S.SIGP) return;
  var ten = (document.getElementById('signame').value || '').trim();
  if (!S.SIGP.ink) { toast('Chưa có chữ ký, hãy vẽ vào khung'); return; }
  if (!ten) { toast('Nhập họ tên người ký'); return; }
  var chk = document.getElementById('sigwa'), useWa = !!(chk && chk.checked);
  if (chk) { db.waPref = useWa; saveSoon(); }
  var fin = function (auth) {
    if (!S.SIGP) return;
    var ex = sigExport();
    var sig = { img: ex.url, w: ex.w, h: ex.h, ten: ten, time: nowLabel(), dev: deviceLabel() };
    if (auth) sig.auth = auth;
    var kind = S.SIGP.kind, key = S.SIGP.key;
    sigPadClose();
    var sg = sigStore(kind); sg.sig = sg.sig || {}; sg.sig[key] = sig;
    if (kind === 'as') X.asLog(sg, 'Ký điện tử: ' + (SIG_TITLES['as.' + key] || key), null, ten + (auth ? ' · ' + auth : ''));
    sigPersist(kind);
    sigRerender(kind);
    toast(auth ? 'Đã ký và xác thực' : 'Đã ký xác nhận');
  };
  if (!useWa) { fin(''); return; }
  waSign(ten).then(function () { db.waFail = 0; fin('Xác thực thiết bị (Face ID/vân tay/mã máy)'); }).catch(function (e) {
    db.waFail = (db.waFail || 0) + 1;
    if (db.waFail >= 2) { db.webauthn = null; db.waFail = 0; }
    store.save();
    toast('Chưa xác thực được' + (e && e.name === 'NotAllowedError' ? ' (đã huỷ hoặc không khớp)' : '') + ' — thử lại, hoặc bỏ chọn xác thực để ký thường');
  });
}

/* Hành động A của phân hệ docs */
function sigOpen(kind, key) {
  var def = '';
  if (kind === 'hv' && S.HV[key]) def = S.HV[key].ten || '';
  if (kind === 'ex' && key === 'nguoiGiaiTrinh') def = S.EX.nguoiGiaiTrinh.ten || '';
  if (kind === 'pe') { var pp = per(S.P.id); def = sgOf(pp && pp.folder)[key] || ''; }
  if (kind === 'as') { var pa = X.asPer(X.AP.pid); def = (pa && X.asTeam(pa)[key]) || ''; }
  if (kind === 'ex' && key === 'lanhDao') def = sgOf(S.EX.boPhan).giamDoc;
  if (!def) def = (db.profile && db.profile.ten) || '';
  sigPadOpen(kind, key, SIG_TITLES[kind + '.' + key] || '', def);
}
function sigClear(kind, key) {
  if (!confirm('Xoá chữ ký này?')) return;
  var sg = sigStore(kind); sg.sig = sg.sig || {}; delete sg.sig[key];
  sigPersist(kind); sigRerender(kind);
}
function A_sigPanelToggle() { S.P.sigOpen = !S.P.sigOpen; rerender(); }
export const actions = { sigOpen, sigClear, sigPanelToggle: A_sigPanelToggle };
