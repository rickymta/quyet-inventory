/* Nạp mọi phân hệ. Mỗi phân hệ tự đăng ký màn hình (registerView), hành động (A) và hàm dùng chung (X). */
const mods = import.meta.glob('./*/index.{js,jsx}', { eager: true });
export default mods;
