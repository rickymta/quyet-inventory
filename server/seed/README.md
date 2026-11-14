# Bộ seed (dữ liệu ban đầu)

> **CẢNH BÁO: đây là DỮ LIỆU THẬT** (số liệu kho, chữ ký tay, nhật ký thao tác). Chỉ để trong kho mã **riêng tư**; không đưa lên kho công khai.

`data/` được sinh từ một file sao lưu của app gốc bằng `node server/scripts/backup-to-seed.mjs <file.json> [thư-mục-đích]`
và được nạp tự động khi CSDL còn trống (`server/src/seed.js`). Dockerfile sao chép cả thư mục `seed` vào image.

```
data/
├── meta.json        nguồn, thời điểm chuyển đổi, số lượng từng loại
├── users.json       tài khoản ban đầu (username, role, profile; KHÔNG có mật khẩu: mật khẩu = ADMIN_PASSWORD)
├── periods/         NN-<id>.json, mỗi kỳ kiểm kê vật tư một file (kèm items); NN giữ thứ tự gốc
├── assets/          NN-<id>.json, kỳ CCDC & TSCĐ (nếu có)
├── handovers.json   biên bản bàn giao
├── explains.json    phiếu giải trình
├── audit.json       nhật ký thay đổi
├── settings/        mỗi khối khoá–giá trị một file: hsd, recon, pay, counters, sg, ...
└── photos.json      (nếu có) ảnh dạng dataURL
```

Không đưa vào seed: dữ liệu riêng người dùng/thiết bị (`profile`, `lastBackup`, `backupSnooze`, `waPref`, `waFail`, `webauthn`,
`__sync`; `__photos` được tách thành `photos.json`) và các trường riêng thiết bị của `sg` (`sig`, `sigs`, `name`, `fixed`, `dev`, `pw`).
