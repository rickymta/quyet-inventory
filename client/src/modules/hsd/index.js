/* Phân hệ hsd: Dashboard cảnh báo hạn sử dụng, chọn kho gửi email cảnh báo, openMailtoSafe, exportHsdAlert (dòng gốc 3262–3452, 5081–5107). */
import { X, registerView } from '../../core';
import * as hsd from './hsd.jsx';

registerView('hsd', hsd.Hsd);
Object.assign(X, hsd);
