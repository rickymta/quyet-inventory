import { A, X } from '../../core';
import * as dom from './dom.js';
import * as decode from './decode.js';
import * as ocr from './ocr.js';
import * as run from './run.jsx';
import { actions } from './actions.jsx';

/* scOcrFail / scOcrRetry / scAutoOcr... đều nằm trong run.jsx; SC nằm ở S.SC (không có X.SC). */
Object.assign(A, actions);
Object.assign(X, dom, decode, ocr, run);
