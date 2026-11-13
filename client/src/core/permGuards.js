/* Chặn thao tác thiếu quyền ở giao diện (máy chủ vẫn là nơi thực thi). Nạp ở main.jsx sau mọi phân hệ. */
import { A, X, S } from './state.js';
import { guardAction, can, canEdit, canDel, canLock, canBranch, allBranches } from './perms.js';

const lockMod = (kind) => (kind === 'as' ? 'assets' : 'kiemke');

export function installPermGuards() {
  const LK = X.LKX;
  if (LK) {
    guardAction(LK, ['lock', 'unlock'], (kind) => canLock() && can(lockMod(kind), 1), 'Bạn không có quyền khoá / mở khoá kỳ kiểm kê');
    guardAction(LK, ['lockAllDone'], () => canLock() && (can('kiemke', 1) || can('assets', 1)), 'Bạn không có quyền khoá / mở khoá kỳ kiểm kê');
  }
  guardAction(A, ['delPeriod'], () => canDel() && canEdit('kiemke'), 'Bạn không có quyền xoá kỳ kiểm kê');
  guardAction(X.ASX, ['delP'], () => canDel() && canEdit('assets'), 'Bạn không có quyền xoá kỳ kiểm kê CCDC');
  guardAction(A, ['hvDelete'], () => canDel() && canEdit('handover'), 'Bạn không có quyền xoá biên bản bàn giao');
  guardAction(A, ['exDelete'], () => canDel() && canEdit('explain'), 'Bạn không có quyền xoá phiếu giải trình');

  guardAction(A, ['createPeriod'], () => canEdit('kiemke') && (!S.UP || !S.UP.folder || canBranch(S.UP.folder)), 'Bạn không có quyền tạo kỳ kiểm kê cho chi nhánh này');
  guardAction(A, ['hvNew'], () => canEdit('handover'), 'Bạn không có quyền tạo biên bản bàn giao');
  guardAction(A, ['exNew'], () => canEdit('explain'), 'Bạn không có quyền tạo phiếu giải trình');
  guardAction(X.ASX, ['upFile'], () => canEdit('assets'), 'Bạn không có quyền tạo kỳ kiểm kê CCDC');
  guardAction(X.ASX, ['upCreate'], () => canEdit('assets') && (!X.AP || !X.AP.up || !X.AP.up.folder || canBranch(X.AP.up.folder)), 'Bạn không có quyền tạo kỳ kiểm kê CCDC cho chi nhánh này');
  guardAction(A, ['folderAdd', 'folderRename', 'folderDel'], () => canEdit('config') && allBranches(), 'Bạn không có quyền quản lý chi nhánh');
  /* vào màn tạo kỳ cần quyền sửa kiemke */
  const og = A.go;
  A.go = function (v, ...r) {
    if (v === 'upload' && !canEdit('kiemke')) { X.toast('Bạn không có quyền tạo kỳ kiểm kê'); return undefined; }
    return og.call(this, v, ...r);
  };
}
/* sau khi mọi phân hệ (kể cả installLockGuards ở setTimeout 0) đã đăng ký */
setTimeout(installPermGuards, 0);
