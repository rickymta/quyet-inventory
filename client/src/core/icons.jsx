/* Icon: giữ hàm trả chuỗi SVG như app gốc (dùng trong mẫu in/Word) và thêm bản trả phần tử React cho JSX. */
import parse from 'html-react-parser';
import { ICONS, FCC, FCP, fcG, fcIco, fcGly, navIco, fcKey, icon } from './iconsData.js';

export { ICONS, FCC, FCP, fcG, fcIco, fcGly, navIco, fcKey, icon };

const cache = new Map();
/* H(chuỗi HTML/SVG tĩnh) -> phần tử React. CHỈ dùng cho nội dung tĩnh, không có sự kiện (icon, hình minh hoạ, đoạn chữ đã định dạng). */
export function H(html) {
  if (html == null || html === '') return null;
  const s = String(html);
  if (s.length > 4000) return parse(s);
  let el = cache.get(s);
  if (el === undefined) { el = parse(s); if (cache.size > 2000) cache.clear(); cache.set(s, el); }
  return el;
}
/* Bản JSX của icon()/fcIco()/fcGly()/navIco() — cùng tham số với bản chuỗi */
export const I = (name, size, cls) => H(icon(name, size, cls));
export const FcIco = (k, size, i) => H(fcIco(k, size, i));
export const FcGly = (k, size) => H(fcGly(k, size));
export const NavIco = (g) => H(navIco(g));
export function Icon({ name, size, cls }) { return I(name, size, cls); }
