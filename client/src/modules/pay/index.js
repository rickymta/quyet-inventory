/* Phân hệ pay — Đề nghị thanh toán NCC (dòng gốc 9972–10957).
   logic.js: trạng thái PAY, nhập Excel, payCompute, ghi chú, kiểm tra · view.jsx: màn hình + thành phần JSX
   exporters.js: xuất Excel + HTML in + file mẫu · actions.js: A.pay* */
import { A, X, registerView } from '../../core';
import * as logic from './logic.js';
import * as view from './view.jsx';
import * as exporters from './exporters.js';
import { actions, rcActions } from './actions.js';

const { PayView, ...viewFns } = view;
registerView('pay', PayView);
Object.assign(A, actions);
Object.assign(X, logic, viewFns, exporters);

/* 3 hành động rc* (rcClr, rcGoList, rcSearch) nằm trong dải dòng gốc của pay nhưng thuộc màn recon:
   chỉ gắn nếu phân hệ recon chưa tự định nghĩa (chờ mọi phân hệ nạp xong). */
queueMicrotask(() => { Object.keys(rcActions).forEach((k) => { if (typeof A[k] !== 'function') A[k] = rcActions[k]; }); });
