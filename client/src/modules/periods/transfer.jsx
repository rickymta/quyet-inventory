/* Bàn giao vật tư từ kỳ kiểm kê, không trừ số liệu kiểm kê (dòng gốc 3584–3631). Trạng thái TR nằm ở S.TR. */
import { useEffect } from 'react';
import { db, S, A, per, norm, fmt, I, st, render, rerender } from '../../core';

export const trAvail = (i) => ((i.counted && i.countQty !== null) ? i.countQty : i.close);
export function trItems(p) {
  const q = norm(S.TR.q || '');
  return p.items.filter((i) => {
    if (!(trAvail(i) > 0)) return false;
    return !q || norm(i.name + ' ' + i.code).indexOf(q) >= 0;
  });
}
export function trRow(i) {
  const TR = S.TR; const on = !!TR.sel[i.id]; const av = trAvail(i);
  return (
    <div key={i.id} className="card" style={{ marginBottom: 8, padding: 12, display: 'flex', gap: 10, alignItems: 'center', ...(on ? { borderColor: 'var(--teal)' } : null) }}>
      <label style={st('display:flex;gap:10px;align-items:center;flex:1;min-width:0;cursor:pointer')}>
        <input type="checkbox" style={{ width: 22, height: 22, flex: 'none' }} checked={on} onChange={() => A.trToggle(i.id)} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 14, wordBreak: 'break-word' }}>{i.name}</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--mut)' }}>{i.code + ' · ' + i.unit + ' · ' + (i.counted ? 'kiểm kê ' : 'sổ sách ') + fmt(av)}</span>
        </span>
      </label>
      {on ? <input className="inp tnum" inputMode="decimal" placeholder="SL" style={{ width: 84, textAlign: 'center', flex: 'none' }}
        value={TR.qty[i.id] == null ? '' : TR.qty[i.id]} onChange={(e) => { TR.qty[i.id] = e.target.value; rerender(); }} /> : null}
    </div>
  );
}
export function trSelCount() { let n = 0; for (const k in S.TR.sel) if (S.TR.sel[k]) n++; return n; }

/* renderTrList: phần danh sách + nút tạo (gốc cập nhật #trlist và #trbtn). */
export function TrList() {
  const TR = S.TR; const p = per(TR.pid); if (!p) return null;
  const list = trItems(p);
  return (
    <div id="trlist">
      {list.slice(0, TR.limit).map((i) => trRow(i))}
      {!list.length ? <div className="card" style={{ textAlign: 'center', color: 'var(--mut)' }}>Không có vật tư nào còn tồn để bàn giao.</div> : null}
      {list.length > TR.limit ? <button className="btn btn-outline" onClick={() => A.trMore()}>{'Xem thêm (' + (list.length - TR.limit) + ' mã)'}</button> : null}
    </div>
  );
}
export const renderTrList = () => rerender();

export function TransferView() {
  const TR = S.TR; const p = per(TR && TR.pid);
  useEffect(() => { if (!per(S.TR && S.TR.pid)) { S.route = { view: 'home' }; render(); } });
  if (!p) return null;
  const n = trSelCount();
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => A.trBack()}>‹</button><div className="ttl">Bàn giao vật tư</div></div><div style={{ height: 10 }}></div></div>
      <div className="wrap" style={{ paddingTop: 14, paddingBottom: 120 }}>
        <div className="note-warn" style={{ marginBottom: 12 }}>Chỉ lập biên bản bàn giao. Số liệu kiểm kê của kỳ <b>{p.name}</b> giữ nguyên, không bị trừ số lượng chuyển đi.</div>
        <label className="lbl">Nơi nhận</label>
        <select className="inp" value={TR.dest} onChange={(e) => A.trDest(e.target.value)}>
          <option value="">— Chọn nơi nhận —</option>
          <option value="HO">Văn phòng / HO</option>
          {db.folders.filter((f) => f !== (p.folder || '')).map((f) => <option key={f} value={f}>{f}</option>)}
          <option value="__other">Nơi khác (nhập tên)</option>
        </select>
        {TR.dest === '__other' ? <input className="inp" style={{ marginTop: 8 }} placeholder="Tên cơ sở / bộ phận nhận" value={TR.destOther} onChange={(e) => { TR.destOther = e.target.value; rerender(); }} /> : null}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
          <span className="sec" style={{ margin: 0 }}>Chọn vật tư và số lượng</span>
          <span style={{ display: 'flex', gap: 14 }}><button className="addbat" onClick={() => A.trAll()}>Chọn hết</button><button className="addbat" style={{ color: 'var(--mut)' }} onClick={() => A.trNone()}>Bỏ chọn</button></span>
        </div>
        <input className="inp" style={{ marginBottom: 10 }} placeholder="Tìm tên hoặc mã vật tư…" defaultValue={TR.q} onChange={(e) => A.trQ(e.target.value)} />
        <TrList />
      </div>
      <div className="botbar"><div className="botin"><button className="btn btn-primary" id="trbtn" onClick={() => A.trCreate()} disabled={!n}>{n ? 'Tạo biên bản bàn giao (' + n + ' mã)' : 'Tích chọn vật tư để bàn giao'}</button></div></div>
    </>
  );
}
export const renderTransfer = () => rerender();
