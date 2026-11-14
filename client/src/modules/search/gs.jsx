/* Tìm kiếm chung (gốc: <script id="gs-js"> dòng 12340–12400): chức năng + vật tư (mọi kỳ) + CCDC/TSCĐ + phiếu báo lỗi.
   Không dấu, một phần, nhiều từ. Kết quả lọc theo quyền. Dropdown vẽ bằng JSX (Shell gắn <X.GS.Results />). */
import { db, S, A, X, norm, stok, smatch, klog, toast, rerender, can, canEdit, canView } from '../../core';

const FN = [['home', 'Tổng quan', 'trang chu dashboard'], ['lists', 'Kỳ kiểm kê', 'danh sach ky kiem ke vat tu'], ['upload', 'Tạo kỳ kiểm kê mới', 'tao ky nhap file excel'], ['stock', 'Tồn kho', 'ton kho'], ['assets', 'CCDC & TSCĐ', 'cong cu dung cu tai san co dinh'], ['hsd', 'Hạn sử dụng', 'han dung date lo'], ['baocao', 'Báo cáo kiểm kê', 'bao cao'], ['reporthub', 'Trung tâm báo cáo', 'xuat excel in'], ['recon', 'Đối chiếu doanh thu – xuất kho', 'doi chieu dt xuat kho pid'], ['pay', 'Thanh toán NCC', 'cong no hoa don vat de nghi thanh toan'], ['err', 'Báo lỗi', 'loi misa labo chung tu'], ['ana', 'Phân tích mua – tiêu hao', 'mua tieu hao'], ['mgmt', 'Điều chuyển', 'dieu chuyen noi bo'], ['transfer', 'Chuyển vật tư', 'chuyen vat tu'], ['dchub', 'Kiểm soát dữ liệu', 'kiem soat du lieu'], ['handover', 'Biên bản bàn giao', 'ban giao'], ['explain', 'Phiếu giải trình', 'giai trinh'], ['sign', 'Ký số PDF', 'chu ky so pdf'], ['settings', 'Cài đặt hệ thống', 'cai dat nguoi ky in an']];

export const GS = { q: '', rows: [], list: [], sel: -1, open: false, t: null, empty: false };

function vals(x) { return Object.keys(x).map((k) => { const v = x[k]; return (typeof v === 'string' || typeof v === 'number') ? v : ''; }).join(' '); }
const skeyOf = (i) => (typeof X.skey === 'function' ? X.skey(i) : norm((i.code || '') + ' ' + (i.name || '')));

export function run(q) {
  const t = stok(q); let R = []; if (!t.length) return R;
  const fn = FN.filter((f) => canView(f[0]) && (f[0] !== 'upload' || canEdit('kiemke')) && smatch(norm(f[1] + ' ' + f[2]), t)).slice(0, 5);
  if (fn.length) { R.push({ h: 'Chức năng' }); fn.forEach((f) => R.push({ t: f[1], s: 'Mở màn hình', a: () => { if (f[0] === 'stock') A.navStock(); else A.navGo(f[0]); } })); }
  if (can('kiemke')) {
    const seen = {}; const vt = []; let nv = 0;
    (db.periods || []).forEach((p) => {
      (p.items || []).forEach((i) => {
        if (!smatch(skeyOf(i), t)) return;
        const k = (i.code || i.name) + '|' + (i.branch || ''); if (seen[k]) return; seen[k] = 1; nv++;
        if (vt.length < 8) {
          vt.push({
            t: (i.code ? i.code + ' · ' : '') + i.name,
            s: p.name + (i.branch ? ' · ' + i.branch : '') + ' · tồn ' + (i.close == null ? '—' : i.close),
            a: () => { A.openPeriod(p.id); if (S.P) { S.P.q = i.code || i.name; S.P.limit = 80; S.P._k = 'gs' + Date.now(); } rerender(); },
          });
        }
      });
    });
    if (vt.length) { R.push({ h: 'Vật tư (' + nv + ')' }); R = R.concat(vt); }
  }
  if (can('assets')) {
    const sa = {}; const as = []; let na = 0;
    (db.assets || []).forEach((p) => {
      (p.items || []).forEach((i) => {
        if (!smatch(norm(i.name + ' ' + i.code + ' ' + i.room), t)) return;
        const k = (i.code || i.name) + '|' + (i.room || ''); if (sa[k]) return; sa[k] = 1; na++;
        if (as.length < 6) as.push({ t: (i.code ? i.code + ' · ' : '') + i.name, s: (p.name || '') + (i.room ? ' · ' + i.room : ''), a: () => { X.ASX.openP(p.id); X.ASX.q(i.code || i.name); } });
      });
    });
    if (as.length) { R.push({ h: 'CCDC & TSCĐ (' + na + ')' }); R = R.concat(as); }
  }
  if (can('err')) {
    let ne = 0; try { ((X.ER && X.ER.items) || []).forEach((x) => { if (smatch(norm(vals(x)), t)) ne++; }); } catch (e) { /* bỏ qua */ }
    if (ne) R.push({ h: 'Báo lỗi' }, { t: ne + ' phiếu lỗi khớp “' + q.trim() + '”', s: 'Mở danh sách Báo lỗi với từ khoá này', a: () => { A.go('err'); try { X.ER.q = q; X.ER.n = 30; X.ER.res(); } catch (e) { klog('gs.err', e); } } });
  }
  return R;
}

function compute() {
  const q = GS.q;
  if (!q.trim()) { GS.open = false; GS.list = []; GS.rows = []; GS.sel = -1; GS.empty = false; return; }
  GS.list = run(q); GS.rows = GS.list.filter((r) => !r.h); GS.empty = !GS.list.length;
  GS.open = true; GS.sel = GS.rows.length ? 0 : -1;
}
export function hide() { if (!GS.open && GS.sel < 0) return; GS.open = false; GS.sel = -1; rerender(); }
function pick(i) {
  const r = GS.rows[i]; if (!r) return;
  GS.open = false; GS.sel = -1; rerender();
  try { r.a(); } catch (x) { klog('gsGo', x); toast('Không mở được kết quả này'); }
}
GS.input = (v) => { GS.q = v; rerender(); clearTimeout(GS.t); GS.t = setTimeout(() => { compute(); rerender(); }, 120); };
GS.focus = () => { if (GS.q.trim()) { compute(); rerender(); } };
GS.key = (e) => {
  if (e.key === 'Escape') { hide(); e.target.blur(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!GS.rows.length) return; e.preventDefault();
    GS.sel = (GS.sel + (e.key === 'ArrowDown' ? 1 : -1) + GS.rows.length) % GS.rows.length; rerender();
  } else if (e.key === 'Enter') {
    e.preventDefault(); clearTimeout(GS.t); compute();
    if (GS.sel >= 0) pick(GS.sel); else rerender();
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', (e) => { if (GS.open && !(e.target.closest && e.target.closest('#fcsrch,#gsres'))) hide(); });
}

export function Results() {
  if (!GS.open) return null;
  const l = typeof document !== 'undefined' ? document.getElementById('fcsrch') : null;
  const style = { display: 'block' };
  if (l) {
    const r = l.getBoundingClientRect(); const w = Math.min(Math.max(r.width, 440), window.innerWidth - 16);
    style.width = w + 'px'; style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px'; style.top = (r.bottom + 6) + 'px';
  }
  let n = -1;
  return (
    <div id="gsres" style={style} onMouseDown={(e) => e.preventDefault()}>
      {GS.empty ? <div className="gse">Không tìm thấy “{GS.q.trim()}”. Thử bớt từ khoá hoặc gõ không dấu.</div> : GS.list.map((r, k) => {
        if (r.h) return <div className="gsh" key={'h' + k}>{r.h}</div>;
        n++; const i = n;
        return <button type="button" key={'r' + k} className={'gsr' + (i === GS.sel ? ' on' : '')} data-i={i} onClick={() => pick(i)}><b>{r.t}</b><small>{r.s}</small></button>;
      })}
    </div>
  );
}
GS.Results = Results;
