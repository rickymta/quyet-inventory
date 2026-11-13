/* Phần 1 của phân hệ recon (dòng gốc 8254–8946): lõi đối chiếu V5, V8 hai bên, tab Map, màn hình `recon`.
   Các A.rcXxx / A.kyXxx nằm ở dải của phần 2 (Object.assign(A,{...}) từ dòng 9170). */
import { ReconView } from './p1-views.jsx';

export * from './p1-seed.js';
export * from './p1-core.js';
export * from './p1-ui.jsx';
export * from './p1-map.jsx';
export * from './p1-views.jsx';

export const views = { recon: ReconView };
export const actions = {};
