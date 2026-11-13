/* Trạng thái toàn cục — giữ đúng mô hình của app gốc để phần port bám sát mã nguồn.
   - db : toàn bộ dữ liệu (dữ liệu dùng chung lưu trên máy chủ; riêng `profile` là hồ sơ của tài khoản đang đăng nhập). LUÔN sửa tại chỗ, không gán lại biến.
   - S  : các biến trạng thái màn hình mà app gốc để ở phạm vi toàn cục (route, P, UP, SB, HV, ...).
   - A  : bảng "hành động" (A.xxx trong app gốc). Mỗi phân hệ tự gắn hành động của mình vào đây.
   - X  : không gian tên dùng chung cho hàm/hằng cấp cao nhất của mọi phân hệ (gọi chéo: X.tenHam()). */
export const DEFAULT_FOLDERS = ['Bùi Thị Xuân', 'Lê Văn Lương', 'Cát Linh', 'Quảng Ninh', 'Ba Đình-Nghĩa Dũng'];

export const emptyDb = () => ({
  folders: DEFAULT_FOLDERS.slice(), barcodes: {}, boxref: {}, track: {}, periods: [], hsd: {}, handovers: [], explains: [], counters: {},
  profile: { ten: '', chucVu: '', chiNhanh: '', ma: '', maManual: false },
});
export const db = emptyDb();

export const S = {
  route: { view: 'home' },
  FD: null,     // thư mục chi nhánh đang mở
  P: null,      // trạng thái màn hình kiểm kê
  BC: null,     // trạng thái màn hình tạo báo cáo
  BCMETA: null, // thông tin bổ sung cho báo cáo
  ST: null,     // trạng thái bảng tồn kho (chỉ xem)
  UP: null,     // trạng thái upload
  SB: null,     // trạng thái sheet nhập liệu
  HV: null,     // biên bản bàn giao đang sửa
  EX: null,     // phiếu giải trình đang sửa
  PICK: null,   // trạng thái picker lấy vật tư từ kỳ kiểm kê
  qT: null,
  stqT: null,
  drawer: false,   // drawer điều hướng (điện thoại) đang mở
  NAV_OPEN: '',    // nhóm menu đang mở
  NAV_LASTV: null,
};

/* Phiên bản app gốc mà bản port này bám theo  */
export const APP_VERSION = '2026111301';

export const A = {};
export const X = {};

if (typeof window !== 'undefined') Object.assign(window, { __kk: { db, S, A, X } });
