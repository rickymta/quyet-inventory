import { A, X, registerView } from '../../core';
import * as util from './util.js';
import * as settings from './settings.jsx';
import * as accounts from './accounts.jsx';
import * as act from './actions.js';

registerView('settings', settings.Settings);
Object.assign(A, act.actions);
const { Settings, ...settingsRest } = settings;
Object.assign(X, util, settingsRest, { ACC: accounts.ACC, ACX: accounts.ACX });
