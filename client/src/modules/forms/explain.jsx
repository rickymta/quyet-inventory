/* Phiếu/Bản giải trình thất thoát (dòng gốc 3049–3261) + hành động ex* (6965–6985) */
import { S, A, X, db, esc, fmt, soThanhChu, store, toast, I, st, rerender, render, canDel, canEdit } from '../../core';
import { renderPicker, chkLine, chipGroupUI, toggleArr, nextSoVanBan, profileFillEX, dot, cinp, sigSection } from './common.jsx';

export const EX_LOAI = ['Công cụ dụng cụ', 'Tài sản cố định', 'Vật tư tiêu hao', 'Hàng hóa', 'Thiết bị – máy móc'];
export const EX_PHATHIEN = ['Kiểm kê định kỳ', 'Kiểm kê đột xuất', 'Đối soát tồn / doanh thu', 'Báo cáo bộ phận', 'Đối soát công nợ NCC'];
export const EX_NGUYENNHAN = ['Hao hụt định mức', 'Sai sót nhập – xuất', 'Hư hỏng / hết hạn', 'Mất mát / thất lạc', 'Dùng sai mục đích', 'Bàn giao thiếu chứng từ', 'Vượt định mức tiêu hao'];
export const EX_BANGCHUNG = ['Biên bản kiểm kê', 'Phiếu nhập / xuất kho', 'Thẻ kho / sổ kho', 'Hình ảnh / camera', 'Báo cáo tiêu hao / DT'];
export function newEX(autoNumber) {
  const o = {
    id: Date.now().toString(36), sig: {}, soPhieu: autoNumber ? nextSoVanBan('GT') : '', boPhan: '',
    nguoiGiaiTrinh: { ten: '', chucVu: '', boPhan: '', thoiGian: '' },
    loai: [], loaiKhac: '', phatHien: [], phatHienKhac: '',
    ngayPhatHien: '', thoiDiemXayRa: '', diaDiem: '', canCu: '',
    items: [],
    vanDe: '', nguyenNhan: [], nguyenNhanKhac: '', nguyenNhanChiTiet: '', caNhanLienQuan: '',
    bangChung: [], bangChungKhac: '',
    bienPhap: [],
    dxGiamTon: false, dxHaoHut: false, dxTruyTim: false, dxTruyTimHan: '', dxBoiHoan: false, dxBoiHoanTien: '', dxBoiHoanNguoi: '', dxKhac: false, dxKhacText: '',
    createdAt: Date.now(),
  };
  if (autoNumber) profileFillEX(o);
  return o;
}

export const renderExplainList = () => rerender();
export function ExplainList() {
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('reporthub')}>‹</button><div className="ttl">Bản giải trình thất thoát</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:100px')}>
        {canEdit('explain') ? <div style={st('display:flex;gap:8px;margin-bottom:16px')}><button className="btn btn-primary" style={{ flex: 1 }} onClick={() => A.exNew()}>+ Tạo phiếu mới</button></div> : null}
        <button className="addbat" style={st('margin-bottom:16px;display:flex;align-items:center;gap:6px')} onClick={() => A.exBlank()}>{I('download', 15)}Tải mẫu trống (.doc) để gửi người khác tự điền tay</button>
        {!db.explains.length ? <div className="card" style={st('color:var(--mut);text-align:center')}>Chưa có phiếu giải trình nào.</div> : null}
        {db.explains.map((v) => (
          <div key={v.id} className="card" style={st('margin-bottom:10px;cursor:pointer')} onClick={() => A.exOpen(v.id)}>
            <div style={st('display:flex;justify-content:space-between')}>
              <div style={{ fontWeight: 700 }}>{v.soPhieu ? 'Phiếu số ' + v.soPhieu : 'Bản giải trình thất thoát'}</div>
              {canDel() && canEdit('explain') ? <button className="addbat" style={st('color:var(--red)')} onClick={(e) => { e.stopPropagation(); A.exDelete(v.id); }}>Xoá</button> : null}
            </div>
            <div style={st('font-size:13px;color:var(--mut);margin-top:4px')}>{v.nguoiGiaiTrinh.ten || '(chưa đặt tên)'}</div>
            <div style={st('font-size:12px;color:var(--mut2);margin-top:2px')}>{(v.ngayPhatHien ? 'Ngày ' + v.ngayPhatHien + ' · ' : '') + v.items.length + ' mã thất thoát'}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function generateExplainDoc(v) {
  v = v || S.EX;
  const docHeaderHtmlBP = X.docHeaderHtmlBPStr || X.docHeaderHtmlBP;
  const docSignHtml4 = X.docSignHtml4Str || X.docSignHtml4;
  const docWrap = X.docWrapStr || X.docWrap;
  let itemRows = '';
  const rows = 6;
  let tongTien = 0;
  for (let i = 0; i < Math.max(v.items.length, rows); i++) {
    const it = v.items[i];
    if (it) {
      const tt = parseFloat(String(it.thanhTien).replace(/[^\d.-]/g, ''));
      if (!isNaN(tt)) tongTien += tt;
      itemRows += '<tr><td align="center">' + (i + 1) + '</td><td align="center">' + esc(it.ma) + '</td><td>' + esc(it.ten) + '</td><td align="center">' + esc(it.dvt) + '</td><td align="right">' + esc(it.slSoSach) + '</td><td align="right">' + esc(it.slThucTe) + '</td><td align="right">' + esc(it.chenh) + '</td><td align="right">' + esc(it.donGia) + '</td><td align="right">' + esc(it.thanhTien) + '</td></tr>';
    } else {
      itemRows += '<tr><td align="center">' + (i + 1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    }
  }
  itemRows += '<tr><td colspan="8" align="center"><b>Tổng giá trị thất thoát</b></td><td align="right"><b>' + (tongTien ? fmt(tongTien) : '') + '</b></td></tr>';

  let bienPhapRows = '';
  const bpRows = 5;
  for (let j = 0; j < Math.max(v.bienPhap.length, bpRows); j++) {
    const bp = v.bienPhap[j];
    if (bp) {
      bienPhapRows += '<tr><td align="center">' + (j + 1) + '</td><td>' + esc(bp.noiDung) + '</td><td>' + esc(bp.nguoiPhuTrach) + '</td><td align="center">' + esc(bp.thoiHan) + '</td><td align="center">' + esc(bp.nhom) + '</td></tr>';
    } else {
      bienPhapRows += '<tr><td align="center">' + (j + 1) + '</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
    }
  }

  let dx = '';
  dx += '<p>' + (v.dxGiamTon ? '☑' : '☐') + ' Điều chỉnh giảm tồn / xuất hủy trên sổ sách</p>';
  dx += '<p>' + (v.dxHaoHut ? '☑' : '☐') + ' Tính vào hao hụt định mức được chấp nhận</p>';
  dx += '<p>' + (v.dxTruyTim ? '☑' : '☐') + ' Tiếp tục truy tìm, thời hạn: ' + dot(v.dxTruyTimHan, '........................') + '</p>';
  dx += '<p>' + (v.dxBoiHoan ? '☑' : '☐') + ' Bồi hoàn: ' + dot(v.dxBoiHoanTien, '...........................') + ' đồng, người chịu trách nhiệm: ' + dot(v.dxBoiHoanNguoi, '..................') + '</p>';
  dx += '<p>' + (v.dxKhac ? '☑' : '☐') + ' Khác: ' + dot(v.dxKhacText, '......................................................') + '</p>';

  const body = docHeaderHtmlBP(v.boPhan, v.soPhieu, 'GT')
    + '<h1>Bản giải trình thất thoát</h1>'
    + '<p class="center"><i>(Vật tư – Tài sản – Công cụ dụng cụ – Hàng hóa)</i></p>'
    + '<p class="center">Số: ' + dot(v.soPhieu, '........./GT-............') + '</p>'
    + '<p><b>Kính gửi:</b> Ban Giám đốc; Bộ phận Hành chính – Kế toán</p>'
    + '<h2>I. NGƯỜI GIẢI TRÌNH</h2>'
    + '<table><tbody>'
    + '<tr><td width="35%">Họ và tên</td><td>' + dot(v.nguoiGiaiTrinh.ten) + '</td></tr>'
    + '<tr><td>Chức vụ</td><td>' + dot(v.nguoiGiaiTrinh.chucVu) + '</td></tr>'
    + '<tr><td>Bộ phận / Chi nhánh</td><td>' + dot(v.nguoiGiaiTrinh.boPhan) + '</td></tr>'
    + '<tr><td>Thời gian phụ trách (từ – đến)</td><td>' + dot(v.nguoiGiaiTrinh.thoiGian) + '</td></tr>'
    + '</tbody></table>'
    + '<h2>II. THÔNG TIN SỰ VIỆC</h2>'
    + '<p><b>1. Loại thất thoát</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(EX_LOAI, v.loai, v.loaiKhac) + '</p>'
    + '<p><b>2. Phát hiện qua</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(EX_PHATHIEN, v.phatHien, v.phatHienKhac) + '</p>'
    + '<p>3. Thời điểm phát hiện: ' + dot(v.ngayPhatHien, 'ngày ...... tháng ...... năm 20......') + '</p>'
    + '<p>4. Thời điểm xảy ra (ước tính): ' + dot(v.thoiDiemXayRa) + '</p>'
    + '<p>5. Địa điểm / kho / chi nhánh: ' + dot(v.diaDiem) + '</p>'
    + '<p>6. Căn cứ (biên bản kiểm kê, phiếu, báo cáo số): ' + dot(v.canCu) + '</p>'
    + '<h2>III. DANH MỤC THẤT THOÁT</h2>'
    + '<table><thead><tr><th>STT</th><th>Mã</th><th>Tên vật tư – tài sản – CCDC</th><th>ĐVT</th><th>SL sổ sách</th><th>SL thực tế</th><th>Chênh lệch</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>' + itemRows + '</tbody></table>'
    + '<p>Bằng chữ: <i>' + (tongTien ? esc(soThanhChu(tongTien)) : dot('')) + '</i></p>'
    + '<h2>IV. NỘI DUNG GIẢI TRÌNH</h2>'
    + '<p><b>1. Vấn đề (diễn biến, thời gian, bối cảnh):</b></p>'
    + '<p style="margin-left:18pt">' + dot(v.vanDe) + '</p>'
    + '<p><b>2. Nguyên nhân</b> <i>(tích chọn nhóm nguyên nhân):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(EX_NGUYENNHAN, v.nguyenNhan, v.nguyenNhanKhac) + '</p>'
    + '<p><i>Giải thích chi tiết nguyên nhân:</i></p>'
    + '<p style="margin-left:18pt">' + dot(v.nguyenNhanChiTiet) + '</p>'
    + '<p>3. Cá nhân / bộ phận liên quan: ' + dot(v.caNhanLienQuan) + '</p>'
    + '<p><b>4. Bằng chứng kèm theo</b> <i>(tích chọn):</i></p>'
    + '<p style="margin-left:18pt">' + chkLine(EX_BANGCHUNG, v.bangChung, v.bangChungKhac) + '</p>'
    + '<h2>V. BIỆN PHÁP KHẮC PHỤC VÀ KIỂM SOÁT LÂU DÀI</h2>'
    + '<table><thead><tr><th>STT</th><th>Biện pháp (khắc phục / phòng ngừa)</th><th>Người phụ trách</th><th>Thời hạn</th><th>Nhóm</th></tr></thead><tbody>' + bienPhapRows + '</tbody></table>'
    + '<h2>VI. ĐỀ XUẤT XỬ LÝ</h2>'
    + dx
    + '<h2>VII. CAM KẾT</h2>'
    + '<p>Tôi cam kết nội dung giải trình trên là đúng sự thật, đầy đủ và chịu trách nhiệm trước Công ty về thông tin đã cung cấp. Tôi sẽ phối hợp cung cấp thêm chứng từ, bằng chứng khi được yêu cầu.</p>'
    + docSignHtml4(['NGƯỜI GIẢI TRÌNH', 'XÁC NHẬN CỦA LÃNH ĐẠO ĐƠN VỊ'], ['(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)'], [(v.sig || {}).nguoiGiaiTrinh, (v.sig || {}).lanhDao], [(v.nguoiGiaiTrinh && v.nguoiGiaiTrinh.ten) || '', X.sgOf(v.boPhan).giamDoc]);
  return docWrap('Bản giải trình thất thoát', body);
}

const CELL = 'padding:4px 8px;font-size:13px';
const ROW = 'display:flex;align-items:center;gap:8px;padding:6px 0';
export const renderExplainEdit = () => rerender();
export function ExplainEdit() {
  const v = S.EX;
  if (!v) return null;
  const F = (k) => cinp(v[k], (x) => A.exField(k, x));
  const Pn = (k) => cinp(v.nguoiGiaiTrinh[k], (x) => A.exPerson(k, x));
  const It = (i, k) => cinp(v.items[i][k], (x) => A.exItem(i, k, x));
  const Bp = (i, k) => cinp(v.bienPhap[i][k], (x) => A.exBP(i, k, x));
  const Ck = (k) => ({ checked: !!v[k], onChange: (e) => { A.exField(k, e.target.checked); rerender(); } });
  const itCols = [['ten', ''], ['ma', ';width:65px'], ['dvt', ';width:50px'], ['slSoSach', ';width:50px'], ['slThucTe', ';width:50px'], ['chenh', ';width:50px'], ['donGia', ';width:70px'], ['thanhTien', ';width:80px']];
  const bpCols = [['noiDung', ''], ['nguoiPhuTrach', ';width:90px'], ['thoiHan', ';width:70px'], ['nhom', ';width:60px']];
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('explain')}>‹</button><div className="ttl">Bản giải trình thất thoát</div></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:110px')}>
        <div style={st('display:flex;gap:8px')}>
          <div style={{ flex: 1 }}><label className="lbl">Số phiếu (tự động, có thể sửa)</label><input className="inp" {...F('soPhieu')} /></div>
          <div style={{ flex: 1 }}><label className="lbl">Bộ phận / Chi nhánh</label><input className="inp" {...F('boPhan')} /></div>
        </div>

        <div className="bcsec" style={st('margin-top:16px')}>I. Người giải trình</div>
        <input className="inp" placeholder="Họ tên" {...Pn('ten')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Chức vụ" {...Pn('chucVu')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Bộ phận / Chi nhánh" {...Pn('boPhan')} style={st('margin-bottom:6px')} />
        <input className="inp" placeholder="Thời gian phụ trách (từ – đến)" {...Pn('thoiGian')} />

        <label className="lbl" style={st('margin-top:14px')}>II.1. Loại thất thoát</label>
        {chipGroupUI(EX_LOAI, v.loai, (val) => A.exToggle('loai', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('loaiKhac')} />

        <label className="lbl" style={st('margin-top:12px')}>II.2. Phát hiện qua</label>
        {chipGroupUI(EX_PHATHIEN, v.phatHien, (val) => A.exToggle('phatHien', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('phatHienKhac')} />

        <div style={st('display:flex;gap:8px;margin-top:10px')}><div style={{ flex: 1 }}><label className="lbl">3. Thời điểm phát hiện</label><input className="inp" placeholder="VD: ngày 05 tháng 09 năm 2026" {...F('ngayPhatHien')} /></div></div>
        <label className="lbl" style={st('margin-top:10px')}>4. Thời điểm xảy ra (ước tính)</label><input className="inp" {...F('thoiDiemXayRa')} />
        <label className="lbl" style={st('margin-top:10px')}>5. Địa điểm / kho / chi nhánh</label><input className="inp" {...F('diaDiem')} />
        <label className="lbl" style={st('margin-top:10px')}>6. Căn cứ (biên bản kiểm kê, phiếu, báo cáo số)</label><input className="inp" {...F('canCu')} />

        <div className="bcsec" style={st('margin-top:16px')}>III. Danh mục thất thoát · {v.items.length} mục</div>
        <div style={st('overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);margin-bottom:8px')}>
          {v.items.length ? (
            <table className="bctbl">
              <thead><tr><th>Tên</th><th>Mã</th><th>ĐVT</th><th>SS</th><th>TT</th><th>Chênh</th><th>Đơn giá</th><th>T.Tiền</th><th></th></tr></thead>
              <tbody>
                {v.items.map((it, i) => (
                  <tr key={i}>
                    {itCols.map(([k, w]) => <td key={k}><input className="inp" style={st(CELL + w)} {...It(i, k)} /></td>)}
                    <td><button className="addbat" style={st('color:var(--red);display:flex')} onClick={() => A.exItemDel(i)}>{I('x', 15)}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
        <div style={st('display:flex;gap:8px;flex-wrap:wrap')}>
          <button className="addbat" onClick={() => A.exItemAdd()}>+ Thêm dòng</button>
          <button className="addbat" style={st('display:flex;align-items:center;gap:6px')} onClick={() => A.pickOpen(true)}>{I('download', 15)}Lấy chênh lệch từ kỳ kiểm kê</button>
        </div>
        {renderPicker(true)}
        <div className="note-warn" style={st('margin-top:8px;display:flex;gap:8px;align-items:flex-start')}>{I('warn', 16)}<span>Đơn giá, Thành tiền app không tự tính được (không có sẵn đơn giá vật tư) — bạn điền tay nếu cần, để trống thì báo cáo để trống ô đó.</span></div>

        <label className="lbl" style={st('margin-top:16px')}>IV.1. Vấn đề (diễn biến, thời gian, bối cảnh) — tuỳ chọn</label>
        <textarea className="inp" rows={2} {...F('vanDe')} />

        <label className="lbl" style={st('margin-top:12px')}>IV.2. Nguyên nhân (nhóm)</label>
        {chipGroupUI(EX_NGUYENNHAN, v.nguyenNhan, (val) => A.exToggle('nguyenNhan', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('nguyenNhanKhac')} />
        <textarea className="inp" rows={2} placeholder="Giải thích chi tiết nguyên nhân (tuỳ chọn)" style={st('margin-top:6px')} {...F('nguyenNhanChiTiet')} />

        <label className="lbl" style={st('margin-top:12px')}>IV.3. Cá nhân / bộ phận liên quan</label><input className="inp" {...F('caNhanLienQuan')} />

        <label className="lbl" style={st('margin-top:12px')}>IV.4. Bằng chứng kèm theo</label>
        {chipGroupUI(EX_BANGCHUNG, v.bangChung, (val) => A.exToggle('bangChung', val))}
        <input className="inp" placeholder="Khác (nếu có)" {...F('bangChungKhac')} />

        <div className="bcsec" style={st('margin-top:16px')}>V. Biện pháp khắc phục · {v.bienPhap.length} mục</div>
        <div style={st('overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);margin-bottom:8px')}>
          {v.bienPhap.length ? (
            <table className="bctbl">
              <thead><tr><th>Biện pháp</th><th>Người phụ trách</th><th>Thời hạn</th><th>Nhóm</th><th></th></tr></thead>
              <tbody>
                {v.bienPhap.map((bp, i) => (
                  <tr key={i}>
                    {bpCols.map(([k, w]) => <td key={k}><input className="inp" style={st(CELL + w)} {...Bp(i, k)} /></td>)}
                    <td><button className="addbat" style={st('color:var(--red);display:flex')} onClick={() => A.exBPDel(i)}>{I('x', 15)}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
        <button className="addbat" onClick={() => A.exBPAdd()}>+ Thêm biện pháp</button>

        <div className="bcsec" style={st('margin-top:16px')}>VI. Đề xuất xử lý</div>
        <label style={st(ROW)}><input type="checkbox" {...Ck('dxGiamTon')} /><span>Điều chỉnh giảm tồn / xuất hủy trên sổ sách</span></label>
        <label style={st(ROW)}><input type="checkbox" {...Ck('dxHaoHut')} /><span>Tính vào hao hụt định mức được chấp nhận</span></label>
        <label style={st(ROW)}><input type="checkbox" {...Ck('dxTruyTim')} /><span>Tiếp tục truy tìm</span></label>
        <input className="inp" placeholder="Thời hạn truy tìm" {...F('dxTruyTimHan')} style={st('margin-bottom:6px')} />
        <label style={st(ROW)}><input type="checkbox" {...Ck('dxBoiHoan')} /><span>Bồi hoàn</span></label>
        <div style={st('display:flex;gap:8px;margin-bottom:6px')}>
          <input className="inp" placeholder="Số tiền bồi hoàn" {...F('dxBoiHoanTien')} />
          <input className="inp" placeholder="Người chịu trách nhiệm" {...F('dxBoiHoanNguoi')} />
        </div>
        <label style={st(ROW)}><input type="checkbox" {...Ck('dxKhac')} /><span>Khác</span></label>
        <input className="inp" placeholder="Nội dung khác" {...F('dxKhacText')} />

        {sigSection('ex')}
      </div>
      <div className="botbar"><div className="botin" style={st('display:flex;gap:8px')}>
        <button className="bcbtn" style={st('flex:1;background:var(--card);border:1px solid var(--line)')} onClick={() => A.exPrint()}>{I('eye', 17)}Xem trước, In</button>
        <button className="bcbtn bcok" style={{ flex: 1 }} onClick={() => A.exSave(true)}>{I('file', 17)}Lưu &amp; tải Word</button>
      </div></div>
    </>
  );
}

export const actions = {
  exNew() { S.EX = newEX(true); S.route = { view: 'explainEdit' }; render(); },
  exOpen(id) { let v = null; for (let i = 0; i < db.explains.length; i++) if (db.explains[i].id === id) v = db.explains[i]; if (!v) return; S.EX = v; S.route = { view: 'explainEdit' }; render(); },
  exDelete(id) { if (!confirm('Xoá phiếu này?')) return; db.explains = db.explains.filter((v) => v.id !== id); store.save(); rerender(); },
  exBlank() { X.exportDocHtml(generateExplainDoc(newEX(false)), 'Mau_GiaiTrinhThatThoat_trong.doc'); },
  exField(k, val) { S.EX[k] = val; },
  exPerson(k, val) { S.EX.nguoiGiaiTrinh[k] = val; },
  exToggle(field, val) { toggleArr(S.EX[field], val); rerender(); },
  exItemAdd() { S.EX.items.push({ ma: '', ten: '', dvt: '', slSoSach: '', slThucTe: '', chenh: '', donGia: '', thanhTien: '' }); rerender(); },
  exItem(i, k, val) { S.EX.items[i][k] = val; },
  exItemDel(i) { S.EX.items.splice(i, 1); rerender(); },
  exBPAdd() { S.EX.bienPhap.push({ noiDung: '', nguoiPhuTrach: '', thoiHan: '', nhom: '' }); rerender(); },
  exBP(i, k, val) { S.EX.bienPhap[i][k] = val; },
  exBPDel(i) { S.EX.bienPhap.splice(i, 1); rerender(); },
  exSave(withExport) {
    const EX = S.EX;
    if (!db.explains.some((v) => v.id === EX.id)) db.explains.unshift(EX);
    store.save();
    toast('Đã lưu bản giải trình');
    if (withExport) X.exportDocHtml(generateExplainDoc(), 'GiaiTrinhThatThoat_' + (EX.soPhieu || EX.id) + '.doc');
  },
  exPrint() { A.exSave(false); X.printPreviewHtml(generateExplainDoc()); },
};
