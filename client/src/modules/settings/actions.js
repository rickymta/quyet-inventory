/* Hành động A.xxx của Cài đặt: pfSet (hồ sơ của tài khoản đang đăng nhập; tầng lưu trữ tự gửi PUT /auth/profile). */
import { db, branchCode, rerender, saveSoon } from '../../core';

export const actions = {
  pfSet(k, v) {
    const pr = db.profile = db.profile || {};
    if (k === 'ma') { v = String(v).replace(/[^A-Za-z0-9]/g, '').toUpperCase(); pr.maManual = !!v; }
    pr[k] = v;
    if (k === 'chiNhanh' && !pr.maManual) pr.ma = branchCode(v);
    saveSoon(); rerender();
  },
};
