/* Thống kê kiểm kê dùng chung + thẻ tiến độ (v2Ring). Mã gốc: dòng 7819–7845. */
import React from 'react';
import { diffOf } from '../../core';

/* mẫu số = mã cần kiểm (tồn ≠ 0 hoặc đã kiểm); mã tồn 0 chưa kiểm không tính vào tiến độ */
export function invStats(p) {
  const scope = p.items.filter((i) => i.counted || i.close !== 0);
  const tot = scope.length; const done = scope.filter((i) => i.counted).length;
  const diff = scope.filter((i) => i.counted && diffOf(i) !== 0).length;
  const todo = tot - done; const match = done - diff;
  return {
    tot, done, todo, diff, match, skip: p.items.length - tot,
    pct: tot ? (todo ? Math.floor(done / tot * 100) : 100) : 0,
    acc: done ? (diff ? Math.floor(match / done * 100) : 100) : null,
  };
}

/* nội dung bên trong <div id="ringcard"> */
export function v2Ring(p) {
  const s = invStats(p); const c = 2 * Math.PI * 36;
  const accCol = s.acc === null ? '#98a2b3' : (s.acc >= 98 ? '#1a9b5f' : (s.acc >= 90 ? '#f59e0b' : '#d92d20'));
  return (
    <>
      <div className="t2">Tiến độ kiểm kê</div>
      <div className="rg"><div className="ring"><svg viewBox="0 0 88 88"><circle className="rb" cx="44" cy="44" r="36" /><circle className="rf" cx="44" cy="44" r="36" strokeDasharray={(c * s.pct / 100).toFixed(1) + ' ' + c.toFixed(1)} transform="rotate(-90 44 44)" /></svg><b>{s.pct}%</b></div>
        <dl><div><dt>Đã kiểm</dt><dd style={{ color: '#1a9b5f' }}>{s.done}</dd></div><div><dt>Chưa kiểm</dt><dd>{s.todo}</dd></div>
          <div><dt>Có chênh lệch</dt><dd style={{ color: '#d92d20' }}>{s.diff}</dd></div><div><dt>Tổng mã cần kiểm</dt><dd>{s.tot}</dd></div></dl></div>
      <div className="acc"><div className="ar"><span>Tỷ lệ khớp số</span><b style={{ color: accCol }}>{s.acc === null ? '–' : s.acc + '%'}</b></div>
        <div className="bar"><i style={{ width: (s.acc === null ? 0 : s.acc) + '%', background: accCol }} /></div>
        <div className="sub">{s.acc === null ? 'Chưa có mã nào được kiểm' : s.match + '/' + s.done + ' mã đã kiểm khớp tồn sổ sách' + (s.diff ? ' · ' + s.diff + ' mã lệch' : '')}
          {s.skip ? <><br />{s.skip} mã tồn = 0 chưa kiểm — không tính vào tiến độ</> : null}</div></div>
    </>
  );
}
