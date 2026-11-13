/* Màn "Tạo báo cáo kiểm kê" (view baocao, hàm gốc renderBaoCao) + hành động A của baocao (dòng gốc 2424–2503, 6761–6808, 7008–7015). */
import { S, A, db, esc, fmt, branchCode, toast, per, rerender, st, I, X } from '../../core';
import { BCSRC, periodCounted, bcFromPeriod, ensureBCMeta, defaultNguoi, readKiemKeXlsx, generateBaoCao } from './logic.js';

/* periodsIn (periods), sigSectionHtml (docs, bản JSX) */
const periodsIn = (...a) => X.periodsIn(...a);

export const renderBaoCao = () => rerender();

export function bcSrcCardHtml() {
  if (!db.periods.length) return null;
  var n = 0;
  var groups = [];
  db.folders.concat(['']).forEach(function (f) {
    var list = periodsIn(f); if (!list.length) return;
    groups.push(
      <div key={'g' + f}>
        <div style={st('font-size:12px;font-weight:700;color:var(--mut);text-transform:uppercase;margin:10px 0 4px')}>{f || 'Chưa phân loại'}</div>
        {list.map(function (p) {
          var on = !!BCSRC.sel[p.id]; if (on) n++;
          return (
            <label key={p.id} style={st('display:flex;gap:10px;align-items:center;padding:8px 0;cursor:pointer;border-top:1px solid var(--line)')}>
              <input type="checkbox" style={st('width:22px;height:22px;flex:none')} checked={on} onChange={() => bcSrcToggle(p.id)} />
              <span style={st('min-width:0')}>
                <span style={st('display:block;font-weight:600;font-size:14px;word-break:break-word')}>{p.name}</span>
                <span style={st('display:block;font-size:12px;color:var(--mut)')}>{'Đã kiểm ' + periodCounted(p) + '/' + p.items.length + ' mã'}</span>
              </span>
            </label>
          );
        })}
      </div>
    );
  });
  return (
    <div className="card mt16">
      <div style={st('font-weight:700;margin-bottom:4px')}>Hoặc lấy từ hồ sơ kiểm kê có sẵn</div>
      <div style={st('font-size:13px;color:var(--mut);margin-bottom:10px')}>Tích chọn kỳ kiểm kê của từng chi nhánh, không cần upload lại file Excel.</div>
      {groups}
      <div style={st('display:flex;gap:10px;margin-top:10px')}><button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => bcSrcLatest()}>Chọn kỳ mới nhất mỗi chi nhánh</button></div>
      <button className="btn btn-primary mt16" disabled={!n} onClick={() => bcUseSrc()}>{n ? 'Lấy dữ liệu (' + n + ' chi nhánh)' : 'Tích chọn kỳ kiểm kê'}</button>
    </div>
  );
}

const chColorOf = (c) => (c === 0 ? 'color:var(--green)' : c > 0 ? 'color:var(--amber)' : 'color:var(--red)');
const chTxtOf = (c) => (c === 0 ? 'Khớp' : (c > 0 ? '+' : '') + fmt(c));

export function BaoCao() {
  ensureBCMeta();
  var BC = S.BC, BCMETA = S.BCMETA;
  var has = !!(BC && BC.branches.length);
  var totC = 0, totK = 0;
  if (has) BC.branches.forEach(function (br) { totC += br.totalClose; totK += br.totalKiem; });
  var totChenh = totK - totC;
  var set = function (k) { return (e) => { A_bcSet(k, e.target.value); rerender(); }; };
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('reporthub')}>‹</button><div className="ttl">Báo cáo kiểm kê</div></div><div style={st('height:10px')}></div></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:100px')}>
        <div className="lbl">Chọn file Excel biên bản kiểm kê (có thể chọn nhiều)</div>
        <input type="file" id="bc_files" accept=".xlsx,.xls" multiple style={st('display:none')} onChange={(e) => bcFiles(e.target)} />
        <button className="drop" onClick={() => document.getElementById('bc_files').click()} style={st('padding:28px 16px')}><div style={st('color:var(--teal);display:flex;justify-content:center')}>{I('folder', 28)}</div><div style={st('font-weight:700;color:var(--teal);margin-top:6px')}>Chọn file Excel biên bản kiểm kê</div><div style={st('font-size:12px;color:var(--mut);margin-top:4px')}>Có thể chọn nhiều file cùng lúc, định dạng .xlsx / .xls</div></button>

        {bcSrcCardHtml()}
        {has ? (
          <>
            <div className="bcsec" style={st('margin-top:16px')}>{'Dữ liệu đọc được · ' + BC.branches.length + ' chi nhánh'}</div>
            <div style={st('overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card)')}><table className="bctbl"><thead><tr><th>Chi nhánh</th><th className="r">Tồn cuối</th><th className="r">Kiểm kê</th><th className="r">Chênh</th></tr></thead><tbody>
              {BC.branches.map(function (br, i) {
                var chenh = br.totalKiem - br.totalClose;
                return <tr key={i}><td>{br.name}</td><td className="r">{fmt(br.totalClose)}</td><td className="r">{fmt(br.totalKiem)}</td><td className="r" style={st('font-weight:700;' + chColorOf(chenh))}>{chTxtOf(chenh)}</td></tr>;
              })}
              <tr style={st('font-weight:700;border-top:2px solid var(--line)')}><td>TỔNG CỘNG</td><td className="r">{fmt(totC)}</td><td className="r">{fmt(totK)}</td><td className="r" style={st(chColorOf(totChenh))}>{chTxtOf(totChenh)}</td></tr>
            </tbody></table></div>
            {BC.warns && BC.warns.length ? (
              <div className="note-warn" style={st('margin-top:8px;display:flex;gap:8px;align-items:flex-start')}>{I('warn', 16)}<span>{BC.warns.map(function (w, i) { return <span key={i}>{i ? <br /> : null}{w}</span>; })}</span></div>
            ) : null}
            {BC.errors && BC.errors.length ? (
              <div className="note-warn" style={st('margin-top:8px;display:flex;gap:8px;align-items:flex-start')}>{I('warn', 16)}<span>{'Không đọc được: ' + BC.errors.join(', ')}</span></div>
            ) : null}

            <div className="bcsec" style={st('margin-top:20px')}>Thông tin báo cáo (theo mẫu)</div>
            <div style={st('display:flex;gap:8px;flex-wrap:wrap')}>
              <div style={st('flex:1;min-width:140px')}><label className="lbl">Số biên bản</label><input className="inp" placeholder="01" value={BCMETA.soVanBan} onChange={set('soVanBan')} /></div>
              <div style={st('flex:1;min-width:100px')}><label className="lbl">Tháng</label><input className="inp" value={BCMETA.thang} onChange={set('thang')} /></div>
              <div style={st('flex:1;min-width:100px')}><label className="lbl">Năm</label><input className="inp" value={BCMETA.nam} onChange={set('nam')} /></div>
            </div>
            <label className="lbl" style={st('margin-top:10px')}>Địa điểm lập báo cáo</label><input className="inp" value={BCMETA.diaDiem} onChange={set('diaDiem')} />

            <div className="bcsec" style={st('margin-top:16px')}>Thời gian &amp; người kiểm kê từng chi nhánh</div>
            {BC.branches.map(function (br, i) {
              var m = BCMETA.br[br.name] || { thoigian: '', nguoi: '', giatri: '' };
              var setb = function (f) { return (e) => { A_bcBr(i, f, e.target.value); rerender(); }; };
              return (
                <div key={i} style={st('border:1px solid var(--line);border-radius:12px;padding:10px;margin-top:8px;background:var(--card)')}>
                  <div style={st('font-weight:700;margin-bottom:6px')}>{br.name} <span style={st('color:var(--mut);font-weight:400')}>{'(' + branchCode(br.name) + ')'}</span></div>
                  <input className="inp" placeholder="VD: 10h34 ngày 03/09/2026" value={m.thoigian} onChange={setb('thoigian')} style={st('margin-bottom:6px')} />
                  <input className="inp" placeholder="Người kiểm kê (VD: Nguyễn Văn A – Thủ kho)" value={m.nguoi} onChange={setb('nguoi')} style={st('margin-bottom:6px')} />
                  <input className="inp" placeholder="Giá trị tồn kho (VNĐ, tuỳ chọn)" value={m.giatri} onChange={setb('giatri')} />
                </div>
              );
            })}

            <label className="lbl" style={st('margin-top:16px')}>Nguyên nhân chênh lệch (mỗi dòng một ý, tuỳ chọn)</label>
            <textarea className="inp" rows="4" placeholder="- Tại cơ sở ...: mã ... thiếu/thừa do ..." value={BCMETA.nguyennhan} onChange={set('nguyennhan')}></textarea>
            <div className="note-warn" style={st('margin-top:8px;display:flex;gap:8px;align-items:flex-start')}>{I('warn', 16)}<span>File Excel kiểm kê không có sẵn đơn giá vật tư nên không tự tính được "Giá trị" — bạn có thể tự điền số tiền vào ô trên nếu biết, để trống thì báo cáo sẽ để trống ô đó.</span></div>
            {X.sigSectionHtml('bc')}
          </>
        ) : null}
      </div>
      <div className="botbar"><div className="botin"><button className="bcbtn bcok" onClick={() => generateBaoCao()} disabled={!has} style={st('box-shadow:0 8px 32px rgba(0,0,0,.5)')}>{I('file', 18)}Tạo báo cáo Word</button></div></div>
    </>
  );
}

/* ---- Hành động A ---- */
function bcSrcToggle(id) {
  var p = per(id); if (!p) return;
  if (BCSRC.sel[id]) { delete BCSRC.sel[id]; }
  else {
    if (p.folder) periodsIn(p.folder).forEach(function (q) { delete BCSRC.sel[q.id]; }); /* mỗi chi nhánh chỉ 1 kỳ */
    BCSRC.sel[id] = true;
  }
  renderBaoCao();
}
function bcSrcLatest() {
  BCSRC.sel = {};
  db.folders.forEach(function (f) {
    var l = periodsIn(f).slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    if (l[0]) BCSRC.sel[l[0].id] = true;
  });
  renderBaoCao();
}
function bcUseSrc() {
  var ps = db.periods.filter(function (p) { return BCSRC.sel[p.id]; });
  if (!ps.length) { toast('Tích chọn ít nhất một kỳ kiểm kê'); return; }
  var order = db.folders;
  ps.sort(function (a, b) { var x = order.indexOf(a.folder), y = order.indexOf(b.folder); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
  var warns = [];
  ps.forEach(function (p) {
    var c = periodCounted(p);
    if (c < p.items.length) warns.push('Kỳ "' + p.name + '" mới kiểm ' + c + '/' + p.items.length + ' mã, số kiểm kê chưa đủ nên chênh lệch có thể lớn.');
  });
  S.BC = { branches: ps.map(bcFromPeriod), errors: [], warns: warns, loading: false };
  ensureBCMeta(); renderBaoCao();
  toast('Đã lấy dữ liệu ' + ps.length + ' chi nhánh');
}
function bcFiles(input) {
  var files = Array.from(input.files || []);
  if (!files.length) return;
  S.BC = { branches: [], errors: [], loading: true };
  renderBaoCao();
  var pending = files.length;
  files.forEach(function (f) {
    readKiemKeXlsx(f, function (err, branches) {
      if (err) { S.BC.errors.push(f.name); }
      else { branches.forEach(function (b) { S.BC.branches.push(b); }); }
      pending--;
      if (pending === 0) { S.BC.loading = false; ensureBCMeta(); renderBaoCao(); }
    });
  });
  input.value = '';
}
function A_bcSet(key, val) { ensureBCMeta(); S.BCMETA[key] = val; }
function A_bcBr(idx, field, val) {
  ensureBCMeta();
  var br = S.BC && S.BC.branches && S.BC.branches[idx];
  if (!br) return;
  if (!S.BCMETA.br[br.name]) S.BCMETA.br[br.name] = { thoigian: '', nguoi: defaultNguoi(br.name), giatri: '' };
  S.BCMETA.br[br.name][field] = val;
}
export const actions = { bcSrcToggle, bcSrcLatest, bcUseSrc, bcFiles, bcSet: A_bcSet, bcBr: A_bcBr };
export const views = { baocao: BaoCao };
