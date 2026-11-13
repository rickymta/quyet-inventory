/* Điểm nhập duy nhất của lõi: các phân hệ chỉ cần `import { ... } from '../../core'`. */
import * as helpers from './helpers.js';
import * as icons from './icons.jsx';
import * as ui from './ui.jsx';
import * as storeMod from './store.js';
import * as router from './router.js';
import * as libs from './libs.js';
import * as data from './data.js';
import * as perms from './perms.js';
import { klog, klogDump, klogClear } from './klog.js';
import { db, S, A, X, DEFAULT_FOLDERS, APP_VERSION } from './state.js';

export * from './state.js';
export * from './helpers.js';
export * from './icons.jsx';
export * from './ui.jsx';
export * from './store.js';
export * from './router.js';
export * from './libs.js';
export * from './data.js';
export * from './perms.js';
export { klog, klogDump, klogClear };

Object.assign(A, {
  closeSheet() { S.SB = null; ui.closeModal(); },
});

/* Mọi hàm của lõi cũng có trên X để gọi chéo theo tên gốc: X.toast(), X.per(), X.fmt()... */
Object.assign(X, helpers, icons, ui, storeMod, router, libs, data, perms, { klog, db, S, A, DEFAULT_FOLDERS, APP_VERSION });
