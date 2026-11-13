/* Hành động A.xxx thuộc phân hệ periods (INDEX.md). Trạng thái UP/TR nằm ở S.UP / S.TR. */
import { db, S, A, X, store, audit, per, norm, fmt, parseNum, kkNeed, toast, render, rerender, closeLayer } from '../../core';
import { LS } from './lists.jsx';
import { periodsIn, moveModal } from './folders.jsx';
import { srcItemsOf } from './upload.jsx';
import { trAvail, trItems } from './transfer.jsx';

let trT = null;
const closeNm = () => { closeLayer('nmovl'); if (typeof X.renameClose === 'function') { try { X.renameClose(); } catch (e) { /* bỏ qua */ } } };

export const actions = {
  onFile(input) {
    if (!kkNeed(['xlsx'], () => { A.onFile(input); })) return;
    const f = input.files && input.files[0];
    if (!f) return;
    const isCsv = /\.csv$/i.test(f.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        const wb = isCsv ? XLSX.read(e.target.result, { type: 'string' }) : XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        S.UP.wb = wb;
        A.upSheet(wb.SheetNames[0]);
      } catch (err) { console.error(err); toast('Không đọc được file — kiểm tra định dạng .xlsx/.csv'); }
    };
    reader.onerror = () => { toast('Không đọc được file'); };
    if (isCsv) reader.readAsText(f); else reader.readAsArrayBuffer(f);
  },
  upSheet(name) {
    const UP = S.UP;
    const ws = UP.wb.Sheets[name];
    const rs = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const hr = X.detectHeaderRow(rs);
    UP.sheet = name; UP.rows = rs; UP.hr = hr; UP.start = Math.min(rs.length, hr + 1);
    UP.map = X.autoMap((rs[hr] || []).map((x) => String(x)));
    rerender();
  },
  upHr(v) {
    const UP = S.UP;
    const x = Math.max(1, Math.min(UP.rows.length, Number(v) || 1)) - 1;
    UP.hr = x; UP.start = Math.min(UP.rows.length, x + 1);
    UP.map = X.autoMap((UP.rows[x] || []).map((y) => String(y)));
    rerender();
  },
  upStart(v) { S.UP.start = Math.max(0, Math.min(S.UP.rows.length, Number(v) || 1) - 1); rerender(); },
  upMap(k, v) { if (v === '') delete S.UP.map[k]; else S.UP.map[k] = Number(v); rerender(); },
  upBranch(v) { S.UP.branchManual = v; rerender(); },
  upUseSrc() {
    const UP = S.UP;
    const src = per(UP.srcPid); if (!src) { toast('Chọn kỳ nguồn'); return; }
    UP.src = { items: srcItemsOf(src, UP.srcMode) };
    if (!UP.folder && src.folder) UP.folder = src.folder;
    rerender();
  },
  upSrcClear() { S.UP.src = null; rerender(); },
  createPeriod() {
    const UP = S.UP;
    const items = UP.src ? UP.src.items : (UP._built || X.buildItems(UP.rows, UP.start, UP.map, UP.branchManual, db.hsd));
    if (!UP.src && (UP.map.name === undefined || !items.length)) { toast('Cần chọn cột Tên vật tư và có dữ liệu'); return; }
    if (!items.length) { toast('Kỳ nguồn không có vật tư'); return; }
    const p = { id: Date.now().toString(36), name: (UP.pname || '').trim() || 'Kỳ kiểm kê', createdAt: Date.now(), items, folder: UP.folder || '', by: ((db.profile && db.profile.ten) || '') };
    if (!UP.folder) { toast('Chọn thư mục chi nhánh trước'); return; }
    if (!UP.src) {
      const ve = X.validateItems(items);
      if (ve.length && !confirm('Dữ liệu nguồn còn ' + ve.length + ' vấn đề (mã trùng, thiếu ĐVT, tồn cuối lệch công thức…).\n\nApp KHÔNG tự sửa. Vẫn tạo kỳ kiểm kê với dữ liệu hiện tại?')) return;
      if (ve.length) audit('create_period_with_errors', p.name, null, { errors: ve.length });
    }
    db.periods.unshift(p);
    store.save();
    S.P = { id: p.id, q: '', flt: 'all', br: 'all', limit: 80 };
    S.route = { view: 'period' }; render();
    toast('Đã tạo kỳ kiểm kê · ' + items.length + ' mã VT');
  },
  zeroReset(id) {
    const p = per(id); if (!p || p.locked) return;
    const l = p.items.filter((i) => i.close === 0 && i.counted && i.countQty === 0);
    if (!l.length) return;
    if (!confirm('Đưa ' + l.length + ' mã có tồn sổ sách = 0 về trạng thái chưa kiểm?\n\nCác mã này trước đây được app tự đánh dấu đã kiểm (thực tế 0). Mã nào bạn đã kiểm tay và nhập 0 cũng sẽ về chưa kiểm, cần kiểm lại.')) return;
    l.forEach((i) => { i.counted = false; i.countQty = null; });
    store.save(); render(); toast('Đã đưa ' + l.length + ' mã về chưa kiểm');
  },
  navFoldersToggle() { S.NAV_FOLDERS_OPEN = !S.NAV_FOLDERS_OPEN; rerender(); },
  openFolder(i) { S.FD = { name: i < 0 ? '' : (db.folders[i] || '') }; S.route = { view: 'folder' }; render(); },

  trBack() { const id = S.TR && S.TR.pid; if (id) { S.P = { id, q: '', flt: 'all', br: 'all', limit: 80 }; S.route = { view: 'period' }; render(); } else A.go('home'); },
  trDest(v) { S.TR.dest = v; rerender(); },
  trQ(v) { clearTimeout(trT); trT = setTimeout(() => { S.TR.q = v; S.TR.limit = 60; rerender(); }, 150); },
  trMore() { S.TR.limit += 100; rerender(); },
  trToggle(id) {
    const TR = S.TR; const p = per(TR.pid); let it = null; p.items.forEach((x) => { if (x.id === id) it = x; });
    if (TR.sel[id]) { TR.sel[id] = false; } else { TR.sel[id] = true; if (it && (TR.qty[id] == null || TR.qty[id] === '')) TR.qty[id] = String(trAvail(it)); }
    rerender();
  },
  trAll() {
    const TR = S.TR; const p = per(TR.pid);
    trItems(p).forEach((i) => { TR.sel[i.id] = true; if (TR.qty[i.id] == null || TR.qty[i.id] === '') TR.qty[i.id] = String(trAvail(i)); });
    rerender();
  },
  trNone() { S.TR.sel = {}; rerender(); },
  trCreate() {
    const TR = S.TR; const p = per(TR.pid); if (!p) return;
    const destName = TR.dest === 'HO' ? 'Văn phòng / HO' : (TR.dest === '__other' ? (TR.destOther || '').trim() : TR.dest);
    if (!destName) { toast('Chọn nơi nhận'); return; }
    const rows = []; let bad = null;
    p.items.forEach((i) => {
      if (!TR.sel[i.id] || bad) return;
      const q = parseNum(TR.qty[i.id]); const av = trAvail(i);
      if (!(q > 0)) { bad = i.name + ': nhập số lượng chuyển'; return; }
      if (q > av + 1e-9) { bad = i.name + ': chuyển ' + fmt(q) + ' nhiều hơn đang có ' + fmt(av); return; }
      rows.push({ ma: i.code, ten: i.name, dvt: i.unit, sl: fmt(q), tinhTrang: '', ghiChu: '' });
    });
    if (bad) { toast(bad); return; }
    if (!rows.length) { toast('Chưa chọn vật tư nào'); return; }
    const o = X.newHV(true);
    const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
    const from = p.folder || o.benGiao.boPhan || '';
    o.periodId = p.id;
    o.loai = ['Vật tư tiêu hao'];
    o.lyDo = ['Luân chuyển nội bộ'];
    o.thoiGian = 'ngày ' + pad(d.getDate()) + ' tháng ' + pad(d.getMonth() + 1) + ' năm ' + d.getFullYear();
    o.diaDiem = from;
    o.canCu = 'Điều chuyển vật tư không sử dụng, theo kỳ kiểm kê: ' + p.name;
    if (from) { o.boPhan = from; o.benGiao.boPhan = from; }
    o.benNhan.boPhan = destName;
    o.items = rows;
    S.HV = o; db.handovers.unshift(o); store.save();
    S.TR = null; S.route = { view: 'handoverEdit' }; render();
    toast('Đã tạo biên bản bàn giao · ' + rows.length + ' mã');
  },

  upBack() {
    if (LS.back) { S.route = { view: 'lists' }; render(); return; }
    if (S.UP && S.UP.fromFolder && S.UP.folder && S.FD) { S.route = { view: 'folder' }; render(); } else A.go('home');
  },
  folderAdd() {
    X.renameModal('Thêm chi nhánh', '', (v) => {
      const dup = db.folders.some((f) => norm(f) === norm(v));
      if (dup) { toast('Chi nhánh này đã có'); return; }
      db.folders.push(v); store.save(); render();
      toast('Đã thêm chi nhánh ' + v);
    });
  },
  folderRename() {
    if (!S.FD || !S.FD.name) return;
    const old = S.FD.name;
    X.renameModal('Đổi tên chi nhánh', old, (v) => {
      if (v === old) return;
      const dup = db.folders.some((f) => f !== old && norm(f) === norm(v));
      if (dup) { toast('Tên này đã có'); return; }
      const i = db.folders.indexOf(old); if (i >= 0) db.folders[i] = v;
      db.periods.forEach((p) => { if (p.folder === old) p.folder = v; });
      (db.assets || []).forEach((p) => { if (p.folder === old) p.folder = v; });
      S.FD.name = v; store.save(); render();
      toast('Đã đổi tên chi nhánh');
    });
  },
  folderDel() {
    if (!S.FD || !S.FD.name || periodsIn(S.FD.name).length) return;
    if (!confirm('Xóa thư mục "' + S.FD.name + '"?')) return;
    const nm = S.FD.name;
    for (let i = db.folders.length - 1; i >= 0; i--) if (db.folders[i] === nm) db.folders.splice(i, 1);
    store.save(); S.FD = null; A.go('home');
  },
  folderNewPeriod() { A.go('upload'); },
  periodMove(id) { const p = per(id); if (p) moveModal(p); },
  periodMoveSave(id) {
    const p = per(id); const sel = document.getElementById('mvsel');
    const v = sel ? sel.value : '';
    if (!p || !v) { toast('Chọn chi nhánh'); return; }
    closeNm();
    p.folder = v; store.save();
    if (S.FD && S.route.view === 'folder' && S.FD.name === '' && !periodsIn('').length) { S.FD = null; S.route = { view: 'home' }; }
    render();
    toast('Đã chuyển vào ' + v);
  },
  renamePeriod(id) {
    const p = per(id); if (!p) return;
    X.renameModal('Sửa tên kỳ kiểm kê', p.name, (v) => {
      p.name = v; store.save();
      if (S.route.view === 'period') rerender(); else render();
      toast('Đã đổi tên kỳ kiểm kê');
    });
  },
  /* Đã gộp bản vá ghi audit (dòng gốc 8197) */
  delPeriod(id) {
    if (!confirm('Xóa kỳ kiểm kê này? Không thể hoàn tác.')) return;
    const p = per(id); const nm = p && p.name; const n = p && p.items.length;
    for (let i = db.periods.length - 1; i >= 0; i--) if (db.periods[i].id === id) db.periods.splice(i, 1);
    store.save(); render();
    if (p && !per(id)) audit('Xoá kỳ kiểm kê', nm, { soMa: n }, null);
  },
};
