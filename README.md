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
│   ├── src/                mã máy chủ (seed.js nạp dữ liệu ban đầu, auth.js tạo tài khoản đầu tiên)
│   ├── seed/data/          bộ seed: dữ liệu hiện có, nằm trong mã nguồn và image Docker (xem server/seed/README.md)
│   └── scripts/            backup-to-seed.mjs: đổi file sao lưu thành bộ seed
├── reference/              mã gốc + bản đồ mã (INDEX.md) dùng khi port
├── docs/PORTING.md         quy ước port từ bản gốc sang React
├── Dockerfile              build nhiều tầng → một image chạy cả API lẫn giao diện
├── docker-compose.yml      nginx + app + MongoDB
├── docker-compose.https.yml  ghi đè bật HTTPS (Let's Encrypt, certbot)
├── nginx/                  cấu hình nginx: templates/ (HTTP), templates-https/ (HTTPS), snippets/ (proxy dùng chung)
└── scripts/                https-init.sh (cấp chứng chỉ + bật HTTPS), https-renew.sh (gia hạn)
```

## Chạy bằng Docker

```bash
docker compose up -d --build
```

Mở <http://localhost> (nginx reverse proxy ở cổng 80, chuyển tiếp tới app). Chạy thử trên máy cá nhân mà cổng 80 đã bận
hoặc cần quyền root: đặt `HTTP_PORT=8080` (`HTTP_PORT=8080 docker compose up -d --build`) rồi mở <http://localhost:8080>.
Cổng của app (`APP_PORT`, mặc định 8080) chỉ gắn vào `127.0.0.1` của máy chủ để chẩn đoán, không ra ngoài.
Lần chạy đầu, khi CSDL còn trống, máy chủ tự nạp bộ seed đi kèm (`server/seed/data`, đã nằm sẵn trong image) và tạo tài khoản quản trị; không cần kèm file ngoài.

Tuỳ chỉnh qua file `.env` (xem `.env.example`):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `HTTP_PORT` | `80` | Cổng HTTP của nginx (cổng người dùng truy cập) |
| `HTTPS_PORT` | `443` | Cổng HTTPS của nginx (chỉ khi dùng `docker-compose.https.yml`) |
| `SERVER_NAME` | `_` | Tên miền của máy chủ (`server_name` nginx, đường dẫn chứng chỉ); `scripts/https-init.sh` tự ghi |
| `APP_PORT` | `8080` | Cổng của app, chỉ gắn vào `127.0.0.1` của máy chủ để chẩn đoán |
| `SEED_PATH` | trống | Tuỳ chọn: đường dẫn (trong container) tới thư mục seed hoặc file sao lưu JSON dùng thay bộ seed đi kèm; trống = dùng `server/seed/data` |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `admin`, `Admin123` | Tài khoản quản trị tạo ở lần chạy đầu, khi chưa có tài khoản nào |
| `JWT_SECRET` | trống | Khoá ký phiên đăng nhập; trống thì tự sinh và lưu trong CSDL (phiên không mất khi khởi động lại) |
| `SESSION_DAYS` | `7` | Số ngày hiệu lực của phiên đăng nhập |
| `TRUST_PROXY` | `1` | Tin `X-Forwarded-*` do nginx gửi (để cookie có cờ `Secure` khi truy cập qua HTTPS); app luôn đứng sau nginx nên mặc định bật |

> Bản gốc không có đăng nhập; bản này yêu cầu tài khoản. Khi đưa lên mạng dùng chung, nên bật HTTPS
> (camera quét mã và xác thực Face ID/vân tay của trình duyệt chỉ hoạt động trên HTTPS hoặc `localhost`); xem mục dưới.

### Triển khai trên máy chủ với nginx

1. Mở cổng **80** và **443** trên tường lửa của VPS (ví dụ `ufw allow 80,443/tcp`) và của nhà cung cấp đám mây.
2. Trỏ bản ghi DNS `A` (và `AAAA` nếu có) của tên miền về IP máy chủ; chờ DNS có hiệu lực.
3. Chạy `docker compose up -d --build` (HTTP, cổng 80).
4. Bật HTTPS bằng Let's Encrypt:

   ```bash
   scripts/https-init.sh kho.example.com admin@example.com
   ```

   Script bảo đảm stack đang chạy, lấy chứng chỉ bằng certbot (webroot qua `/.well-known/acme-challenge/`), ghi đúng dòng
   `SERVER_NAME=` vào `.env`, rồi khởi động lại nginx với `docker-compose.https.yml`. Thử trước bằng `STAGING=1 scripts/https-init.sh ...`
   để tránh giới hạn tần suất của Let's Encrypt. Từ đó khởi động bằng:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.https.yml up -d
   ```

   HTTP tự chuyển hướng 301 sang HTTPS (trừ đường dẫn cấp chứng chỉ).
5. Gia hạn tự động: chứng chỉ sống 90 ngày; thêm vào `crontab -e` (chạy 03:17 mỗi ngày, certbot chỉ gia hạn khi sắp hết hạn):

   ```cron
   17 3 * * * cd /đường/dẫn/tới/dự-án && scripts/https-renew.sh >> /var/log/kiemke-renew.log 2>&1
   ```

6. Xem log: `docker compose logs -f nginx` (truy cập, lỗi), `docker compose logs -f app`. Kiểm tra cấu hình nginx:
   `docker compose exec nginx nginx -t`.

Ghi chú cấu hình nginx: giới hạn body 110 MB (app nhận tới 100 MB cho ảnh/PDF), timeout đọc/gửi 120 s; nginx **không nén gzip**
vì Express đã nén và nginx chuyển nguyên `Content-Encoding`; `/api/` không cache, `/assets/` giữ header cache của app;
`X-Forwarded-Proto` luôn do nginx ghi đè theo kết nối thật. Nếu đặt thêm một proxy/CDN phía trước nginx thì cần chỉnh lại việc tin `X-Forwarded-*`.

### Đăng nhập và tài khoản

Dữ liệu quản lý tập trung: ai có tài khoản thì đăng nhập được và thấy chung toàn bộ dữ liệu. Lần chạy đầu máy chủ tạo sẵn
tài khoản quản trị **`admin` / `Admin123`** (hồ sơ lấy từ `users.json` của bộ seed; mật khẩu ban đầu là `ADMIN_PASSWORD`). **Hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên.**

- Phiên đăng nhập là cookie httpOnly `kk_session` (JWT, hiệu lực `SESSION_DAYS` ngày). Đổi mật khẩu hoặc bị quản trị đặt lại
  mật khẩu thì các phiên khác hết hiệu lực; tài khoản bị khoá thì mất phiên ngay.
- Quản trị viên tạo, khoá/mở khoá, đổi vai trò (`admin`/`user`), đặt lại mật khẩu và xoá tài khoản. Luôn phải còn ít nhất một
  quản trị viên đang hoạt động; không thể tự khoá hoặc tự xoá chính mình.
- Tên đăng nhập 3–32 ký tự `a-z 0-9 . _ -` (lưu chữ thường); mật khẩu tối thiểu 8 ký tự (băm bcrypt). Đăng nhập sai quá 8 lần
  trong 10 phút (theo IP + tên đăng nhập) sẽ bị tạm chặn.
- Mỗi tài khoản có hồ sơ riêng (họ tên, chức vụ, chi nhánh, mã).

Dữ liệu MongoDB nằm trong volume `kiemke_mongo-data`. Nạp lại từ đầu: `docker compose down -v` rồi `up` lại.

### Dữ liệu ban đầu (bộ seed)

Dữ liệu hiện có của dự án nằm trong mã nguồn tại `server/seed/data` (mỗi kỳ, biên bản, khối cài đặt một file JSON; xem
[server/seed/README.md](server/seed/README.md)) và được sao chép vào image Docker. Khi CSDL còn trống, máy chủ nạp bộ seed rồi
tạo tài khoản trong `users.json` (hiện là `admin`, mật khẩu ban đầu = `ADMIN_PASSWORD`, mặc định `Admin123`; `ADMIN_USERNAME`
khác `admin` thì thay tên của quản trị viên đầu tiên). Không có `users.json` thì tạo một quản trị viên mặc định.

- Tạo lại bộ seed từ một file sao lưu khác của app gốc:
  `node server/scripts/backup-to-seed.mjs đường/dẫn/SaoLuu.json` (hoặc `npm run seed:build -- đường/dẫn/SaoLuu.json`),
  mặc định ghi vào `server/seed/data` (xoá sạch thư mục đích trước khi ghi). Thêm tham số thứ hai để ghi nơi khác.
- Nạp lại: `docker compose down -v` rồi `docker compose up -d --build`, hoặc với CSDL đang chạy `npm run seed -- --force`
  (ghi đè dữ liệu, không đụng tài khoản). `npm run seed -- --force đường/dẫn` nhận cả thư mục seed lẫn file sao lưu JSON.
- Đặt `SEED_PATH` để nạp từ nguồn khác (thư mục seed, file hoặc thư mục chứa file sao lưu JSON) thay vì bộ đi kèm.
- **Đây là dữ liệu thật** (số liệu kho, chữ ký tay): chỉ để trong kho mã riêng tư.

## Chạy khi phát triển

```bash
npm run install:all      # cài thư viện cho server và client
npm run dev:db           # MongoDB bằng Docker (cổng 27017)
npm run dev:server       # API ở http://localhost:4000 (tự nạp server/seed/data nếu CSDL trống)
npm run dev:client       # Vite ở http://localhost:5173, proxy /api sang cổng 4000
```

Nạp lại dữ liệu (ghi đè): `npm run seed -- --force` (bộ seed đi kèm) hoặc `npm run seed -- --force đường/dẫn/file.json`.

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
