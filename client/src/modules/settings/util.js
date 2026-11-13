/* Nhãn thời gian dạng "14:05 ngày 13/11/2026" (nơi khác dùng qua X.tsLabel) */
export function tsLabel(ts) {
  const d = new Date(ts); const p = (n) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ngày ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}
