# Phân quyền chi tiết — đặc tả (hợp đồng giữa máy chủ và giao diện)

Mục tiêu: mỗi tài khoản được cấp quyền theo **phân hệ** (Không / Xem / Sửa) và theo **chi nhánh**, cộng hai quyền riêng:
**khoá/mở khoá kỳ** và **xoá dữ liệu**. Quản trị viên gán bằng **vai trò mẫu** rồi chỉnh riêng từng quyền.
Mọi kiểm tra quyền phải được **máy chủ thực thi**; giao diện chỉ ẩn/khoá cho tiện dùng.

## 1. Mô hình

Trên tài khoản (`User.perms`):

```js
perms: {
  preset: 'thukho' | 'ketoan' | 'hanhchinh' | 'xem' | 'custom',   // vai trò mẫu đã chọn (chỉ để hiển thị)
  modules: { kiemke, hsd, assets, handover, explain, recon, pay, ana, err, sign, config },  // mỗi khoá: 0 | 1 | 2
  branches: '*' | ['Bùi Thị Xuân', 'Cát Linh', ...],             // '*' = mọi chi nhánh; mảng = đúng tên trong db.folders
  lock: boolean,   // được khoá / mở khoá kỳ kiểm kê (vật tư và CCDC)
  del: boolean     // được xoá kỳ kiểm kê, kỳ CCDC, biên bản bàn giao, phiếu giải trình
}
```

- Mức: `0` không truy cập · `1` chỉ xem (mở, in, xuất Excel/Word được; không lưu thay đổi) · `2` được sửa.
- `role === 'admin'` luôn có toàn quyền (mọi phân hệ mức 2, `branches: '*'`, `lock` và `del` = true), bất kể `perms` lưu gì.
- Tài khoản `user` chưa có `perms` (dữ liệu cũ) → coi như vai trò mẫu **Chỉ xem**.
- Máy chủ chuẩn hoá `perms` khi nhận: khoá phân hệ lạ bị bỏ, mức ngoài 0–2 → 400, `branches` phải là `'*'` hoặc mảng chuỗi (≤ 100 phần tử).

### Phân hệ

| Khoá | Tên hiển thị | Màn hình (`route.view`) | Dữ liệu |
|---|---|---|---|
| `kiemke` | Kiểm kê vật tư | `lists`, `upload`, `folder`, `period`, `stock`, `transfer`, `baocao`, `reporthub`, `mgmt` | collection `periods` (+ dòng vật tư); kv `barcodes`, `boxref`, `track`, `ocrfix`, `hsd` |
| `hsd` | Cảnh báo hạn sử dụng | `hsd` | kv `hsd` (chỉ đọc; việc ghi do `kiemke` thực hiện) |
| `assets` | Kiểm kê CCDC & TSCĐ | `assets`, `asset` | collection `assets` (+ dòng tài sản); blob `kk_photos` |
| `handover` | Biên bản bàn giao | `handover`, `handoverEdit` | collection `handovers` |
| `explain` | Giải trình chênh lệch | `explain`, `explainEdit` | collection `explains` |
| `recon` | Đối chiếu doanh thu – xuất kho | `recon` | kv `recon` |
| `pay` | Thanh toán NCC | `pay` | kv `pay` |
| `ana` | Phân tích mua hàng – tiêu hao | `ana` | kv `ana` |
| `err` | Báo lỗi nhập liệu & labo | `err` | kv `err`; blob `kk_err_img` |
| `sign` | Ký số PDF | `sign` | kv `sg`; blob `kk_sign` |
| `config` | Cấu hình chung (chi nhánh, in ấn, người ký) | phần tương ứng trong `settings` | kv `folders`, `print`, `signers`, `keys` |

Các màn `home`, `dchub`, `settings` (hồ sơ, đổi mật khẩu) luôn vào được; nội dung bên trong tự ẩn phần không có quyền.

### Vai trò mẫu

| Mẫu | kiemke | hsd | assets | handover | explain | recon | pay | ana | err | sign | config | lock | del | branches |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `thukho` Thủ kho | 2 | 1 | 2 | 2 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | ✗ | ✗ | (quản trị viên chọn; mặc định `'*'`) |
| `ketoan` Kế toán | 1 | 1 | 1 | 1 | 1 | 2 | 2 | 2 | 2 | 1 | 0 | ✓ | ✗ | `'*'` |
| `hanhchinh` Hành chính | 2 | 1 | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 2 | ✓ | ✓ | `'*'` |
| `xem` Chỉ xem | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | ✗ | ✗ | `'*'` |
| `custom` Tuỳ chỉnh | — quản trị viên tự tích — |

Bảng mẫu được định nghĩa **một nơi ở máy chủ** và trả cho giao diện qua `GET /api/auth/presets` (xem mục 3) để hai bên không lệch nhau.

## 2. Quy tắc theo chi nhánh

Chi nhánh là tên trong `db.folders`. Áp dụng cho:

- `periods` và `assets`: theo trường `folder` của kỳ. Kỳ có `folder` rỗng/thiếu ("Chưa phân loại") chỉ tài khoản `branches: '*'` thấy.
- `handovers`, `explains`: theo `folder` của bản ghi nếu có; nếu không có thì theo `folder` của kỳ có `id === periodId` (tìm trong `periods` rồi `assets`);
  không xác định được chi nhánh → mọi tài khoản có quyền phân hệ đều thấy.
- kv `folders`: tài khoản bị giới hạn chi nhánh chỉ nhận danh sách đã lọc theo `branches` (giữ thứ tự gốc).
- Các phân hệ `recon`, `pay`, `ana`, `err`, `sign`, `hsd` **không** lọc theo chi nhánh ở máy chủ (dữ liệu dùng hệ tên cơ sở khác).

## 3. API

Đối tượng `user` (ở `/api/auth/me`, `/api/auth/login`, `/api/users*`) có thêm:

```js
perms: { preset, modules: {…đủ 11 khoá…}, branches, lock, del }   // ĐÃ CHUẨN HOÁ = quyền hiệu lực (admin → toàn quyền)
```

- `GET /api/auth/presets` (cần đăng nhập) → `{ modules: [{ key, label }...theo thứ tự bảng trên], presets: [{ key, label, perms }] }`.
- `POST /api/users` và `PUT /api/users/:id` nhận thêm `perms` (bỏ qua với `role: 'admin'`).
- `GET /api/bootstrap` trả dữ liệu **đã lọc theo quyền** của người gọi:
  - collection của phân hệ mức 0 → mảng rỗng; kv của phân hệ mức 0 → không có khoá đó.
  - `hsd` có mặt khi `kiemke ≥ 1` hoặc `hsd ≥ 1`. `barcodes`, `boxref`, `track`, `ocrfix` có mặt khi `kiemke ≥ 1` hoặc `assets ≥ 1`.
  - `counters`, `folders` (đã lọc), `print`, `signers`, `keys` luôn có mặt (cần để dựng văn bản).
  - `audit`: chỉ quản trị viên nhận đủ; tài khoản khác nhận mảng rỗng.
  - Thứ tự các collection: theo `createdAt` giảm dần (mới nhất trước), bằng nhau thì theo `ord`. (Không còn phụ thuộc `ord` do client gửi, vì client bị lọc chỉ biết một phần danh sách.)
- `POST /api/sync` áp các op **được phép**, bỏ qua op không được phép và trả:
  `{ ok: true, rev, prev, rejected: [{ i, reason }] }` — `i` là chỉ số op trong lô, `reason` là câu tiếng Việt ngắn. Không trả 403 cho cả lô.
- Blob: `GET` cần mức ≥ 1 của phân hệ sở hữu store, `PUT`/`DELETE` cần mức 2 (`kk_photos` → `assets`, `kk_err_img` → `err`, `kk_sign` → `sign`; store khác → chỉ quản trị viên). Không đủ quyền → 403.
- Các route tra cứu chỉ đọc (`/api/periods`, `/api/periods/:id`, `/api/handovers`, `/api/explains`, `/api/assets`, `/api/settings/:key`) áp cùng bộ lọc; không có quyền → 403 hoặc 404.

### Quy tắc kiểm tra từng op của `/api/sync`

| Op | Điều kiện |
|---|---|
| `kv` / `kvdel` với khoá `recon`, `pay`, `ana`, `err`, `sg` | phân hệ tương ứng mức 2 |
| `kv` `barcodes`, `boxref`, `track`, `ocrfix` | `kiemke` = 2 hoặc `assets` = 2 |
| `kv` `hsd` | `kiemke` = 2 |
| `kv` `print`, `signers`, `keys` | `config` = 2 |
| `kv` `folders` | `config` = 2 **và** `branches === '*'` (tài khoản bị lọc chi nhánh không được ghi đè danh sách chung) |
| `kv` `counters` | có ít nhất một trong `handover`, `explain`, `kiemke`, `assets` ở mức 2 |
| `kv` khoá khác | có ít nhất một phân hệ mức 2 |
| `doc` (có `d`) vào `periods`/`assets` | **Chỉ khoá/mở khoá** (bản ghi đã tồn tại và `d` chỉ khác bản đang lưu ở `locked`, `lockLog`; so sâu phần còn lại, bỏ qua `items`): `lock` **và** phân hệ mức ≥ 1, chi nhánh được phép. **Các trường hợp khác**: phân hệ mức 2; `d.folder` thuộc chi nhánh được phép; nếu bản ghi đã tồn tại thì `folder` cũ cũng phải được phép; nếu trạng thái khoá đổi (`!!cũ.locked !== !!d.locked`) thì cần thêm `lock` |
| `doc` (có `d`) vào `handovers`/`explains` | phân hệ mức 2; chi nhánh xác định theo mục 2 (cả bản cũ lẫn bản mới) phải được phép |
| `doc` không có `d` (chỉ đổi thứ tự) | bỏ qua êm (không coi là bị từ chối) |
| `docdel` | phân hệ mức 2 **và** `del`; chi nhánh của bản ghi phải được phép |
| `item` / `itemdel` | phân hệ mức 2; chi nhánh của kỳ cha (bản đang lưu, hoặc op `doc` của kỳ đó trong cùng lô nếu kỳ mới) phải được phép |
| `audit` | luôn được phép |

Op gửi tới bản ghi mà người gọi **không nhìn thấy** (ngoài chi nhánh / phân hệ mức 0) luôn bị từ chối, kể cả khi bản ghi chưa tồn tại nhưng `folder` đích không được phép.

## 4. Giao diện

- Lõi cung cấp (và đưa lên `X`): `can(moduleKey, level = 1)`, `canEdit(moduleKey)`, `canBranch(folder)`, `canLock()`, `canDel()`, `viewModule(view)`.
- Menu (sidebar, drawer, thanh dưới, thẻ ở trang chủ/hub): ẩn mục của phân hệ mức 0. Vào thẳng đường dẫn của màn không có quyền → toast "Bạn không có quyền truy cập mục này" và về Tổng quan.
- Màn của phân hệ mức 1: hiện dải thông báo "Chế độ chỉ xem — thay đổi sẽ không được lưu" ở đầu màn.
- Nút khoá/mở khoá kỳ, nút xoá kỳ/biên bản/phiếu, nút tạo kỳ/tạo biên bản: ẩn hoặc chặn kèm toast khi thiếu quyền tương ứng.
- Khi `/api/sync` trả `rejected` không rỗng: toast lý do đầu tiên ("Không lưu được: …"), rồi **tải lại dữ liệu từ máy chủ** để màn hình trở về đúng trạng thái đã lưu (bỏ thay đổi cục bộ không được phép). Không thử gửi lại các op đó.
- Cài đặt → Quản lý tài khoản: form tạo/sửa có chọn vai trò mẫu (điền sẵn bảng quyền), bảng phân hệ × (Không / Xem / Sửa), danh sách chi nhánh (Tất cả hoặc tích từng chi nhánh), hai công tắc "Khoá / mở khoá kỳ" và "Xoá dữ liệu". Sửa tay bất kỳ quyền nào → `preset: 'custom'`. Danh sách tài khoản hiện tên vai trò mẫu và tóm tắt chi nhánh.
