# Kiểm kê kho MedDental — bản MERN

Bản dựng lại của ứng dụng [kiemkevattu](https://maiquyet09-sys.github.io/kiemkevattu/) (một file HTML chạy hoàn toàn trên trình duyệt)
theo stack **MongoDB + Express + React + Node**. Giao diện, câu chữ và cấu trúc dữ liệu giữ nguyên như bản gốc; khác biệt chính là
dữ liệu nằm trên máy chủ (MongoDB) thay vì `localStorage`/IndexedDB, nên nhiều máy dùng chung một bộ dữ liệu.

```
├── client/                 React 18 + Vite
│   └── src/
│       ├── core/           lõi: store đồng bộ, điều hướng, khung trang, icon, tiện ích
│       ├── modules/        mỗi phân hệ một thư mục (kiểm kê, bàn giao, đối chiếu, thanh toán NCC, ...)
│       └── styles/         CSS chép nguyên văn từ bản gốc
├── server/                 Express + Mongoose (API và phục vụ bản build React)
├── reference/              mã gốc + bản đồ mã (INDEX.md) dùng khi port
├── docs/PORTING.md         quy ước port từ bản gốc sang React
├── Dockerfile              build nhiều tầng → một image chạy cả API lẫn giao diện
├── docker-compose.yml      app + MongoDB
└── SaoLuu_ToanBo_*.json    dữ liệu hiện có (file sao lưu của bản gốc), tự nạp ở lần chạy đầu
```

## Chạy bằng Docker

```bash
docker compose up -d --build
```

Mở <http://localhost:8080>. Lần chạy đầu, khi CSDL còn trống, máy chủ tự nạp file `SaoLuu_ToanBo_20261113_1537.json`.

Tuỳ chỉnh qua file `.env` (xem `.env.example`):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `APP_PORT` | `8080` | Cổng truy cập trên máy chủ |
| `SEED_FILE` | `./SaoLuu_ToanBo_20261113_1537.json` | File sao lưu dùng để nạp dữ liệu lần đầu |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `admin`, `Admin123` | Tài khoản quản trị tạo ở lần chạy đầu, khi chưa có tài khoản nào |
| `JWT_SECRET` | trống | Khoá ký phiên đăng nhập; trống thì tự sinh và lưu trong CSDL (phiên không mất khi khởi động lại) |
| `SESSION_DAYS` | `7` | Số ngày hiệu lực của phiên đăng nhập |
| `TRUST_PROXY` | trống | Đặt `1` khi chạy sau reverse proxy HTTPS (tin `X-Forwarded-Proto` để bật cờ `Secure` cho cookie) |

> Bản gốc không có đăng nhập; bản này yêu cầu tài khoản. Khi đưa lên mạng dùng chung, nên đặt sau HTTPS
> (camera quét mã và xác thực Face ID/vân tay của trình duyệt chỉ hoạt động trên HTTPS hoặc `localhost`).

### Đăng nhập và tài khoản

Dữ liệu quản lý tập trung: ai có tài khoản thì đăng nhập được và thấy chung toàn bộ dữ liệu. Lần chạy đầu máy chủ tạo sẵn
tài khoản quản trị **`admin` / `Admin123`** (hồ sơ lấy từ dữ liệu nạp ban đầu). **Hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên.**

- Phiên đăng nhập là cookie httpOnly `kk_session` (JWT, hiệu lực `SESSION_DAYS` ngày). Đổi mật khẩu hoặc bị quản trị đặt lại
  mật khẩu thì các phiên khác hết hiệu lực; tài khoản bị khoá thì mất phiên ngay.
- Quản trị viên tạo, khoá/mở khoá, đổi vai trò (`admin`/`user`), đặt lại mật khẩu và xoá tài khoản. Luôn phải còn ít nhất một
  quản trị viên đang hoạt động; không thể tự khoá hoặc tự xoá chính mình.
- Tên đăng nhập 3–32 ký tự `a-z 0-9 . _ -` (lưu chữ thường); mật khẩu tối thiểu 8 ký tự (băm bcrypt). Đăng nhập sai quá 8 lần
  trong 10 phút (theo IP + tên đăng nhập) sẽ bị tạm chặn.
- Mỗi tài khoản có hồ sơ riêng (họ tên, chức vụ, chi nhánh, mã).

Dữ liệu MongoDB nằm trong volume `kiemke_mongo-data`. Nạp lại từ đầu: `docker compose down -v` rồi `up` lại.

## Chạy khi phát triển

```bash
npm run install:all      # cài thư viện cho server và client
npm run dev:db           # MongoDB bằng Docker (cổng 27017)
npm run dev:server       # API ở http://localhost:4000 (tự nạp file JSON nếu CSDL trống)
npm run dev:client       # Vite ở http://localhost:5173, proxy /api sang cổng 4000
```

Nạp lại dữ liệu từ một file sao lưu (ghi đè): `npm run seed -- --force đường/dẫn/file.json`.

## Kiến trúc dữ liệu

Phía trình duyệt vẫn giữ một đối tượng `db` đúng cấu trúc file sao lưu của bản gốc. Mã nghiệp vụ sửa `db` tại chỗ rồi gọi
`store.save()`; tầng lưu trữ (`client/src/core/store.js`) so với bản đã đồng bộ và chỉ gửi phần thay đổi lên `POST /api/sync`.
Máy chủ tách dữ liệu thành các collection:

| Collection | Nội dung |
|---|---|
| `periods`, `period_items` | Kỳ kiểm kê vật tư và từng dòng vật tư (đồng bộ theo từng dòng) |
| `asset_periods`, `asset_items` | Kỳ kiểm kê CCDC & TSCĐ |
| `handovers`, `explains` | Biên bản bàn giao, phiếu giải trình |
| `settings` | Các khối khoá–giá trị: `hsd`, `recon`, `pay`, `profile`, `counters`, `sg`, ... |
| `users` | Tài khoản đăng nhập (mật khẩu băm bcrypt) và hồ sơ của từng tài khoản |
| `audit_logs` | Nhật ký thay đổi |
| `blobs` | Ảnh và tệp lớn (thay IndexedDB): ảnh tài sản, ảnh báo lỗi, PDF ký số |

Các máy đang mở sẽ tự lấy thay đổi của nhau (kiểm tra số phiên bản mỗi 15 giây và khi quay lại tab). Hai máy sửa cùng một
dòng thì lần ghi sau thắng.

Một số điểm về đồng bộ:

- **Mất kết nối**: thay đổi chưa gửi được lưu tạm trong IndexedDB của trình duyệt và tự gửi lại khi có mạng, kể cả sau khi
  đóng rồi mở lại trang. Ảnh và tệp (ảnh tài sản, ảnh báo lỗi, PDF) cũng có hàng đợi gửi lại riêng.
- **Dữ liệu riêng từng thiết bị** không được đưa lên máy chủ, giống bản gốc: khoá Face ID/vân tay (`webauthn`, `waFail`,
  `waPref`) và người ký cố định của máy trong mục Ký số PDF (`sg.sig`, `sg.name`, `sg.fixed`, `sg.dev`, `sg.pw`). Chúng nằm
  ở `localStorage` khoá `kk_dev_local`.
- **Bộ đếm số văn bản** (`counters`) được gộp theo từng khoá, lấy giá trị lớn nhất, để hai máy không ghi đè lần tăng của nhau.
- **Hồ sơ người dùng** gắn với từng tài khoản (không còn là dữ liệu chung); **cài đặt in** (`print`) vẫn dùng chung cho mọi máy.

### API

Mọi đường dẫn `/api/**` (trừ `/api/health`, đăng nhập, đăng xuất) cần đăng nhập, nếu không trả 401. Lệnh ghi (POST/PUT/DELETE) có body phải gửi `Content-Type: application/json`.

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/health` | Kiểm tra máy chủ và kết nối MongoDB (không cần đăng nhập) |
| POST | `/api/auth/login` | Đăng nhập `{username, password}`, đặt cookie phiên |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Thông tin tài khoản đang đăng nhập (kèm `perms` đã chuẩn hoá = quyền hiệu lực) |
| GET | `/api/auth/presets` | Danh sách 11 phân hệ và các vai trò mẫu `{modules, presets}` |
| PUT | `/api/auth/profile` | Tự sửa hồ sơ `{profile}` |
| PUT | `/api/auth/password` | Đổi mật khẩu `{current, next}` |
| GET/POST | `/api/users` | (quản trị) Danh sách / tạo tài khoản (nhận thêm `perms`) |
| PUT/DELETE | `/api/users/:id` | (quản trị) Sửa vai trò, khoá, hồ sơ, mật khẩu, `perms` / xoá tài khoản |
| GET | `/api/bootstrap` | Dữ liệu theo cấu trúc `db` + số phiên bản, **đã lọc theo quyền** của người gọi |
| GET | `/api/rev` | Số phiên bản dữ liệu hiện tại |
| POST | `/api/sync` | Lô thay đổi `{ops:[...]}` (kv / doc / item / audit). Trả `{ok, rev, prev, rejected:[{i, reason}]}`: op không đủ quyền bị bỏ qua và liệt kê ở `rejected` |
| GET | `/api/periods`, `/api/periods/:id`, `/api/handovers`, `/api/explains`, `/api/assets`, `/api/settings/:key` | Tra cứu chỉ đọc (lọc theo quyền / chi nhánh) |
| GET/PUT/DELETE | `/api/blobs/:store/:key` (`/raw` để lấy nội dung nhị phân) | Ảnh, tệp lớn (đọc cần mức ≥ 1, ghi/xoá cần mức 2 của phân hệ sở hữu store; 403 nếu thiếu) |

## Phân quyền

Mỗi tài khoản có `perms`: mức Không / Xem / Sửa cho 11 phân hệ, danh sách chi nhánh được phép, quyền khoá/mở khoá kỳ và quyền xoá.
Quản trị viên luôn toàn quyền; tài khoản thường chưa có `perms` được coi như vai trò mẫu "Chỉ xem". Máy chủ thực thi mọi kiểm tra
(lọc `/api/bootstrap`, kiểm tra từng op của `/api/sync`, blob, các route tra cứu); giao diện chỉ ẩn/khoá cho tiện dùng.
Quyền được đọc lại mỗi request nên sửa `perms` có hiệu lực ngay. Đặc tả đầy đủ: [docs/PERMISSIONS.md](docs/PERMISSIONS.md);
mã nguồn tại `server/src/perms.js` (bảng quyền), `server/src/syncguard.js` (kiểm tra `/api/sync`).

## Sao lưu

Ứng dụng không còn chức năng sao lưu/khôi phục; hãy sao lưu ở tầng hạ tầng (toàn bộ CSDL gồm cả tài khoản):

```bash
docker compose exec -T mongo mongodump --archive --gzip --db kiemke > kiemke.archive.gz
# Khôi phục (ghi đè dữ liệu hiện có):
docker compose exec -T mongo mongorestore --archive --gzip --drop < kiemke.archive.gz
```
