/* Cảnh báo hạn sử dụng: dashboard (5081–5107), chọn kho gửi email (3262–3305), mailto an toàn, xuất Excel cảnh báo (3306–3452) */
import { S, A, X, esc, fmt, fmtDate, norm, daysTo, hsdEntries, BUCKETS, toast, klog, kkLoad, openModal, st, rerender } from '../../core';

/* ================= Chọn kho gửi email cảnh báo HSD ================= */
export function showHsdEmailPicker() {
  const entries = hsdEntries();
  const critical = entries.filter((e) => e.days < 90);
  if (!critical.length) { toast('Không có vật tư nào cần cảnh báo (HSD còn > 3 tháng)'); return; }
  const branchMap = {};
  critical.forEach((e) => {
    const br = e.branch || 'Kho chính';
    if (!branchMap[br]) branchMap[br] = [];
    branchMap[br].push(e);
  });
  const branches = Object.keys(branchMap);
  if (branches.length === 1) { exportHsdAlert(branches[0]); return; }
  openModal(() => (
    <div className="ovl" id="ovl" onClick={(e) => { if (e.target === e.currentTarget) A.closeSheet(); }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="shead">
          <div style={st('flex:1;min-width:0')}>
            <div style={st('font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7d9bd1;margin-bottom:4px')}>GỬI EMAIL CẢNH BÁO HSD</div>
            <div style={st('font-weight:700;font-size:16px;color:#f0f0f0')}>Chọn kho để gửi riêng</div>
            <div style={st('font-size:12px;color:#6b7280;margin-top:3px')}>{critical.length} mã cần cảnh báo · {branches.length} kho</div>
          </div>
          <button className="sx" onClick={() => A.closeSheet()}>✕</button>
        </div>
        <div style={st('padding:12px 20px 28px')}>
          <button onClick={() => { A.closeSheet(); exportHsdAlert(); }} style={st('display:block;width:100%;border:1px solid rgba(77,166,255,.3);background:rgba(77,166,255,.07);color:#7d9bd1;font:inherit;font-size:14px;font-weight:700;border-radius:14px;padding:13px;text-align:left;cursor:pointer;margin-bottom:10px')}>
            📧 Tất cả kho — 1 email tổng hợp ({critical.length} mã)</button>
          <div style={st('font-size:11px;color:#6b7280;text-align:center;margin-bottom:10px')}>── hoặc gửi riêng từng kho ──</div>
          {branches.map((br) => {
            const items = branchMap[br];
            const exp = items.filter((e) => e.days < 0).length;
            const m1 = items.filter((e) => e.days >= 0 && e.days <= 30).length;
            const m3 = items.filter((e) => e.days > 30 && e.days <= 90).length;
            let badge = '';
            if (exp > 0) badge += ' 🔴 ' + exp + ' hết hạn';
            if (m1 > 0) badge += ' 🟠 ' + m1 + ' <1th';
            if (m3 > 0) badge += ' 🟡 ' + m3 + ' <3th';
            return (
              <button key={br} onClick={() => { A.closeSheet(); exportHsdAlert(br); }} style={st('display:block;width:100%;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:#ffffff;font:inherit;font-size:14px;font-weight:600;border-radius:14px;padding:13px;text-align:left;cursor:pointer;margin-bottom:8px')}>
                <div style={{ fontWeight: 700 }}>{br}</div>
                <div style={st('font-size:12px;color:#6b7280;margin-top:3px')}>{items.length} mã cần cảnh báo ·{badge}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ));
}

/* ================= Mở email an toàn — tránh URL quá dài ================= */
export function openMailtoSafe(subject, body) {
  const url = 'mailto:?subject=' + encodeURIComponent(subject);
  function doOpen() { window.location.href = url; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(body).then(() => {
      doOpen();
      setTimeout(() => { toast('✉ Đã mở soạn email — tiêu đề điền sẵn. Nhấn Ctrl+V (hoặc Dán) để điền nội dung.'); }, 400);
    }).catch(() => {
      /* Clipboard thất bại — thử body ngắn */
      const short = body.length > 500 ? body.substring(0, 500) + '\n\n[...xem tiếp trong file đính kèm]' : body;
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(short);
    });
  } else {
    const short = body.length > 500 ? body.substring(0, 500) + '\n\n[...xem tiếp trong file đính kèm]' : body;
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(short);
  }
}

export function exportHsdAlert(filterBranch) {
  const entries = hsdEntries();
  const critical = entries.filter((e) => e.days < 90 && (!filterBranch || norm(e.branch) === norm(filterBranch)));
  if (!critical.length) { toast('Không có vật tư nào cần cảnh báo' + (filterBranch ? ' tại ' + filterBranch : '')); return; }
  const now = new Date();
  const dateStr = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
  /* Phân loại theo mức */
  const expired = critical.filter((e) => e.days < 0);
  const nearExpiry = critical.filter((e) => e.days >= 0);
  const SO_NGAY = 90;
  const hanXuLyDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const hanXuLy = String(hanXuLyDate.getDate()).padStart(2, '0') + '/' + String(hanXuLyDate.getMonth() + 1).padStart(2, '0') + '/' + hanXuLyDate.getFullYear();
  const fmtQty = (e) => ((e.qty !== null && e.qty !== undefined && e.qty !== '') ? fmt(e.qty) + ' ' + (e.unit || '') : '—');
  const lines = [];
  lines.push('Kính gửi: Ban Giám đốc cơ sở ' + (filterBranch || 'tất cả cơ sở') + ' & Thủ kho,');
  lines.push('');
  lines.push('Phòng Hành chính Hậu cần gửi danh sách vật tư cận date và hết hạn cần xử lý gấp:');
  lines.push('');
  lines.push('📊 TỔNG QUAN');
  lines.push('Hết hạn: ' + expired.length + ' mã (Cần tiêu hủy/xuất hủy)');
  lines.push('Cận date (< ' + SO_NGAY + ' ngày): ' + nearExpiry.length + ' mã (Ưu tiên xuất dùng/luân chuyển)');
  if (expired.length) {
    lines.push('');
    lines.push('🚨 DANH SÁCH HÀNG HẾT HẠN (CẦN XỬ LÝ NGAY)');
    expired.forEach((e) => {
      lines.push(e.name + ' (' + (e.code || '—') + ') — Lô: ' + (e.lot || '—') + (e.label ? ' [' + e.label + ']' : '') + ' | SL: ' + fmtQty(e) + ' | HSD: ' + fmtDate(e.exp) + ' (Đã quá hạn ' + Math.abs(e.days) + ' ngày)');
    });
  }
  if (nearExpiry.length) {
    lines.push('');
    lines.push('⚠️ DANH SÁCH HÀNG CẬN DATE (ƯU TIÊN XUẤT TRƯỚC)');
    nearExpiry.forEach((e) => {
      lines.push(e.name + ' (' + (e.code || '—') + ') — Lô: ' + (e.lot || '—') + (e.label ? ' [' + e.label + ']' : '') + ' | SL: ' + fmtQty(e) + ' | HSD: ' + fmtDate(e.exp) + ' (Còn ' + e.days + ' ngày)');
    });
  }
  lines.push('');
  lines.push('👉 Đề nghị Thủ kho: Kiểm tra thực tế kho và cập nhật phương án xử lý (luân chuyển / thanh lý / hủy) trên hệ thống trước ngày ' + hanXuLy + '.');
  lines.push('(Email tự động, vui lòng không phản hồi trực tiếp)\nMAI VĂN QUYẾT - CHUYÊN VIÊN HÀNH CHÍNH\nCÔNG TY CỔ PHẦN NỤ CƯỜI MỚI VIỆT NAM');
  const body = lines.join('\n');
  const subject = '[MedDental] CẢNH BÁO hạn sử dụng vật tư' + (filterBranch ? ' – ' + filterBranch : '') + ' – ' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
  const fname = 'CanhBao_HSD_' + (filterBranch ? filterBranch.replace(/[^\w]/g, '_') + '_' : '') + dateStr.replace(/\//g, '-') + '.xlsx';
  /* Nếu không có ExcelJS thì tải; không được thì mở mailto luôn */
  if (typeof window.ExcelJS === 'undefined') {
    kkLoad('exceljs').then((ok) => { if (ok) exportHsdAlert(filterBranch); else openMailtoSafe(subject, body); });
    return;
  }
  const ExcelJS = window.ExcelJS;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Cảnh báo HSD'); X.xlPrint(ws, '3:3', true);
  [22, 14, 45, 8, 10, 14, 16, 18, 20, 30].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const thin = { style: 'thin' }; const bAll = { top: thin, left: thin, bottom: thin, right: thin };
  /* Tiêu đề */
  ws.mergeCells(1, 1, 1, 10);
  const tc = ws.getCell(1, 1);
  tc.value = 'CẢNH BÁO HẠN SỬ DỤNG VẬT TƯ – MEDDENTAL';
  tc.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFE45E' } };
  tc.alignment = { horizontal: 'center', vertical: 'middle' };
  tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1130' } };
  ws.getRow(1).height = 22;
  ws.mergeCells(2, 1, 2, 10);
  const dc = ws.getCell(2, 1);
  dc.value = 'Ngày lập: ' + dateStr + ' · ' + critical.length + ' mã cần xử lý';
  dc.font = { name: 'Arial', size: 10, italic: true }; dc.alignment = { horizontal: 'center' };
  ws.getRow(2).height = 15;
  /* Header */
  ['Chi nhánh/Kho', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Số lượng', 'Hạn sử dụng', 'Còn lại (ngày)', 'Cảnh báo', 'Nhãn / Kích thước', 'Lô · Seri · Mã NSX (GTIN)'].forEach((t, i) => {
    const c = ws.getCell(3, i + 1);
    c.value = t; c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2558' } };
    c.border = bAll; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  ws.getRow(3).height = 20;
  /* Màu theo mức cảnh báo */
  const bgMap = { expired: 'FFFFD6D6', m1: 'FFFFE8CC', m3: 'FFFFFACD' };
  critical.forEach((e, i) => {
    const r = 4 + i; let bk = null;
    for (let j = 0; j < BUCKETS.length; j++) { if (BUCKETS[j].test(e.days)) { bk = BUCKETS[j]; break; } }
    const argb = (bk && bgMap[bk.k]) ? bgMap[bk.k] : 'FFEEEEEE';
    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    [e.branch, e.code, e.name, e.unit,
      (e.qty === null || e.qty === undefined || e.qty === '' ? '' : e.qty),
      fmtDate(e.exp), e.days, (bk ? bk.label : 'Còn > 3 tháng'), e.label || '', [e.lot ? 'Lô ' + e.lot : '', e.gtin].filter(Boolean).join(' · ')].forEach((v, ci) => {
      const cc = ws.getCell(r, ci + 1);
      cc.value = v; cc.font = { name: 'Times New Roman', size: 11 };
      cc.fill = fill; cc.border = bAll;
      cc.alignment = { wrapText: true, horizontal: ci >= 4 ? 'center' : 'left' };
    });
  });
  /* Dòng chú thích cuối */
  const lastR = 4 + critical.length;
  ws.mergeCells(lastR, 1, lastR, 10);
  ws.getCell(lastR, 1).value = '(*) File tự động tạo từ hệ thống Kiểm kê kho – MedDental';
  ws.getCell(lastR, 1).font = { name: 'Arial', size: 9, italic: true };
  /* Watermark */
  try {
    const wc = document.createElement('canvas'); wc.width = 380; wc.height = 210;
    const wctx = wc.getContext('2d'); wctx.translate(190, 105); wctx.rotate(-28 * Math.PI / 180);
    wctx.font = '13px Arial'; wctx.fillStyle = 'rgba(0,0,0,0.075)'; wctx.textAlign = 'center'; wctx.textBaseline = 'middle';
    wctx.fillText('Mai Văn Quyết quyetmv', 0, 0);
    const wmId = wb.addImage({ base64: wc.toDataURL('image/png').split(',')[1], extension: 'png' });
    ws.addBackgroundImage(wmId);
  } catch (e) { klog("var wc=document.createElement('canvas');wc.width", e); }
  wb.xlsx.writeBuffer().then((buf) => {
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    let file = null;
    try { file = new File([blob], fname, { type: blob.type }); } catch (e) { klog('file=new File([blob],fname,{type:blob.type});', e); }
    let shared = false;
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      shared = true;
      const shareText = subject + '\n\n' + body;
      navigator.share({ files: [file], title: subject, text: shareText }).then(() => {
        toast('✉ Đã mở soạn email — kiểm tra tiêu đề và nội dung trước khi gửi');
      }).catch((err) => {
        if (err && err.name === 'AbortError') return;
        X.dlAnchor(blob, fname);
        setTimeout(() => { openMailtoSafe(subject, body); }, 600);
      });
    }
    if (!shared) {
      X.dlAnchor(blob, fname);
      setTimeout(() => { openMailtoSafe(subject, body); }, 900);
    }
  }).catch((e) => { console.error(e); toast('Không tạo được file cảnh báo'); });
}

/* ================= Dashboard HSD ================= */
export const renderHsd = () => rerender();
export function Hsd() {
  const entries = hsdEntries();
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('home')}>‹</button><div className="ttl">Cảnh báo hạn sử dụng</div><button className="pill" onClick={() => A.hsdPrint()}>In</button><button className="pill" onClick={() => showHsdEmailPicker()}>✉ Gửi cảnh báo</button></div><div style={{ height: 10 }} /></div>
      <div className="wrap" style={st('padding-top:16px;padding-bottom:40px')}>
        {!entries.length ? <div className="empty">Chưa có dữ liệu HSD. Nhập hạn sử dụng khi kiểm kê — hệ thống sẽ lưu và cảnh báo tại đây.</div> : null}
        {BUCKETS.map((b) => {
          const rows = entries.filter((e) => b.test(e.days));
          return (
            <div key={b.k} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: b.strong, marginBottom: 8 }}>{b.label} · {rows.length}</div>
              {!rows.length ? <div style={st('font-size:12px;color:var(--mut2)')}>Không có.</div> : null}
              {rows.map((e, idx) => (
                <div className="hsditem" key={idx}>
                  <div style={st('flex:1;min-width:0')}>
                    <div style={st('font-weight:600;font-size:14px;line-height:1.35')}>{e.name}</div>
                    <div style={st('font-size:12px;color:var(--mut);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
                      {[e.code, e.label, e.lot ? 'Lô ' + e.lot : '', e.branch].filter((x) => x).join(' · ') + (e.qty !== null && e.qty !== undefined && e.qty !== '' ? ' · SL ' + fmt(e.qty) : '')}
                    </div>
                  </div>
                  <div style={st('text-align:right;flex:0 0 auto')}>
                    <div className="tnum" style={st('font-size:14px;font-weight:700')}>{fmtDate(e.exp)}</div>
                    <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: b.strong }}>{e.days < 0 ? 'quá hạn ' + Math.abs(e.days) + ' ngày' : 'còn ' + e.days + ' ngày'}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
