/* Khung ứng dụng: header + sidebar (máy tính) + drawer & thanh dưới (điện thoại) + vùng nội dung.
   Port từ phần thân HTML, navGroups()/navHtml()/renderNavOld()/renderNav() và bộ bnav của app gốc. */
import React, { useEffect } from 'react';
import { db, S, A, X } from './state.js';
import { useStore, store, boot, auth, logout } from './store.js';
import Login from './Login.jsx';
import { getView, hashSync, hrView, hrSafe, hrGo, render } from './router.js';
import { ModalHost, LayerHost } from './ui.jsx';
import { I, FcGly, NavIco, H } from './icons.jsx';
import { hsdEntries } from './data.js';
import { klog } from './klog.js';
import { can, canEdit, canView, allBranches, viewLevel } from './perms.js';

const call = (fn, ...a) => { try { return typeof fn === 'function' ? fn(...a) : undefined; } catch (e) { klog('shell.call', e); console.error(e); return undefined; } };

function navCounts() {
  const C = window.__nbc; if (C && Date.now() - C.t < 4000) return C.v;
  const v = { ex: 0, m1: 0, o: 0, nl: 0 };
  try { const en = hsdEntries(); v.ex = en.filter((e) => e.days < 0).length; v.m1 = en.filter((e) => e.days >= 0 && e.days <= 30).length; } catch (e) { /* bỏ qua */ }
  try { v.o = db.periods.filter((p) => p.items.some((i) => !i.counted && i.close !== 0)).length; } catch (e) { /* bỏ qua */ }
  try { if (db.pay && db.pay.mua && db.pay.mua.length && X.payCompute) X.payCompute().forEach((g) => { if (g.bad) v.nl++; }); } catch (e) { /* bỏ qua */ }
  window.__nbc = { t: Date.now(), v }; return v;
}
export function navGroups() {
  const nc = navCounts(); const v = S.route.view;
  const LSback = !!(X.LS && X.LS.back);
  const C = (fn) => () => { A.drawerClose(); call(fn); };
  /* 6 phân hệ: Tổng quan · Kiểm kê · Kho · Đối chiếu · Thanh toán NCC · Quản trị & tiện ích. Thao tác nhanh (Tạo kỳ, Quét QR) nằm đầu menu. */
  const kk = [
    { m: 'kiemke', label: 'Danh sách kỳ kiểm kê', title: 'Gồm các kỳ đang kiểm dở', cnt: nc.o || undefined, act: C(() => X.v2List()), on: v === 'lists' || v === 'transfer' || v === 'folder' || (v === 'asset' && LSback) || v === 'period' },
    { m: 'assets', label: 'Kiểm kê CCDC & TSCĐ', act: C(() => A.go('assets')), on: v === 'assets' || (v === 'asset' && !LSback) },
    { m: 'explain', label: 'Giải trình chênh lệch', title: 'Giải trình các mã chênh lệch sau kiểm kê', act: C(() => A.go('explain')), on: v === 'explain' || v === 'explainEdit' },
    { m: 'kiemke', label: 'Báo cáo kiểm kê', title: 'Tổng hợp kết quả kiểm kê', act: C(() => A.go('baocao')), on: v === 'baocao' || v === 'reporthub' },
    { ed: 'kiemke', label: 'Tạo kỳ kiểm kê', act: C(() => A.go('upload')), on: v === 'upload', hide: true },
  ];
  const kho = [
    { m: 'kiemke', label: 'Vật tư, tồn kho', act: () => call(A.navStock), on: v === 'stock' },
    { m: 'hsd', label: 'Cảnh báo hạn sử dụng', cnt: nc.ex || undefined, hot: 1, act: C(() => A.go('hsd')), on: v === 'hsd' },
    { m: 'kiemke', label: 'Điều chuyển liên chi nhánh', title: 'Tồn ≥3/6 tháng, gợi ý điều chuyển giữa chi nhánh', act: C(() => A.go('mgmt')), on: v === 'mgmt' },
  ];
  return permFilter([
    { quick: [
      { ed: 'kiemke', label: 'Tạo kỳ', icon: 'plus', pri: 1, act: C(() => A.go('upload')), on: v === 'upload' },
      { m: 'kiemke', label: 'Quét QR', icon: 'scan', act: C(() => X.v2Scan()), on: false },
    ] },
    { k: 'ov', icon: 'home', label: 'Tổng quan', act: () => A.navGo('home'), on: v === 'home' },
    { k: 'kk', icon: 'list', label: 'Kiểm kê', bd: nc.o || undefined, subs: kk, on: ['lists', 'transfer', 'upload', 'folder', 'period', 'assets', 'asset', 'baocao', 'reporthub', 'explain', 'explainEdit'].indexOf(v) >= 0 },
    { k: 'kho', icon: 'box', label: 'Kho', bd: nc.ex || undefined, subs: kho, on: ['stock', 'hsd', 'mgmt'].indexOf(v) >= 0 },
    { k: 'rc', icon: 'swap', label: 'Đối chiếu', on: ['recon', 'err', 'ana'].indexOf(v) >= 0, subs: [
      { m: 'recon', label: 'Đối chiếu doanh thu – xuất kho', title: 'So doanh thu với giá trị xuất kho theo tháng', act: C(() => A.go('recon')), on: v === 'recon' },
      { m: 'ana', label: 'Phân tích mua hàng – tiêu hao', title: 'So mua hàng với tiêu hao vật tư theo cơ sở, từ sổ chi tiết MISA', act: C(() => A.go('ana')), on: v === 'ana' },
      { m: 'err', label: 'Báo lỗi nhập liệu và labo', act: C(() => A.go('err')), on: v === 'err' }] },
    { m: 'pay', k: 'pay', icon: 'doc', label: 'Thanh toán NCC', bd: nc.nl || undefined, act: () => A.navGo('pay'), on: v === 'pay' },
    { k: 'qt', icon: 'file', label: 'Quản trị & tiện ích', on: ['handover', 'handoverEdit', 'dchub', 'settings', 'sign'].indexOf(v) >= 0, subs: [
      { m: 'handover', label: 'Biên bản bàn giao', title: 'Bàn giao vật tư, tài sản giữa các bên', act: C(() => A.go('handover')), on: v === 'handover' || v === 'handoverEdit' },
      { label: 'Trung tâm kiểm soát dữ liệu', title: 'Tổng hợp các công cụ đối chiếu, kiểm soát', act: C(() => A.go('dchub')), on: v === 'dchub' },
      { m: 'sign', label: 'Ký số PDF', title: 'Ký PDF, chọn vị trí ký, xác nhận mật khẩu / Face ID', act: C(() => A.go('sign')), on: v === 'sign' },
      { label: 'Cài đặt hệ thống', title: 'Hồ sơ, tài khoản, in ấn, người ký', act: C(() => A.go('settings')), on: v === 'settings' }] },
    { k: 'logout', icon: 'x', label: 'Đăng xuất', act: () => { A.drawerClose(); A.logout(); }, on: false },
  ]);
}
/* Ẩn mục của phân hệ mức 0 (m = cần xem, ed = cần sửa, br = không bị giới hạn chi nhánh); bỏ nhóm rỗng */
function permFilter(gs) {
  const ok = (x) => (!x.m || can(x.m)) && (!x.ed || canEdit(x.ed)) && (!x.br || allBranches());
  const out = [];
  gs.forEach((g) => {
    if (g.quick) { const q = g.quick.filter(ok); if (q.length) out.push({ ...g, quick: q }); return; }
    if (!ok(g)) return;
    if (!g.subs) { out.push(g); return; }
    const subs = g.subs.filter(ok);
    if (subs.some((y) => !y.hide)) out.push({ ...g, subs });
  });
  return out;
}
export function navActive(gs) {
  let g = null; let sub = null;
  gs.forEach((x) => { if (x.on && !g) g = x; });
  if (g && g.subs) g.subs.forEach((y) => { if (y.on && !sub) sub = y; });
  return { g, sub };
}
export function userInitials(n) {
  const w = String(n || '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}

function NavList({ gs, ac }) {
  return gs.map((g, gi) => {
    if (g.quick) {
      return <div key={'q' + gi} className="gnav-quick">{g.quick.map((q) => <a key={q.label} className={'gq' + (q.pri ? ' pri' : '') + (q.on ? ' on' : '')} onClick={q.act}>{I(q.icon, 16)}<span className="lb">{q.label}</span></a>)}</div>;
    }
    const on = ac.g === g;
    if (!g.subs) {
      return <a key={g.k} className={'gnav-item' + (on ? ' on' : '')} title={g.label} onClick={g.act}>{NavIco(g)}<span className="lb">{g.label}</span>{g.bd ? <span className="gbd">{g.bd}</span> : null}</a>;
    }
    return (
      <div key={g.k} className={'gnav-wrap' + (S.NAV_OPEN === g.k ? ' open' : '')} data-g={g.k}>
        <a className={'gnav-item gnav-grp' + (on ? ' on' : '')} title={g.label} onClick={() => A.navGroup(g.k)}>{NavIco(g)}<span className="lb">{g.label}</span>{g.bd ? <span className="gbd">{g.bd}</span> : null}<span className="chv">{I('chev', 16)}</span></a>
        <div className="gnav-subs"><div>
          {g.subs.map((y, i) => (y.hide ? null
            : <a key={i} className={'gnav-item gnav-sub' + (y.on ? ' on' : '')} title={y.title || undefined} onClick={y.act}>{y.label}{y.cnt != null ? <span className={'cnt' + (y.hot ? ' hot' : '')}>{y.cnt}</span> : null}</a>))}
        </div></div>
      </div>
    );
  });
}

class ViewBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { klog('view:' + this.props.view, err); console.error(err); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="wrap" style={{ paddingTop: 24 }}>
        <div className="note-warn"><b>Màn hình này gặp lỗi khi hiển thị.</b> Dữ liệu của bạn vẫn được giữ nguyên.
          <div style={{ fontSize: 12, marginTop: 6, wordBreak: 'break-word' }}>{String(this.state.err && this.state.err.message)}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="pill" onClick={() => this.setState({ err: null })}>Thử lại</button>
            <button className="pill" onClick={() => { this.setState({ err: null }); A.go('home'); }}>Về Tổng quan</button>
          </div>
        </div>
      </div>
    );
  }
}
function NoAccess() {
  return (
    <div className="wrap" style={{ paddingTop: 24 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Bạn không có quyền truy cập mục này</div>
        <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 12 }}>Liên hệ quản trị viên nếu cần được cấp quyền.</div>
        <button className="pill" onClick={() => A.go('home')}>Về Tổng quan</button>
      </div>
    </div>
  );
}
function Missing({ view }) {
  return <div className="wrap" style={{ paddingTop: 24 }}><div className="card">Màn hình <b>{view}</b> chưa sẵn sàng.</div></div>;
}

const LOGO_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="h5g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b9852a"/></linearGradient></defs></svg>';
const SV = (d) => H('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>');

function BootScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      {store.bootErr ? (
        <div className="card" style={{ maxWidth: 420 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Chưa kết nối được máy chủ</div>
          <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 12 }}>{String(store.bootErr.message || store.bootErr)}</div>
          <button className="btn" onClick={() => { store.bootErr = null; boot(); }}>Thử lại</button>
        </div>
      ) : <div style={{ color: 'var(--mut)' }}>Đang tải dữ liệu…</div>}
    </div>
  );
}

A.logout = () => { logout(); };

let started = false;
export default function Shell() {
  useStore();
  const v = S.route.view;

  useEffect(() => {
    if (store.ready && !started) {
      started = true;
      try { if (localStorage.getItem('kk_ui_sb') === '1' && window.innerWidth >= 900) document.body.classList.add('sb-min'); } catch (e) { klog('kk_ui_sb', e); }
      call(X.migrateFolders);
      store.save(); /* như app gốc: migrateFolders(); store.save(); — không có gì đổi thì không gửi gì */
      const hv0 = hrView();
      if (hv0 && hrSafe(hv0) !== 'home') hrGo(hv0); else render();
    }
  });
  useEffect(() => {
    document.body.setAttribute('data-view', v);
    hashSync();
    const bl = document.getElementById('fcbell');
    if (bl) bl.classList.toggle('has', !!document.querySelector('#app .nx-tot'));
  });

  if (!auth.checked) return <BootScreen />;
  if (!auth.user) return <Login />;
  if (!store.ready) return <BootScreen />;

  const gs = navGroups(); const ac = navActive(gs);
  if (S.NAV_LASTV !== v) { S.NAV_LASTV = v; if (ac.g && ac.g.subs) S.NAV_OPEN = ac.g.k; }
  const pr = db.profile || {};
  const shownName = pr.ten || (auth.user && auth.user.username) || '';
  const LSback = !!(X.LS && X.LS.back);
  const on = {
    home: ['home', 'upload', 'folder'].indexOf(v) >= 0,
    list: ['lists', 'period', 'stock', 'transfer'].indexOf(v) >= 0 || (v === 'asset' && LSback),
    dc: ['dchub', 'recon', 'pay', 'mgmt', 'err', 'ana'].indexOf(v) >= 0,
    more: ['sign', 'settings', 'hsd', 'assets', 'reporthub', 'baocao', 'handover', 'handoverEdit', 'explain', 'explainEdit'].indexOf(v) >= 0 || (v === 'asset' && !LSback),
  };
  const View = getView(v);
  const allowed = canView(v);
  const lv = allowed ? viewLevel(v) : null;
  const kk = can('kiemke');
  const GS = X.GS; const GSR = GS && GS.Results; /* phân hệ search */
  const offS = { opacity: 0.38, pointerEvents: 'none' };

  return (
    <>
      <header id="gheader">
        <button id="ghmenu" aria-label="Mở menu" onClick={() => A.drawerToggle()}>{H('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>')}</button>
        {H(LOGO_DEFS)}
        <div id="gbrand"><div className="bt"><div className="h5row"><span className="h5nm"><b className="h5t">MedDental<i className="h2k k1" /><i className="h2k k2" /><i className="h2k k3" /><i className="h2k k4" /></b></span><span className="h5p">Prime</span></div><small>Designed by Quyet Mai</small></div></div>
        <div id="gcrumb">{ac.g ? <span>{ac.g.label}</span> : null}{ac.sub ? <><span className="sp">›</span><b>{ac.sub.label}</b></> : null}</div>
        <label id="fcsrch">{SV('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input id="fcq" type="search" placeholder="Tìm kiếm vật tư, mã hàng, chứng từ…" autoComplete="off" value={GS ? GS.q : ''} onChange={(e) => GS && GS.input(e.target.value)} onFocus={() => GS && GS.focus()} onKeyDown={(e) => GS && GS.key(e)} /><kbd>Ctrl + K</kbd></label>
        <button id="fcbr" type="button">{SV('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>')}<span>{(db.folders && db.folders[0]) || '12M Cát Linh (HO)'}</span>{SV('<path d="m6 9 6 6 6-6"/>')}</button>
        <button id="fcbell" type="button" onClick={() => A.go('hsd')} aria-label="Thông báo">{SV('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4"/>')}<i /></button>
        <div id="guser" onClick={() => A.go('settings')}>{shownName ? <><span className="uav">{userInitials(shownName)}</span><span className="nm">{shownName}</span></> : null}<span className="gearb">{I('gear', 24)}</span></div>
      </header>
      {GSR ? <GSR /> : null}
      <div id="gshell">
        <nav id="gsidebar">
          <a className="gnav-item gnav-toggle" title="Thu gọn / mở rộng thanh bên" onClick={() => A.sbToggle()}>{I('menu', 18)}<span className="lb">Thu gọn thanh bên</span></a>
          <NavList gs={gs} ac={ac} />
        </nav>
        <main id="gmain">
          {lv === 1 ? <div className="ro-banner" role="status">{I('lock', 14)}<span>Chế độ chỉ xem — thay đổi sẽ không được lưu</span></div> : null}
          <div id="app" className={v === 'period' ? 'v2p' : undefined}>
            {allowed
              ? <ViewBoundary key={v} view={v}>{View ? <View /> : <Missing view={v} />}</ViewBoundary>
              : <NoAccess />}
          </div>
        </main>
      </div>
      <div id="gdrawer-ovl" className={S.drawer ? 'open' : undefined} onClick={() => A.drawerToggle()} />
      <nav id="gdrawer" className={S.drawer ? 'open' : undefined}><NavList gs={gs} ac={ac} /></nav>
      <ModalHost />
      <LayerHost />
      <nav id="bnav" aria-label="Điều hướng chính">
        <button data-k="home" className={on.home ? 'on' : undefined} onClick={() => A.go('home')}>{FcGly('home', 24)}Trang chủ</button>
        <button data-k="list" className={on.list ? 'on' : undefined} disabled={!kk} style={kk ? undefined : offS} onClick={() => call(X.v2List)}>{FcGly('list', 24)}Kiểm kê</button>
        <button className="fab" disabled={!kk} style={kk ? undefined : offS} onClick={() => call(X.v2Scan)} aria-label="Quét QR"><i>{I('qr', 30)}</i>Quét QR</button>
        <button data-k="dc" className={on.dc ? 'on' : undefined} onClick={() => A.go('dchub')}>{FcGly('rec', 24)}Đối chiếu</button>
        <button data-k="more" className={on.more ? 'on' : undefined} onClick={() => A.drawerToggle()}>{FcGly('more', 24)}Khác</button>
      </nav>
    </>
  );
}
