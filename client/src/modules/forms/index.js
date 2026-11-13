/* Phân hệ forms: Picker, nhóm tích chọn, Biên bản bàn giao, Bản giải trình thất thoát (dòng gốc 2822–3261). */
import { A, X, registerView } from '../../core';
import * as common from './common.jsx';
import * as handover from './handover.jsx';
import * as explain from './explain.jsx';

registerView('handover', handover.HandoverList);
registerView('handoverEdit', handover.HandoverEdit);
registerView('explain', explain.ExplainList);
registerView('explainEdit', explain.ExplainEdit);
Object.assign(A, handover.actions, explain.actions, common.pickActions);
const { pickActions, cinp, sigSection, toast, ...commonFns } = common;
Object.assign(X, commonFns, handover, explain);
delete X.actions;
