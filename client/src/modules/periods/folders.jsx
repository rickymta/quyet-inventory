/* Thẻ kỳ kiểm kê, thư mục chi nhánh, hộp thoại chuyển thư mục (dòng gốc 3545–3583, 4500–4535). */
import { useEffect } from 'react';
import { db, S, A, DEFAULT_FOLDERS, diffOf, I, st, render, rerender, openLayer, closeLayer, canDel, canEdit, allBranches } from '../../core';
import { lockTagHtml } from './lock.jsx';

export function periodCardHtml0(p) {
  const total = p.items.length;
  const done = p.items.filter((i) => i.counted).length;
  const diff = p.items.filter((i) => i.counted && diffOf(i) !== 0).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const right = diff > 0 ? <span style={{ fontWeight: 700, color: 'var(--red)' }}>{diff + ' mã chênh lệch'}</span>
    : (total > 0 && done === total ? <span style={{ fontWeight: 700, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{I('check', 14)}Hoàn tất</span> : <span style={{ color: 'var(--mut2)' }}>Đang kiểm</span>);
  return (
    <div key={p.id} className="card per" onClick={() => A.openPeriod(p.id)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {lockTagHtml(p)}
          <div style={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{'Tạo ' + new Date(p.createdAt).toLocaleDateString('vi-VN') + ' · ' + total + ' mã VT' + (p.by ? ', bởi ' + p.by : '')}</div>
        </div>
        <div style={{ display: 'flex', flex: 'none' }}>
          <button className="perx" onClick={(e) => { e.stopPropagation(); A.periodMove(p.id); }} title="Chuyển sang thư mục khác" style={{ display: 'flex' }}>{I('folder', 15)}</button>
          <button className="perx" onClick={(e) => { e.stopPropagation(); A.renamePeriod(p.id); }} title="Sửa tên kỳ" style={{ display: 'flex' }}>{I('edit', 15)}</button>
          {canDel() && canEdit('kiemke') ? <button className="perx" onClick={(e) => { e.stopPropagation(); A.delPeriod(p.id); }} title="Xóa kỳ" style={{ display: 'flex' }}>{I('x', 15)}</button> : null}
        </div>
      </div>
      <div className="bar" style={{ marginTop: 12 }}><div className="fill" style={{ width: pct + '%' }}></div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
        <span style={{ color: 'var(--mut)' }}>Đã kiểm <b className="tnum" style={{ color: 'var(--ink)' }}>{done + '/' + total}</b></span>{right}
      </div>
    </div>
  );
}
/* Bản gốc chèn thẻ khoá vào periodCardHtml0; ở đây periodCardHtml0 đã có sẵn thẻ khoá nên hai hàm trùng nhau. */
export function periodCardHtml(p) { return periodCardHtml0(p); }

export function guessFolder(name) {
  const m = String(name || '').trim().toUpperCase().match(/^(BTX|LVL|CL|QN|41ND)(?=[\s_\-.(]|$)/);
  if (!m) return '';
  const f = { BTX: 'Bùi Thị Xuân', LVL: 'Lê Văn Lương', CL: 'Cát Linh', QN: 'Quảng Ninh', '41ND': 'Ba Đình-Nghĩa Dũng' }[m[1]];
  return db.folders.indexOf(f) >= 0 ? f : '';
}
export function migrateFolders() {
  if (!Array.isArray(db.folders)) db.folders = DEFAULT_FOLDERS.slice();
  if (!db.barcodes || typeof db.barcodes !== 'object') db.barcodes = {};
  if (!db.ocrfix || typeof db.ocrfix !== 'object') db.ocrfix = {};
  if (!Array.isArray(db.assets)) db.assets = [];
  if (!db.signers || typeof db.signers !== 'object') db.signers = {};
  db.periods.forEach((p) => {
    if (!p.folder) { const g = guessFolder(p.name); if (g) p.folder = g; }
    if (p.folder && db.folders.indexOf(p.folder) < 0) db.folders.push(p.folder);
  });
}
export function periodsIn(name) { return db.periods.filter((p) => (p.folder || '') === name); }

export function FolderView() {
  const FD = S.FD;
  useEffect(() => { if (!S.FD) { S.route = { view: 'home' }; render(); } });
  if (!FD) return null;
  const name = FD.name; const list = periodsIn(name);
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.go('home')}>‹</button>
        <div className="ttl">{name || 'Chưa phân loại'}</div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {name && canEdit('config') && allBranches() ? <button className="pill" style={{ display: 'inline-flex' }} title="Đổi tên chi nhánh" onClick={() => A.folderRename()}>{I('edit', 15)}</button> : null}
          {name && canEdit('kiemke') ? <button className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => A.folderNewPeriod()}>{I('plus', 15)}Kỳ mới</button> : null}
        </div></div><div style={{ height: 10 }}></div></div>
      <div className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
        {!name ? <div className="note-warn" style={{ marginBottom: 12 }}>Các kỳ dưới đây chưa thuộc chi nhánh nào. Bấm biểu tượng thư mục trên từng kỳ để chuyển vào đúng chi nhánh.</div> : null}
        {list.map((p) => periodCardHtml(p))}
        {!list.length ? (
          <>
            <div style={{ textAlign: 'center', padding: '36px 20px', border: '1.5px dashed var(--line)', borderRadius: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{I('box', 22)}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Chưa có kỳ kiểm kê nào</div>
              <div style={{ fontSize: 13, color: 'var(--mut)' }}>Bấm "Kỳ mới" để upload file tồn kho cho chi nhánh này.</div>
            </div>
            {name && canEdit('config') && allBranches() ? <div style={{ textAlign: 'center', marginTop: 16 }}><button className="addbat" style={{ color: 'var(--red)' }} onClick={() => A.folderDel()}>Xóa thư mục này</button></div> : null}
          </>
        ) : null}
      </div>
    </>
  );
}
export const renderFolder = () => rerender();

export function moveModal(p) {
  openLayer('nmovl', () => (
    <div id="nmovl">
      <div className="sigcard">
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Chuyển sang thư mục</div>
        <select className="inp" id="mvsel" defaultValue={p.folder || ''}>
          {p.folder ? null : <option value="">— Chọn chi nhánh —</option>}
          {db.folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div style={st('display:flex;gap:8px;margin-top:12px')}>
          <button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => closeLayer('nmovl')}>Huỷ</button>
          <button className="btn btn-primary" style={st('flex:1;padding:12px')} onClick={() => A.periodMoveSave(p.id)}>{I('check', 16)}Chuyển</button>
        </div>
      </div>
    </div>
  ));
}

export const KIC={expired:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>'};
export const KCAL='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h2"/></svg>';