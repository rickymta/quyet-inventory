# Hướng dẫn port app gốc sang React (MERN)

App gốc là **một file** `reference/original/index.html` (~12.000 dòng JS thuần, dựng giao diện bằng chuỗi HTML + `onclick="A.xxx()"`,
dữ liệu trong biến toàn cục `db` lưu localStorage/IndexedDB). Bản mới: React (Vite) ở `client/`, API Express + MongoDB ở `server/`.

Mục tiêu khi port một phân hệ: **giữ nguyên 100% hành vi, câu chữ tiếng Việt, tên class CSS, cấu trúc dữ liệu** — chỉ đổi cách dựng giao diện
(chuỗi HTML → JSX) và cách truy cập biến toàn cục. Không thiết kế lại, không bỏ tính năng, không thêm tính năng.
CSS của app gốc đã được chép nguyên văn vào `client/src/styles/` nên chỉ cần giữ đúng `className`/`id`.

Tra cứu: `reference/INDEX.md` (dải dòng từng phân hệ, hành động `A.xxx` thuộc phân hệ nào, hàm cấp cao nhất thuộc phân hệ nào, các chỗ vá đè).
Đọc mã gốc theo dải dòng bằng `sed -n 'a,bp' reference/original/index.html` (nhiều dòng rất dài — đừng cắt cột khi cần port chính xác).

## 1. Cấu trúc một phân hệ

```
client/src/modules/<tên>/
  index.js        # BẮT BUỘC: import các file của phân hệ, đăng ký màn hình + hành động + hàm dùng chung
  *.jsx / *.js    # chia theo tính năng, mỗi file nên < ~700 dòng
```

`index.js` mẫu:

```js
import { A, X, registerView } from '../../core';
import * as list from './list.jsx';
import * as edit from './edit.jsx';

registerView('handover', list.HandoverList);       // tên view = route.view của app gốc
registerView('handoverEdit', edit.HandoverEdit);
Object.assign(A, list.actions, edit.actions);      // mọi A.xxx mà phân hệ sở hữu (theo INDEX.md)
Object.assign(X, list, edit);                      // MỌI hàm/hằng cấp cao nhất của phân hệ, theo ĐÚNG TÊN GỐC
```

Mọi file `modules/*/index.js` được nạp tự động (`import.meta.glob`). **Không sửa file ngoài thư mục phân hệ của mình** (kể cả `core/`);
nếu thấy lõi thiếu gì, ghi rõ trong báo cáo cuối.

## 2. Biến toàn cục của app gốc → bản mới

Tất cả import từ `'../../core'`:

| App gốc | Bản mới | Ghi chú |
|---|---|---|
| `db` | `db` | Cùng cấu trúc. **Luôn sửa tại chỗ**, không gán lại; cần thay toàn bộ thì `replaceDb(obj)` |
| `route`, `FD`, `P`, `BC`, `BCMETA`, `ST`, `UP`, `SB`, `HV`, `EX`, `PICK`, `qT`, `stqT` | `S.route`, `S.FD`, `S.P`, ... | Biến trạng thái bị gán lại nằm trong `S` |
| biến trạng thái cấp cao nhất khác **bị gán lại** (`SC=...`, `PH2=null`...) | `S.<TÊN_GỐC>` | Để phân hệ khác đọc được |
| đối tượng trạng thái **không bị gán lại** (`RC`, `PAY`, `AP`, `LS`, `HS`, `UNM`...) | `export const RC = {...}` + đưa lên `X` | Phân hệ khác dùng `X.RC` |
| `A.xxx(...)` | `A.xxx(...)` | `A` là object dùng chung; phân hệ sở hữu định nghĩa, nơi khác cứ gọi `A.xxx()` |
| hàm cấp cao nhất của **phân hệ khác** | `X.tenHam(...)` | Không import chéo giữa các phân hệ. Trong cùng phân hệ thì import/gọi trực tiếp |
| `ASX.xxx`, `LSX.xxx`, `LKX.xxx`, `SGX.xxx`... | giữ nguyên là object, `export` + đưa lên `X` | nơi khác gọi `X.ASX.xxx()` |
| `render()` | `render()` | Đóng modal, `S.SB=null`, vẽ lại, cuộn lên đầu, đồng bộ hash |
| `renderXxx()` gọi trực tiếp để vẽ lại một màn | `rerender()` | Mỗi phân hệ vẫn phải `export const renderXxx = () => rerender()` cho từng hàm render gốc của mình (nơi khác gọi `X.renderXxx()`) |
| `store.save()`, `saveSoon()`, `store.flush()`, `store.saveVerified()` | cùng tên | Tự so khác biệt và đẩy lên MongoDB. Cần chờ ghi xong: `await store.flushNow()` |
| `audit(type,target,before,after)` | cùng tên | |
| `toast(m)`, `confirm()`, `prompt()`, `alert()` | cùng tên / giữ nguyên hộp thoại trình duyệt | |
| `per(id)`, `hsdEntries()`, `norm`, `esc`, `fmt`, `parseNum`, `qtyCheck`, `soThanhChu`, `daysTo`, `fmtDate`, `normKey`, `branchCode`, `diffOf`, `needsCount`, `zeroPending`, `BUCKETS`, `QUICK_NOTES`, `DEFAULT_FOLDERS` | cùng tên | |
| `klog(ctx, err)` | cùng tên | |
| `kkNeed(['xlsx','exceljs'], retry)` | cùng tên | Sau khi sẵn sàng dùng `window.XLSX`, `window.ExcelJS` như cũ. Không nạp script từ CDN |
| nạp ZXing / Tesseract / pdf-lib / pdf.js từ CDN | `await kkReady(['zxing'])` → `window.ZXing`; `'tesseract'` → `window.Tesseract`; `'pdflib'` → `window.PDFLib`; `'pdfjs'` → `window.pdfjsLib` (worker đã cấu hình) | Tesseract: dùng `createWorker('eng')` mặc định, bỏ đường dẫn CDN tuỳ chỉnh |
| `localStorage` chứa **dữ liệu nghiệp vụ** (`kk_err_v1`, dữ liệu phân tích...) | đưa vào `db` dưới khoá mới (vd `db.err`, `db.ana`) rồi `store.save()` | Để đồng bộ lên máy chủ. Ghi rõ khoá mới trong báo cáo. Tuỳ chọn giao diện thuần tuý (`kk_ui_*`, snapshot KPI) vẫn để `localStorage` |
| IndexedDB (`kk_photos`, `kk_err_img`, `kv` của ký số...) | `blobs.get(store,key)`, `blobs.put(store,key,value)`, `blobs.del(store,key)`, `blobs.keys(store)` (async) | `value` phải là JSON (chuỗi dataURL/base64...). ArrayBuffer/Blob → đổi sang dataURL trước khi lưu, đổi ngược khi đọc |
| `hashSync()`, cập nhật bản mới, service worker | bỏ | Lõi đã lo điều hướng; bản server không cần tự kiểm tra bản mới |

`A` có sẵn từ lõi: `go`, `navGo`, `navStock`, `drawerToggle`, `drawerClose`, `navGroup`, `sbToggle`, `navFolder`, `navFolderAdd`, `closeSheet`.
Lõi cũng xuất: `rerender`, `useStore`, `api`, `blobs`, `sanitizeDb`, `deepSync`, `replaceDb`, `registerView`, `go`, `openModal`, `closeModal`,
`modalOpen`, `openLayer`, `closeLayer`, `bind`, `st`, `H`, `I`, `FcIco`, `FcGly`, `NavIco`, `Icon`, `icon`, `fcIco`, `fcGly`, `fcKey`, `ICONS`, `kkReady`, `kkLoad`, `kkHas`.

## 3. Chuỗi HTML → JSX

- Hàm `renderXxx()` gán `document.getElementById('app').innerHTML = h` → component React trả JSX tương đương (phần trong `#app`).
  Hàm phụ trả mảnh HTML (`xxxHtml()`) → hàm cùng tên trả JSX. **Riêng** các hàm sinh HTML cho in ấn / xuất Word / Excel / email / cửa sổ in
  (`window.open`, Blob `.doc`, `mailto:`) thì **giữ nguyên dạng chuỗi** (chép gần như nguyên văn, vẫn dùng `esc()`).
- Giao diện vẽ lại theo kiểu "immediate mode": sửa trạng thái (`db`, `S`, object trạng thái của phân hệ) rồi gọi `rerender()`; toàn bộ cây React vẽ lại.
  Không cần `useState` cho trạng thái nghiệp vụ. **Không gọi `rerender()`/`render()` trong lúc đang render** (chỉ gọi trong handler, effect, callback).
- `onclick="A.foo(1,'x')"` → `onClick={() => A.foo(1, 'x')}`; `event.stopPropagation()` giữ nguyên; `this.value` → `e.target.value`.
- Ô nhập: mặc định dùng ô **có kiểm soát** — `value={obj.k}` + `onChange={(e) => { obj.k = e.target.value; rerender(); }}` (hoặc `{...bind(obj,'k')}`).
  Chỗ app gốc đọc DOM lúc bấm nút (`document.getElementById('x').value`) có thể giữ `id` + `defaultValue` và đọc DOM như cũ, nhưng phải đặt `key`
  để ô được tạo lại khi bản ghi nền thay đổi.
- `class` → `className`, `for` → `htmlFor`, thuộc tính SVG camelCase. Style nội tuyến dạng chuỗi: dùng `style={st('display:flex;gap:10px')}`.
- **Không dùng `esc()` cho chữ trong JSX** (React tự escape — dùng sẽ hiện `&amp;`). Thực thể HTML trong chuỗi (`&amp;`, `&nbsp;`, `&#39;`) đổi thành ký tự thật.
- Icon: `icon('warn',18)` → `{I('warn',18)}`; `fcIco(k,38)` → `{FcIco(k,38)}`; `fcGly` → `{FcGly(...)}`. SVG/HTML tĩnh dài (hình minh hoạ) → `{H(chuỗi)}`.
  `H()` **chỉ** dành cho nội dung tĩnh không có sự kiện; không dùng `dangerouslySetInnerHTML` cho phần có tương tác.
- Modal/sheet: `document.getElementById('modal').innerHTML = html` → `openModal(() => <JSX/>)` (hàm được gọi lại mỗi lần vẽ nên nội dung luôn mới);
  xoá `#modal` → `closeModal()`. Chỉ có **một** khe modal như app gốc. Phần tử gắn thẳng vào `document.body` → `openLayer(key, () => <JSX/>)` / `closeLayer(key)`.
- `insertAdjacentHTML`, sửa DOM sau khi vẽ, và các chỗ **vá đè** (bảng cuối `INDEX.md`: `var o=A.x; A.x=function(){...}`) → gộp vào hành vi cuối cùng
  của hàm/màn hình bị vá (phân hệ sở hữu hàm gốc chịu trách nhiệm gộp; nếu bản vá nằm trong dải dòng của bạn nhưng hàm gốc thuộc phân hệ khác,
  hãy tự bọc lại trong `index.js` của bạn theo kiểu `const o = A.x; A.x = function (...a) {...}` bên trong `queueMicrotask`/`setTimeout(…,0)` để chắc chắn hàm gốc đã được đăng ký).
- Thao tác DOM mệnh lệnh cho camera/canvas/video/file input/focus/scroll được phép (trong handler, `ref`, `useEffect`).
- Danh sách phải có `key` ổn định.

## 4. Kiểm tra trước khi báo xong

```bash
cd client && npx esbuild src/modules/<tên>/*.js* --loader:.js=jsx --format=esm --outdir=/tmp/esb-<tên> --log-level=warning
```

(Chỉ kiểm tra cú pháp từng file. **Không** chạy `vite build`/`npm install`, không khởi động server — phần tích hợp do người điều phối làm.)
Tự rà lại: mọi `A.xxx` phân hệ sở hữu (theo `INDEX.md`) đã được định nghĩa; mọi hàm cấp cao nhất trong dải dòng đã có mặt trên `X` đúng tên;
mọi tên không thuộc phân hệ mình đều gọi qua `X.`/`A.`/lõi; không còn `document.getElementById('app').innerHTML`.

## 5. Báo cáo cuối (ngắn gọn)

Danh sách file đã tạo; view đã đăng ký; khoá mới thêm vào `db` (nếu có); tên `X.`/`A.` của phân hệ khác mà bạn phụ thuộc;
những gì **chưa port được hoặc chưa chắc đúng** (ghi cụ thể dòng gốc). Không dán lại mã nguồn.
