import { A, X, registerView } from '../../core';
import * as data from './data.jsx';
import { ErrView } from './view.jsx';

data.initErr();
registerView('err', ErrView);
/* Hành động A.xxx: phân hệ này không sở hữu hành động A nào (chỉ bọc A.go bên trong initErr).
   ER (kèm ER.items, ER.nhacView()) và renderErr đưa lên X cho trang chủ. */
Object.assign(X, { ER: data.ER, renderErr: data.renderErr });
