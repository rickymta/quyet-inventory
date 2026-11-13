/* Thư viện nặng tải theo nhu cầu (app gốc tải từ CDN; ở đây đóng gói bằng npm + dynamic import).
   Sau khi tải, gắn vào window với đúng tên toàn cục app gốc dùng: XLSX, ExcelJS, ZXing, Tesseract, PDFLib, pdfjsLib. */
import { toast } from './ui.jsx';

const loaders = {
  xlsx: async () => {
    if (window.XLSX) return;
    const x = await import('xlsx');
    /* bản ESM không kèm bảng mã trang (cần cho file .xls cũ có tiếng Việt) như bản xlsx.full.min.js của app gốc */
    try { const cp = await import('xlsx/dist/cpexcel.full.mjs'); x.set_cptable(cp); } catch (e) { console.warn('cpexcel', e); }
    window.XLSX = x;
  },
  exceljs: async () => { if (!window.ExcelJS) { const m = await import('exceljs/dist/exceljs.min.js'); window.ExcelJS = m.default || m; } },
  zxing: async () => { if (!window.ZXing) window.ZXing = await import('@zxing/library'); },
  tesseract: async () => { if (!window.Tesseract) { const m = await import('tesseract.js'); window.Tesseract = m.default || m; } },
  pdflib: async () => { if (!window.PDFLib) window.PDFLib = await import('pdf-lib'); },
  pdfjs: async () => {
    if (window.pdfjsLib) return;
    const m = await import('pdfjs-dist/build/pdf');
    const lib = m.default && m.default.getDocument ? m.default : m;
    const w = await import('pdfjs-dist/build/pdf.worker.min.js?url');
    lib.GlobalWorkerOptions.workerSrc = w.default;
    window.pdfjsLib = lib;
  },
};
const GLOBAL = { xlsx: 'XLSX', exceljs: 'ExcelJS', zxing: 'ZXing', tesseract: 'Tesseract', pdflib: 'PDFLib', pdfjs: 'pdfjsLib' };
const pending = {};

export function kkHas(k) { return typeof window[GLOBAL[k]] !== 'undefined'; }
export function kkLoad(k) {
  if (kkHas(k)) return Promise.resolve(true);
  if (pending[k]) return pending[k];
  pending[k] = loaders[k]().then(() => true).catch((e) => { console.error(e); delete pending[k]; return false; });
  return pending[k];
}
/* Trả true nếu đã sẵn sàng. Nếu chưa: tải thư viện rồi tự chạy lại thao tác (retry) — đúng cách dùng của app gốc. */
export function kkNeed(keys, retry) {
  if (keys.every(kkHas)) return true;
  toast(keys.some((k) => k === 'xlsx' || k === 'exceljs') ? 'Đang tải thư viện Excel…' : 'Đang tải thư viện…');
  Promise.all(keys.map(kkLoad)).then((r) => {
    if (r.every(Boolean)) { if (retry) retry(); } else toast(keys.some((k) => k === 'xlsx' || k === 'exceljs') ? 'Chưa tải được thư viện Excel — kiểm tra kết nối mạng' : 'Chưa tải được thư viện — kiểm tra kết nối mạng');
  });
  return false;
}
/* Bản async: await kkReady(['pdflib','pdfjs']) */
export async function kkReady(keys) { const r = await Promise.all(keys.map(kkLoad)); return r.every(Boolean); }
