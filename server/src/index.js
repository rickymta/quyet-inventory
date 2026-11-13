import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config.js';
import api from './routes.js';
import { seedIfEmpty } from './seed.js';
import { AuditLog } from './models.js';
import { apiGate, authRouter, ensureAdmin, initAuth, jsonOnly } from './auth.js';
import usersRouter from './users.js';

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);
app.use(compression());
app.use('/api', jsonOnly);
app.use(express.json({ limit: config.bodyLimit }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny', { skip: (req) => req.path === '/api/rev' || req.path === '/api/health' }));

/* Mọi /api đều cần đăng nhập (cookie phiên), trừ /api/health, đăng nhập và đăng xuất. Bản build React vẫn mở để tải trang đăng nhập. */
app.use('/api', apiGate);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api', api);

/* Phục vụ bản build React (một container cho cả API và giao diện) */
const indexHtml = path.join(config.publicDir, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(config.publicDir, { index: false, maxAge: '1h', setHeaders(res, file) {
    if (/[\\/]assets[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } }));
  app.get('*', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(indexHtml));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Lỗi máy chủ' });
});

async function connectWithRetry() {
  for (let i = 1; ; i++) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      return;
    } catch (e) {
      console.error(`[mongo] Chưa kết nối được (lần ${i}): ${e.message}`);
      if (i >= 30) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

await connectWithRetry();
console.log('[mongo] Đã kết nối', config.mongoUri.replace(/\/\/[^@/]*@/, '//***@'));
await AuditLog.init(); // bảo đảm unique index của audit đã dựng trước khi nhận ghi
try {
  await seedIfEmpty();
} catch (e) {
  console.error('[seed] Lỗi nạp dữ liệu ban đầu:', e.message);
}
try {
  await initAuth();
  await ensureAdmin();
} catch (e) {
  console.error('[auth] Lỗi khởi tạo tài khoản:', e.message);
  process.exit(1);
}
const server = app.listen(config.port, () => console.log(`[server] http://localhost:${config.port}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  });
}
