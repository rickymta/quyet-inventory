import mongoose from 'mongoose';

const { Schema } = mongoose;
const opts = { minimize: false, versionKey: false, timestamps: { createdAt: false, updatedAt: 'updatedAt' } };

/* Mỗi bản ghi giữ nguyên cấu trúc của app gốc trong `data` (cấu trúc linh hoạt, nhiều trường tuỳ chọn).
   `_id` là id do client sinh; `ord` giữ thứ tự hiển thị trong danh sách. */
function docModel(name, collection) {
  const schema = new Schema(
    { _id: String, ord: { type: Number, default: 0, index: true }, data: { type: Schema.Types.Mixed, default: {} } },
    { ...opts, collection }
  );
  return mongoose.model(name, schema);
}

/* Dòng vật tư / tài sản của một kỳ kiểm kê. `_id` = `<pid>:<id>`; `idx` giữ thứ tự dòng như file Excel. */
function itemModel(name, collection) {
  const schema = new Schema(
    {
      _id: String,
      pid: { type: String, index: true },
      iid: String,
      idx: { type: Number, default: 0 },
      data: { type: Schema.Types.Mixed, default: {} },
    },
    { ...opts, collection }
  );
  schema.index({ pid: 1, idx: 1 });
  return mongoose.model(name, schema);
}

export const Period = docModel('Period', 'periods');
export const PeriodItem = itemModel('PeriodItem', 'period_items');
export const AssetPeriod = docModel('AssetPeriod', 'asset_periods');
export const AssetItem = itemModel('AssetItem', 'asset_items');
export const Handover = docModel('Handover', 'handovers');
export const Explain = docModel('Explain', 'explains');

/* Các khối dữ liệu dạng khoá–giá trị của app gốc: hsd, counters, profile, recon, pay, sg, ... */
export const Setting = mongoose.model(
  'Setting',
  new Schema({ _id: String, value: Schema.Types.Mixed }, { ...opts, collection: 'settings' })
);

/* Nhật ký thay đổi (db.audit) — chỉ ghi nối thêm. */
const auditSchema = new Schema(
  { seq: { type: Number, index: true }, key: String, data: Schema.Types.Mixed },
  { versionKey: false, collection: 'audit_logs' }
);
/* `key` = data.k hoặc sha1(data): chống ghi trùng khi client gửi lại. sparse để các bản ghi cũ chưa có key không xung đột. */
auditSchema.index({ key: 1 }, { unique: true, sparse: true });
export const AuditLog = mongoose.model('AuditLog', auditSchema);

/* Dữ liệu nhị phân/ảnh lớn (thay cho IndexedDB của app gốc): ảnh tài sản, ảnh báo lỗi, PDF đã ký... */
const blobSchema = new Schema(
  {
    _id: String, store: { type: String, index: true }, key: String, value: Schema.Types.Mixed, size: Number,
    /* blob lớn: document chính giữ { parts, size } (không có value); các phần có part:true, parent = _id chính */
    parts: Number, part: Boolean, parent: { type: String, index: true },
  },
  { ...opts, collection: 'blobs' }
);
export const Blob = mongoose.model('Blob', blobSchema);

/* Tài khoản đăng nhập. `pv` (password version) tăng khi đổi mật khẩu để vô hiệu các phiên cũ. */
const userSchema = new Schema(
  {
    username: { type: String, required: true },
    hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    active: { type: Boolean, default: true },
    /* Phân quyền chi tiết (xem perms.js); chưa có → coi như mẫu "xem" */
    perms: { type: Schema.Types.Mixed, default: undefined },
    pv: { type: Number, default: 0 },
    profile: {
      type: new Schema(
        { ten: String, chucVu: String, chiNhanh: String, ma: String, maManual: Boolean },
        { _id: false, minimize: false }
      ),
      default: () => ({ ten: '', chucVu: '', chiNhanh: '', ma: '', maManual: false }),
    },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null },
  },
  { versionKey: false, collection: 'users' }
);
userSchema.index({ username: 1 }, { unique: true });
export const User = mongoose.model('User', userSchema);

export const Meta = mongoose.model(
  'Meta',
  new Schema({ _id: String, n: { type: Number, default: 0 }, value: Schema.Types.Mixed }, { versionKey: false, collection: 'meta' })
);

/* Tên mảng trong `db` của app gốc → model lưu trữ */
export const DOC_COLS = {
  periods: { model: Period, items: PeriodItem },
  assets: { model: AssetPeriod, items: AssetItem },
  handovers: { model: Handover },
  explains: { model: Explain },
};
