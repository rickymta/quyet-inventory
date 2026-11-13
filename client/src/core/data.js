/* Hàm truy vấn dữ liệu dùng chung (phần "State" của app gốc) */
import { db, X } from './state.js';
import { daysTo } from './helpers.js';

export function per(id) {
  for (let i = 0; i < db.periods.length; i++) if (db.periods[i].id === id) return db.periods[i];
  return (typeof X.asPer === 'function') ? X.asPer(id) : null;
}
export function hsdEntries() {
  const out = [];
  Object.keys(db.hsd).forEach((k) => {
    const e = db.hsd[k];
    (e.boxes || []).forEach((b) => {
      const d = daysTo(b.exp);
      if (d === null) return;
      out.push({ branch: e.branch, code: e.code, name: e.name, unit: e.unit || '', qty: b.qty || 1, exp: b.exp, days: d, lot: b.lot || '', label: b.label || '', gtin: b.gtin || '' });
    });
    (e.batches || []).forEach((b) => {
      const d = daysTo(b.exp);
      if (d === null) return;
      out.push({ branch: e.branch, code: e.code, name: e.name, unit: e.unit || '', qty: b.qty, exp: b.exp, days: d });
    });
  });
  out.sort((a, b) => a.days - b.days);
  return out;
}
