/* Biên bản bàn giao (dòng gốc 2893–3048) + hành động hv* (6947–6964) */
import { S, A, X, db, esc, fmt, store, toast, I, st, rerender, render, canDel, canEdit } from '../../core';
import { renderPicker, chkLine, chipGroupUI, toggleArr, nextSoVanBan, profileFillHV, dot, cinp, sigSection } from './common.jsx';

export const HV_LOAI = ['Công cụ dụng cụ', 'Tài sản cố định', 'Vật tư tiêu hao', 'Thiết bị – máy móc', 'Hồ sơ – chứng từ'];
export const HV_LYDO = ['Cấp phát mới', 'Luân chuyển nội bộ', 'Thu hồi / nhập lại kho', 'Nghỉ việc / điều chuyển', 'Cho mượn / hoàn trả', 'Nhận / trả NCC'];
export const HV_HOSO = ['Hóa đơn / phiếu nhập kho', 'Phiếu xuất / điều chuyển', 'Sổ bảo hành, HDSD', 'Phụ kiện đi kèm', 'Hình ảnh hiện trạng'];
export function newHV(autoNumber) {
  const o = {
    id: Date.now().toString(36), sig: {}, soBB: autoNumber ? nextSoVanBan('BBBG') : '', boPhan: '',
    loai: [], loaiKhac: '', lyDo: [], lyDoKhac: '',
    thoiGian: '', diaDiem: '', canCu: '',
    benGiao: { ten: '', chucVu: '', boPhan: '', dienThoai: '' },
    benNhan: { ten: '', chucVu: '', boPhan: '', dienThoai: '' },
    items: [],
    hoSo: [], hoSoKhac: '', chenhLech: '',
    soNgay: '05', soBan: '03',
    createdAt: Date.now(),
  };
  if (autoNumber) profileFillHV(o);
  return o;
}

export const renderHandoverList = () => rerender();
export function HandoverList() {
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('reporthub')}>‹</button><div className="ttl">Biên bản bàn giao</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:100px')}>
        {canEdit('handover') ? <div style={st('display:flex;gap:8px;margin-bottom:16px')}><button className="btn btn-primary" style={{ flex: 1 }} onClick={() => A.hvNew()}>+ Tạo biên bản mới</button></div> : null}
        <button className="addbat" style={st('margin-bottom:16px;display:flex;align-items:center;gap:6px')} onClick={() => A.hvBlank()}>{I('download', 15)}Tải mẫu trống (.doc) để gửi người khác tự điền tay</button>
        {!db.handovers.length ? <div className="card" style={st('color:var(--mut);text-align:center')}>Chưa có biên bản bàn giao nào.</div> : null}
        {db.handovers.map((v) => (
          <div key={v.id} className="card" style={st('margin-bottom:10px;cursor:pointer')} onClick={() => A.hvOpen(v.id)}>
            <div style={st('display:flex;justify-content:space-between')}>
              <div style={{ fontWeight: 700 }}>{(v.loai.length ? v.loai.join(', ') : 'Biên bản bàn giao') + (v.soBB ? ' · Số ' + v.soBB : '')}</div>
              {canDel() && canEdit('handover') ? <button className="addbat" style={st('color:var(--red)')} onClick={(e) => { e.stopPropagation(); A.hvDelete(v.id); }}>Xoá</button> : null}
            </div>
            <div style={st('font-size:13px;color:var(--mut);margin-top:4px')}>{(v.benGiao.ten || '(chưa đặt tên)') + ' → ' + (v.benNhan.ten || '(chưa đặt tên)')}</div>
            <div style={st('font-size:12px;color:var(--mut2);margin-top:2px')}>{(v.thoiGian ? v.thoiGian + ' · ' : '') + v.items.length + ' mục'}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* Tài liệu in/Word: giữ dạng chuỗi HTML. Các hàm mẫu biểu của docs gọi qua X (bản Str nếu có) */
export function generateHandoverDoc(v) {
  v = v || S.HV;
  const docHeaderHtmlBP = X.docHeaderHtmlBPStr || X.docHeaderHtmlBP;
  const docSignHtml4 = X.docSignHtml4Str || X.docSignHtml4;
  const docWrap = X.docWrapStr || X.docWrap;
  let itemRows = '';
  const slRows = 8;
  let tongSL = 0;
  for (let i = 0; i < Math.max(v.items.length, slRows); i++) {
    const it = v.items[i];
    if (it) {
      const slNum = parseFloat(String(it.sl).replace(/[^\d.-]/g, ''));
      if (!isNaN(slNum)) tongSL += slNum;
      itemRows += '<tr><td align="center">' + (i + 1) + '</td><td align="center">' + esc(it.ma) + '</td><td>' + esc(it.ten) + '</td><td align="center">' + esc(it.dvt) + '</td><td align="right">' + esc(it.sl) + '</td><td>' + esc(it.tinhTrang) + '</td><td>' + esc(it.ghiChu) + '</td></tr>';
    } else {
      itemRows += '<tr><td align="center">' + (i + 1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    }
  }
  itemRows += '<tr><td colspan="4" align="center"><b>Tổng cộng</b></td><td align="right"><b>' + (tongSL ? fmt(tongSL) : '') + '</b></td><td></td><td></td></tr>';

  const body = docHeaderHtmlBP(v.boPhan, v.soBB, 'BBBG')
    + '<h1>Biên bản bàn giao</h1>'
    + '<p class="center"><i>(Công cụ dụng cụ – Tài sản – Vật tư – Thiết bị – Hồ sơ)</i></p>'
    + '<p class="center">Số: ' + dot(v.soBB, '........./BBBG-............') + '</p>'
    + '<h2>I. THÔNG TIN CHUNG</h2>'
    + '<p><b>1. Loại bàn giao</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(HV_LOAI, v.loai, v.loaiKhac) + '</p>'
    + '<p><b>2. Lý do / hình thức bàn giao</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(HV_LYDO, v.lyDo, v.lyDoKhac) + '</p>'
    + '<p>3. Thời gian bàn giao: ' + dot(v.thoiGian, '...... giờ ...... phút, ngày ...... tháng ...... năm 20......') + '</p>'
    + '<p>4. Địa điểm bàn giao: ' + dot(v.diaDiem) + '</p>'
    + '<p>5. Căn cứ (đề xuất / phiếu xuất kho / quyết định số): ' + dot(v.canCu) + '</p>'
    + '<h2>II. CÁC BÊN THAM GIA BÀN GIAO</h2>'
    + '<table><thead><tr><th>Nội dung</th><th>BÊN GIAO (A)</th><th>BÊN NHẬN (B)</th></tr></thead><tbody>'
    + '<tr><td>Họ và tên</td><td>' + dot(v.benGiao.ten) + '</td><td>' + dot(v.benNhan.ten) + '</td></tr>'
    + '<tr><td>Chức vụ</td><td>' + dot(v.benGiao.chucVu) + '</td><td>' + dot(v.benNhan.chucVu) + '</td></tr>'
    + '<tr><td>Bộ phận / Chi nhánh</td><td>' + dot(v.benGiao.boPhan) + '</td><td>' + dot(v.benNhan.boPhan) + '</td></tr>'
    + '<tr><td>Điện thoại / Mã NV</td><td>' + dot(v.benGiao.dienThoai) + '</td><td>' + dot(v.benNhan.dienThoai) + '</td></tr>'
    + '</tbody></table>'
    + '<h2>III. NỘI DUNG BÀN GIAO</h2>'
    + '<table><thead><tr><th>STT</th><th>Mã / Serial</th><th>Tên công cụ – tài sản – vật tư</th><th>ĐVT</th><th>SL</th><th>Tình trạng</th><th>Ghi chú</th></tr></thead><tbody>' + itemRows + '</tbody></table>'
    + '<p><i>Tình trạng ghi: Mới – Tốt – Cũ (còn dùng) – Hỏng/cần sửa – Thiếu.</i></p>'
    + '<h2>IV. HỒ SƠ KÈM THEO VÀ GHI NHẬN CHÊNH LỆCH</h2>'
    + '<p><b>1. Hồ sơ kèm theo</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(HV_HOSO, v.hoSo, v.hoSoKhac) + '</p>'
    + '<p><b>2. Chênh lệch, hư hỏng, thiếu hụt phát hiện khi bàn giao:</b></p>'
    + '<p style="margin-left:18pt">' + dot(v.chenhLech, '(không có)') + '</p>'
    + '<h2>V. CAM KẾT TRÁCH NHIỆM</h2>'
    + '<p>1. Bên giao bàn giao đúng, đủ theo danh mục trên; chịu trách nhiệm về số liệu và tình trạng tại thời điểm bàn giao.</p>'
    + '<p>2. Bên nhận đã kiểm đếm, đối chiếu thực tế, nhận đúng và đủ; kể từ thời điểm ký, chịu trách nhiệm bảo quản, sử dụng đúng mục đích và hoàn trả khi có yêu cầu.</p>'
    + '<p>3. Hư hỏng, mất mát phát sinh sau thời điểm bàn giao do Bên nhận chịu trách nhiệm theo quy định của Công ty. Sai lệch phát hiện trong vòng ' + dot(v.soNgay, '......') + ' ngày kể từ ngày bàn giao: hai bên lập biên bản bổ sung.</p>'
    + '<p>4. Biên bản lập thành ' + dot(v.soBan, '......') + ' bản, mỗi bên giữ 01 bản, 01 bản chuyển Hành chính – Kế toán để cập nhật sổ sách, thẻ kho.</p>'
    + docSignHtml4(['BÊN BÀN GIAO', 'BÊN NHẬN BÀN GIAO'], ['(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)'], [(v.sig || {}).benGiao, (v.sig || {}).benNhan], [(v.benGiao && v.benGiao.ten) || '', (v.benNhan && v.benNhan.ten) || '']);
  return docWrap('Biên bản bàn giao', body);
}

const CELL = 'padding:4px 8px;font-size:13px';
export const renderHandoverEdit = () => rerender();
export function HandoverEdit() {
  const v = S.HV;
  if (!v) return null;
  const F = (k) => cinp(v[k], (x) => A.hvField(k, x));
  const Pn = (side, k) => cinp(v[side][k], (x) => A.hvPerson(side, k, x));
  const It = (i, k) => cinp(v.items[i][k], (x) => A.hvItem(i, k, x));
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('handover')}>‹</button><div className="ttl">Biên bản bàn giao</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:110px')}>
        <div style={st('display:flex;gap:8px')}>
          <div style={{ flex: 1 }}><label className="lbl">Số biên bản (tự động, có thể sửa)</label><input className="inp" {...F('soBB')} /></div>
          <div style={{ flex: 1 }}><label className="lbl">Bộ phận / Chi nhánh</label><input className="inp" {...F('boPhan')} /></div>
        </div>

        <label className="lbl" style={st('margin-top:10px')}>1. Loại bàn giao (chạm để chọn, có thể chọn nhiều)</label>
        {chipGroupUI(HV_LOAI, v.loai, (val) => A.hvToggle('loai', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('loaiKhac')} />

        <label className="lbl" style={st('margin-top:12px')}>2. Lý do / hình thức bàn giao</label>
        {chipGroupUI(HV_LYDO, v.lyDo, (val) => A.hvToggle('lyDo', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('lyDoKhac')} />

        <label className="lbl" style={st('margin-top:12px')}>3. Thời gian bàn giao</label>
        <input className="inp" placeholder="VD: 14 giờ 30 phút, ngày 05 tháng 09 năm 2026" {...F('thoiGian')} />
        <label className="lbl" style={st('margin-top:10px')}>4. Địa điểm bàn giao</label><input className="inp" {...F('diaDiem')} />
        <label className="lbl" style={st('margin-top:10px')}>5. Căn cứ (đề xuất / phiếu xuất kho / quyết định số)</label><input className="inp" {...F('canCu')} />

        <div className="bcsec" style={st('margin-top:16px')}>Bên giao (A)</div>
        <input className="inp" placeholder="Họ tên" {...Pn('benGiao', 'ten')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Chức vụ" {...Pn('benGiao', 'chucVu')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Bộ phận / Chi nhánh" {...Pn('benGiao', 'boPhan')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Điện thoại / Mã NV" {...Pn('benGiao', 'dienThoai')} />

        <div className="bcsec" style={st('margin-top:16px')}>Bên nhận (B)</div>
        <input className="inp" placeholder="Họ tên" {...Pn('benNhan', 'ten')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Chức vụ" {...Pn('benNhan', 'chucVu')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Bộ phận / Chi nhánh" {...Pn('benNhan', 'boPhan')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Điện thoại / Mã NV" {...Pn('benNhan', 'dienThoai')} />

        <div className="bcsec" style={st('margin-top:16px')}>III. Nội dung bàn giao · {v.items.length} mục</div>
        <div style={st('overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);margin-bottom:8px')}>
          {v.items.length ? (
            <table className="bctbl">
              <thead><tr><th>Tên</th><th>Mã/Serial</th><th>ĐVT</th><th>SL</th><th>Tình trạng</th><th>Ghi chú</th><th></th></tr></thead>
              <tbody>
                {v.items.map((it, i) => (
                  <tr key={i}>
                    <td><input className="inp" style={st(CELL)} {...It(i, 'ten')} /></td>
                    <td><input className="inp" style={st(CELL + ';width:70px')} {...It(i, 'ma')} /></td>
                    <td><input className="inp" style={st(CELL + ';width:55px')} {...It(i, 'dvt')} /></td>
                    <td><input className="inp" style={st(CELL + ';width:55px')} {...It(i, 'sl')} /></td>
                    <td><input className="inp" style={st(CELL + ';width:85px')} {...It(i, 'tinhTrang')} /></td>
                    <td><input className="inp" style={st(CELL + ';width:85px')} {...It(i, 'ghiChu')} /></td>
                    <td><button className="addbat" style={st('color:var(--red);display:flex')} onClick={() => A.hvItemDel(i)}>{I('x', 15)}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
        <div style={st('display:flex;gap:8px;flex-wrap:wrap')}>
          <button className="addbat" onClick={() => A.hvItemAdd()}>+ Thêm dòng</button>
          <button className="addbat" style={st('display:flex;align-items:center;gap:6px')} onClick={() => A.pickOpen(false)}>{I('download', 15)}Lấy từ kỳ kiểm kê</button>
        </div>
        {renderPicker(false)}

        <label className="lbl" style={st('margin-top:16px')}>1. Hồ sơ kèm theo</label>
        {chipGroupUI(HV_HOSO, v.hoSo, (val) => A.hvToggle('hoSo', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('hoSoKhac')} />
        <label className="lbl" style={st('margin-top:12px')}>2. Chênh lệch, hư hỏng, thiếu hụt phát hiện khi bàn giao (tuỳ chọn)</label>
        <textarea className="inp" rows={2} {...F('chenhLech')} />

        <div style={st('display:flex;gap:8px;margin-top:10px')}>
          <div style={{ flex: 1 }}><label className="lbl">Hạn đối chiếu bổ sung (ngày)</label><input className="inp" {...F('soNgay')} /></div>
          <div style={{ flex: 1 }}><label className="lbl">Số bản lập</label><input className="inp" {...F('soBan')} /></div>
        </div>

        {sigSection('hv')}
      </div>
      <div className="botbar"><div className="botin" style={st('display:flex;gap:8px')}>
        <button className="bcbtn" style={st('flex:1;background:var(--card);border:1px solid var(--line)')} onClick={() => A.hvPrint()}>{I('eye', 17)}Xem trước, In</button>
        <button className="bcbtn bcok" style={{ flex: 1 }} onClick={() => A.hvSave(true)}>{I('file', 17)}Lưu &amp; tải Word</button>
      </div></div>
    </>
  );
}

export const actions = {
  hvNew() { S.HV = newHV(true); S.route = { view: 'handoverEdit' }; render(); },
  hvOpen(id) { let v = null; for (let i = 0; i < db.handovers.length; i++) if (db.handovers[i].id === id) v = db.handovers[i]; if (!v) return; S.HV = v; S.route = { view: 'handoverEdit' }; render(); },
  hvDelete(id) { if (!confirm('Xoá biên bản này?')) return; db.handovers = db.handovers.filter((v) => v.id !== id); store.save(); rerender(); },
  hvBlank() { X.exportDocHtml(generateHandoverDoc(newHV(false)), 'Mau_BienBanBanGiao_trong.doc'); },
  hvField(k, val) { S.HV[k] = val; },
  hvPerson(side, k, val) { S.HV[side][k] = val; },
  hvToggle(field, val) { toggleArr(S.HV[field], val); rerender(); },
  hvItemAdd() { S.HV.items.push({ ma: '', ten: '', dvt: '', sl: '', tinhTrang: '', ghiChu: '' }); rerender(); },
  hvItem(i, k, val) { S.HV.items[i][k] = val; },
  hvItemDel(i) { S.HV.items.splice(i, 1); rerender(); },
  hvSave(withExport) {
    const HV = S.HV;
    if (!db.handovers.some((v) => v.id === HV.id)) db.handovers.unshift(HV);
    store.save();
    toast('Đã lưu biên bản bàn giao');
    if (withExport) X.exportDocHtml(generateHandoverDoc(), 'BienBanBanGiao_' + (HV.soBB || HV.id) + '.doc');
  },
  hvPrint() { A.hvSave(false); X.printPreviewHtml(generateHandoverDoc()); },
};
