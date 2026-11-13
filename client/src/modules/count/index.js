/* Phân hệ kiểm kê vật tư (count): màn hình kiểm kê, bảng tồn kho, sheet nhập, hộp QR, số quét chưa khớp, UI v2. */
import { A, X, registerView } from '../../core';
import * as list from './list.jsx';
import * as sheet from './sheet.jsx';
import * as unm from './unm.jsx';
import * as stats from './stats.jsx';
import * as v2 from './v2.jsx';

registerView('period', list.PeriodView);   // route.view = 'period' (renderPeriod)
registerView('stock', list.StockView);     // route.view = 'stock' (renderStock)

Object.assign(A, list.actions, sheet.actions, v2.actions);

/* mọi hàm/hằng cấp cao nhất theo đúng tên gốc, gồm HS, UNM, invStats, v2Ring... */
const strip = (m) => { const { actions, default: _d, ...rest } = m; return rest; };
Object.assign(X, strip(list), strip(sheet), strip(unm), strip(stats), strip(v2));
