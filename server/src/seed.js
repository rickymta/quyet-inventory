import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from './config.js';
import { importDataset, isEmpty } from './dataset.js';

/* Tìm file sao lưu JSON: SEED_PATH có thể là 1 file hoặc 1 thư mục (lấy file .json mới nhất theo tên). */
export function findSeedFile(p = config.seedPath) {
  if (!p || !fs.existsSync(p)) return null;
  const st = fs.statSync(p);
  if (st.isFile()) return p;
  const files = fs.readdirSync(p).filter((f) => /\.json$/i.test(f) && !/^package(-lock)?\.json$/i.test(f)).sort();
  return files.length ? path.join(p, files[files.length - 1]) : null;
}

export async function seedIfEmpty({ force = false } = {}) {
  const file = findSeedFile();
  if (!file) return null;
  if (!force && !(await isEmpty())) return null;
  const src = JSON.parse(fs.readFileSync(file, 'utf8'));
  const stats = await importDataset(src, { mode: 'replace' });
  console.log(`[seed] Đã nạp ${path.basename(file)}:`, JSON.stringify(stats));
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
