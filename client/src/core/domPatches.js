/* Các lớp "vá DOM" của app gốc (ux-opt-js, ds-layer-js): chỉ thêm thuộc tính/class hiển thị, không đụng dữ liệu. */
import { klog } from './klog.js';
import { toast } from './ui.jsx';
import { store } from './store.js';

export function installDomPatches() {
  const D = document;
  /* 1. Lưới an toàn lỗi */
  let lastErr = 0;
  function safe(m) { const n = Date.now(); if (n - lastErr < 8000) return; lastErr = n; try { store.flush(); } catch (e) { klog('store.flush', e); } try { toast(m); } catch (e) { klog('toast', e); } }
  window.addEventListener('error', (e) => { if (!e || !e.message || /ResizeObserver|Script error/i.test(e.message)) return; klog('window.onerror', e.error || e.message); safe('Có lỗi nhỏ xảy ra, dữ liệu của bạn vẫn được giữ nguyên.'); });
  window.addEventListener('unhandledrejection', (e) => { const r = e && e.reason; if (r && /AbortError|NotAllowedError|cancel/i.test(String(r.name || r))) return; klog('unhandledrejection', r); safe('Tác vụ chưa hoàn tất, bạn thử lại nhé.'); });
  /* 2. Trạng thái mạng */
  function net() { const nb = D.getElementById('netbar'); if (nb) nb.hidden = navigator.onLine !== false; }
  window.addEventListener('offline', () => { net(); toast('Đang offline — thay đổi sẽ được gửi lên máy chủ khi có mạng trở lại'); });
  window.addEventListener('online', () => { net(); toast('Đã có mạng trở lại'); });
  /* 3. Nhập liệu chính xác */
  function fixInputs(root) {
    root.querySelectorAll('input:not([data-ux])').forEach((i) => {
      const t = (i.type || 'text').toLowerCase(); if (t !== 'text' && t !== 'search' && t !== 'number' && t !== 'tel') return;
      i.setAttribute('data-ux', '1');
      const m = i.getAttribute('inputmode') || '';
      if (m === 'decimal' || m === 'numeric' || t === 'number') { if (!i.hasAttribute('enterkeyhint')) i.setAttribute('enterkeyhint', 'done'); }
      else if (i.classList.contains('inp') || i.classList.contains('sinp') || /mã|tìm|quét|dãy số/i.test(i.placeholder || '')) {
        if (!i.hasAttribute('autocapitalize')) i.setAttribute('autocapitalize', 'off');
        if (!i.hasAttribute('autocorrect')) i.setAttribute('autocorrect', 'off');
        if (!i.hasAttribute('spellcheck')) i.spellcheck = false;
        if (!i.hasAttribute('autocomplete')) i.setAttribute('autocomplete', 'off');
      }
    });
  }
  /* 5. Chạm ô số lượng là chọn sẵn toàn bộ để gõ đè */
  D.addEventListener('focusin', (e) => {
    const t = e.target; if (!t || t.tagName !== 'INPUT') return;
    const m = t.getAttribute('inputmode');
    if (m === 'decimal' || m === 'numeric' || t.type === 'number') setTimeout(() => { try { t.select(); } catch (x) { klog('t.select', x); } }, 0);
  });
  D.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { const q = D.getElementById('fcq'); if (q) { e.preventDefault(); q.focus(); } }
  });
  /* DS v1: căn phải ô số trong bảng */
  const Q = '#app .stktable td:not(:first-child),#app .rct td:not(:first-child),#app .bctbl td:not(:first-child)';
  const re = /^[\s\-+(]*\d[\d.,\s]*(%|đ|₫|\))?\s*$/i;
  function mark() { D.querySelectorAll(Q).forEach((td) => { td.classList.toggle('num', re.test(td.textContent.trim())); }); }
  let q = false;
  function run() { q = false; net(); fixInputs(D); mark(); }
  function sched() { if (q) return; q = true; (window.requestAnimationFrame || setTimeout)(run); }
  try { new MutationObserver(sched).observe(D.body, { childList: true, subtree: true, characterData: true }); } catch (e) { klog('MutationObserver', e); }
  run();
  /* Watermark như app gốc */
  try {
    const W = 300; const Hh = 170;
    const c = D.createElement('canvas'); c.width = W; c.height = Hh;
    const ctx = c.getContext('2d');
    ctx.translate(W / 2, Hh / 2); ctx.rotate(-28 * Math.PI / 180);
    ctx.font = '12.5px Arial,sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.072)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Mai Văn Quyết quyetmv', 0, 0);
    const wm = D.createElement('div');
    wm.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none;background-image:url(' + c.toDataURL('image/png') + ');background-repeat:repeat;background-size:' + W + 'px ' + Hh + 'px';
    D.body.appendChild(wm);
  } catch (e) { klog('watermark', e); }
}
