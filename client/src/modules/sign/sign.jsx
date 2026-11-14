/* Ký số PDF (bản gốc 2026111401, khối sg-js): thư mục bản PDF đã ký riêng · thư viện nhiều chữ ký · chọn vị trí ký · xác nhận Face ID.
   Metadata ở db.sg (docs, folders, sigs; sigs/name/dev/pw là dữ liệu riêng thiết bị). File PDF ở blobs 'kk_sign' (khoá sgsrc:<id> / sgout:<id>, giá trị dataURL). */
import { useEffect, useRef, useState } from 'react';
import { cutInk } from './ink.js';
import { db, A, X, store, blobs, rerender, toast, esc, icon, I, st, klog, kkReady, openLayer, closeLayer } from '../../core';

const SG = { tab: 'todo', fo: -1 };
const SIG_MAX = 12;
let SGP = null;
const BS = 'kk_sign';

/* S() của app gốc → sgState() (S của lõi là trạng thái toàn cục) */
export function sgState() {
  let s = db.sg; if (!s || typeof s !== 'object') s = db.sg = {};
  if (!Array.isArray(s.docs)) s.docs = [];
  if (!Array.isArray(s.folders) || !s.folders.length) s.folders = ['Chưa phân loại'];
  if (!Array.isArray(s.sigs)) s.sigs = [];
  /* chuyển chữ ký đơn cũ (1 chữ ký cố định/máy) sang thư viện nhiều chữ ký */
  if (s.sig && s.sig.img) s.sigs.push({ id: uid(), name: s.name || (db.profile && db.profile.ten) || 'Chữ ký', img: s.sig.img, w: s.sig.w, h: s.sig.h, kind: 'draw', at: Date.now() });
  if (s.sig || s.fixed) { delete s.sig; delete s.fixed; }
  return s;
}
const sigById = (id) => sgState().sigs.filter((g) => g.id === id)[0];
const $ = (i) => document.getElementById(i);
const D = (id) => sgState().docs.filter((x) => x.id === id)[0];
const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB');
function dt(t) { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function sha(b) { return crypto.subtle.digest('SHA-256', b).then((h) => Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, '0')).join('')); }
export function pwHash(pw, salt, it) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
    .then((k) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: X.waUn(salt), iterations: it }, k, 256)).then(X.waB64);
}
function rdFile(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error || new Error('read')); r.readAsArrayBuffer(f); }); }
const uid = () => 'sg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function devId() {
  const k = 'kk_sg_did'; let v = '';
  try { v = localStorage.getItem(k) || ''; if (!v) { v = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(); localStorage.setItem(k, v); } } catch (e) { v = v || 'N/A'; }
  return v;
}

/* ---- file PDF: ArrayBuffer <-> dataURL trong blobs ---- */
function bufToUrl(buf) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error || new Error('read')); r.readAsDataURL(new Blob([buf], { type: 'application/pdf' })); }); }
function urlToBuf(u) {
  const i = u.indexOf(','); const b = atob(u.slice(0, 5) === 'data:' && i >= 0 ? u.slice(i + 1) : u);
  const a = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a.buffer;
}
async function getBuf(k) { try { const v = await blobs.get(BS, k); return v ? urlToBuf(v) : null; } catch (e) { klog('sgGet', e); return null; } }
async function putBuf(k, buf) { try { await blobs.put(BS, k, await bufToUrl(buf)); putBuf.err = ''; return true; } catch (e) { klog('sgPut', e); putBuf.err = (e && e.message) || ''; return false; } }
async function idbDel(k) { try { await blobs.del(BS, k); return 1; } catch (e) { return 0; } }

/* ---- con dấu chữ ký vẽ bằng canvas để có đủ dấu tiếng Việt ---- */
function stamp(o) {
  return new Promise((res) => {
    function fin(im) {
      const W = 640; let iw = 300; let ih = 90; const c = document.createElement('canvas');
      if (im) { const k = Math.min(560 / im.width, 150 / im.height); iw = im.width * k; ih = im.height * k; }
      const H = Math.round(ih + 20 + (o.txt ? 184 : 0)); c.width = W; c.height = H; const x = c.getContext('2d');
      if (im) x.drawImage(im, (W - iw) / 2, 10, iw, ih);
      else { x.strokeStyle = '#98a2b3'; x.setLineDash([8, 6]); x.strokeRect(170, 10, 300, 90); x.fillStyle = '#98a2b3'; x.font = '22px Arial,sans-serif'; x.textAlign = 'center'; x.fillText('Chưa có chữ ký', W / 2, 62); x.textAlign = 'left'; }
      if (o.txt) {
        x.fillStyle = '#1e3a6b';
        ['Ký bởi: ' + String(o.name || '').slice(0, 34), 'Thời gian: ' + o.when, 'Ký bằng: ' + X.deviceLabel(), 'Mã máy: ' + devId() + (db.webauthn ? ' · Khoá FaceID ' + db.webauthn.id.slice(0, 6).toUpperCase() : ''), 'Xác thực: ' + o.auth].forEach((t, i) => { x.font = (i ? '' : 'bold ') + '24px Arial,sans-serif'; x.fillText(t, 14, ih + 42 + i * 34); });
      }
      res({ url: c.toDataURL('image/png'), ar: H / W });
    }
    if (o.sig) { const im = new Image(); im.onload = () => { fin(im); }; im.src = o.sig.img; } else fin(null);
  });
}

/* ---- thư viện chữ ký: vẽ tay trên màn hình hoặc tải ảnh scan, lưu trên máy để chọn lại ---- */
function canAdd() { if (sgState().sigs.length >= SIG_MAX) { toast('Tối đa ' + SIG_MAX + ' chữ ký — hãy xoá bớt trước khi thêm'); return false; } return true; }
function defName() { return sgState().sigs.length ? '' : ((db.profile && db.profile.ten) || ''); }
function sigAdd(o) { const g = { id: uid(), name: o.name, img: o.img, w: o.w, h: o.h, kind: o.kind, at: Date.now() }; sgState().sigs.push(g); store.save(); return g; }

function SgPad({ cb }) {
  const ref = useRef(null); const nm = useRef(null); const api = useRef({});
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1; const r = cv.getBoundingClientRect(); const x = cv.getContext('2d'); let bb; let dr = false; let lp;
    cv.width = r.width * dpr; cv.height = r.height * dpr; x.scale(dpr, dpr); x.lineWidth = 2.4; x.lineCap = x.lineJoin = 'round'; x.strokeStyle = '#1d4ed8';
    const rs = () => { bb = [1e9, 1e9, -1e9, -1e9]; x.clearRect(0, 0, r.width, r.height); }; rs();
    const pt = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const bx = (p) => { bb = [Math.min(bb[0], p[0]), Math.min(bb[1], p[1]), Math.max(bb[2], p[0]), Math.max(bb[3], p[1])]; };
    cv.onpointerdown = (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); lp = pt(e); dr = true; x.beginPath(); x.moveTo(lp[0], lp[1]); x.lineTo(lp[0] + 0.01, lp[1] + 0.01); x.stroke(); bx(lp); };
    cv.onpointermove = (e) => { if (!dr) return; const p = pt(e); x.beginPath(); x.moveTo(lp[0], lp[1]); x.lineTo(p[0], p[1]); x.stroke(); lp = p; bx(p); };
    cv.onpointerup = cv.onpointercancel = () => { dr = false; };
    api.current.rs = rs;
    api.current.save = () => {
      const n = ((nm.current && nm.current.value) || '').trim();
      if (bb[0] > 1e8) { toast('Chưa có chữ ký, hãy vẽ vào khung'); return; }
      if (!n) { toast('Nhập tên người ký'); return; }
      const p = 10; const sx = Math.max(0, bb[0] - p); const sy = Math.max(0, bb[1] - p); const w = Math.min(r.width - sx, bb[2] - bb[0] + 2 * p); const h = Math.min(r.height - sy, bb[3] - bb[1] + 2 * p);
      const ow = Math.min(600, Math.round(w * dpr)); const oh = Math.max(1, Math.round(h * ow / w)); const oc = document.createElement('canvas');
      oc.width = ow; oc.height = oh; oc.getContext('2d').drawImage(cv, sx * dpr, sy * dpr, w * dpr, h * dpr, 0, 0, ow, oh);
      const g = sigAdd({ name: n.slice(0, 40), img: oc.toDataURL('image/png'), w: ow, h: oh, kind: 'draw' }); closeLayer('sgpad'); if (cb) cb(g);
    };
  }, []);
  return (
    <div id="sgpad"><div className="sigcard"><div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>Vẽ chữ ký</div>
      <label className="lbl">Tên người ký</label><input className="inp" id="sgpnm" ref={nm} defaultValue={defName()} placeholder="Họ tên" style={st('margin-bottom:10px')} />
      <canvas id="sgcv2" ref={ref} />
      <div style={st('font-size:12px;color:var(--mut);margin:6px 0 12px')}>Dùng ngón tay hoặc bút vẽ vào khung. Chữ ký được lưu trên máy này để chọn lại khi ký.</div>
      <div style={st('display:flex;gap:8px')}>
        <button className="btn btn-outline" style={st('flex:1;padding:12px')} id="sgpc" onClick={() => api.current.rs && api.current.rs()}>Vẽ lại</button>
        <button className="btn btn-outline" style={st('flex:1;padding:12px')} id="sgpx" onClick={() => closeLayer('sgpad')}>Huỷ</button>
        <button className="btn btn-primary" style={st('flex:1.3;padding:12px')} id="sgpo" onClick={() => api.current.save && api.current.save()}>Lưu</button>
      </div></div></div>
  );
}
function pad(cb) { if (!canAdd()) return; openLayer('sgpad', () => <SgPad cb={cb} />); }

/* ---- tải ảnh scan: tách nền trắng (thuật toán cutInk ở ink.js, chép nguyên văn), xem trước, lưu ---- */
function scan(f, cb) {
  if (!f) return; if (!canAdd()) return;
  if (!/^image\//.test(f.type || '') && !/\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(f.name || '')) { toast('Hãy chọn file ảnh chữ ký (PNG, JPG)'); return; }
  const url = URL.createObjectURL(f); const im = new Image();
  im.onerror = () => { URL.revokeObjectURL(url); toast('Không đọc được ảnh này — thử lưu lại thành PNG hoặc JPG'); };
  im.onload = () => { scanUi(im, url, cb); };
  im.src = url;
}
function ScanDlg({ sd, w, h, hasA, cb }) {
  const [nm, setNm] = useState(defName()); const [on, setOn] = useState(!hasA); const [sl, setSl] = useState(50); const [msg, setMsg] = useState('');
  const pv = useRef(null); const cur = useRef(null);
  useEffect(() => {
    const p = pv.current; if (!p) return;
    const res = cutInk(sd, +sl, on);
    if (!res) { cur.current = null; p.width = p.height = 1; setMsg('Không thấy nét chữ ký — thử kéo “Độ đậm nét” sang phải hoặc chụp lại rõ hơn'); return; }
    const tc = document.createElement('canvas'); tc.width = w; tc.height = h; tc.getContext('2d').putImageData(res.img, 0, 0);
    const b = res.box; const pd = 6; const cx = Math.max(0, b[0] - pd); const cy = Math.max(0, b[1] - pd); const cw = Math.min(w - cx, b[2] - b[0] + 1 + 2 * pd); const ch = Math.min(h - cy, b[3] - b[1] + 1 + 2 * pd); const sc = Math.min(1, 600 / cw); const oc = document.createElement('canvas');
    oc.width = Math.max(1, Math.round(cw * sc)); oc.height = Math.max(1, Math.round(ch * sc)); oc.getContext('2d').drawImage(tc, cx, cy, cw, ch, 0, 0, oc.width, oc.height);
    cur.current = oc; p.width = oc.width; p.height = oc.height; p.getContext('2d').drawImage(oc, 0, 0); setMsg('');
  }, [on, sl]);
  const save = () => {
    const n = (nm || '').trim();
    if (!cur.current) { toast('Chưa có nét chữ ký để lưu'); return; }
    if (!n) { toast('Nhập tên người ký'); return; }
    const c = cur.current; const g = sigAdd({ name: n.slice(0, 40), img: c.toDataURL('image/png'), w: c.width, h: c.height, kind: 'scan' }); closeLayer('sgup'); if (cb) cb(g); toast('Đã lưu chữ ký');
  };
  return (
    <div id="sgup"><div className="sigcard"><div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>Tải ảnh chữ ký</div>
      <label className="lbl">Tên người ký</label><input className="inp" id="sgunm" value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Họ tên" style={st('margin-bottom:10px')} />
      <div className="sgcb" style={st('border:1.5px solid var(--line);border-radius:12px;padding:10px;min-height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:8px')}><canvas id="sgupv" ref={pv} style={st('max-width:100%;max-height:170px')} /></div>
      <label style={st('display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:8px')}><input type="checkbox" id="sgubg" checked={on} onChange={(e) => setOn(e.target.checked)} /> Tách nền trắng, chỉ giữ nét chữ ký</label>
      <div id="sgusr" style={{ ...st('display:flex;gap:10px;align-items:center;font-size:12.5px;margin-bottom:6px'), opacity: on ? '1' : '.4' }}><span style={st('flex:none')}>Độ đậm nét</span><input type="range" id="sgusl" min="0" max="100" value={sl} onChange={(e) => setSl(+e.target.value)} style={st('flex:1')} /></div>
      <div id="sgumsg" style={st('font-size:12px;color:var(--red);min-height:16px;margin-bottom:6px')}>{msg}</div>
      <div style={st('display:flex;gap:8px')}><button className="btn btn-outline" style={st('flex:1;padding:12px')} id="sgux" onClick={() => closeLayer('sgup')}>Huỷ</button><button className="btn btn-primary" style={st('flex:1.3;padding:12px')} id="sguo" onClick={save}>Lưu</button></div></div></div>
  );
}
function scanUi(im, url, cb) {
  const k = Math.min(1, 700 / Math.max(im.naturalWidth, im.naturalHeight)); const w = Math.max(1, Math.round(im.naturalWidth * k)); const h = Math.max(1, Math.round(im.naturalHeight * k));
  const src = document.createElement('canvas'); let sd;
  src.width = w; src.height = h; const sx = src.getContext('2d', { willReadFrequently: true }); sx.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
  try { sd = sx.getImageData(0, 0, w, h); } catch (e) { klog('sgScan', e); toast('Không xử lý được ảnh này'); return; }
  let tr = 0; let sm = 0; for (let i = 3; i < sd.data.length; i += 28) { sm++; if (sd.data[i] < 200) tr++; }
  const hasA = sm > 0 && tr / sm > 0.02;
  openLayer('sgup', () => <ScanDlg sd={sd} w={w} h={h} hasA={hasA} cb={cb} />);
}
/* sau khi thêm chữ ký: đang ở màn chọn vị trí thì chọn luôn chữ ký đó, đang ở bảng quản lý thì làm mới bảng */
function afterAdd(g) { if (SGP && $('sgovl')) use(g.id, true); else rerender(); }

/* ---- BẮT BUỘC xác thực khuôn mặt / vân tay trước khi ký ---- */
function authOpen(cb) {
  if (!X.waOk()) { toast('Trình duyệt này không hỗ trợ Face ID — hãy mở app bằng HTTPS trên Safari/Chrome'); return; }
  X.waSign((SGP && SGP.name) || (db.profile && db.profile.ten) || '').then(() => { db.waFail = 0; cb('Face ID / vân tay'); }).catch((e) => {
    db.waFail = (db.waFail || 0) + 1; if (db.waFail >= 2) { db.webauthn = null; db.waFail = 0; } store.save();
    klog('sgAuth', e); toast('Chưa xác thực được Face ID' + (e && e.name === 'NotAllowedError' ? ' (đã huỷ hoặc không khớp)' : ' (' + ((e && e.name) || 'lỗi') + ')') + ' — chưa ký');
  });
}
function SgSec() {
  const s = sgState();
  return (
    <div id="sgauth"><div className="sigcard"><div style={st('font-weight:800;font-size:16px;margin-bottom:10px')}>Chữ ký &amp; bảo mật</div>
      <div style={st('font-size:13px;line-height:1.7;margin-bottom:10px')}>Khi ký: <b>bắt buộc xác thực Face ID / vân tay</b><br />Trạng thái: <b>{!X.waOk() ? 'trình duyệt này không hỗ trợ' : db.webauthn ? 'đã bật' : 'chưa bật (tự bật ở lần ký đầu tiên)'}</b></div>
      <div style={st('font-weight:700;font-size:13.5px;margin-bottom:4px')}>Chữ ký đã lưu ({s.sigs.length}/{SIG_MAX})</div>
      {s.sigs.length ? s.sigs.map((g) => (
        <div key={g.id} style={st('display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)')}>
          <span className="sgcb" style={st('flex:none;width:84px;height:44px;border-radius:8px;border:1px solid var(--line);display:flex;align-items:center;justify-content:center')}><img src={g.img} style={st('max-width:100%;max-height:100%')} alt="" /></span>
          <div style={st('flex:1;min-width:0')}><div style={st('font-weight:700;font-size:13.5px;word-break:break-word')}>{g.name}</div><div style={st('font-size:11.5px;color:var(--mut)')}>{(g.kind === 'scan' ? 'Ảnh tải lên' : 'Vẽ tay') + ' · ' + dt(g.at)}</div></div>
          <button className="sgbt rd" onClick={() => SGX.sigDel(g.id)}>Xoá</button>
        </div>
      )) : <div style={st('font-size:13px;color:var(--mut);padding:8px 0;border-top:1px solid var(--line)')}>Chưa có chữ ký nào. Vẽ tay hoặc tải ảnh scan chữ ký lên.</div>}
      <div style={st('display:flex;gap:8px;margin:12px 0')}>
        <button className="btn btn-outline" style={st('flex:1;padding:11px')} onClick={() => SGX.draw()}>{I('edit', 15)}Vẽ chữ ký</button>
        <label className="btn btn-outline" style={st('flex:1;padding:11px;cursor:pointer')}>{I('upload', 15)}Tải ảnh<input type="file" accept="image/*" hidden onChange={(e) => SGX.scan(e.target)} /></label>
      </div>
      <button className="btn btn-primary" style={st('padding:12px')} id="sgsx" onClick={() => closeLayer('sgauth')}>Xong</button></div></div>
  );
}

/* ---- chọn vị trí ký trên từng trang ---- */
async function refStamp() { if (!SGP) return; SGP.st = await stamp({ sig: SGP.sig, name: SGP.name || 'Họ tên người ký', when: '(ghi lúc ký)', auth: 'Face ID / vân tay', txt: SGP.txt }); }
async function showPage() {
  const P = SGP; if (!P) return;
  const page = await P.pdf.getPage(P.pg); const body = $('sgbody'); const cv = $('sgcv'); if (!body || !cv || SGP !== P) return;
  const cw = Math.min(body.clientWidth - 16, 900); const v0 = page.getViewport({ scale: 1 }); const sc = cw / v0.width; const dpr = Math.min(window.devicePixelRatio || 1, 2); const v = page.getViewport({ scale: sc * dpr });
  cv.width = v.width; cv.height = v.height; cv.style.width = cw + 'px'; cv.style.height = v0.height * sc + 'px'; P.cw = cw; P.ch = v0.height * sc;
  if (P.task) { try { P.task.cancel(); } catch (e) { /* bỏ qua */ } }
  P.task = page.render({ canvasContext: cv.getContext('2d'), viewport: v });
  try { await P.task.promise; } catch (e) { if (e && e.name === 'RenderingCancelledException') return; klog('sgRender', e); toast('Lỗi hiển thị trang PDF — vẫn có thể chạm để đặt chữ ký'); }
  rerender();
}
/* đặt ô ký vào giữa phần trang đang nhìn thấy, để người ký chỉ việc kéo đến chỗ cần ký */
function putCenter() {
  const P = SGP; const body = $('sgbody'); const wr = $('sgwrap'); if (!P || !body || !wr || !P.st) return;
  const b = body.getBoundingClientRect(); const w = wr.getBoundingClientRect(); const bw = P.w * P.cw; const bh = bw * P.st.ar; const cy = Math.min(Math.max((b.top + b.bottom) / 2, w.top), w.bottom) - w.top;
  P.pl[P.pg] = { x: 0.5 - P.w / 2, y: (cy - bh / 2) / P.ch };
}
async function use(id, place) {
  const P = SGP; const g = sigById(id); if (!P || !g) return;
  P.sigId = id; P.sig = g; P.name = g.name;
  await refStamp(); rerender();
  if (SGP !== P) return;
  if (place && !P.pl[P.pg]) putCenter();
  rerender();
}
async function pick(id) {
  if (pick._busy || SGP) return;
  pick._busy = true;
  try { await pick0(id); } finally { pick._busy = false; }
}
async function pick0(id) {
  const d = D(id); if (!d) return; toast('Đang mở PDF…');
  try { if (!(await kkReady(['pdflib', 'pdfjs']))) throw new Error('lib'); } catch (e) { toast('Chưa tải được thư viện PDF — kiểm tra kết nối mạng'); return; }
  const buf = await getBuf('sgsrc:' + id); if (!buf) { toast('Không còn file gốc trên máy này'); return; }
  let pdf; try { pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise; } catch (e) { toast('Không đọc được file PDF (bị mã hoá hoặc hỏng)'); return; }
  SGP = { d, pdf, pg: 1, n: pdf.numPages, pl: {}, w: 0.3, txt: true, name: '', sig: null, sigId: '', st: null, cw: 0, ch: 0 };
  document.body.style.overflow = 'hidden';
  openLayer('sgovl', () => <PickOverlay />);
}
let sgDrag = null;
function PickOverlay() {
  const P = SGP;
  useEffect(() => {
    (async () => {
      await refStamp(); rerender(); await showPage();
      const f = sgState().sigs[0]; if (f) await use(f.id, true); else toast('Hãy vẽ hoặc tải ảnh chữ ký để bắt đầu');
    })();
  }, []);
  if (!P) return null;
  const b = P.pl[P.pg]; const ks = Object.keys(P.pl).sort((a, c) => a - c);
  const boxSt = { display: 'none' };
  if (b && P.st) {
    /* kẹp ô ký trong trang (boxPos của bản gốc) */
    const w = P.w * P.cw; const h = w * P.st.ar;
    b.x = Math.min(Math.max(b.x, 0), Math.max(0, 1 - P.w)); b.y = Math.min(Math.max(b.y, 0), Math.max(0, 1 - h / P.ch));
    Object.assign(boxSt, { display: 'block', left: b.x * P.cw + 'px', top: b.y * P.ch + 'px', width: w + 'px', height: h + 'px' });
  }
  const sigs = sgState().sigs;
  const wrapClick = (e) => {
    if (e.target.closest('#sgbox')) return;
    if (!P.sig) { toast('Chọn hoặc thêm chữ ký trước'); return; }
    if (!P.st) return;
    const w = $('sgwrap'); const r = w.getBoundingClientRect(); const bw = P.w * P.cw; const bh = bw * P.st.ar;
    P.pl[P.pg] = { x: (e.clientX - r.left - bw / 2) / P.cw, y: (e.clientY - r.top - bh / 2) / P.ch }; rerender();
  };
  const down = (e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); const r = $('sgwrap').getBoundingClientRect(); const bb = SGP.pl[SGP.pg]; sgDrag = { ox: e.clientX - r.left - bb.x * SGP.cw, oy: e.clientY - r.top - bb.y * SGP.ch }; };
  const move = (e) => { if (!sgDrag) return; const r = $('sgwrap').getBoundingClientRect(); const bb = SGP.pl[SGP.pg]; bb.x = (e.clientX - r.left - sgDrag.ox) / SGP.cw; bb.y = (e.clientY - r.top - sgDrag.oy) / SGP.ch; rerender(); };
  const up = () => { sgDrag = null; };
  const cnt = !P.sig ? 'Chọn hoặc thêm chữ ký ở bên dưới, rồi kéo đến chỗ cần ký'
    : ks.length ? 'Đã đặt ' + ks.length + ' vị trí (trang ' + ks.join(', ') + ') · kéo ô chữ ký đến đúng chỗ, chạm vào trang để chuyển vị trí'
      : 'Chạm vào trang hoặc bấm lại chữ ký để đặt ô ký ở trang này';
  return (
    <div id="sgovl">
      <div className="sgh"><button className="back" onClick={() => SGX.close()}>✕</button><b>Chọn vị trí ký</b><span className="sgpg"><button className="back" onClick={() => SGX.pg(-1)}>‹</button><span id="sgpn">{P.pg + ' / ' + P.n}</span><button className="back" onClick={() => SGX.pg(1)}>›</button></span></div>
      <div className="sgbody" id="sgbody"><div className="sgwrap" id="sgwrap" onClick={wrapClick}><canvas id="sgcv" /><div className="sgbox" id="sgbox" style={boxSt} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><img id="sgimg" alt="" src={P.st ? P.st.url : undefined} /></div></div></div>
      <div className="sgf"><div id="sgcnt" style={st('font-size:12.5px;color:var(--mut)')}>{cnt}</div>
        <div className="row" style={st('align-items:stretch')}>
          <div className="sgtray" id="sgtray" style={st('flex:1;min-width:0')}>
            {sigs.length ? sigs.map((g) => <button key={g.id} className={'sgth' + (P.sigId === g.id ? ' on' : '')} onClick={() => SGX.use(g.id)}><span className="sgcb"><img src={g.img} alt="" /></span><span>{g.name}</span></button>)
              : <span style={st('font-size:12.5px;color:var(--mut);align-self:center')}>Chưa có chữ ký — vẽ hoặc tải ảnh scan</span>}
          </div>
          <div style={st('display:flex;flex-direction:column;gap:6px;flex:none')}>
            <button className="sgbt" onClick={() => SGX.draw()}>{I('edit', 14)} Vẽ</button>
            <label className="sgbt" style={st('display:block;text-align:center;cursor:pointer')}>{I('upload', 14)} Ảnh<input type="file" accept="image/*" hidden onChange={(e) => SGX.scan(e.target)} /></label>
          </div>
        </div>
        <div className="row"><span style={st('font-size:13px;font-weight:600')}>Cỡ</span><input type="range" min="12" max="60" value={Math.round(P.w * 100)} style={st('flex:1')} onChange={(e) => SGX.size(e.target.value)} /><button className="sgbt rd" id="sgdl" onClick={() => SGX.delPl()} style={{ visibility: b ? 'visible' : 'hidden' }}>Bỏ ô trang này</button></div>
        <div className="row"><input className="inp" id="sgname" key={P.sigId || 'none'} placeholder="Họ tên người ký" defaultValue={P.name} onBlur={(e) => SGX.nm(e.target.value)} style={st('flex:1;min-width:0')} /><label style={st('display:flex;gap:6px;align-items:center;font-size:12.5px;white-space:nowrap')}><input type="checkbox" checked={!!P.txt} onChange={(e) => SGX.txt(e.target.checked)} />Kèm giờ ký</label></div>
        <button className="btn btn-primary" id="sgok" style={st('padding:13px')} disabled={!ks.length} onClick={() => SGX.sign()}>{I('check', 16)}Xác nhận &amp; ký</button></div>
    </div>
  );
}
function closePick() {
  closeLayer('sgovl'); document.body.style.overflow = '';
  if (SGP) { try { SGP.pdf.destroy(); } catch (e) { /* bỏ qua */ } }
  SGP = null;
}

/* ---- ghi chữ ký vào PDF, lưu BẢN ĐÃ KÝ thành file riêng (bản gốc giữ nguyên) ---- */
async function doSign(auth) {
  const P = SGP; const d = P.d; const s = sgState(); if (P.busy) return; P.busy = true; toast('Đang ký…');
  try {
    const PDFLib = window.PDFLib;
    const buf = await getBuf('sgsrc:' + d.id); if (!buf) { toast('Không còn file gốc trên máy này'); return; }
    const srcHash = await sha(buf); const pdf = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); const when = X.nowLabel();
    const stp = await stamp({ sig: P.sig, name: P.name, when, auth, txt: P.txt }); const img = await pdf.embedPng(stp.url); const pls = [];
    for (const k in P.pl) {
      const pg = pdf.getPage(+k - 1);
      if (pg.getRotation().angle) { toast('Trang ' + k + ' của file này bị xoay nên chưa hỗ trợ ký — hãy bỏ ô ở trang đó'); return; }
      const z = pg.getSize(); const w = P.w * z.width; const h = w * stp.ar; const b = P.pl[k];
      pg.drawImage(img, { x: b.x * z.width, y: z.height - b.y * z.height - h, width: w, height: h }); pls.push({ p: +k, x: b.x, y: b.y, w: P.w });
    }
    pdf.setKeywords(['Đã ký điện tử', 'Người ký: ' + P.name, when, 'SHA-256 bản gốc: ' + srcHash.slice(0, 16)]);
    const out = await pdf.save(); const ob = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength); const oh = await sha(ob);
    if (!(await putBuf('sgout:' + d.id, ob))) { toast('Không lưu được bản đã ký' + (putBuf.err ? ': ' + putBuf.err : ' — chưa ghi được lên máy chủ')); return; }
    Object.assign(d, { status: 'signed', signedAt: Date.now(), signer: P.name, auth, srcHash, outHash: oh, outSize: ob.byteLength, pl: pls, folder: (typeof d.folder === 'number' && s.folders[d.folder]) ? d.folder : (SG.fo >= 0 ? SG.fo : 0) });
    store.save(); closePick(); SG.tab = 'done'; SG.fo = d.folder; rerender(); toast('Đã ký xong, lưu trong thư mục “' + s.folders[d.folder] + '”');
  } catch (e) { klog('sgSign', e); toast('Lỗi khi ký PDF: ' + ((e && e.message) || '')); } finally { P.busy = false; }
}
async function fileOut(id, kind, dl) {
  if (!dl) {
    const a = document.createElement('a'); a.href = '/api/blobs/' + BS + '/' + encodeURIComponent((kind === 'out' ? 'sgout:' : 'sgsrc:') + id) + '/raw';
    a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); return;
  }
  const d = D(id); const buf = await getBuf((kind === 'out' ? 'sgout:' : 'sgsrc:') + id);
  if (!d || !buf) { toast('Không còn file này trên máy (có thể đang mở ở máy khác)'); return; }
  const u = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' })); const a = document.createElement('a'); a.href = u;
  if (dl) a.download = d.name.replace(/\.pdf$/i, '') + (kind === 'out' ? '_da-ky' : '') + '.pdf'; else a.target = '_blank';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => { URL.revokeObjectURL(u); }, 60000);
}

export const renderSign = () => rerender();
export const SGX = {
  close: closePick, pw() { openLayer('sgauth', () => <SgSec />); },
  pg(n) { const P = SGP; if (!P) return; const q = Math.min(P.n, Math.max(1, P.pg + n)); if (q !== P.pg) { P.pg = q; rerender(); showPage(); } },
  size(v) { SGP.w = v / 100; rerender(); },
  delPl() { delete SGP.pl[SGP.pg]; rerender(); },
  nm(v) { const P = SGP; if (!P) return; P.name = v.trim(); refStamp().then(() => rerender()); },
  txt(c) { SGP.txt = !!c; refStamp().then(() => rerender()); },
  use(id) { use(id, true); },
  draw() { pad(afterAdd); },
  scan(inp) { const f = inp.files && inp.files[0]; inp.value = ''; scan(f, afterAdd); },
  sigDel(id) { const g = sigById(id); if (!g || !confirm('Xoá chữ ký của “' + g.name + '” khỏi máy này?')) return; const s = sgState(); s.sigs = s.sigs.filter((x) => x.id !== id); store.save(); rerender(); toast('Đã xoá chữ ký'); },
  sign() {
    const P = SGP; if (!P || P.busy) return; const ni = $('sgname'); if (ni) P.name = ni.value.trim();
    if (!P.sig) { toast('Chọn hoặc thêm chữ ký trước'); return; } if (!P.name) { toast('Nhập họ tên người ký'); return; }
    if (!Object.keys(P.pl).length) { toast('Kéo chữ ký đến chỗ cần ký trước'); return; } authOpen(doSign);
  },
  async add(inp) {
    const fs = Array.prototype.slice.call(inp.files || []); const s = sgState(); let n = 0; const bufs = [];
    try {
      for (let i = 0; i < fs.length; i++) { try { bufs.push(await rdFile(fs[i])); } catch (e) { klog('sgRead', e); bufs.push(null); } }
      inp.value = '';
      for (let j = 0; j < fs.length; j++) {
        const f = fs[j]; const buf = bufs[j];
        if (!buf) { toast('Không đọc được “' + f.name + '” — thử chọn lại file từ mục Tệp (Files)'); continue; }
        if (String.fromCharCode.apply(null, new Uint8Array(buf.slice(0, 5))).indexOf('%PDF') < 0) { toast('“' + f.name + '” không đúng định dạng PDF'); continue; }
        if (buf.byteLength > 40 * 1048576) { toast('“' + f.name + '” lớn hơn 40 MB'); continue; }
        const id = uid(); if (!(await putBuf('sgsrc:' + id, buf))) { toast('Không lưu được file' + (putBuf.err ? ': ' + putBuf.err : ' — chưa ghi được lên máy chủ')); break; }
        s.docs.unshift({ id, name: f.name || 'tai-lieu.pdf', size: buf.byteLength, addedAt: Date.now(), status: 'todo' }); n++;
      }
      if (n) { store.save(); SG.tab = 'todo'; toast('Đã thêm ' + n + ' file PDF'); }
    } catch (e) { klog('sgAdd', e); toast('Không thêm được file: ' + ((e && e.message) || e)); }
    renderSign();
  },
  tab(t) { SG.tab = t; renderSign(); },
  fo(i) { SG.fo = i; renderSign(); },
  newFo() { X.renameModal('Tên thư mục PDF đã ký', ' ', (v) => { const s = sgState(); if (s.folders.indexOf(v) < 0) s.folders.push(v); store.save(); SG.fo = s.folders.indexOf(v); SG.tab = 'done'; renderSign(); }); },
  pick,
  view(id, k) { fileOut(id, k, false); }, dl(id) { fileOut(id, 'out', true); },
  mv(id, i) { const d = D(id); if (d) { d.folder = +i; store.save(); SG.fo = +i; renderSign(); toast('Đã chuyển vào “' + sgState().folders[+i] + '”'); } },
  async check(id) {
    const d = D(id); const buf = await getBuf('sgout:' + id); if (!d || !buf) { toast('Không còn file đã ký trên máy này'); return; }
    const h = await sha(buf); toast(h === d.outHash ? 'Toàn vẹn: file đã ký giống hệt lúc ký' : 'CẢNH BÁO: file đã ký KHÔNG khớp mã kiểm tra lúc ký');
  },
  async del(id) {
    const d = D(id); if (!d || !confirm('Xoá “' + d.name + '” (cả bản gốc và bản đã ký) khỏi máy này?')) return;
    await idbDel('sgsrc:' + id); await idbDel('sgout:' + id); sgState().docs = sgState().docs.filter((x) => x.id !== id); store.save(); renderSign();
  },
};

/* ---- màn hình Ký số PDF ---- */
function Btn({ f, c, children }) { return <button className={'sgbt ' + (c || '')} onClick={f}>{children}</button>; }
function Card({ d }) {
  const s = sgState(); const g = d.status === 'signed';
  return (
    <div className="sgc">
      <div style={st('display:flex;gap:10px;align-items:flex-start')}>
        <span style={{ flex: 'none', display: 'flex', color: g ? 'var(--green)' : 'var(--teal)' }}>{I(g ? 'check' : 'doc', 22)}</span>
        <div style={st('flex:1;min-width:0')}>
          <div style={st('font-weight:700;word-break:break-word')}>{d.name}</div>
          <div style={st('font-size:12px;color:var(--mut);margin-top:2px')}>{kb(g ? d.outSize : d.size)} · {g ? 'Ký ' + dt(d.signedAt) + ' · ' + d.signer : 'Thêm ' + dt(d.addedAt)}</div>
          {g ? <div style={st('font-size:12px;color:var(--green);margin-top:2px')}>🔒 {d.auth} · {d.pl.length} vị trí ký</div> : null}
        </div>
      </div>
      <div style={st('display:flex;gap:8px;flex-wrap:wrap;margin-top:10px')}>
        {g ? <>
          <Btn c="pr" f={() => SGX.dl(d.id)}>Tải về</Btn><Btn f={() => SGX.view(d.id, 'out')}>Xem</Btn><Btn f={() => SGX.check(d.id)}>Kiểm tra</Btn><Btn f={() => SGX.pick(d.id)}>Ký lại từ bản gốc</Btn><Btn c="rd" f={() => SGX.del(d.id)}>Xoá</Btn>
        </> : <>
          <Btn c="pr" f={() => SGX.pick(d.id)}>{I('edit', 14)} Chọn vị trí &amp; ký</Btn><Btn f={() => SGX.view(d.id, 'src')}>Xem</Btn><Btn c="rd" f={() => SGX.del(d.id)}>Xoá</Btn>
        </>}
      </div>
      {g ? <select className="inp" style={st('margin-top:10px')} value={s.folders[d.folder] !== undefined ? d.folder : 0} onChange={(e) => SGX.mv(d.id, e.target.value)}>{s.folders.map((f, i) => <option key={i} value={i}>Thư mục: {f}</option>)}</select> : null}
    </div>
  );
}
export function SignView() {
  const s = sgState(); const todo = s.docs.filter((d) => d.status !== 'signed'); const done = s.docs.filter((d) => d.status === 'signed');
  const l = done.filter((d) => SG.fo < 0 || d.folder === SG.fo);
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('home')}>‹</button><div className="ttl">Ký số PDF</div><button className="pill" onClick={() => SGX.pw()}>Chữ ký &amp; bảo mật</button></div><div style={st('height:10px')} /></div>
      <div className="wrap" style={st('padding-top:14px;padding-bottom:40px')}>
        <label className="btn btn-primary" style={st('margin-bottom:12px;cursor:pointer')}>{I('upload', 18)}Chọn file PDF cần ký<input type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => SGX.add(e.target)} /></label>
        <div className="sgtabs"><button className={'sgtab' + (SG.tab === 'todo' ? ' on' : '')} onClick={() => SGX.tab('todo')}>Cần ký ({todo.length})</button><button className={'sgtab' + (SG.tab === 'done' ? ' on' : '')} onClick={() => SGX.tab('done')}>Đã ký ({done.length})</button></div>
        {SG.tab === 'todo'
          ? (todo.length ? todo.map((d) => <Card key={d.id} d={d} />) : <div className="sgc" style={st('text-align:center;color:var(--mut);font-size:13px')}>Chưa có file nào chờ ký. Bấm “Chọn file PDF cần ký” ở trên.</div>)
          : <>
            <div className="sgchips"><button className={'sgchip' + (SG.fo < 0 ? ' on' : '')} onClick={() => SGX.fo(-1)}>Tất cả ({done.length})</button>
              {s.folders.map((f, i) => <button key={i} className={'sgchip' + (SG.fo === i ? ' on' : '')} onClick={() => SGX.fo(i)}>{f} ({done.filter((d) => d.folder === i).length})</button>)}
              <button className="sgchip" onClick={() => SGX.newFo()}>+ Thư mục</button></div>
            {l.length ? l.map((d) => <Card key={d.id} d={d} />) : <div className="sgc" style={st('text-align:center;color:var(--mut);font-size:13px')}>Thư mục này chưa có bản đã ký.</div>}
            <div style={st('font-size:12px;color:var(--mut)')}>File PDF được lưu trên máy chủ cùng dữ liệu. Hãy bấm “Tải về” để giữ bản đã ký.</div>
          </>}
      </div>
    </>
  );
}
