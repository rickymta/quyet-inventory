/* Phân hệ periods: gửi email kết quả, thẻ kỳ, thư mục chi nhánh, bàn giao từ kỳ, upload & khớp cột, danh sách kỳ, khoá kỳ.
   Dòng gốc 3453–3631, 4500–4535, 4565–4693, 7918–8123. */
import { A, X, registerView } from '../../core';
import * as email from './email.js';
import * as folders from './folders.jsx';
import * as transfer from './transfer.jsx';
import * as upload from './upload.jsx';
import * as lists from './lists.jsx';
import * as lock from './lock.jsx';
import { actions } from './actions.js';

registerView('folder', folders.FolderView);
registerView('transfer', transfer.TransferView);
registerView('upload', upload.UploadView);
registerView('lists', lists.ListsView);

Object.assign(A, actions);
const { FolderView, ...fo } = folders; // eslint-disable-line no-unused-vars
const { TransferView, TrList, ...tr } = transfer; // eslint-disable-line no-unused-vars
const { UploadView, UploadFromSrc, ...up } = upload; // eslint-disable-line no-unused-vars
const { ListsView, ...ls } = lists; // eslint-disable-line no-unused-vars
const { installLockGuards, ...lk } = lock;
Object.assign(X, email, fo, tr, up, ls, lk);
/* Dòng gốc 8098–8111: bọc hành động của phân hệ khác — chạy sau khi mọi phân hệ đã đăng ký A/X. */
setTimeout(installLockGuards, 0);
