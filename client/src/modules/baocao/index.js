import { A, X, registerView } from '../../core';
import * as logic from './logic.js';
import * as view from './view.jsx';

const { views, actions, BaoCao, ...viewRest } = view;
Object.entries(views).forEach(([name, Comp]) => registerView(name, Comp));
Object.assign(A, actions);
Object.assign(X, logic, viewRest);
