/* Xuất biểu mẫu Excel / HTML in (giữ dạng chuỗi) — dòng gốc 6068–6161, 6230–6257 */
import { X, esc, fmt, klog } from '../../core';
import { asDate, asDiff, asStats, asTeam, asSummary } from './model.js';
import { addPhotoSheet } from './photos.jsx';

export function asFileName(p) {
  const d = asDate(p.dateCount).replace(/\//g, '-');
  return ('BBKK_TS_CCDC_' + (p.branch || p.name) + (d ? '_' + d : '')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w-]+/g, '_') + '.xlsx';
}
export function asRowVals(it) {
  const d = asDiff(it);
  if (it.extra) {
    /* Tài sản phát hiện thêm: không có số liệu kế toán nên để trống Phần I; mã/tên ghi vào Ghi chú */
    const un = String(it.note || '').replace(/^Phát hiện thêm[\s,:.\-–]*/, '').trim(); const real = it.name && it.name.indexOf('(Chưa rõ tên)') !== 0; const def = /^(Phát hiện thêm|Quét thấy nhưng chưa có trong sổ, cần dò tìm)$/.test(it.note || '');
    let note = 'Phát hiện thêm' + (it.code ? ' – mã ' + it.code : '') + (real ? ' – ' + it.name + (it.unit ? ' (' + it.unit + ')' : '') : ' – chưa rõ tên, cần dò tìm') + (un && !def ? ' – ' + un : '');
    if ((it.imgs || []).length) note += ' – có ảnh (xem sheet ẢNH KIỂM KÊ)';
    return ['', '', '', '', '', '', it.counted ? it.cQty : '', d === null ? '' : d, it.counted ? (it.mgmt || it.unit1 || '') : '', it.counted ? it.room : '', it.counted ? it.user : '', it.counted ? it.loc : '', it.counted ? it.quality : '', it.counted ? it.status : '', note];
  }
  return [it.stt, it.code, it.name, it.unit, it.qty, it.unit1 || '', it.counted ? it.cQty : '', d === null ? '' : d, it.counted ? (it.mgmt || it.unit1 || '') : '', it.counted ? it.room : '', it.counted ? it.user : '', it.counted ? it.loc : '', it.counted ? it.quality : '', it.counted ? it.status : '', it.note || ''];
}
/* Thứ tự khi xuất biểu mẫu: tài sản trong sổ trước, tài sản phát hiện thêm xếp riêng ở cuối */
export function asOrdered(p) {
  const a = p.items.filter((i) => !i.extra); const b = p.items.filter((i) => i.extra);
  return b.length ? a.concat([{ sep: true }], b) : a;
}
export const AS_HEAD = ['STT', 'Mã CCDC', 'TÊN CCDC', 'ĐVT', 'SỐ LƯỢNG', 'ĐƠN VỊ CẤP 1', 'SỐ LƯỢNG KIỂM KÊ', 'CHÊNH', 'ĐƠN VỊ QUẢN LÝ', 'PHÒNG SỬ DỤNG THỰC TẾ', 'NGƯỜI SỬ DỤNG THỰC TẾ', 'VỊ TRÍ', 'PHẨM CHẤT TS/CCDC', 'TÌNH TRẠNG', 'GHI CHÚ'];
export function buildAssetXlsx(p) {
  const wb = new window.ExcelJS.Workbook(); const s = asStats(p);
  const ws = wb.addWorksheet('BBKK', { pageSetup: { paperSize: X.prPage().xl, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } } });
  const F = (o) => Object.assign({ name: 'Times New Roman', size: 11 }, o || {}); const thin = { style: 'thin' }; const bAll = { top: thin, left: thin, bottom: thin, right: thin };
  [7, 18, 42, 8, 10, 24, 12, 9, 24, 30, 22, 14, 14, 16, 40].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const put = (addr, val, font, al) => { const c = ws.getCell(addr); c.value = val; c.font = F(font); if (al) c.alignment = al; return c; };
  ws.mergeCells('A1:O1'); put('A1', 'BIÊN BẢN KIỂM KÊ TS&CCDC', { size: 16, bold: true }, { horizontal: 'center' });
  put('A2', 'Chi nhánh ' + (p.branch || ''), { bold: true });
  put('A3', 'Thời điểm kiểm kê: ' + asDate(p.dateCount));
  put('A4', 'Thời điểm chốt số liệu đến ngày ' + asDate(p.cutoff));
  put('A5', 'Tổng cộng', { bold: true });
  put('E5', s.qty, { bold: true }, { horizontal: 'center' }); put('G5', s.cq, { bold: true }, { horizontal: 'center' }); put('H5', Math.round((s.cq - s.qty) * 100) / 100, { bold: true }, { horizontal: 'center' });
  ws.mergeCells('A6:F6'); put('A6', 'PHẦN I: THÔNG TIN THEO DÕI TRÊN PHẦN MỀM', { bold: true }, { horizontal: 'center' });
  ws.mergeCells('G6:O6'); put('G6', 'PHẦN II: DÀNH CHO TỔ KIỂM KÊ', { bold: true }, { horizontal: 'center' });
  AS_HEAD.forEach((t, j) => {
    const c = ws.getCell(7, j + 1); c.value = t; c.font = F({ bold: true }); c.border = bAll;
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
  });
  ws.getRow(7).height = 44;
  const ord = asOrdered(p);
  ord.forEach((it, k) => {
    const r = 8 + k;
    if (it.sep) {
      ws.mergeCells(r, 1, r, 15);
      const sc = ws.getCell(r, 1); sc.value = 'TÀI SẢN PHÁT HIỆN THÊM KHI KIỂM KÊ (chưa có trong số liệu kế toán)';
      sc.font = F({ bold: true }); sc.alignment = { horizontal: 'left', vertical: 'middle' }; sc.border = bAll;
      sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      return;
    }
    asRowVals(it).forEach((v, j) => {
      const c = ws.getCell(r, j + 1); c.value = v; c.font = F(); c.border = bAll;
      c.alignment = { vertical: 'middle', wrapText: true, horizontal: (j === 0 || j === 3 || j === 4 || j === 6 || j === 7) ? 'center' : 'left' };
    });
  });
  ws.pageSetup.printTitlesRow = '6:7';
  const r0 = 8 + ord.length + 2; const t = asTeam(p);
  [['B', 'C', 'ĐẦU MỐI KIỂM KÊ TẠI ĐƠN VỊ', t.dauMoi], ['G', 'J', 'TỔ KIỂM KÊ', t.toKiemKe], ['L', 'O', 'LÃNH ĐẠO ĐƠN VỊ', t.lanhDao]].forEach((b) => {
    ws.mergeCells(b[0] + r0 + ':' + b[1] + r0); put(b[0] + r0, b[2], { bold: true }, { horizontal: 'center' });
    ws.mergeCells(b[0] + (r0 + 1) + ':' + b[1] + (r0 + 1)); put(b[0] + (r0 + 1), '(Ký, ghi rõ họ tên)', { italic: true }, { horizontal: 'center' });
    ws.mergeCells(b[0] + (r0 + 5) + ':' + b[1] + (r0 + 5)); put(b[0] + (r0 + 5), b[3] || '', { bold: true }, { horizontal: 'center' });
  });
  (function () {
    const sg = p.sig || {}; const ends = { B: 'C', G: 'J', L: 'O' }; const cix = { B: 1, G: 6, L: 11 };
    [2, 3, 4].forEach((d) => { ws.getRow(r0 + d).height = 20; });
    [['B', 'dauMoi'], ['G', 'toKiemKe'], ['L', 'lanhDao']].forEach((z) => {
      const x = sg[z[1]]; if (!x || !x.img) return;
      try {
        let hh = 56; let ww = Math.round(hh * (x.w || 300) / (x.h || 120)); if (ww > 150) { ww = 150; hh = Math.round(ww * (x.h || 120) / (x.w || 300)); }
        const id = wb.addImage({ base64: x.img.split(',')[1], extension: 'png' });
        ws.addImage(id, { tl: { col: cix[z[0]] + 0.15, row: r0 + 1.1 }, ext: { width: ww, height: hh } });
        ws.mergeCells(z[0] + (r0 + 6) + ':' + ends[z[0]] + (r0 + 6));
        const c = ws.getCell(z[0] + (r0 + 6)); c.value = 'Ký điện tử ' + x.time + ' (' + x.dev + ')' + (x.auth ? ' · ' + x.auth : ''); c.font = { name: 'Arial', size: 8, italic: true }; c.alignment = { horizontal: 'center', wrapText: true };
      } catch (e) { klog('var hh=56,ww=Math.round(hh*(x.w||300)/(x.h||120)', e); }
    });
  }());
  addSummarySheet(wb, p); addPhotoSheet(wb, p); addLogSheet(wb, p); X.addUnmSheet(wb, p);
  return wb;
}
export function asPrintHtml(p) {
  const s = asStats(p); const t = asTeam(p); const rows = asOrdered(p).map((it) => {
    if (it.sep) return '<tr><td colspan="15" style="background:#fff2cc;font-weight:bold;text-align:left">TÀI SẢN PHÁT HIỆN THÊM KHI KIỂM KÊ (chưa có trong số liệu kế toán)</td></tr>';
    return '<tr>' + asRowVals(it).map((v, j) => '<td style="text-align:' + ((j === 0 || j === 3 || j === 4 || j === 6 || j === 7) ? 'center' : 'left') + '">' + esc(v) + '</td>').join('') + '</tr>';
  }).join('');
  const sig = (a, b, x) => '<td style="width:33%;text-align:center"><b>' + a + '</b><br><i>(Ký, ghi rõ họ tên)</i><div style="height:70px">' + (x && x.img ? '<img src="' + x.img + '" style="max-height:66px;max-width:200px">' : '') + '</div><b>' + esc(b || '') + '</b>' + (x && x.img ? '<br><span style="font-size:8pt;font-style:italic">Ký điện tử ' + esc(x.time) + ' (' + esc(x.dev) + ')' + (x.auth ? ' · ' + esc(x.auth) : '') + '</span>' : '') + '</td>';
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(asFileName(p).replace('.xlsx', '')) + '</title><style>@page{size:' + (X.PR().paper || 'A4') + ' landscape;margin:10mm}body{font-family:"Times New Roman",serif;font-size:10pt;margin:0}h1{text-align:center;font-size:16pt;margin:0 0 6px}table.m{border-collapse:collapse;width:100%}table.m th,table.m td{border:1px solid #000;padding:3px 4px;vertical-align:middle}table.m th{background:#d9e2f3}thead{display:table-header-group}tr{page-break-inside:avoid}</style></head><body>'
    + '<h1>BIÊN BẢN KIỂM KÊ TS&amp;CCDC</h1><div><b>Chi nhánh ' + esc(p.branch || '') + '</b></div><div>Thời điểm kiểm kê: ' + esc(asDate(p.dateCount)) + '</div><div>Thời điểm chốt số liệu đến ngày ' + esc(asDate(p.cutoff)) + '</div>'
    + '<div style="margin:6px 0"><b>Tổng cộng:</b> Số lượng ' + fmt(s.qty) + ' · Kiểm kê ' + fmt(s.cq) + ' · Chênh ' + fmt(Math.round((s.cq - s.qty) * 100) / 100) + '</div>'
    + '<table class="m"><thead><tr><th colspan="6">PHẦN I: THÔNG TIN THEO DÕI TRÊN PHẦN MỀM</th><th colspan="9">PHẦN II: DÀNH CHO TỔ KIỂM KÊ</th></tr><tr>' + AS_HEAD.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table>'
    + '<table style="width:100%;margin-top:18px;page-break-inside:avoid"><tr>' + sig('ĐẦU MỐI KIỂM KÊ TẠI ĐƠN VỊ', t.dauMoi, (p.sig || {}).dauMoi) + sig('TỔ KIỂM KÊ', t.toKiemKe, (p.sig || {}).toKiemKe) + sig('LÃNH ĐẠO ĐƠN VỊ', t.lanhDao, (p.sig || {}).lanhDao) + '</tr></table></body></html>';
}

export function asSheetHead(ws, heads, widths) {
  heads.forEach((t, j) => {
    const c = ws.getCell(1, j + 1); c.value = t; c.font = { name: 'Times New Roman', size: 11, bold: true }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }; c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}
export function addSummarySheet(wb, p) {
  const s = asSummary(p); const ws = wb.addWorksheet('TỔNG KẾT'); const F = { name: 'Times New Roman', size: 11 }; const bd = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  ws.getColumn(1).width = 38; for (let i = 2; i <= 7; i++) ws.getColumn(i).width = 14;
  const put = (r, c, v, o) => { const x = ws.getCell(r, c); x.value = v; x.font = Object.assign({}, F, o || {}); x.border = bd; x.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' }; return x; };
  ws.mergeCells('A1:G1'); const t = ws.getCell('A1'); t.value = 'TỔNG KẾT KIỂM KÊ — ' + p.name; t.font = Object.assign({}, F, { bold: true, size: 13 });
  const rows = [['Tổng số tài sản theo sổ sách', s.tot], ['Đã kiểm kê', s.done + ' (' + s.pct + '%)'], ['Khớp số lượng', s.ok], ['Thiếu (kiểm kê < sổ sách)', s.less], ['Thừa (kiểm kê > sổ sách)', s.more], ['Không tìm thấy', s.miss], ['Chưa kiểm', s.todo], ['Hỏng / không sử dụng', s.bad], ['Phát hiện thêm ngoài sổ', s.extra], ['Trong đó cần dò tìm (chưa rõ tên)', s.trace]];
  rows.forEach((x, k) => { put(3 + k, 1, x[0]); put(3 + k, 2, x[1], { bold: true }); });
  const r = 3 + rows.length + 1;
  ['Vị trí', 'Tổng', 'Đã kiểm', 'Thiếu', 'Thừa', 'Không thấy', 'Phát hiện thêm'].forEach((h, j) => { const x = put(r, j + 1, h, { bold: true }); x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }; });
  s.floors.forEach((f, k) => { const g = f[1];[f[0], g.tot, g.done, g.less, g.more, g.miss, g.ext].forEach((v, j) => { put(r + 1 + k, j + 1, v); }); });
}
export function addLogSheet(wb, p) {
  if (!(p.log || []).length) return;
  const ws = wb.addWorksheet('NHẬT KÝ');
  asSheetHead(ws, ['STT', 'Thời gian', 'Người thao tác', 'Thao tác', 'Mã', 'Tên tài sản', 'Chi tiết'], [6, 20, 20, 34, 18, 34, 44]);
  p.log.forEach((e, k) => {
    [k + 1, new Date(e.t).toLocaleString('vi-VN'), e.by || '', e.a, e.c || '', e.n || '', e.d || ''].forEach((v, j) => { const c = ws.getCell(k + 2, j + 1); c.value = v; c.font = { name: 'Times New Roman', size: 11 }; c.alignment = { vertical: 'middle', wrapText: true, horizontal: j === 0 ? 'center' : 'left' }; });
  });
}
