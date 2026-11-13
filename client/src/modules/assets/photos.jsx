/* Ảnh kiểm kê TS & CCDC: chụp nét + tự lưu ảnh tem khi quét không khớp.
   App gốc lưu IndexedDB 'kk_photos'; bản mới dùng blobs('kk_photos', id) (giá trị là chuỗi dataURL), giữ lớp cache trong bộ nhớ. (dòng gốc 5457–5729) */
import { useEffect, useRef, useState } from 'react';
import { S, X, blobs, toast, klog, saveSoon, rerender, openLayer, closeLayer, I, st, esc } from '../../core';
import { asRid, asLog, asCurP, AP } from './model.js';

const STORE = 'kk_photos';
export const PH = {
  db: null, cache: {}, mem: {}, busy: {},
  open() { return Promise.resolve(null); },
  put(id, d) {
    PH.cache[id] = d;
    return blobs.put(STORE, id, d).then(() => true).catch((e) => {
      klog('PH.put', e);
      PH.mem[id] = d;
      if (!PH.warned2) { PH.warned2 = 1; toast('Chưa gửi được ảnh lên máy chủ (mạng lỗi hoặc máy chủ bận). Ảnh tạm giữ trong phiên này — đừng đóng app, hãy kiểm tra mạng rồi thử lại, hoặc xuất Excel ngay.'); }
      return false;
    });
  },
  get(id) {
    if (PH.cache[id]) return Promise.resolve(PH.cache[id]);
    if (PH.mem[id]) return Promise.resolve(PH.mem[id]);
    return blobs.get(STORE, id).then((v) => { if (v) PH.cache[id] = v; return v || null; }).catch(() => null);
  },
  del(id) {
    delete PH.cache[id]; delete PH.mem[id];
    return blobs.del(STORE, id).catch((e) => { klog('PH.del', e); });
  },
  preload(p) {
    const a = []; p.items.forEach((it) => { (it.imgs || []).forEach((m) => { a.push(PH.get(m.id)); }); });
    return Promise.all(a);
  },
};
export function phAdd(it, k, d, w, h) {
  const id = 'ph_' + Date.now().toString(36) + asRid();
  const put = PH.put(id, d);
  it.imgs = (it.imgs || []).concat([{ id, k, at: Date.now(), w: w || 0, h: h || 0 }]);
  asLog(asCurP(), 'Thêm ảnh ' + (k === 'tem' ? 'tem' : 'tài sản'), it);
  /* chỉ lưu/đồng bộ danh sách sau khi ảnh đã được ghi (hoặc xếp hàng gửi) để máy khác không thấy it.imgs trỏ tới ảnh chưa có */
  Promise.resolve(put).then(() => { saveSoon(); }, () => { saveSoon(); });
  return id;
}
export function phDelItem(it) { (it.imgs || []).forEach((m) => { PH.del(m.id); }); it.imgs = []; }

/* phFill(root) của app gốc gán src cho <img data-ph>; bản React: thẻ <PhImg id=...> */
export function PhImg({ id, ...rest }) {
  const [src, setSrc] = useState(PH.cache[id] || null);
  useEffect(() => {
    let ok = true, tm = null; const waits = [1000, 3000, 8000];
    const load = (n) => { PH.get(id).then((d) => { if (!ok) return; if (d) setSrc(d); else if (n < waits.length) tm = setTimeout(() => load(n + 1), waits[n]); }); };
    load(0);
    return () => { ok = false; if (tm) clearTimeout(tm); };
  }, [id]);
  return <img data-ph={id} alt="" src={src || undefined} {...rest} />;
}
export function phFill() { /* không còn cần: PhImg tự nạp ảnh */ }

/* Độ nét = phương sai Laplacian; ảnh càng nét càng lớn */
export function phSharp(cv) {
  const k = Math.min(1, 320 / Math.max(cv.width, cv.height)); const w = Math.max(8, Math.round(cv.width * k)); const h = Math.max(8, Math.round(cv.height * k));
  const c = PH._sc || (PH._sc = document.createElement('canvas')); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(cv, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data; const L = new Float32Array(w * h); let i; let x; let y; let s = 0; let s2 = 0; let n = 0; let v;
  for (i = 0; i < w * h; i++) L[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
  for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) { i = y * w + x; v = 4 * L[i] - L[i - 1] - L[i + 1] - L[i - w] - L[i + w]; s += v; s2 += v * v; n++; }
  return s2 / n - (s / n) * (s / n);
}
export function phSharpen(cv, a) {
  try {
    const g = cv.getContext('2d'); const w = cv.width; const h = cv.height; const im = g.getImageData(0, 0, w, h); const s = im.data; const o = new Uint8ClampedArray(s); let x; let y; let i; let c; let v;
    for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) { i = (y * w + x) * 4; for (c = 0; c < 3; c++) { v = s[i + c]; o[i + c] = v + a * (4 * v - s[i + c - 4] - s[i + c + 4] - s[i + c - w * 4] - s[i + c + w * 4]); } }
    im.data.set(o); g.putImageData(im, 0, 0);
  } catch (e) { klog("var g=cv.getContext('2d'),w=cv.width,h=cv.height", e); }
}
export function phFrame(v, maxSide) {
  if (!v || !v.videoWidth) return null;
  const k = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight)); const c = document.createElement('canvas');
  c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
  try { c.getContext('2d', { willReadFrequently: true }).drawImage(v, 0, 0, c.width, c.height); } catch (e) { return null; }
  return c;
}
/* Chụp liên tiếp n khung, giữ khung nét nhất */
export function phBurst(v, n, gap, maxSide) {
  return new Promise((res) => {
    let best = null; let bs = -1; let i = 0;
    (function step() {
      const c = phFrame(v, maxSide);
      if (c) { const s = phSharp(c); if (s > bs) { bs = s; best = c; } }
      if (++i < n) setTimeout(step, gap); else res({ cv: best, score: bs });
    }());
  });
}
/* Ảnh tĩnh độ phân giải đầy đủ (có tự lấy nét) nếu trình duyệt hỗ trợ ImageCapture */
export function phStill(track) {
  if (!track || typeof ImageCapture === 'undefined') return Promise.resolve(null);
  return new Promise((res) => {
    let done = false; const fin = (x) => { if (!done) { done = true; res(x); } };
    setTimeout(() => { fin(null); }, 5000);
    try {
      new ImageCapture(track).takePhoto().then(X.scLoadImage).then((im) => {
        const c = document.createElement('canvas'); c.width = im.w; c.height = im.h; c.getContext('2d').drawImage(im.el, 0, 0); fin(c);
      }).catch(() => { fin(null); });
    } catch (e) { fin(null); }
  });
}
export function phShoot(v, track, maxSide) {
  const out = (cv, sharp) => {
    const k = Math.min(1, maxSide / Math.max(cv.width, cv.height));
    if (k < 1) { const c = document.createElement('canvas'); c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, c.width, c.height); cv = c; }
    if (sharp) phSharpen(cv, 0.5);
    return { d: cv.toDataURL('image/jpeg', 0.92), w: cv.width, h: cv.height };
  };
  return phStill(track).then((cv) => {
    if (cv) return out(cv, false);
    return phBurst(v, 5, 110, 2560).then((r) => (r.cv ? out(r.cv, true) : null));
  });
}
export function phNote() {
  const e = document.getElementById('scphn'); if (!e || !S.SC) return;
  e.textContent = '📷 Đã lưu ảnh tem vào file kiểm kê'; e.style.color = '#4ade80';
}
/* Quét không khớp → tự chụp ảnh tem (khung nét nhất) gắn vào tài sản "Cần dò tìm" */
export function phTemFor(it) {
  const SC = S.SC;
  if (!SC || SC.kind !== 'asset' || PH.busy[it.id]) return;
  if ((it.imgs || []).some((m) => m.k === 'tem')) return;
  PH.busy[it.id] = 1;
  const fin = (d, w, h) => { delete PH.busy[it.id]; if (d) { phAdd(it, 'tem', d, w, h); phNote(); rerender(); } };
  if (SC.snap) { const s = SC.snap; SC.snap = null; fin(s.d, s.w, s.h); return; }
  phBurst(document.getElementById('scvid'), 3, 90, 1600).then((r) => {
    if (!r.cv) { fin(null); return; }
    phSharpen(r.cv, 0.5); fin(r.cv.toDataURL('image/jpeg', 0.88), r.cv.width, r.cv.height);
  }).catch(() => { fin(null); });
}

/* ---- Màn hình chụp ảnh tài sản (độ phân giải cao, đo độ nét trực tiếp) ---- */
export let PC = null;
export const PH_BTN = 'border:1px solid #33333d;background:#23232c;color:#e5e7eb;border-radius:12px;padding:12px 16px;font:inherit;font-size:14px;font-weight:700';
export function phCamClose() {
  if (!PC) return;
  clearInterval(PC.t);
  if (PC.stream) PC.stream.getTracks().forEach((t) => { t.stop(); });
  PC = null;
  closeLayer('phcam');
}
export function phCamBar(mode) {
  if (mode === 'live') {
    return (
      <>
        <label style={st(PH_BTN + ';cursor:pointer;width:96px;text-align:center')}>Camera máy<input type="file" accept="image/*" capture="environment" style={st('display:none')} onChange={(e) => phCamFile(e.target)} /></label>
        <button id="phshut" onClick={() => phCamShoot()} style={st('width:72px;height:72px;border-radius:50%;border:4px solid #fff;background:#e5e7eb;flex:none')} />
        <span style={st('width:96px')} />
      </>
    );
  }
  return (
    <>
      <button onClick={() => phCamRetake()} style={st(PH_BTN + ';flex:1')}>Chụp lại</button>
      <button onClick={() => phCamUse()} style={st(PH_BTN + ';flex:1;background:#1e3a6b;border-color:#1e3a6b;color:#fff')}>Dùng ảnh này</button>
    </>
  );
}
function PhCamView({ title }) {
  const vref = useRef(null);
  const [q, setQ] = useState({ t: 'Đang mở camera…', c: '#9ca3af' });
  const pc = PC;
  useEffect(() => {
    if (!pc) return undefined;
    pc.setQ = (t, c) => setQ({ t, c: c || '#9ca3af' });
    if (pc.started) return undefined;
    pc.started = true;
    const qq = pc.setQ;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { qq('Không mở được camera trực tiếp — dùng nút “Camera máy”', '#fbbf24'); return undefined; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 } }, audio: false }).then((stream) => {
      if (PC !== pc) { stream.getTracks().forEach((t) => { t.stop(); }); return; }
      pc.stream = stream; pc.track = stream.getVideoTracks()[0];
      const v = vref.current; v.muted = true; v.setAttribute('playsinline', ''); v.srcObject = stream;
      const pl = v.play(); if (pl && pl.catch) pl.catch(() => {});
      try { pc.track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {}); } catch (e) { klog('PC.track.applyConstraints({advanced:[{focusMode:', e); }
      let caps = {}; try { caps = pc.track.getCapabilities ? pc.track.getCapabilities() : {}; } catch (e) { klog('caps=PC.track.getCapabilities?PC.track.getCapabi', e); }
      pc.caps = caps; rerender();
      pc.t = setInterval(() => {
        if (PC !== pc || pc.busy || pc.data) return;
        const c = phFrame(v, 360); if (!c) return;
        const s = phSharp(c); pc.max = Math.max(pc.max * 0.97, s); const r = s / pc.max;
        if (r >= 0.65) qq('Độ nét: Nét ✓ — có thể chụp', '#4ade80');
        else if (r >= 0.35) qq('Độ nét: hơi mờ — giữ chắc tay, chờ lấy nét', '#fbbf24');
        else qq('Độ nét: mờ — lùi ra xa hơn, chạm/giữ yên để lấy nét', '#f87171');
      }, 450);
    }).catch((e) => { qq('Không mở được camera (' + ((e && e.name) || 'lỗi') + ') — dùng nút “Camera máy”', '#fbbf24'); });
    return undefined;
  }, [pc]);
  if (!pc) return null;
  const caps = pc.caps || {};
  return (
    <div id="phcam" style={st('position:fixed;inset:0;z-index:170;background:#000;display:flex;flex-direction:column;color:#e5e7eb')}>
      <div style={st('display:flex;align-items:center;justify-content:space-between;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px')}><b>{title}</b><button onClick={() => phCamClose()} style={st(PH_BTN + ';width:36px;height:36px;padding:0;border-radius:999px')}>✕</button></div>
      <div style={st('position:relative;flex:1;min-height:0;background:#000')}>
        <video id="phv" ref={vref} playsInline muted autoPlay style={st('width:100%;height:100%;object-fit:contain')} />
        <img id="phprev" alt="" src={pc.data ? pc.data.d : undefined} style={st('position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;display:' + (pc.data ? 'block' : 'none'))} />
        <div id="phq" style={st('position:absolute;left:10px;top:10px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(18,18,26,.8)')}><span style={{ color: pc.data ? '#9ca3af' : q.c }}>{pc.data ? 'Kiểm tra ảnh đã nét chưa' : (pc.busy ? 'Đang chụp — giữ yên máy…' : q.t)}</span></div>
        <div id="phtools" style={st('position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:8px;align-items:flex-end')}>
          {caps.torch ? <button onClick={() => phCamTorch()} style={st('width:40px;height:40px;border-radius:50%;border:1px solid #33333d;background:rgba(18,18,26,.75);font-size:18px')}>🔦</button> : null}
          {caps.zoom && caps.zoom.max > caps.zoom.min ? <input type="range" min={caps.zoom.min} max={Math.min(caps.zoom.max, 5)} step={caps.zoom.step || 0.1} defaultValue={caps.zoom.min} onInput={(e) => phCamZoom(e.target.value)} style={st('width:110px')} /> : null}
        </div>
      </div>
      <div id="phbar" style={st('display:flex;gap:10px;align-items:center;justify-content:center;padding:14px 16px calc(env(safe-area-inset-bottom,0px) + 16px)')}>{phCamBar(pc.data ? 'review' : 'live')}</div>
    </div>
  );
}
export function phCam(title, cb) {
  if (PC) phCamClose();
  PC = { cb, max: 1, data: null, busy: false };
  openLayer('phcam', () => <PhCamView title={title} />);
}
export function phCamTorch() { if (!PC || !PC.track) return; PC.torch = !PC.torch; try { PC.track.applyConstraints({ advanced: [{ torch: PC.torch }] }).catch(() => {}); } catch (e) { klog('PC.track.applyConstraints({advanced:[{torch:PC.t', e); } }
export function phCamZoom(z) { if (!PC || !PC.track) return; try { PC.track.applyConstraints({ advanced: [{ zoom: parseFloat(z) }] }).catch(() => {}); } catch (e) { klog('PC.track.applyConstraints({advanced:[{zoom:parse', e); } }
export function phCamReview(r) { PC.data = r; rerender(); }
export function phCamShoot() {
  if (!PC || PC.busy) return;
  const v = document.getElementById('phv'); if (!v || !v.videoWidth) { toast('Camera chưa sẵn sàng'); return; }
  PC.busy = true; rerender();
  phShoot(v, PC.track, 2000).then((r) => { if (!PC) return; PC.busy = false; if (!r) { toast('Không chụp được ảnh'); rerender(); return; } phCamReview(r); });
}
export function phCamFile(inp) {
  const f = inp.files && inp.files[0]; inp.value = ''; if (!f || !PC) return;
  X.compressImg(f, 2000, 0.92, (d) => {
    const im = new Image(); im.onload = () => { if (PC) phCamReview({ d, w: im.naturalWidth, h: im.naturalHeight }); }; im.src = d;
  });
}
export function phCamRetake() { if (!PC) return; PC.data = null; rerender(); }
export function phCamUse() { if (!PC || !PC.data) return; const r = PC.data; const cb = PC.cb; phCamClose(); cb(r.d, r.w, r.h); }
export function phView(id) {
  openLayer('phview', () => (
    <div onClick={() => closeLayer('phview')} style={st('position:fixed;inset:0;z-index:180;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center')}>
      <PhImg id={id} style={st('max-width:100%;max-height:100%;object-fit:contain')} />
      <div style={st('position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:16px;color:#fff;font-size:22px')}>✕</div>
    </div>
  ));
}
export function asPhotoSec(it) {
  const imgs = it.imgs || [];
  const bs = 'flex:1;width:auto;padding:11px;display:flex;align-items:center;justify-content:center;gap:6px';
  return (
    <>
      <label className="lbl" style={st('margin-top:12px')}>Ảnh ({imgs.length})</label>
      <div style={st('display:flex;gap:10px;flex-wrap:wrap')}>
        {imgs.map((m) => (
          <div key={m.id} style={st('position:relative;width:78px;height:78px')}>
            <PhImg id={m.id} onClick={() => phView(m.id)} style={st('width:78px;height:78px;object-fit:cover;border-radius:10px;border:1px solid var(--line);background:#222')} />
            <span style={st('position:absolute;left:4px;bottom:4px;font-size:9px;font-weight:800;background:rgba(0,0,0,.7);color:#fff;border-radius:6px;padding:1px 5px')}>{m.k === 'tem' ? 'TEM' : 'TÀI SẢN'}</span>
            <button onClick={() => X.ASX.phDel(m.id)} style={st('position:absolute;top:-7px;right:-7px;width:22px;height:22px;border-radius:50%;border:none;background:#111;color:#fff;font-size:11px')}>✕</button>
          </div>
        ))}
      </div>
      <div style={st('display:flex;gap:8px;margin-top:10px')}>
        <button className="btn btn-outline" style={st(bs)} onClick={() => X.ASX.phShoot('ts')}>{I('camera', 16)}Chụp tài sản (nét)</button>
        <button className="btn btn-outline" style={st(bs)} onClick={() => X.ASX.phShoot('tem')}>{I('camera', 16)}Chụp tem</button>
      </div>
    </>
  );
}
export function asPhotoRefresh() { if (!AP.editing) return; rerender(); }
export function asShootRow(it) {
  const n = (it.imgs || []).length; const SC = S.SC;
  const txt = SC && SC.shootTxt && SC.shootId === it.id ? SC.shootTxt : null;
  return (
    <button id="scshoot" className="btn" style={st('margin-top:8px;padding:10px;background:#14203a;color:#a9bde0;border:1px solid #2c4f8f;display:flex;align-items:center;justify-content:center;gap:6px')} onClick={() => X.ASX.scShoot(it.id, 'ts')}>
      {txt ? (txt.icon ? <>{I('camera', 16)}{txt.t}</> : txt.t) : <>{I('camera', 16)}{n ? 'Đã có ' + n + ' ảnh · chụp thêm' : 'Chụp ảnh tài sản (nét)'}</>}
    </button>
  );
}
/* ---- Thêm ảnh vào sheet riêng của file Excel kiểm kê ---- */
export function addPhotoSheet(wb, p) {
  const rows = [];
  p.items.forEach((it) => { (it.imgs || []).forEach((m) => { if (PH.cache[m.id] || PH.mem[m.id]) rows.push({ it, m }); }); });
  if (!rows.length) return;
  rows.sort((a, b) => (a.m.k === b.m.k ? 0 : a.m.k === 'tem' ? -1 : 1) || a.m.at - b.m.at);
  const ws = wb.addWorksheet('ẢNH KIỂM KÊ'); const F = { name: 'Times New Roman', size: 11 };
  ['STT', 'Mã / nội dung quét', 'Tên tài sản', 'Phòng sử dụng', 'Loại ảnh', 'Thời gian chụp', 'Ảnh'].forEach((t, j) => {
    const c = ws.getCell(1, j + 1); c.value = t; c.font = Object.assign({ bold: true }, F); c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }; c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  [6, 26, 34, 22, 22, 18, 48].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  rows.forEach((r, k) => {
    const it = r.it; const m = r.m; const row = k + 2; const vals = [k + 1, it.code || '', it.name || '', it.room || '', m.k === 'tem' ? 'Tem quét không khớp' : 'Ảnh tài sản', new Date(m.at).toLocaleString('vi-VN')];
    vals.forEach((v, j) => { const c = ws.getCell(row, j + 1); c.value = v; c.font = F; c.alignment = { vertical: 'middle', wrapText: true, horizontal: j === 2 || j === 1 ? 'left' : 'center' }; });
    const d = PH.cache[m.id] || PH.mem[m.id]; const b64 = d && d.split(',')[1];
    if (b64) {
      try {
        const w = m.w || 1600; const h = m.h || 1200; const s = Math.min(330 / w, 225 / h); const id = wb.addImage({ base64: b64, extension: 'jpeg' });
        ws.addImage(id, { tl: { col: 6.05, row: row - 1 + 0.05 }, ext: { width: Math.round(w * s), height: Math.round(h * s) } });
      } catch (e) { ws.getCell(row, 7).value = '(không nhúng được ảnh)'; }
    }
    ws.getRow(row).height = 176;
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}
