import { A, X, registerView } from '../../core';
import * as home from './home.jsx';
import * as meter from './meter.jsx';
import * as hubs from './hubs.jsx';

registerView('home', home.Home);
registerView('mgmt', hubs.Mgmt);
registerView('dchub', hubs.DcHub);
registerView('reporthub', hubs.ReportHub);
Object.assign(A, meter.actions);
const { actions: _a, ...meterRest } = meter;
const { Home, ...homeRest } = home;
const { Mgmt, DcHub, ReportHub, ...hubsRest } = hubs;
Object.assign(X, meterRest, homeRest, hubsRest);
