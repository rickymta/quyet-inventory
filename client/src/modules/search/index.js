import { A, X } from '../../core';
import * as gs from './gs.jsx';
import * as nx from './nx.jsx';

/* X.GS: ô tìm kiếm chung (Shell gắn vào #fcq); X.NX: "Cần xử lý" đi thẳng tới chỗ có vấn đề */
X.GS = gs.GS;
X.NX = nx.NX;
Object.assign(X, { gsRun: gs.run });
queueMicrotask(() => nx.install());
