import { X, registerView } from '../../core';
import * as sign from './sign.jsx';

registerView('sign', sign.SignView);
/* Phân hệ này không sở hữu hành động A.xxx nào (INDEX.md); mọi hàm cấp cao nhất cần dùng chéo đưa lên X. */
Object.assign(X, { SGX: sign.SGX, renderSign: sign.renderSign, sgState: sign.sgState });
