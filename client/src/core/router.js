/* Điều hướng: giữ mô hình route.view + đường dẫn #/... của app gốc. */
import { S, A, X, db } from './state.js';
import { rerender } from './store.js';
import { _clearModal } from './ui.jsx';
import { klog } from './klog.js';
import { canView } from './perms.js';

const views = {};
/* Mỗi phân hệ đăng ký màn hình của mình: registerView('handover', HandoverList) */
export function registerView(name, Comp) { views[name] = Comp; }
export function getView(name) { return views[name] || null; }

export const HR_SLUG = { sign: 'ky-so-pdf', home: 'tong-quan', lists: 'ky-kiem-ke', upload: 'tao-ky', assets: 'ccdc-tscd', hsd: 'han-su-dung', baocao: 'bao-cao-kiem-ke', reporthub: 'trung-tam-bao-cao', handover: 'ban-giao', explain: 'giai-trinh', settings: 'cai-dat', recon: 'doi-chieu', pay: 'thanh-toan-ncc', err: 'bao-loi', ana: 'phan-tich-mua-tieu-hao', mgmt: 'dieu-chuyen', dchub: 'kiem-soat-du-lieu', stock: 'ton-kho', transfer: 'chuyen-vat-tu', period: 'ky-kiem-ke/chi-tiet', folder: 'chi-nhanh', asset: 'ccdc-tscd/chi-tiet', handoverEdit: 'ban-giao/soan', explainEdit: 'giai-trinh/soan' };
/* Màn cần ngữ cảnh (chi tiết kỳ, soạn biên bản...) khi mở lại từ liên kết sẽ về màn danh sách cha */
export const HR_FALL = { stock: 'lists', transfer: 'lists', period: 'lists', folder: 'lists', asset: 'assets', handoverEdit: 'handover', explainEdit: 'explain' };
const HR_REV = {};
Object.keys(HR_SLUG).forEach((k) => { HR_REV[HR_SLUG[k]] = k; });
let HR_REPL = false;

export function hrView() { const h = String(location.hash || ''); if (h.indexOf('#/') !== 0) return null; return HR_REV[h.slice(2).split('?')[0]] || null; }
export function hrSafe(v) { return HR_FALL[v] || v; }
export function hashSync() {
  try {
    const s = HR_SLUG[S.route.view]; if (!s) return;
    const want = '#/' + s; if (location.hash === want) return;
    if (HR_REPL || !location.hash || !hrView()) history.replaceState(null, '', want); else history.pushState(null, '', want);
  } catch (e) { klog('hashSync', e); }
}
export function hrGo(v) {
  const t = hrSafe(v); if (t === S.route.view) return;
  HR_REPL = true;
  try { A.drawerClose(); A.go(t); } finally { HR_REPL = false; }
}

/* render() của app gốc: đóng modal, bỏ sheet đang nhập, vẽ lại toàn bộ và cuộn lên đầu.
   Các hàm renderXxx() cục bộ của app gốc (vẽ lại 1 màn, không cuộn) tương ứng với rerender(). */
export function render() {
  _clearModal();
  S.SB = null;
  rerender();
  try { window.scrollTo(0, 0); } catch (_) { /* bỏ qua */ }
  hashSync();
}

Object.assign(A, {
  go(v) {
    if (!canView(v)) {
      X.toast('Bạn không có quyền truy cập mục này');
      if (v === 'home') return;
      v = 'home';
    }
    if (v === 'upload') {
      const now = new Date();
      const fromF = (S.route.view === 'folder' && S.FD && S.FD.name) ? S.FD.name : '';
      S.UP = { folder: fromF, fromFolder: !!fromF, src: null, srcPid: '', srcMode: 'keep', wb: null, sheet: '', rows: null, hr: 0, start: 1, map: {}, branchManual: '',
        pname: 'Kiểm kê ' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear() };
    }
    S.route = { view: v }; render();
  },
  navGo(v) { A.drawerClose(); A.go(v); },
  navStock() {
    A.drawerClose();
    if (!db.periods.length) { X.toast('Chưa có kỳ kiểm kê nào — tạo kỳ mới trước đã'); A.go('home'); return; }
    A.openStock(db.periods[0].id);
  },
  drawerToggle() { S.drawer = !S.drawer; rerender(); },
  drawerClose() { if (S.drawer) { S.drawer = false; rerender(); } },
  navGroup(k) {
    if (document.body.classList.contains('sb-min') && window.innerWidth >= 900) { A.sbToggle(); S.NAV_OPEN = k; rerender(); return; }
    S.NAV_OPEN = (S.NAV_OPEN === k) ? '' : k; rerender();
  },
  sbToggle() {
    const m = document.body.classList.toggle('sb-min');
    try { localStorage.setItem('kk_ui_sb', m ? '1' : '0'); } catch (e) { klog('kk_ui_sb', e); }
  },
  navFolder(i) { A.drawerClose(); A.openFolder(i); },
  navFolderAdd() { A.drawerClose(); A.folderAdd(); },
});
export const go = (v) => A.go(v);

if (typeof window !== 'undefined') window.addEventListener('hashchange', () => { const v = hrView(); if (v) hrGo(v); });
