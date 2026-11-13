import { A, X } from '../../core';
import * as print from './print.js';
import * as sig from './sig.jsx';

const { actions, ...sigRest } = sig;
Object.assign(A, actions);
Object.assign(X, print, sigRest);
