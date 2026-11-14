/* Danh sách: Chi nhánh › (Vật tư | CCDC & TSCĐ) › Kỳ kiểm kê (dòng gốc 7918–8030) + thẻ tỷ lệ theo tháng HM (8113–8123). */
import { db, S, A, X, store, norm, toast, render, rerender, I, H, FcIco, st, openLayer, closeLayer, canDel, canEdit, allBranches } from '../../core';
import { periodsIn, guessFolder, periodCardHtml } from './folders.jsx';
import { lockTagHtml } from './lock.jsx';

const BRC_SVG = '<svg width="34" height="34" viewBox="0 0 64 64" fill="none" stroke="#1e3a6b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 37V11a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v19"/><circle cx="25" cy="17" r="3.8"/><circle cx="25" cy="27" r="3.8"/><path stroke-width="2.1" d="M32 15h9M32 19.5h9M32 25h9M32 29.5h9"/><path d="M8 47v11l16 4 16-4V47M24 51v11M8 47l16 4 16-4M8 47l-5-5 15-5 6 6M24 43l6-6 15 5-5 5"/><circle cx="52" cy="48" r="8"/><path stroke="#d4af5f" stroke-width="2.8" d="M23.2 17.2l1.5 1.5 2.8-3.1M23.2 27.2l1.5 1.5 2.8-3.1M48 48.5l3 3 6-6.5"/></svg>';
export const LS = { folder: null, kind: 'vt', back: false };
export const LS_LBL = { vt: 'Vật tư', as: 'CCDC & TSCĐ' };

export const LSX = {
  folderGuess(txt) {
    const t = norm(txt || ''); if (!t) return '';
    for (let i = 0; i < db.folders.length; i++) { const nf = norm(db.folders[i]); if (nf && (t.indexOf(nf) >= 0 || nf.indexOf(t) >= 0)) return db.folders[i]; }
    return guessFolder(txt) || '';
  },
  asFolder(p) {
    if (p.folder) return p.folder;
    return LSX.folderGuess(p.branch) || guessFolder(p.name) || '';
  },
  assetsIn(f) { return (db.assets || []).filter((p) => LSX.asFolder(p) === f); },
  counts(f) { return { vt: periodsIn(f).length, as: LSX.assetsIn(f).length }; },
  folderList() {
    const l = db.folders.slice();
    const hasUn = periodsIn('').length || (db.assets || []).some((p) => LSX.asFolder(p) === '');
    if (hasUn) l.push('');
    return l;
  },
  pick(i) {
    const l = LSX.folderList(); const f = l[i]; if (f === undefined) return;
    LS.folder = f; if (X.HS) X.HS.folder = f;
    const c = LSX.counts(f);
    LS.kind = (!c.vt && c.as) ? 'as' : 'vt';
    render();
  },
  setKind(k) { LS.kind = k; render(); },
  backToFolders() { LS.folder = null; render(); },
  openAs(id) { LS.back = true; X.ASX.openP(id); },
  newPeriod() {
    const f = LS.folder; const k = LS.kind;
    if (f === null || (f === '' && k === 'vt')) { toast('Hãy chọn một chi nhánh trước'); return; }
    LS.back = true;
    if (k === 'vt') { S.FD = { name: f }; S.route = { view: 'folder' }; A.go('upload'); return; }
    X.AP.up = null; X.AP.pre = { folder: f };
    S.route = { view: 'assets' }; render();
  },
  assetBack() {
    const p = X.asPer(X.AP.pid);
    if (LS.back) { LS.folder = p ? LSX.asFolder(p) : ''; LS.kind = 'as'; S.route = { view: 'lists' }; render(); }
    else A.go('assets');
  },
  assetsBack() {
    if (LS.back) { S.route = { view: 'lists' }; render(); } else A.go('home');
  },
  meta(id) {
    const p = X.asPer(id); if (!p) return;
    const fo = LSX.asFolder(p);
    openLayer('nmovl', () => (
      <div id="nmovl">
        <div className="sigcard">
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Chuyển sang chi nhánh</div>
          <select className="inp" id="mtfold" defaultValue={fo}>
            {fo ? null : <option value="">— Chọn chi nhánh —</option>}
            {db.folders.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <div style={st('display:flex;gap:8px;margin-top:12px')}>
            <button className="btn btn-outline" style={st('flex:1;padding:12px')} onClick={() => closeLayer('nmovl')}>Huỷ</button>
            <button className="btn btn-primary" style={st('flex:1;padding:12px')} onClick={() => LSX.metaSave(id)}>{I('check', 16)}Chuyển</button>
          </div>
        </div>
      </div>
    ));
  },
  metaSave(id) {
    const p = X.asPer(id); if (!p) return;
    p.folder = document.getElementById('mtfold').value;
    store.save(); closeLayer('nmovl'); LS.folder = p.folder; LS.kind = 'as'; render(); toast('Đã chuyển chi nhánh');
  },
};

export function lsAssetCard(p) {
  const s = X.asStats(p); const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
  const right = s.ndiff ? <span style={{ fontWeight: 700, color: 'var(--red)' }}>{s.ndiff + ' chênh lệch'}</span>
    : (s.total > 0 && s.done === s.total ? <span style={{ fontWeight: 700, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{I('check', 14)}Hoàn tất</span> : <span style={{ color: 'var(--mut2)' }}>Đang kiểm</span>);
  return (
    <div key={p.id} className="card per" onClick={() => LSX.openAs(p.id)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {lockTagHtml(p)}
          <div style={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 2 }}>{(p.dateCount ? 'Kiểm kê ' + X.asDate(p.dateCount) + ' · ' : '') + s.total + ' tài sản' + (s.extra ? ' · ' + s.extra + ' phát hiện thêm' : '')}</div>
        </div>
        <div style={{ display: 'flex', flex: 'none' }}>
          <button className="perx" style={{ display: 'flex' }} title="Chuyển chi nhánh" onClick={(e) => { e.stopPropagation(); LSX.meta(p.id); }}>{I('folder', 15)}</button>
          {canDel() && canEdit('assets') ? <button className="perx" style={{ display: 'flex' }} title="Xoá kỳ" onClick={(e) => { e.stopPropagation(); X.ASX.delP(p.id); }}>{I('x', 15)}</button> : null}
        </div>
      </div>
      <div className="bar" style={{ marginTop: 12 }}><div className="fill" style={{ width: pct + '%' }}></div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
        <span style={{ color: 'var(--mut)' }}>Đã kiểm <b className="tnum" style={{ color: 'var(--ink)' }}>{s.done + '/' + s.total}</b></span>{right}
      </div>
    </div>
  );
}

export function ListsView() {
  LS.back = true;
  if (LS.folder === null) {
    return (
      <>
        <div className="topbar"><div className="trow wrap"><div className="ttl">Danh sách kiểm kê</div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{canEdit('config') && allBranches() ? <button className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => A.folderAdd()}>{I('plus', 15)}Chi nhánh</button> : null}</div></div><div style={{ height: 10 }}></div></div>
        <div className="wrap" style={{ paddingTop: 16, paddingBottom: 110 }}>
          <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 12 }}>Chọn chi nhánh để xem các kỳ kiểm kê Vật tư và CCDC &amp; TSCĐ.</div>
          {LSX.folderList().map((f, i) => {
            const c = LSX.counts(f); const tot = c.vt + c.as;
            let op = 0; let dn = 0; let cd = 0;
            try { periodsIn(f).forEach((p) => { if (p.items.some((it) => !it.counted && it.close !== 0)) op++; p.items.forEach((it) => { cd++; if (it.counted) dn++; }); }); } catch (e) { /* bỏ qua */ }
            const pc = cd ? Math.round(dn / cd * 100) : 0;
            return (
              <div key={f + '|' + i} className="brc" onClick={() => LSX.pick(i)}>
                <span className="bt" aria-hidden="true">{H(BRC_SVG)}</span>
                <div style={{ minWidth: 0, flex: 1 }}><div className="bn">{f || 'Chưa phân loại'}</div><div className="bs">
                  {tot ? <><span className="bp">Vật tư<b>{c.vt}</b></span><span className="bp">CCDC &amp; TSCĐ<b>{c.as}</b></span>{op ? <span className="bp warn"><i className="dt"></i>{op} đang kiểm</span> : null}</> : <span className="bp none"><i className="dt"></i>Chưa có kỳ kiểm kê</span>}
                </div>{cd ? <div className="bpg"><div className="bpt"><i style={{ width: pc + '%' }}></i></div><span>{pc}%</span></div> : null}</div>
                <span className="bc">{I('chev', 16)}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  }
  const f = LS.folder; const c = LSX.counts(f);
  if (LS.kind !== 'vt' && LS.kind !== 'as') LS.kind = 'vt';
  const list = LS.kind === 'vt' ? periodsIn(f) : LSX.assetsIn(f);
  return (
    <>
      <div className="topbar"><div className="trow wrap"><button className="back" onClick={() => LSX.backToFolders()}>‹</button><div className="ttl">{f || 'Chưa phân loại'}</div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{(f || LS.kind !== 'vt') && canEdit(LS.kind === 'vt' ? 'kiemke' : 'assets') ? <button className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => LSX.newPeriod()}>{I('plus', 15)}Kỳ mới</button> : null}</div></div>
        <div className="chips" style={{ paddingTop: 10 }}>
          {[['vt', c.vt], ['as', c.as]].map((t) => <button key={t[0]} className={'chip' + (LS.kind === t[0] ? ' chip-on' : '')} onClick={() => LSX.setKind(t[0])}>{LS_LBL[t[0]] + ' ' + t[1]}</button>)}
        </div></div>
      <div className="wrap" style={{ paddingTop: 14, paddingBottom: 110 }}>
        {list.map((p) => (LS.kind === 'vt' ? periodCardHtml(p) : lsAssetCard(p)))}
        {!list.length ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', border: '1.5px dashed var(--line)', borderRadius: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{I(LS.kind === 'vt' ? 'box' : 'monitor', 22)}</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{'Chưa có kỳ kiểm kê ' + LS_LBL[LS.kind]}</div>
            <div style={{ fontSize: 13, color: 'var(--mut)' }}>Bấm "Kỳ mới" để upload file cho chi nhánh này.</div>
          </div>
        ) : null}
      </div>
    </>
  );
}
export const renderLists = () => rerender();

/* Thẻ tỷ lệ kiểm kê theo tháng (màn hình chính) */
export const HM = { m: null };
export function hmKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
export function hmStats(m) {
  const ps = db.periods.filter((p) => p.createdAt && hmKey(new Date(p.createdAt)) === m); let act = 0; let exp = 0; let codes = 0; let done = 0;
  ps.forEach((p) => {
    p.items.forEach((i) => {
      exp += Number(i.close) || 0; codes++;
      if (i.counted && i.countQty !== null && i.countQty !== undefined) { act += Number(i.countQty) || 0; done++; }
    });
  });
  return { kyN: ps.length, act: Math.round(act * 100) / 100, exp: Math.round(exp * 100) / 100, codes, done, pct: exp > 0 ? act / exp * 100 : null };
}
