/* Phân tích mua hàng – tiêu hao vật tư (dòng gốc 11274–11896). logic.js: ANA (tính toán thuần) · ui.jsx: AN + view `ana` + xuất Excel. */
import { X, registerView } from '../../core';
import { ANA } from './logic.js';
import { AN, AnaView, renderAna } from './ui.jsx';

registerView('ana', AnaView);
Object.assign(X, { ANA, AN, renderAna });
