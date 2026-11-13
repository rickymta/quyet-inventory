/* Phần 2 (dòng gốc 8947–9971) — thùng re-export các file p2-*.
   views: {} (view `recon` do phần 1 đăng ký) · actions: mọi A.xxx trong 4 khối Object.assign(A,{...}) ở dòng 9170, 9621, 9788, 9951
   · còn lại: mọi hàm/hằng cấp cao nhất của dải theo đúng tên gốc (RC_UNDO nằm ở S.RC_UNDO vì bị gán lại). */
import { actions as actA } from './p2-acts-a.js';
import { actions as actB } from './p2-acts-b.js';
import { actions as actRows } from './p2-rows.jsx';
import { actions as actC } from './p2-acts-c.js';

export * from './p2-import.js';   // RC_FLD RC_FLB RC_MODE rcPidN rcDK rcLoose rcShow rcRowDiff rcApply rcSnap rcImpReport rcRunImport rcRows rcWbOut rcWs
export * from './p2-impui.jsx';   // rcImpShow rcImpHtml rcImpCard (JSX)
export * from './p2-apx.jsx';     // RC_KQ RC_KQX RC_APX_HEAD RC_APX_CLS rcYears rcYrOk rcApxRow rcApxBuild rcApxCard rcViewApx
export { RC_FD, RC_FX } from './p2-rows.jsx';

export const views = {};
export const actions = Object.assign({}, actA, actB, actRows, actC);
