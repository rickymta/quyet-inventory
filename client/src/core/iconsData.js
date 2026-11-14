/* Trích nguyên văn từ app gốc (bộ icon SVG) */
/* eslint-disable */
var ICONS={
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h3m10-10v9a1 1 0 0 1-1 1h-3"/><path d="M9 20v-6h6v6"/>',
  box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  upload:'<path d="M20 16.5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><path d="M16 8.5 12 4.5 8 8.5"/><path d="M12 4.5v12"/>',
  eye:'<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  mail:'<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m22 6-10 7L2 6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  chev:'<path d="m9 18 6-6-6-6"/>',
  folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/>',
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>',
  download:'<path d="M20 16.5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><path d="m8 11 4 4 4-4"/><path d="M12 15V3"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  warn:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>',
  play:'<path d="M6 3v18l15-9Z"/>',
  grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.6"/><path d="M15.5 14.2c2.6.3 4.5 2.6 4.5 5.3"/>',
  monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  swap:'<path d="M7 4v13M7 4 3 8M7 4l4 4"/><path d="M17 20V7M17 20l4-4M17 20l-4-4"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>'
};
/* ===== FastCons icons v2: nhỏ, nhẹ, duotone ===== */
var FCC={"vt": ["#eef1f8", "#1e3a6b", "#d4af5f"], "as": ["#eef1f8", "#1e3a6b", "#d4af5f"], "open": ["#eef1f8", "#1e3a6b", "#d4af5f"], "qr": ["#eef1f8", "#1e3a6b", "#d4af5f"], "list": ["#eef1f8", "#1e3a6b", "#d4af5f"], "home": ["#eef1f8", "#1e3a6b", "#d4af5f"], "bld0": ["#eef1f8", "#1e3a6b", "#d4af5f"], "bld1": ["#eef1f8", "#1e3a6b", "#d4af5f"], "bld2": ["#eef1f8", "#1e3a6b", "#d4af5f"], "bld3": ["#eef1f8", "#1e3a6b", "#d4af5f"], "bld4": ["#eef1f8", "#1e3a6b", "#d4af5f"], "rec": ["#eef1f8", "#1e3a6b", "#d4af5f"], "pay": ["#eef1f8", "#1e3a6b", "#d4af5f"], "err": ["#fdecea", "#dc4a4a", "#d4af5f"], "mgmt": ["#eef1f8", "#1e3a6b", "#d4af5f"], "handover": ["#eef1f8", "#1e3a6b", "#d4af5f"], "stock": ["#eef1f8", "#1e3a6b", "#d4af5f"], "form": ["#eef1f8", "#1e3a6b", "#d4af5f"], "report": ["#eef1f8", "#1e3a6b", "#d4af5f"], "explain": ["#eef1f8", "#1e3a6b", "#d4af5f"], "gear": ["#eef1f8", "#1e3a6b", "#d4af5f"], "more": ["#eef1f8", "#1e3a6b", "#d4af5f"]};
var FCP={
vt:`<path d="M24 10.5 37 17.8v14.4L24 39.5 11 32.2V17.8Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 17.8 24 25l13-7.2M24 25v14.5" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="35" cy="34" r="7" fill="{A}"/><path d="m31.7 34 2.4 2.5 4.2-4.8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
as:`<rect x="9" y="11" width="30" height="21" rx="3.5" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 38h10M24 32v6" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m14.5 27 5-6 4 3 6-7 4.5 4.5" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
open:`<rect x="12" y="11" width="24" height="29" rx="4" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 11V9.5A1.5 1.5 0 0 1 20.5 8h7A1.5 1.5 0 0 1 29 9.5V11" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m17 23 2 2 3.5-4M17 31l2 2 3.5-4" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M27 23h5M27 31h5" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
qr:`<path d="M11 18v-5a2 2 0 0 1 2-2h5M30 11h5a2 2 0 0 1 2 2v5M37 30v5a2 2 0 0 1-2 2h-5M18 37h-5a2 2 0 0 1-2-2v-5" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="17" y="17" width="5" height="5" rx="1" fill="{D}"/><rect x="26" y="17" width="5" height="5" rx="1" fill="{D}" fill-opacity=".55"/><rect x="17" y="26" width="5" height="5" rx="1" fill="{D}" fill-opacity=".55"/><rect x="26" y="26" width="5" height="5" rx="1" fill="{D}"/><rect class="fci-scan" x="10" y="23" width="28" height="2.4" rx="1.2" fill="{A}"/>`,
rec:`<path d="M17 36V13m0 0-6 6m6-6 6 6" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M31 12v23m0 0-6-6m6 6 6-6" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
pay:`<path d="M13 9h22v31l-3.7-2.6L27.7 40 24 37.4 20.3 40l-3.7-2.6L13 40Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 17h12M18 23h6" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="33" cy="32" r="7.5" fill="{A}"/><text x="33" y="35.6" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="Montserrat,Inter,sans-serif">₫</text>`,
err:`<g class="fci-pulse"><path d="M24 9.5 40 37a2 2 0 0 1-1.7 3H9.7A2 2 0 0 1 8 37Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 20v9" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="24" cy="34" r="1.9" fill="{A}"/></g>`,
mgmt:`<path d="M24 23v-9M24 25l-10 9M24 25l10 9" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="24" cy="24" r="5.5" fill="{A}"/><circle cx="24" cy="11" r="4" fill="{D}"/><circle cx="12.5" cy="36" r="4" fill="{D}"/><circle cx="35.5" cy="36" r="4" fill="{D}"/>`,
stock:`<path d="M9 21 24 11l15 10v17H9Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="27" width="8" height="11" rx="1" fill="{D}"/><rect x="25" y="29" width="8" height="9" rx="1" fill="{A}"/><rect x="25" y="23" width="8" height="5" rx="1" fill="{D}" fill-opacity=".55"/>`,
form:`<rect x="10" y="8" width="23" height="31" rx="3.5" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 16h13M15 22h13M15 28h6" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m26 40 2-6.5 10-10 4.5 4.5-10 10Z" fill="{A}" stroke="{A}" stroke-width="1.6" stroke-linejoin="round"/>`,
gear:`<g class="fci-spin"><g transform="translate(9 9) scale(2.5)" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${ICONS.gear}</g></g>`,
bld:`<rect x="12" y="10" width="17" height="28" rx="2.5" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="29" y="22" width="8" height="16" rx="2" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 17h2M22 17h2M17 23h2M22 23h2M17 29h2M22 29h2" stroke="{A}" stroke-width="2.8" stroke-linecap="round"/><path d="M9 38.5h31" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
home:`<path d="M9 22 24 10l15 12v15a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 39V29h8v10" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
more:`<circle cx="12" cy="24" r="3.2" fill="{D}"/><circle cx="24" cy="24" r="3.2" fill="{D}"/><circle cx="36" cy="24" r="3.2" fill="{A}"/>`,
report:`<rect x="10" y="8" width="28" height="32" rx="4" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 33v-6M24 33V19M31 33v-9" stroke="{A}" stroke-width="3.4" stroke-linecap="round"/>`,
handover:`<path d="M11 18h23m0 0-5-5m5 5-5 5" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M37 31H14m0 0 5-5m-5 5 5 5" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
explain:`<path d="M10 13a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H21l-7 7v-7h-1a3 3 0 0 1-3-3Z" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 17h14M17 23h8" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
list:`<rect x="12" y="11" width="24" height="29" rx="4" fill="{D}" fill-opacity=".14" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 11V9.5A1.5 1.5 0 0 1 20.5 8h7A1.5 1.5 0 0 1 29 9.5V11" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m17 23 2 2 3.5-4M17 31l2 2 3.5-4" stroke="{A}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M27 23h5M27 31h5" stroke="{D}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`};
function fcG(k,D,A){return (FCP[k]||FCP.form).split('{D}').join(D).split('{A}').join(A);}
function fcIco(k,size,i){
  var g=k==='bld'?'bld'+((i||0)%5):k,c=FCC[g]||FCC.form;
  return '<svg class="fci" width="'+(size||38)+'" height="'+(size||38)+'" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="'+c[0]+'"/><rect x=".5" y=".5" width="47" height="47" rx="14" fill="none" stroke="'+c[1]+'" stroke-opacity=".14"/><g transform="translate(5.5 5.5) scale(.77)">'+fcG(k,c[1],c[2])+'</g></svg>';
}
function fcGly(k,size){var c=FCC[k]||FCC.form;
  return '<svg class="fcg" width="'+(size||22)+'" height="'+(size||22)+'" viewBox="6 6 36 36" aria-hidden="true">'+fcG(k,'currentColor',c[2])+'</svg>';}
function navIco(g){var m={list:'list',home:'home',scan:'open',swap:'rec',doc:'pay',box:'stock',file:'report',warn:'err',gear:'gear'};return m[g.icon]?fcGly(m[g.icon],20):icon(g.icon,18);}
function fcKey(lb){var t=String(lb).toLowerCase();
  if(/báo cáo/.test(t))return 'report';if(/bàn giao/.test(t))return 'handover';if(/giải trình/.test(t))return 'explain';
  if(/kiểm kê vật tư/.test(t))return 'vt';if(/ccdc/.test(t))return 'as';if(/đang kiểm dở/.test(t))return 'open';if(/qr/.test(t))return 'qr';
  if(/đối chiếu/.test(t))return 'rec';if(/thanh toán/.test(t))return 'pay';if(/báo lỗi/.test(t))return 'err';if(/liên chi nhánh/.test(t))return 'mgmt';
  if(/tồn kho/.test(t))return 'stock';if(/biểu mẫu/.test(t))return 'form';if(/cài đặt/.test(t))return 'gear';return null;}
function icon(name,size,cls){
  var d=ICONS[name]||ICONS.file;
  return '<svg class="ic'+(cls?' '+cls:'')+'" width="'+(size||18)+'" height="'+(size||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
}
ICONS.bars='<path d="M5 21V10M12 21V4M19 21v-8"/>';
ICONS.dots='<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>';
ICONS.qr='<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M17 20h4M20 17v.01"/>';
ICONS.bolt='<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>';
ICONS.image='<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>';
ICONS.keyboard='<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>';
ICONS.building='<path d="M4 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M14 9h5a1 1 0 0 1 1 1v11M3 21h18M8 7h2M8 11h2M8 15h2"/>';
ICONS.layers='<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>';
ICONS.back='<path d="m15 18-6-6 6-6"/>';
ICONS.save='<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>';

ICONS.lock='<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
ICONS.unlock='<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>';

export { ICONS, FCC, FCP, fcG, fcIco, fcGly, navIco, fcKey, icon };
