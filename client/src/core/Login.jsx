/* Màn Đăng nhập: hiện thay cho toàn bộ khung app khi chưa có phiên (hoặc phiên hết hạn). */
import { useState } from 'react';
import { auth, login } from './store.js';

export default function Login() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    if (!u.trim() || !p) { setErr('Hãy nhập tên đăng nhập và mật khẩu'); return; }
    setBusy(true); setErr('');
    try {
      await login(u, p);
    } catch (x) {
      setErr(String((x && x.message) || 'Không đăng nhập được'));
      setBusy(false);
    }
  };

  return (
    <div className="lg-page">
      <form className="lg-card" onSubmit={submit} noValidate>
        <div className="lg-brand"><span className="lg-nm">MedDental</span><span className="lg-pr">Prime</span></div>
        <div className="lg-sub">Kiểm kê kho</div>
        <h1 className="lg-ttl">Đăng nhập</h1>
        {auth.expired ? <div className="note-warn lg-msg">Phiên đăng nhập đã hết hạn — đăng nhập lại để tiếp tục</div> : null}
        <label className="lbl" htmlFor="lg_u">Tên đăng nhập</label>
        <input className="inp" id="lg_u" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus value={u} onChange={(e) => setU(e.target.value)} disabled={busy} />
        <label className="lbl" htmlFor="lg_p" style={{ marginTop: 14 }}>Mật khẩu</label>
        <div className="lg-pw">
          <input className="inp" id="lg_p" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} disabled={busy} />
          <button type="button" className="lg-eye" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} tabIndex={-1}>{show ? 'Ẩn' : 'Hiện'}</button>
        </div>
        {err ? <div className="lg-err" role="alert">{err}</div> : null}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
}
