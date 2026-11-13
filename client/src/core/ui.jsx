/* Thành phần giao diện dùng chung: toast, khung modal (#modal của app gốc), lớp phủ phụ. */
import { S } from './state.js';
import { rerender } from './store.js';

/* toast(): giữ nguyên hành vi app gốc (tự nhận biết thông báo lỗi để đổi màu) */
export function toast(m) {
  const el = document.getElementById('toastin');
  if (!el) return;
  const bad = /lỗi|thất bại|không thể|không hợp lệ|chưa (có|chọn|nhập)|sai |không có quyền|không lưu được/i.test(String(m || ''));
  el.classList.toggle('err', bad); el.classList.toggle('ok', !bad);
  el.textContent = m; el.classList.add('show');
  const d = Math.max(2200, Math.min(6500, String(m).length * 65));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), d);
}

/* Modal: app gốc gán innerHTML cho #modal (mỗi lúc một hộp thoại). Ở đây giữ một "khe" duy nhất:
   openModal(fn) với fn trả JSX; fn được gọi lại ở mỗi lần vẽ nên nội dung luôn theo trạng thái mới nhất. */
let modalFn = null;
export function openModal(fn) { modalFn = typeof fn === 'function' ? fn : () => fn; rerender(); }
export function closeModal() { if (!modalFn) return; modalFn = null; rerender(); }
export function modalOpen() { return !!modalFn; }
export function ModalHost() { return <div id="modal">{modalFn ? modalFn() : null}</div>; }
/* dùng nội bộ: xoá modal mà không vẽ lại (render() sẽ vẽ ngay sau đó) */
export function _clearModal() { modalFn = null; }

/* Lớp phủ phụ đặt ngoài #modal (app gốc tạo bằng document.createElement rồi gắn vào body) */
const layers = new Map();
export function openLayer(key, fn) { layers.set(key, typeof fn === 'function' ? fn : () => fn); rerender(); }
export function closeLayer(key) { if (layers.delete(key)) rerender(); }
export function layerOpen(key) { return layers.has(key); }
export function LayerHost() {
  return <>{Array.from(layers.entries()).map(([k, fn]) => <div key={k} data-layer={k}>{fn()}</div>)}</>;
}

/* Tiện ích cho ô nhập có kiểm soát: gán giá trị rồi vẽ lại */
export function bind(obj, key, after) {
  return {
    value: obj[key] == null ? '' : obj[key],
    onChange: (e) => { obj[key] = e.target.value; if (after) after(e.target.value); rerender(); },
  };
}
export { S };

/* st('display:flex;gap:10px') -> { display:'flex', gap:'10px' } : chuyển chuỗi style nội tuyến của app gốc sang object cho JSX */
const stCache = new Map();
export function st(css) {
  if (!css) return undefined;
  let o = stCache.get(css);
  if (o) return o;
  o = {};
  String(css).split(';').forEach((part) => {
    const i = part.indexOf(':'); if (i < 0) return;
    const k = part.slice(0, i).trim(); const v = part.slice(i + 1).trim();
    if (!k || !v) return;
    o[k.startsWith('--') ? k : k.replace(/^-(webkit|moz|ms)-/, (m, p) => (p === 'ms' ? 'ms-' : p[0].toUpperCase() + p.slice(1) + '-')).replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = v;
  });
  if (stCache.size > 5000) stCache.clear();
  stCache.set(css, o);
  return o;
}
