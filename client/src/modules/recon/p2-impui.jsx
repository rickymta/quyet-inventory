/* Phần 2 · V7 — khung kết quả "Đã cập nhật lại đối chiếu" và thẻ "Lần cập nhật gần nhất" (dòng gốc 9098–9166).
   rcImpShow mở modal; rcImpHtml / rcImpCard trả JSX để nhúng vào màn hình (phần 1 gọi X.rcImpCard()). */
/* eslint-disable */
import { A, X, S, openModal, st } from '../../core';

export function rcImpShow(rep) {
  openModal(() => (
    <div style={st('position:fixed;inset:0;background:rgba(16,24,40,.5);z-index:90;display:flex;align-items:flex-end;justify-content:center')}>
      <div style={st('background:#fff;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:16px')}>
        {rcImpHtml(rep)}
      </div>
    </div>
  ));
}

export function rcImpHtml(rep) {
  const kb = rep.kb, ka = rep.ka;
  function itm(s, i) {
    if (typeof s === 'string') return <div key={i} style={st('margin-bottom:4px')}>• {s}</div>;
    if (s.f && s.f.length) return (
      <div key={i} className="rcm"><div className="rcm-l">{s.l}</div>
        {X.rcTbl(['Trường', 'Trước', 'Sau'], s.f.map((z) => [z[0], z[1], <b>{z[2]}</b>]), 3)}</div>
    );
    if (s.a !== undefined) return (
      <div key={i} className="rcm"><div className="rcm-l">{s.l}</div>
        <div className="rcm-g"><div><i>Trước</i>{s.a}</div><div><i>Sau</i><b>{s.b}</b></div></div></div>
    );
    return <div key={i} style={st('margin-bottom:4px')}>• {s.l}{s.d ? ' — ' + s.d : ''}</div>;
  }
  function det(t, n, arr, col) {
    if (!n) return null;
    return (
      <details key={'d' + t} style={st('margin-top:6px')}>
        <summary style={{ fontWeight: 700, fontSize: 13, color: 'var(--' + col + ')' }}>{t} ({n})</summary>
        <div style={st('font-size:12px;color:var(--mut);padding:6px 0 0 4px;line-height:1.5')}>
          {arr.map(itm)}{n > arr.length ? <div>… và {n - arr.length} mục nữa</div> : null}
        </div>
      </details>
    );
  }
  function pct(v) { return v == null ? '–' : v.toFixed(1) + '%'; }
  function dcell(x, y, f, good) {
    if (x == null || y == null) return '—';
    const d = y - x; if (Math.abs(d) < 1e-9) return '—';
    const c = good === undefined ? 'mut' : ((good === 'up') === (d > 0) ? 'green' : 'red');
    return <span style={{ color: 'var(--' + c + ')', fontWeight: 700 }}>{(d > 0 ? '+' : '−') + f(Math.abs(d))}</span>;
  }
  const rows = [];
  [['dt', 'Doanh thu'], ['xk', 'Xuất kho']].forEach((p) => { const c = rep.cnt[p[0]]; if (c) rows.push([p[1], c.add, c.upd, c.same, rep.mode === 'replace' ? c.del : '—']); });
  const kp = [['Tỷ lệ khớp', pct(kb.rate), pct(ka.rate), dcell(kb.rate, ka.rate, (v) => v.toFixed(1) + '%', 'up')],
    ['Lượt đối chiếu', kb.n, ka.n, dcell(kb.n, ka.n, X.rcF)],
    ['Ca doanh thu cần xử lý', kb.needD, ka.needD, dcell(kb.needD, ka.needD, X.rcF, 'down')],
    ['Phiếu xuất cần xử lý', kb.needX, ka.needX, dcell(kb.needX, ka.needX, X.rcF, 'down')],
    ['Tổng doanh thu (VND)', X.rcF(kb.rev), X.rcF(ka.rev), dcell(kb.rev, ka.rev, X.rcF)],
    ['Giá trị xuất kho (VND)', X.rcF(kb.val), X.rcF(ka.val), dcell(kb.val, ka.val, X.rcF)]];
  return (
    <>
      <div style={st('display:flex;justify-content:space-between;align-items:flex-start;gap:8px')}>
        <div><div className="sec" style={st('margin-bottom:2px')}>Đã cập nhật lại đối chiếu</div>
          <div style={st('font-size:12px;color:var(--mut)')}>{rep.at} · {rep.modeLbl} · {rep.src}</div></div>
        <button className="btn btn-outline" style={st('width:auto;padding:6px 12px')} onClick={() => A.rcImpClose()}>Đóng</button>
      </div>
      <div style={st('margin-top:12px')}>
        <div style={st('font-weight:700;font-size:13px;margin-bottom:4px')}>1. Dữ liệu vừa nhập (số dòng)</div>
        {X.rcTbl(['', 'Thêm mới', 'Sửa', 'Giữ nguyên', 'Bỏ'], rows, 1)}
        <div style={st('font-size:11.5px;color:var(--mut2);margin-top:4px')}>Sửa = dòng đã có được cập nhật theo file (giữ nguyên giải trình). Bỏ = dòng cũ không có trong file thay thế.</div>
      </div>
      {rep.warn ? (
        <div className="rcnote" style={st('margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--amber-bg);color:var(--amber)')}>⚠ <b>{rep.warn}</b> dòng mới giống dòng đã có (cùng khách/ngày/dịch vụ hoặc cùng số CT/vật tư) nhưng khác số liệu, đã được THÊM như dòng riêng nên có thể bị tính trùng. Nếu đó là bản điều chỉnh: bấm Hoàn tác, chọn chế độ “Bổ sung / điều chỉnh” rồi nhập lại.</div>
      ) : null}
      <div style={st('margin-top:14px')}>
        <div style={st('font-weight:700;font-size:13px;margin-bottom:4px')}>2. Kết quả đối chiếu: trước → sau</div>
        {X.rcTbl(['Chỉ tiêu', 'Trước', 'Sau', 'Chênh'], kp, 1)}
      </div>
      <div style={st('margin-top:14px')}>
        <div style={st('font-weight:700;font-size:13px')}>3. Ca đổi kết quả</div>
        {[['dt', 'Doanh thu → xuất kho (ca)'], ['xk', 'Phiếu xuất kho']].map((p) => {
          const c = rep.ch[p[0]], it = rep.it[p[0]]; if (!c) return null;
          const tot = c.fixed + c.bad + c.other + c.nw + c.gone;
          return (
            <div key={p[0]}>
              <div style={st('font-size:12.5px;font-weight:700;margin:8px 0 2px;color:var(--mut)')}>{p[1]}</div>
              {!tot ? <div className="rcnote">Không có ca nào đổi kết quả.</div> : (
                <>
                  {det('✔ Chuyển sang khớp / hết lệch', c.fixed, it.fixed, 'green')}
                  {det('✖ Từ khớp thành lệch', c.bad, it.bad, 'red')}
                  {det('↔ Vẫn lệch nhưng đổi kết quả / số liệu', c.other, it.other, 'amber')}
                  {det('＋ Ca mới phát sinh lệch', c.nwBad, it.nwBad, 'red')}
                  {(c.nw - c.nwBad) ? <div className="rcnote" style={st('margin-top:6px')}>＋ Ca mới đã khớp: <b>{c.nw - c.nwBad}</b></div> : null}
                  {det('－ Ca không còn trong dữ liệu', c.gone, it.gone, 'amber')}
                </>
              )}
            </div>
          );
        })}
      </div>
      {[['dt', 'Doanh thu'], ['xk', 'Xuất kho']].map((p) => {
        const c = rep.cnt[p[0]], l = rep.chg[p[0]];
        return (c && c.upd && l && l.length)
          ? <div key={'u' + p[0]} style={st('margin-top:10px')}>{det('Dòng ' + p[1].toLowerCase() + ' đã được điều chỉnh', c.upd, l, 'sky')}</div>
          : null;
      })}
      {rep.reN ? (
        <div style={st('margin-top:12px;padding:8px 10px;border-radius:10px;background:var(--red-bg);color:var(--red);font-size:12.5px')}>⚠ <b>{rep.reN}</b> ca <b>đã duyệt</b> nhưng kết quả đối chiếu đã đổi sau lần nhập này. Giải trình được giữ, ca được gắn cờ để duyệt lại.{det('Danh sách', rep.reN, rep.reL, 'red')}</div>
      ) : null}
      {rep.orph ? (
        <div style={st('margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--amber-bg);color:var(--amber);font-size:12.5px')}><b>{rep.orph}</b> giải trình / duyệt cũ không còn gắn với dòng nào (dòng đã bị bỏ khỏi dữ liệu).</div>
      ) : null}
      <div style={st('display:grid;gap:8px;margin-top:14px')}>
        {rep.reN ? <button className="btn btn-primary" onClick={() => A.rcImpGo(rep.reD ? 0 : 1)}>Xem ca đã duyệt cần xem lại ({rep.reN})</button> : null}
        <button className={'btn ' + (rep.reN ? 'btn-outline' : 'btn-primary')} onClick={() => A.rcImpGo(-1)}>Xem các ca lệch cần xử lý</button>
        {(S.RC_UNDO && S.RC_UNDO.at === rep.at) ? <button className="btn btn-outline" style={st('color:var(--red)')} onClick={() => A.rcImpUndo()}>Hoàn tác lần nhập này</button> : null}
      </div>
    </>
  );
}

export function rcImpCard() {
  const L = X.rcDb().lastImp; if (!L) return null;
  const c = L.cnt || {}, t = (s, n) => (n ? s + ': +' + n.add + ' mới · ' + n.upd + ' sửa · ' + n.same + ' giữ nguyên' + (L.mode === 'replace' ? ' · ' + n.del + ' bỏ' : '') : '');
  function pc(v) { return v == null ? '–' : v.toFixed(1) + '%'; }
  const cu = (S.RC_UNDO && S.RC_UNDO.at === L.at);
  return (
    <div className="card" style={st('margin-bottom:12px')}>
      <div className="sec">Lần cập nhật gần nhất</div>
      <div style={st('font-size:12.5px;color:var(--mut);margin-bottom:8px')}>{L.at} · {L.modeLbl} · {L.src}
        {c.dt ? <><br />{t('Doanh thu', c.dt)}</> : null}{c.xk ? <><br />{t('Xuất kho', c.xk)}</> : null}</div>
      {X.rcTbl(['Chỉ tiêu', 'Trước', 'Sau'], [['Tỷ lệ khớp', pc(L.kb.rate), <b>{pc(L.ka.rate)}</b>], ['Ca cần xử lý', L.kb.needD + L.kb.needX, <b>{L.ka.needD + L.ka.needX}</b>]], 1)}
      <div style={st('display:grid;grid-template-columns:' + (cu ? '1fr 1fr' : '1fr') + ';gap:8px;margin-top:10px')}>
        <button className="btn btn-outline" onClick={() => A.rcImpLast()}>Xem chi tiết</button>
        {cu ? <button className="btn btn-outline" style={st('color:var(--red)')} onClick={() => A.rcImpUndo()}>Hoàn tác</button> : null}
      </div>
    </div>
  );
}
