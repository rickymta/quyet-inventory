import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kiemke',
  /* Thư mục chứa bản build của client (Vite). Khi chạy dev, client chạy riêng ở cổng 5173. */
  publicDir: process.env.PUBLIC_DIR || path.resolve(here, '../public'),
  /* Nguồn dữ liệu ban đầu, chỉ nạp khi CSDL còn trống: thư mục seed (có meta.json), file sao lưu JSON hoặc thư mục chứa nó.
     Không đặt SEED_PATH → dùng bộ seed đi kèm mã nguồn (server/seed/data). */
  seedPath: process.env.SEED_PATH || path.resolve(here, '../seed/data'),
  /* Tài khoản: JWT_SECRET trống thì sinh ngẫu nhiên và lưu vào collection meta */
  jwtSecret: process.env.JWT_SECRET || '',
  sessionDays: Number(process.env.SESSION_DAYS) > 0 ? Number(process.env.SESSION_DAYS) : 7,
  trustProxy: /^(1|true)$/i.test(process.env.TRUST_PROXY || ''),
  adminUsername: (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase(),
  /* Khác mặc định → thay cho username của quản trị viên đầu tiên trong users.json của bộ seed */
  adminUsernameSet: (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase() !== 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123',
  bodyLimit: process.env.BODY_LIMIT || '100mb',
};
