/* Đối chiếu doanh thu – xuất kho: phân hệ lớn, chia 2 phần.
   part1.js: lõi khớp + màn hình (dòng gốc 8254–8946) · part2.js: cập nhật khi nhập lại, xuất Excel, phụ lục (8947–9971).
   Mỗi phần xuất: `views` ({tênView: Component}), `actions` (các A.xxx) và mọi hàm/hằng cấp cao nhất theo tên gốc. */
import { A, X, registerView } from '../../core';
import * as part1 from './part1.js';
import * as part2 from './part2.js';

[part1, part2].forEach((p) => {
  Object.entries(p.views || {}).forEach(([name, Comp]) => registerView(name, Comp));
  Object.assign(A, p.actions || {});
  const { views, actions, default: _d, ...rest } = p;
  Object.assign(X, rest);
});
