/* Báo lỗi nhập liệu & labo — dữ liệu + hành động (dòng gốc 11065–11272).
   Khoá localStorage cũ → db.err:  kk_err_v1→items, kk_err_misa→misa, kk_err_map→map, kk_err_ex→ex,
   kk_err_labo→labos. Ảnh: blobs 'kk_err_img' (giá trị dataURL). */
import { db, S, A, store, blobs, rerender, toast, esc, kkNeed, klog, openLayer, closeLayer } from '../../core';

export const LNL = ['Sai mã', 'Sai số lượng', 'Sai đơn giá', 'Sai số chứng từ', 'Sai số hóa đơn', 'Khác'];
export const LLB = ['Khách hàng không được thực hiện đúng dịch vụ', 'Đã thực hiện dịch vụ nhưng chưa lên điều trị', 'Chưa có thông tin điều trị', 'Thiếu hoặc sai mã PID', 'Sai đơn giá / số lượng', 'Trùng dòng công nợ', 'Khác'];
export const NOTR = LLB[2];
export const STS = ['Mới', 'Đã gửi cơ sở', 'Đã xử lý'];
export const LK = [['ma', 'Mã hàng'], ['ten', 'Tên hàng'], ['kho', 'Kho'], ['tkk', 'TK Kho'], ['tkn', 'TK Công nợ'], ['dvt', 'ĐVT'], ['sl', 'Số lượng'], ['gia', 'Đơn giá'], ['tien', 'Thành tiền'], ['thue', '% Thuế GTGT']];
export const NT = [['Thiếu thông tin điều trị', 'Chưa có thông tin điều trị, đề nghị bổ sung hồ sơ điều trị'], ['Sai số răng', 'Sai số răng, đề nghị labo kiểm tra lại'], ['Sai đơn giá / SL', 'Sai đơn giá hoặc số lượng, đề nghị điều chỉnh'], ['Trùng dòng', 'Trùng dòng công nợ, đề nghị loại bỏ'], ['Chưa thực hiện DV', 'Khách chưa được thực hiện dịch vụ, đề nghị kiểm tra lại'], ['Sai PID', 'Thiếu hoặc sai mã PID, đề nghị bổ sung']];
export const TOUCH = /iPhone|iPad|iPod|Android/.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
const IMG = 'kk_err_img';

/* db.err luôn lấy lại từ db (tầng lưu trữ có thể thay nội dung tại chỗ) */
export function E() {
  let e = db.err;
  if (!e || typeof e !== 'object' || Array.isArray(e)) e = db.err = {};
  if (!Array.isArray(e.items)) e.items = [];
  if (!Array.isArray(e.misa)) e.misa = [];
  if (!e.map || typeof e.map !== 'object' || Array.isArray(e.map)) e.map = {};
  if (!e.ex || typeof e.ex !== 'object' || Array.isArray(e.ex)) e.ex = {};
  if (!Array.isArray(e.labos)) e.labos = [];
  return e;
}
const sv = () => { store.save(); };

export function uid() { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
export function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
export function kyOf(s) { return (s || ymd(new Date())).slice(0, 7); }
export const $ = (i) => document.getElementById(i);
export function val(i) { const e = $(i); return e ? e.value.trim() : ''; }
export function who() { return (db && db.profile && db.profile.ten) || ''; }
export function nz(s) { return String(s || '').replace(/\s+/g, ''); }
export function nq(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }

export const ER = {
  v: 'list', f: 'all', st: '', ky: kyOf(), q: '', cs: '', n: 30, form: null, slot: 'bad', cache: {}, _del: [], clean: false, nh: false, _c: [], _fk: 0,
  get items() { return E().items; }, set items(v) { E().items = v; },
  get misa() { return E().misa; }, set misa(v) { E().misa = v; },
  get map() { return E().map; }, set map(v) { E().map = v; },
  get ex() { return E().ex; }, set ex(v) { E().ex = v; },
  get labos() { return E().labos; }, set labos(v) { E().labos = v; },
};
if (typeof window !== 'undefined') window.ER = ER;

export const renderErr = () => rerender();
const rEr = () => rerender();

export function qm(s) { const h = nq(s), hz = h.replace(/\s+/g, ''); return nq(ER.q).split(/\s+/).filter(Boolean).every((t) => h.indexOf(t) >= 0 || hz.indexOf(t) >= 0); }
export function hay(x) { return [x.sct, x.ncc, x.cs, x.labo, x.kh, x.pid, x.note, x.loai1, (x.loai || []).join(' '), (x.lines || []).map((l) => l.ma + ' ' + l.ten).join(' ')].join(' '); }

/* ---- ảnh (blobs 'kk_err_img') ---- */
export function idbPut(id, url) {
  const p = Promise.resolve().then(() => blobs.put(IMG, id, url)).catch((e) => { klog('err.img', e); toast('Không lưu được ảnh' + (e && e.message ? ': ' + e.message : '')); throw e; });
  p.catch(() => {});
  (ER._up || (ER._up = {}))[id] = p;
  return p;
}
export function clrUp(ids) { if (ER._up) (ids || []).forEach((i) => { delete ER._up[i]; }); }
export function idbGet(ids, cb) {
  const need = ids.filter((i) => !ER.cache[i]);
  if (!need.length) { cb(); return; }
  Promise.all(need.map((i) => blobs.get(IMG, i).then((v) => { if (v) ER.cache[i] = v; }).catch(() => {}))).then(() => cb());
}
export function idbDel(ids) { ids.forEach((i) => { blobs.del(IMG, i).catch(() => {}); }); }
export function pack(file, cb) {
  const u = URL.createObjectURL(file); const im = new Image();
  im.onload = () => {
    const s = Math.min(1, 1600 / Math.max(im.width, im.height)); const c = document.createElement('canvas');
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(u); cb(c.toDataURL('image/jpeg', 0.85));
  };
  im.onerror = () => { toast('Không đọc được ảnh'); };
  im.src = u;
}
export function imT(i) { const m = ER.form && ER.form.im && ER.form.im[i]; return m ? new Date(m.t).toLocaleString('vi-VN') + (m.by ? ' · ' + m.by : '') : ''; }

ER.addImg = function (files) {
  const f = ER.form; if (!f) return;
  [].forEach.call(files, (file) => {
    if (!/^image\//.test(file.type)) return;
    if (f[ER.slot].length >= 5) { toast('Tối đa 5 ảnh mỗi ô'); return; }
    pack(file, (url) => {
      const id = uid(); ER.cache[id] = url; idbPut(id, url); f[ER.slot].push(id); f.im[id] = { t: Date.now(), by: who() };
      if (ER.slot === 'bad' && f.bad.length === 1 && !f.ok.length && $('erS_ok')) ER.pick('ok');
      rEr();
    });
  });
};
ER.pick = function (s) { ER.slot = s; const b = $('erS_' + s); if (b) b.style.borderColor = ''; rEr(); };
ER.paste = function () {
  if (!navigator.clipboard || !navigator.clipboard.read) { toast('Nhấn Ctrl+V (Cmd+V) để dán ảnh'); return; }
  navigator.clipboard.read().then((a) => {
    a.forEach((it) => {
      const t = it.types.filter((x) => /^image\//.test(x))[0];
      if (t) it.getType(t).then((b) => { ER.addImg([new File([b], 'p.png', { type: t })]); }); else toast('Clipboard không có ảnh');
    });
  }).catch(() => { toast('Nhấn Ctrl+V (Cmd+V) để dán ảnh'); });
};
ER.rmImg = function (s, k) { const id = ER.form[s].splice(k, 1)[0]; ER._del.push(id); clrUp([id]); rEr(); };
ER.zoom = function (i) {
  openLayer('erzoom', () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }} onClick={() => closeLayer('erzoom')}>
      <img src={ER.cache[i]} style={{ maxWidth: '100%', maxHeight: '100%' }} alt="" />
    </div>
  ));
};

/* ---- kiểm tra tự động file MISA ---- */
export function chk() {
  const R = ER.misa; const o = []; const seen = {}; const by = {};
  R.forEach((r) => {
    const n = nz(r.sct); const m = n.match(/^NK-([A-Z]+)-(\d+)-(\d+)$/); r.n = n;
    (seen[n] = seen[n] || []).push(r);
    if (m) { const bk = m[1] + '-' + m[2]; (by[bk] = by[bk] || []).push(+m[3]); r.q = +m[3]; r.c = m[1]; }
    if (!/^NK-[A-Z]+-\d{2}-\d{3}$/.test(r.sct)) o.push({ r, k: 'Sai định dạng số chứng từ', l: 'Sai số chứng từ' });
    if (!r.nk) o.push({ r, k: 'Giá trị nhập kho = 0', l: 'Sai đơn giá' });
    else if (r.tt !== r.nk) { const q = (r.tt - r.nk) / r.nk; if (![0.05, 0.08, 0.1].some((p) => Math.abs(q - p) < 0.0006)) o.push({ r, k: 'Chênh tổng thanh toán / giá trị nhập kho bất thường (' + (q * 100).toFixed(2) + '%)', l: 'Sai đơn giá' }); }
    if (r.q && r.q < 100 && +r.hd === r.q) o.push({ r, k: 'Số hóa đơn trùng số phiếu (nghi nhập nhầm)', l: 'Sai số hóa đơn' });
  });
  Object.keys(seen).forEach((n) => { if (seen[n].length > 1) seen[n].forEach((r) => { o.push({ r, k: 'Trùng số chứng từ (' + seen[n].length + ' phiếu)', l: 'Sai số chứng từ' }); }); });
  Object.keys(by).forEach((bk) => {
    const p = bk.split('-'); const c = p[0]; const mo = p[1]; const mx = Math.max.apply(null, by[bk]);
    for (let i = 1; i <= mx; i++) if (by[bk].indexOf(i) < 0) o.push({ r: { sct: 'NK-' + c + '-' + mo + '-' + ('00' + i).slice(-3), ncc: '', d: '', c }, k: 'Thiếu số phiếu ' + i + ' của mã ' + c + ' tháng ' + mo, l: 'Sai số chứng từ' });
  });
  return o;
}
ER.misaUp = function (inp) {
  const file = inp.files && inp.files[0]; if (!file) return;
  if (!kkNeed(['xlsx'], () => { ER.misaUp(inp); })) return;
  const rd = new FileReader();
  rd.onload = async (e) => {
    try {
      const XLSX = window.XLSX;
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' }); let hi = -1;
      rows.forEach((x, i) => { if (hi < 0 && x.indexOf('Số chứng từ') >= 0) hi = i; });
      if (hi < 0) { toast('Không thấy cột "Số chứng từ" — kiểm tra đúng file MISA Mua hàng hóa, dịch vụ'); return; }
      const H = rows[hi]; const c = (n) => H.indexOf(n); const out = [];
      rows.slice(hi + 1).forEach((x) => {
        const s = String(x[c('Số chứng từ')] || ''); if (!/^NK/i.test(nz(s))) return;
        const d = x[c('Ngày hạch toán')];
        out.push({ d: d instanceof Date ? ymd(d) : String(d), sct: s, hd: String(x[c('Số hóa đơn')] || ''), ncc: String(x[c('Nhà cung cấp')] || ''), tt: +x[c('Tổng tiền thanh toán')] || 0, nk: +x[c('Giá trị nhập kho')] || 0 });
      });
      ER.misa = out; sv(); toast('Đã đọc ' + out.length + ' phiếu nhập kho'); rEr();
    } catch (err) { klog('er.misa', err); toast('Không đọc được file Excel'); }
  };
  rd.readAsArrayBuffer(file); inp.value = '';
};

/* ---- dòng hàng bị lỗi ---- */
export function lnTxt(l) { return [l.ma, l.ten].filter(Boolean).join(' · ') + (l.sl || l.gia ? ' · SL ' + (l.sl || '?') + ' × ' + (l.gia || '?') + (l.tien ? ' = ' + l.tien : '') : ''); }
ER.lsync = function () { (ER.form.lines || []).forEach((l, i) => { LK.forEach((k) => { const e = $('erL' + i + k[0]); if (e) l[k[0]] = e.value.trim(); }); }); };
ER.addLn = function () { ER.lsync(); ER.form.lines.push({}); rEr(); };
ER.rmLn = function (i) { ER.lsync(); ER.form.lines.splice(i, 1); rEr(); };
ER.pasteLn = function () {
  const t = (($('erPaste') && $('erPaste').value) || '').replace(/\r/g, '').trim();
  if (!t) { toast('Dán dữ liệu dòng đã copy từ MISA vào ô trên'); return; }
  ER.lsync(); let n = 0;
  t.split('\n').forEach((row) => {
    let c = row.split('\t').map((x) => x.trim()); if (c.length < 3) c = row.trim().split(/\s{2,}/);
    if (c.length > LK.length && /^\d{1,3}$/.test(c[0])) c.shift();
    if (c.filter(Boolean).length < 3) return;
    const l = {}; LK.forEach((k, j) => { l[k[0]] = c[j] || ''; }); ER.form.lines.push(l); n++;
  });
  if (!n) { toast('Chưa nhận được dòng nào — dán đúng dòng đã bôi đỏ hoặc nhập tay'); return; }
  $('erPaste').value = ''; rEr(); toast('Đã nhận ' + n + ' dòng — kiểm tra lại từng ô');
};

/* ---- form ---- */
export function setForm(f) { ER.form = f; ER._fk++; }
/* Bản gốc gán ER.tg hai lần; bản cuối (đổi trạng thái) thắng nên chip "Loại lỗi" trong form không bấm được.
   Bản port tách riêng ER.tgLoai cho chip để chức năng hoạt động đúng ý định. */
ER.tgLoai = function (x) { const l = ER.form.loai; const i = l.indexOf(x); if (i < 0) l.push(x); else l.splice(i, 1); rEr(); };
ER.sctCh = function () {
  const s = nz(val('erSct')); const r = ER.misa.filter((x) => nz(x.sct) === s)[0];
  if (r && !val('erNcc') && $('erNcc')) $('erNcc').value = r.ncc;
  const m = s.match(/^NK-([A-Z]+)-/); if (m && ER.map[m[1]] && $('erCs') && !$('erCs').value) $('erCs').value = ER.map[m[1]];
};
ER.new = function (t) { setForm({ type: t, cs: '', loai: t === 'nl' ? [] : undefined, loai1: '', bad: [], ok: [], im: {}, lines: [], st: STS[0], ky: kyOf() }); ER.v = 'form'; rEr(); };
ER.fromChk = function (i) { const c = ER._c[i]; ER.new('nl'); const f = ER.form; f.sct = c.r.sct; f.ncc = c.r.ncc; f.loai = [c.l]; f.note = c.k; f.cs = ER.map[c.r.c] || ''; f.ky = kyOf(c.r.d); rEr(); };
ER.edit = function (id) { setForm(JSON.parse(JSON.stringify(ER.items.filter((x) => x.id === id)[0]))); ER.v = 'form'; rEr(); };
ER.cancel = function () { if (ER.form) clrUp(ER.form.bad.concat(ER.form.ok, ER._del || [])); if (ER.form && !ER.form.id) idbDel(ER.form.bad.concat(ER.form.ok)); ER.v = 'list'; ER.form = null; ER._del = []; rEr(); };
export function miss(s) { const b = $('erS_' + s) || $(s); if (b) { b.style.borderColor = '#dc2626'; b.scrollIntoView({ block: 'center' }); } }
ER.save = async function (more) {
  if (ER._saving) return;
  const f = ER.form; const nl = f.type === 'nl'; const cs = val('erCs');
  if (!cs) { toast('Chọn cơ sở'); return; }
  if (nl) {
    f.sct = val('erSct'); f.ncc = val('erNcc');
    if (!f.sct) { toast('Nhập số chứng từ'); return; }
    if (!f.loai.length) { toast('Chọn ít nhất 1 loại lỗi'); return; }
    if (!f.bad.length && !f.ok.length && !f.cl) { toast('Cần ít nhất 1 ảnh'); miss('bad'); return; }
    const m = nz(f.sct).match(/^NK-([A-Z]+)-/); if (m) { ER.map[m[1]] = cs; sv(); }
  } else {
    f.labo = val('erLabo'); f.kh = val('erKh'); f.pid = val('erPid'); f.dvLabo = val('erDvLb'); f.slLabo = val('erSlLb'); f.rLabo = val('erRLb'); f.dvVT = val('erDvVT'); f.slVT = val('erSlVT'); f.note = val('erNoteLb'); f.nhac = !!($('erNhac') && $('erNhac').checked);
    if (!f.labo || !f.kh || !f.pid) { toast('Nhập tên labo, tên khách hàng và mã KH'); miss('erLabo'); return; }
    if (!f.bad.length && !f.cl) { toast('Cần ít nhất 1 ảnh bằng chứng'); miss('bad'); return; }
    if (ER.labos.indexOf(f.labo) < 0) { ER.labos.push(f.labo); sv(); }
  }
  f.cs = cs; f.ky = val('erKy') || kyOf(); f.st = val('erSt');
  if (!f.id) {
    const dp = ER.items.filter((x) => x.type === f.type && (nl ? (nz(x.sct) === nz(f.sct) && x.loai.some((l) => f.loai.indexOf(l) >= 0)) : (!!f.pid && x.pid === f.pid && x.labo === f.labo)));
    if (dp.length && !confirm('Đã có ' + dp.length + ' lỗi giống (' + (nl ? f.sct : f.pid + ' – ' + f.labo) + '). Vẫn ghi thêm?')) return;
  }
  ER._saving = true;
  try {
    const ids = f.bad.concat(f.ok).filter((id) => ER._up && ER._up[id]);
    const res = await Promise.allSettled(ids.map((id) => ER._up[id]));
    const rej = ids.filter((id, k) => res[k].status === 'rejected');
    if (rej.length) {
      if (ER.form === f) {
        f.bad = f.bad.filter((id) => rej.indexOf(id) < 0); f.ok = f.ok.filter((id) => rej.indexOf(id) < 0);
        rej.forEach((id) => { if (f.im) delete f.im[id]; delete ER.cache[id]; });
      }
      clrUp(rej); rEr();
      toast('Có ' + rej.length + ' ảnh bị máy chủ từ chối nên đã gỡ khỏi form — hãy thêm lại ảnh rồi lưu');
      return;
    }
  } finally { ER._saving = false; }
  if (ER.form !== f) return;
  const i = ER.items.map((x) => x.id).indexOf(f.id);
  if (i >= 0) ER.items[i] = f; else { f.id = uid(); f.ngay = new Date().toISOString(); f.by = who(); f.han = ymd(new Date(Date.now() + 3 * 864e5)); ER.items.unshift(f); }
  clrUp(f.bad.concat(f.ok, ER._del)); if (ER._del.length) idbDel(ER._del); ER._del = []; sv(); toast('Đã lưu lỗi');
  if (more) { const g = ER.form; ER.new(g.type); const n = ER.form; n.cs = g.cs; n.ky = g.ky; if (g.type === 'lb') n.labo = g.labo; ER.slot = 'bad'; rEr(); return; }
  ER.form = null; ER.v = 'list'; rEr();
};
export function byId(id) { return ER.items.filter((i) => i.id === id)[0]; }
/* đổi trạng thái (bản ER.tg cuối cùng của app gốc) */
ER.tg = function (id, k, el) {
  const x = byId(id); if (!x) return; const was = x.st;
  if (k === 'done') { if (was === STS[2]) { x.st = x.stPrev && x.stPrev !== STS[2] ? x.stPrev : STS[1]; delete x.stPrev; } else { x.stPrev = was; x.st = STS[2]; } }
  else { if (was === STS[0]) x.st = STS[1]; else { x.st = STS[0]; delete x.stPrev; } }
  sv();
  const on = x.st === STS[2]; if (k === 'done' && el) { el.classList.toggle('on', on); el.setAttribute('aria-checked', on ? 'true' : 'false'); }
  const DN = STS[2]; const leave = ER.f === 'done' ? x.st !== DN : (x.st === DN && ER.st !== DN);
  if (x.st === DN && was !== DN) toast('Đã xử lý — chuyển sang “Công việc đã xử lý”'); else if (was === DN) toast('Đã mở lại — trạng thái: ' + x.st);
  if (leave) setTimeout(rEr, 350); else rEr();
};
ER.nx = function (id) { const x = ER.items.filter((i) => i.id === id)[0]; x.st = STS[Math.min(2, STS.indexOf(x.st) + 1)]; sv(); if (x.st === STS[2]) toast('Đã chuyển sang “Công việc đã xử lý”'); rEr(); };
ER.del = function (id) { if (!confirm('Xoá lỗi này và ảnh đính kèm?')) return; const x = ER.items.filter((i) => i.id === id)[0]; idbDel(x.bad.concat(x.ok)); ER.items = ER.items.filter((i) => i.id !== id); sv(); rEr(); };
ER.set = function (k, v) { ER[k] = v; ER.n = 30; rEr(); };
ER.res = function () { rEr(); };

/* ---- danh sách + thống kê ---- */
export function cur() { return ER.items.filter((x) => (ER.f === 'all' || ER.f === 'stat' || (ER.f === 'done' ? x.st === STS[2] : x.type === ER.f)) && (!ER.ky || x.ky === ER.ky) && (!ER.st || x.st === ER.st) && (!ER.cs || x.cs === ER.cs) && (!ER.nh || (x.nhac && x.st !== STS[2])) && (!ER.q || qm(hay(x)))); }
export function stat() {
  const T = {}; const L = {}; const N = {};
  ER.items.forEach((x) => {
    if (ER.ky && x.ky !== ER.ky) return;
    const t = T[x.cs] = T[x.cs] || { nl: 0, ps: {}, lb: 0 }; const nl = x.type === 'nl';
    if (nl) { t.nl++; t.ps[nz(x.sct)] = 1; } else t.lb++;
    (nl ? x.loai : [x.loai1]).filter(Boolean).forEach((l) => { L[l] = (L[l] || 0) + 1; });
  });
  ER.misa.forEach((r) => { if (ER.ky && r.d.slice(0, 7) !== ER.ky) return; const m = nz(r.sct).match(/^NK-([A-Z]+)-/); const c = m && ER.map[m[1]]; if (c) N[c] = (N[c] || 0) + 1; });
  return { T, L, N };
}
export function due() { const t = ymd(new Date()); return ER.items.filter((x) => x.type === 'lb' && x.nhac && x.st !== STS[2] && x.nhacNgay !== t); }
export function cn(t) { const n = ER.items.filter((x) => x.type === t && x.st !== STS[2] && (!ER.ky || x.ky === ER.ky)).length; return n ? ' (' + n + ')' : ''; }
export function dnN() { const n = ER.items.filter((x) => x.st === STS[2] && (!ER.ky || x.ky === ER.ky)).length; return n ? ' (' + n + ')' : ''; }
export function pend() { return ER.items.filter((x) => x.st !== STS[2]).length; }
export function csList() { let a = ((db && db.folders) || []).slice(); ER.items.forEach((x) => { if (x.cs && a.indexOf(x.cs) < 0) a = a.concat(x.cs); }); return a; }
export function labosList() { const o = {}; ER.labos.concat(ER.items.map((x) => x.labo)).forEach((v) => { if (v) o[v] = 1; }); return Object.keys(o).sort(); }
export function uniqList(k) { const o = {}; ER.items.forEach((x) => { k.forEach((f) => { if (x[f]) o[x[f]] = 1; }); }); return Object.keys(o); }

/* ---- nhắc / nhân bản ---- */
ER.tpl = function (i) { const e = $('erNoteLb'); if (!e) return; const v = e.value.trim(); e.value = v ? v + '; ' + NT[i][1] : NT[i][1]; };
ER.pasteRow = function () { const t = val('erPbL'); if (!t) return; const c = t.split('\t').map((x) => x.trim()); if (c.length < 2) return; ['erKh', 'erPid', 'erDvLb', 'erSlLb', 'erRLb', 'erDvVT', 'erSlVT'].forEach((id, i) => { if (c[i] && $(id)) $(id).value = c[i]; }); $('erPbL').value = ''; toast('Đã điền từ dòng dán — kiểm tra lại'); };
ER.cpVT = function () { if ($('erDvVT')) $('erDvVT').value = val('erDvLb'); if ($('erSlVT')) $('erSlVT').value = val('erSlLb'); };
ER.dup = function (id) { const x = ER.items.filter((i) => i.id === id)[0]; if (!x) return; const c = JSON.parse(JSON.stringify(x)); delete c.id; delete c.ngay; delete c.by; delete c.cl; c.bad = []; c.ok = []; c.im = {}; c.st = STS[0]; setForm(c); ER.v = 'form'; rEr(); toast('Đã nhân bản — thêm ảnh mới rồi lưu'); };
ER.pasteLb = function () { const t = val('erPb'); if (!t) return; const c = t.split('\t').map((x) => x.trim()); if (c.length < 2) return; ['erKh', 'erPid', 'erDvVT', 'erDvLb'].forEach((id, i) => { if (c[i] && $(id)) $(id).value = c[i]; }); $('erPb').value = ''; toast('Đã điền từ dòng dán'); };
ER.dupImg = function (id) {
  const x = byId(id); const ids = x.bad.concat(x.ok);
  idbGet(ids, async () => {
    const c = JSON.parse(JSON.stringify(x)); delete c.id; delete c.ngay; delete c.by; delete c.cl; delete c.han; c.nhacNgay = ''; c.soNhac = 0; c.st = STS[0]; c.im = {};
    const ps = [];
    const mp = (a) => a.filter((i) => ER.cache[i]).map((i) => { const n = uid(); ER.cache[n] = ER.cache[i]; ps.push(idbPut(n, ER.cache[i])); c.im[n] = { t: Date.now(), by: who() }; return n; });
    c.bad = mp(x.bad); c.ok = mp(x.ok);
    const res = await Promise.allSettled(ps);
    if (res.some((q) => q.status === 'rejected')) { toast('Không nhân bản được ảnh — máy chủ từ chối'); return; }
    setForm(c); ER.v = 'form'; rEr(); toast('Đã nhân bản kèm ảnh — sửa dịch vụ, ghi chú rồi lưu');
  });
};
ER.nhac = function (id) { const x = byId(id); x.nhac = !x.nhac; if (x.nhac) x.nhacNgay = ''; sv(); rEr(); };
ER.nhacView = function () { ER.f = 'all'; ER.ky = ''; ER.st = ''; ER.cs = ''; ER.q = ''; ER.nh = true; ER.n = 30; ER.v = 'list'; ER.form = null; rEr(); };
ER.ack = function (id) { const x = byId(id); x.nhacNgay = ymd(new Date()); x.soNhac = (x.soNhac || 0) + 1; sv(); rEr(); };
ER.share = function (id) {
  const x = byId(id); const ids = x.bad.concat(x.ok);
  idbGet(ids, () => {
    Promise.all(ids.filter((i) => ER.cache[i]).map((i, k) => fetch(ER.cache[i]).then((r) => r.blob()).then((b) => new File([b], 'loi-' + (k + 1) + '.jpg', { type: 'image/jpeg' })))).then((fs) => {
      if (navigator.canShare && navigator.canShare({ files: fs })) return navigator.share({ files: fs, title: 'Lỗi labo ' + x.labo, text: (x.dvLabo || '') + (x.note ? ' — ' + x.note : '') });
      toast('Trình duyệt không hỗ trợ chia sẻ ảnh — dùng Xuất Word kèm ảnh');
    }).catch(() => {});
  });
};
ER.pack = function () { if (!ER.ky) { toast('Chọn tháng cần xuất'); return; } ER.f = 'all'; ER.q = ''; ER.st = ''; ER.cs = ''; ER.xls(); setTimeout(ER.doc, 800); };

/* ---- dọn dữ liệu sau khi xuất ---- */
export function mk(t, k) { return t + '|' + k; }
export function mark(t) { const ks = ER.ky ? [ER.ky] : ER.items.map((x) => x.ky); ks.forEach((k) => { ER.ex[mk(t, k)] = Date.now(); }); sv(); }
export function exTxt(t) { const v = ER.ex[mk(t, ER.ky)]; return v ? new Date(v).toLocaleString('vi-VN') : ''; }
export function tgt() { return ER.items.filter((x) => x.ky === ER.ky); }
ER.cl = function () { ER.clean = !ER.clean; rEr(); };
ER.clImg = function () {
  if (!ER.ky) { toast('Chọn tháng cần dọn'); return; }
  const T = tgt(); let ids = []; T.forEach((x) => { ids = ids.concat(x.bad, x.ok); });
  if (!ids.length) { toast('Kỳ này không còn ảnh để xoá'); return; }
  if (!ER.ex[mk('w', ER.ky)]) { toast('Chưa xuất Word kèm ảnh của kỳ này — bấm Xuất gói báo cáo tháng trước'); return; }
  if (!confirm('Xoá ' + ids.length + ' ảnh của ' + T.length + ' lỗi kỳ ' + ER.ky + '? Số liệu thống kê vẫn giữ. Không khôi phục được.')) return;
  idbDel(ids); ids.forEach((i) => { delete ER.cache[i]; }); T.forEach((x) => { x.bad = []; x.ok = []; x.im = {}; x.cl = 1; }); sv(); toast('Đã xoá ' + ids.length + ' ảnh'); ER.clean = false; rEr();
};
ER.clAll = function () {
  if (!ER.ky) { toast('Chọn tháng cần dọn'); return; }
  const T = tgt(); let ids = []; T.forEach((x) => { ids = ids.concat(x.bad, x.ok); });
  if (!T.length) { toast('Kỳ này không có lỗi'); return; }
  if (!ER.ex[mk('w', ER.ky)] || !ER.ex[mk('x', ER.ky)]) { toast('Chưa xuất đủ Word và Excel của kỳ này — bấm Xuất gói báo cáo tháng trước'); return; }
  const pd = T.filter((x) => x.st !== STS[2]).length;
  if (pd && !confirm('Còn ' + pd + ' lỗi chưa "Đã xử lý". Vẫn xoá?')) return;
  if (!confirm('Xoá HẲN ' + T.length + ' lỗi và ' + ids.length + ' ảnh của kỳ ' + ER.ky + '? Số liệu KPI kỳ này cũng mất, không khôi phục được.')) return;
  idbDel(ids); ids.forEach((i) => { delete ER.cache[i]; });
  ER.items = ER.items.filter((x) => x.ky !== ER.ky); sv();
  ER.misa = ER.misa.filter((r) => String(r.d).slice(0, 7) !== ER.ky); sv();
  toast('Đã dọn kỳ ' + ER.ky); ER.clean = false; rEr();
};

/* ---- xuất Excel / Word (giữ dạng chuỗi HTML) ---- */
ER.xls = function () {
  if (!kkNeed(['xlsx'], ER.xls)) return;
  const XLSX = window.XLSX; const wb = XLSX.utils.book_new(); const st0 = stat();
  const ts = Object.keys(st0.T).map((c) => { const t = st0.T[c]; const p = Object.keys(t.ps).length; const n = st0.N[c] || ''; return { 'Cơ sở': c, 'Số lỗi nhập liệu': t.nl, 'Số phiếu có lỗi': p, 'Tổng phiếu nhập kho': n, 'Tỷ lệ phiếu lỗi': n ? p / n : '', 'Số lỗi labo': t.lb }; });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ts.length ? ts : [{}]), 'Tổng hợp');
  const L = ER.items.filter((x) => !ER.ky || x.ky === ER.ky);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(L.filter((x) => x.type === 'nl').map((x) => ({ 'Kỳ': x.ky, 'Cơ sở': x.cs, 'Số chứng từ': x.sct, 'Nhà cung cấp': x.ncc, 'Loại lỗi': x.loai.join(', '), 'Dòng hàng lỗi': (x.lines || []).map(lnTxt).join(' | ') || x.vt, 'Đang nhập sai': x.sai, 'Đúng là': x.dung, 'Ghi chú': x.note, 'Trạng thái': x.st, 'Số ảnh': x.bad.length + x.ok.length }))), 'Lỗi nhập liệu');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(L.filter((x) => x.type === 'lb').map((x) => ({ 'Kỳ': x.ky, 'Cơ sở': x.cs, 'Labo': x.labo, 'Khách hàng': x.kh, 'Mã PID': x.pid, 'Dịch vụ trên VT': x.dvVT, 'Dịch vụ labo báo': x.dvLabo, 'SL labo báo': x.slLabo, 'Số răng labo báo': x.rLabo, 'SL trên VT': x.slVT, 'Lỗi': x.loai1, 'Hạn xử lý': x.han, 'Số lần nhắc': x.soNhac || 0, 'Nhắc gần nhất': x.nhacNgay || '', 'Ghi chú': x.note, 'Trạng thái': x.st, 'Số ảnh': x.bad.length + x.ok.length }))), 'Lỗi labo');
  XLSX.writeFile(wb, 'bao-loi-' + (ER.ky || 'tat-ca') + '.xlsx'); mark('x');
};
ER.doc = function () {
  const L = cur(); let ids = []; if (ER.f === 'all' && !ER.q && !ER.st) mark('w'); L.forEach((x) => { ids = ids.concat(x.bad, x.ok); });
  idbGet(ids, () => {
    /* Bố cục: 1 cột, ảnh rộng ~15,9 cm (A4, lề 2/2,5 cm) để đọc được chữ trên phiếu; giữ nguyên tỷ lệ, giới hạn chiều cao */
    const MW = 600; const need = ids.filter((i) => ER.cache[i]);
    const dim = (u) => new Promise((r) => { const m = new Image(); m.onload = () => { r({ w: m.naturalWidth || MW, h: m.naturalHeight || MW * 0.75 }); }; m.onerror = () => { r({ w: MW, h: MW * 0.75 }); }; m.src = u; });
    Promise.all(need.map((i) => dim(ER.cache[i]))).then((ds) => {
      const D = {}; need.forEach((i, k) => { D[i] = ds[k]; });
      const im = (a) => { const mh = a.length > 1 ? 420 : 700; return a.map((i) => { const u = ER.cache[i]; if (!u) return ''; const d = D[i]; const k = Math.min(MW / d.w, mh / d.h); const w = Math.round(d.w * k); const g = Math.round(d.h * k); return '<p style="text-align:center;margin:3pt 0;page-break-inside:avoid"><img src="' + u + '" width="' + w + '" height="' + g + '" style="width:' + w + 'px;height:' + g + 'px;border:1px solid #888"></p>'; }).join(''); };
      const sec = (t, a) => '<p style="margin:8pt 0 2pt;page-break-after:avoid"><b>' + t + '</b></p>' + im(a);
      let h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!-' + '-[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-' + '-><style>@page Section1{size:21cm 29.7cm;margin:2cm 2cm 2cm 2.5cm;mso-page-orientation:portrait}div.Section1{page:Section1}body{font-family:"Times New Roman";font-size:13pt}</style></head><body><div class="Section1"><h2 style="text-align:center">BIÊN BẢN BÁO LỖI' + (ER.ky ? ' THÁNG ' + esc(ER.ky) : '') + '</h2>';
      L.forEach((x, i) => {
        const nl = x.type === 'nl';
        h += '<p style="margin:' + (i ? '16pt' : '6pt') + ' 0 0;page-break-after:avoid;' + (i ? 'border-top:1px solid #000;padding-top:6pt' : '') + '"><b>' + (i + 1) + '. ' + (nl ? 'Lỗi nhập liệu: ' + esc(x.sct) + ' – ' + esc(x.ncc) : 'Lỗi labo: ' + esc(x.labo) + (x.kh ? ' – KH ' + esc(x.kh) + ' (PID ' + esc(x.pid) + ')' : '')) + '</b><br>Cơ sở: ' + esc(x.cs) + ' | Trạng thái: ' + esc(x.st) + '<br>' + (nl ? 'Lỗi: ' + esc(x.loai.join(', ')) + '<br>Sai: ' + esc(x.sai) + ' → Đúng: ' + esc(x.dung) + ((x.lines && x.lines.length) ? '<br>Dòng hàng: ' + x.lines.map((l) => esc(lnTxt(l))).join('; ') : (x.vt ? '<br>Vật tư: ' + esc(x.vt) : '')) : (x.loai1 ? 'Lỗi: ' + esc(x.loai1) + '<br>' : '') + 'Labo báo: ' + esc(x.dvLabo) + ' · SL ' + esc(x.slLabo || '') + ' · ' + esc(x.rLabo || '') + ' răng<br>Phần mềm VT: ' + esc(x.dvVT) + ' · SL ' + esc(x.slVT || '')) + (x.note ? '<br>Ghi chú: ' + esc(x.note) : '') + '</p>' + (x.bad.length ? sec('Ảnh bằng chứng lỗi', x.bad) : '<p style="margin:8pt 0 2pt"><b>Ảnh bằng chứng lỗi:</b> <i>chưa có ảnh</i></p>') + (x.ok.length ? sec('Ảnh đúng', x.ok) : '');
      });
      const b = new Blob(['﻿' + h + '</div></body></html>'], { type: 'application/msword' }); const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'bao-loi-' + (ER.ky ? ER.ky : 'tat-ca') + '.doc'; a.click();
    });
  });
};

/* ---- khởi tạo một lần: dán ảnh, đóng menu "⋯", nhắc labo, bản vá A.go ---- */
let inited = false;
export function initErr() {
  if (inited) return; inited = true;
  document.addEventListener('paste', (e) => {
    if (S.route.view !== 'err' || !ER.form) return;
    const fs = [];
    [].forEach.call((e.clipboardData && e.clipboardData.items) || [], (x) => { if (x.kind === 'file' && /^image\//.test(x.type)) fs.push(x.getAsFile()); });
    if (fs.length) { e.preventDefault(); ER.addImg(fs); }
  });
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.er-mn[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
    /* bản gốc vẽ lại cả màn nên menu tự đóng sau khi chọn; ở đây đóng tay khi bấm nút trong menu */
    const bt = e.target.closest && e.target.closest('.er-pop button'); const d = bt && bt.closest('.er-mn');
    if (d) setTimeout(() => d.removeAttribute('open'), 0);
  });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* bỏ qua */ }
  { let tries = 0; const iv = setInterval(() => { if (store.ready || ++tries >= 40) { clearInterval(iv); if (!store.ready) return; const n = due().length; if (n) toast('Hôm nay cần nhắc ' + n + ' lỗi labo — vào mục Báo lỗi'); } }, 500); }
  /* bản vá A.go (dòng gốc 11198): vào màn err thì đặt lại trạng thái danh sách */
  setTimeout(() => {
    const o = A.go;
    A.go = function (...a) {
      const v = a[0];
      if (v === 'err') { ER.v = 'list'; ER.form = null; ER._del = []; ER.q = ''; ER.clean = false; ER.nh = false; }
      return o.apply(this, a);
    };
  }, 0);
}
