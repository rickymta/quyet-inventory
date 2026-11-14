#!/usr/bin/env node
/* Chuyển 1 file sao lưu JSON của app gốc thành bộ seed (nhiều file nhỏ, dễ theo dõi trong git).
   Dùng: node server/scripts/backup-to-seed.mjs <file-sao-luu.json> [thu-muc-dich]   (mặc định server/seed/data) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [srcArg, outArg] = process.argv.slice(2);
if (!srcArg) {
  console.error('Dùng: node server/scripts/backup-to-seed.mjs <file-sao-luu.json> [thu-muc-dich]');
  process.exit(1);
}
const outDir = path.resolve(outArg || path.join(here, '../seed/data'));
const src = JSON.parse(fs.readFileSync(srcArg, 'utf8'));
if (!src || typeof src !== 'object' || Array.isArray(src)) throw new Error('File sao lưu không hợp lệ');

/* Khoá không phải dữ liệu dùng chung + trường riêng thiết bị trong `sg` */
const DROP_KV = new Set(['profile', 'lastBackup', 'backupSnooze', 'waPref', 'waFail', 'webauthn', '__sync', '__photos']);
const DROP_SG = ['sig', 'sigs', 'name', 'fixed', 'dev', 'pw'];
const ARRAYS = ['periods', 'assets', 'handovers', 'explains', 'audit'];

const safe = (s) => String(s).replace(/[^A-Za-z0-9._-]/g, '_');
const write = (rel, value) => {
  const f = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(value, null, 1) + '\n', 'utf8');
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const counts = { periods: 0, periodItems: 0, assets: 0, handovers: 0, explains: 0, audit: 0, settings: 0 };
const pad = (i, n) => String(i).padStart(Math.max(2, String(n).length), '0');

for (const col of ['periods', 'assets']) {
  const arr = Array.isArray(src[col]) ? src[col] : [];
  arr.forEach((p, i) => {
    write(`${col}/${pad(i, arr.length)}-${safe(p.id)}.json`, p);
    counts[col]++;
    if (col === 'periods') counts.periodItems += Array.isArray(p.items) ? p.items.length : 0;
  });
}
for (const col of ['handovers', 'explains', 'audit']) {
  const arr = Array.isArray(src[col]) ? src[col] : [];
  write(`${col}.json`, arr);
  counts[col] = arr.length;
}

for (const [k, v] of Object.entries(src)) {
  if (ARRAYS.includes(k) || DROP_KV.has(k)) continue;
  let val = v;
  if (k === 'sg' && val && typeof val === 'object' && !Array.isArray(val)) {
    val = { ...val };
    for (const f of DROP_SG) delete val[f];
  }
  write(`settings/${safe(k)}.json`, val);
  counts.settings++;
}

const p = src.profile && typeof src.profile === 'object' ? src.profile : {};
const profile = {
  ten: p.ten ?? '', chucVu: p.chucVu ?? '', chiNhanh: p.chiNhanh ?? '', ma: p.ma ?? '', maManual: !!p.maManual,
};
write('users.json', [{ username: 'admin', role: 'admin', profile }]);
if (src.__photos && typeof src.__photos === 'object') write('photos.json', src.__photos);

write('meta.json', { source: path.basename(srcArg), convertedAt: new Date().toISOString(), counts });
console.log(`[backup-to-seed] ${path.basename(srcArg)} → ${outDir}`);
console.log(JSON.stringify(counts));
