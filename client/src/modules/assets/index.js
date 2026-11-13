/* Phân hệ assets — Kiểm kê CCDC & TSCĐ (+ ảnh kiểm kê). Dòng gốc 5457–6455.
   View: 'assets' (danh sách kỳ), 'asset' (chi tiết kỳ). Không có hành động A.xxx riêng (scNext thuộc phân hệ scan). */
import { X, registerView } from '../../core';
import * as model from './model.js';
import * as photos from './photos.jsx';
import * as views from './views.jsx';
import * as exp from './export.js';
import * as asx from './asx.jsx';

registerView('assets', views.AssetsView);
registerView('asset', views.AssetView);
Object.assign(X, model, photos, views, exp, asx);
