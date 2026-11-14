/* "Cần xử lý": bấm vào là vào thẳng chỗ có vấn đề (gốc: dòng 12404–12470). Có kiểm tra quyền trước khi đi. */
import { db, A, X, needsCount, klog, openLayer, closeLayer, can, st } from '../../core';

export const NX = {
  from: '',
  focus(el) {
    if (!el) return;
    el.style.scrollMarginTop = '84px';
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
    el.classList.remove('nx-flash'); void el.offsetWidth; el.classList.add('nx-flash');
    setTimeout(() => { el.classList.remove('nx-flash'); }, 2600);
  },
  openPeriods() {
    const ops = db.periods.filter((p) => p.items.some(needsCount));
    if (!ops.length) { X.v2List(); return; }
    if (ops.length === 1) { NX.openP(ops[0].id); return; }
    const rows = ops.map((p) => ({ p, n: p.items.filter(needsCount).length })).sort((a, b) => b.n - a.n);
    openLayer('nmovl', () => (
      <div id="nmovl">
        <div className="sigcard">
          <div style={st('font-weight:800;font-size:16px;margin-bottom:2px')}>Kỳ đang kiểm dở</div>
          <div style={st('font-size:12.5px;color:var(--mut);margin-bottom:10px')}>Chọn kỳ để vào thẳng danh sách mã chưa kiểm.</div>
          {rows.map((x) => (
            <button key={x.p.id} className="btn btn-outline" style={st('display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 12px;margin-bottom:8px;text-align:left')} onClick={() => { closeLayer('nmovl'); NX.openP(x.p.id); }}>
              <span style={st('min-width:0')}><span style={st('display:block;font-weight:700')}>{x.p.name || 'Kỳ kiểm kê'}</span>
                {x.p.folder ? <span style={st('display:block;font-size:11.5px;font-weight:500;color:var(--mut)')}>{x.p.folder}</span> : null}</span>
              <b className="tnum" style={st('flex:none;color:var(--red)')}>{x.n} mã</b>
            </button>
          ))}
          <button className="btn btn-outline" style={st('padding:11px;margin-top:2px')} onClick={() => closeLayer('nmovl')}>Đóng</button>
        </div>
      </div>
    ));
  },
  openP(id) {
    A.openPeriod(id); /* mở kỳ */
    NX.from = 'home'; /* nút ‹ quay về Trang chủ thay vì thư mục */
    A.setFlt('todo'); /* chỉ hiện mã chưa kiểm */
    window.scrollTo(0, 0);
  },
  pay() {
    const PAY = X.PAY;
    const bad = X.payCompute().filter((g) => g.bad);
    PAY.v = ''; PAY.step = 3; PAY.q = ''; PAY.ec = 'all'; PAY.ed = '';
    if (bad.length === 1) PAY.sel = bad[0].key;
    else { PAY.sel = ''; PAY.f = 'bad'; }
    A.go('pay');
    setTimeout(() => {
      if (PAY.sel) {
        let t = null;
        [].slice.call(document.querySelectorAll('#app .bk-row')).forEach((r) => {
          if (t) return;
          if (r.classList.contains('bk-x')) { t = r; return; }
          const s = r.querySelector('.bk-st'); if (s && s.textContent.trim()) t = r;
        });
        NX.focus(t || document.querySelector('#app .bk-head'));
      } else {
        const h = document.getElementById('paylist-h');
        NX.focus(document.querySelector('#paylist .pxc') || h);
      }
    }, 80);
  },
  go(k) {
    try {
      if (k === 'open') { if (can('kiemke')) NX.openPeriods(); return; }
      if (k === 'pay') { if (can('pay')) NX.pay(); return; }
      if (!can('hsd')) return;
      A.go('hsd');
      setTimeout(() => { const b = document.getElementById('hsd-b-' + k); if (b) NX.focus(b); }, 60);
    } catch (e) {
      try { klog('NX.go ' + k, e); } catch (_) { /* bỏ qua */ }
      if (k === 'open') X.v2List(); else A.go(k === 'pay' ? 'pay' : 'hsd');
    }
  },
};

/* Bản vá đè gốc: mở kỳ bình thường thì xoá NX.from; nút ‹ về Trang chủ nếu vào từ "Cần xử lý" */
export function install() {
  const oo = A.openPeriod; const pb = A.periodBack;
  if (typeof oo === 'function') A.openPeriod = function (id) { NX.from = ''; return oo.apply(this, arguments); };
  if (typeof pb === 'function') A.periodBack = function () { if (NX.from === 'home') { NX.from = ''; A.go('home'); return undefined; } return pb.apply(this, arguments); };
}
