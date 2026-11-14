import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from './config.js';
import { importDataset, isEmpty } from './dataset.js';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const jsonFiles = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /\.json$/i.test(f)).sort() : []);

/* Thư mục seed dạng mới: có meta.json (do server/scripts/backup-to-seed.mjs sinh ra) */
export const isSeedDir = (p) => !!p && fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'meta.json'));

/* Tìm file sao lưu JSON: SEED_PATH có thể là 1 file hoặc 1 thư mục (lấy file .json mới nhất theo tên). */
export function findSeedFile(p = config.seedPath) {
  if (!p || !fs.existsSync(p)) return null;
  const st = fs.statSync(p);
  if (st.isFile()) return p;
  const files = jsonFiles(p).filter((f) => !/^package(-lock)?\.json$/i.test(f));
  return files.length ? path.join(p, files[files.length - 1]) : null;
}

/* Dựng lại object dạng file sao lưu từ thư mục seed (không gồm users.json — xem loadSeedUsers) */
export function loadSeedDir(dir) {
  const db = {};
  for (const col of ['periods', 'assets']) {
    db[col] = jsonFiles(path.join(dir, col)).map((f) => readJson(path.join(dir, col, f)));
  }
  for (const col of ['handovers', 'explains', 'audit']) {
    const f = path.join(dir, `${col}.json`);
    db[col] = fs.existsSync(f) ? readJson(f) : [];
  }
  for (const f of jsonFiles(path.join(dir, 'settings'))) db[f.replace(/\.json$/i, '')] = readJson(path.join(dir, 'settings', f));
  const photos = path.join(dir, 'photos.json');
  if (fs.existsSync(photos)) db.__photos = readJson(photos);
  return db;
}

/* Danh sách tài khoản của bộ seed (users.json) hoặc null nếu nguồn không có */
export function loadSeedUsers(p = config.seedPath) {
  if (!isSeedDir(p)) return null;
  const f = path.join(p, 'users.json');
  if (!fs.existsSync(f)) return null;
  const arr = readJson(f);
  return Array.isArray(arr) ? arr : null;
}

/* Nguồn seed → { src, label } hoặc null */
function resolveSource(p) {
  if (isSeedDir(p)) {
    const meta = readJson(path.join(p, 'meta.json'));
    return { src: loadSeedDir(p), label: `bộ seed ${meta.source || path.basename(p)}${meta.convertedAt ? ` (${meta.convertedAt})` : ''}` };
  }
  const file = findSeedFile(p);
  return file ? { src: readJson(file), label: `file sao lưu ${path.basename(file)}` } : null;
}

export async function seedIfEmpty({ force = false } = {}) {
  const r = resolveSource(config.seedPath);
  if (!r) return null;
  if (!force && !(await isEmpty())) return null;
  const stats = await importDataset(r.src, { mode: 'replace' });
  console.log(`[seed] Đã nạp ${r.label}:`, JSON.stringify(stats));
  return stats;
}

/* Chạy trực tiếp: `npm run seed` (thêm --force để ghi đè dữ liệu đang có) */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  const arg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (arg) config.seedPath = arg;
  await mongoose.connect(config.mongoUri);
  const r = await seedIfEmpty({ force });
  if (!r) console.log('[seed] Bỏ qua: không tìm thấy file seed hoặc CSDL đã có dữ liệu (dùng --force để ghi đè).');
  await mongoose.disconnect();
}
