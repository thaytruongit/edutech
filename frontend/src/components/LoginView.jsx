import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginView({ hint }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await login(username.trim(), password); }
    catch (err) { setError(err.message === 'Failed to fetch' ? 'Không kết nối được backend (cd backend && npm start)' : err.message); }
    finally { setBusy(false); }
  };

  const fill = (u) => { setUsername(u); setPassword('123456'); };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 16px' }}>
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e8dcc8', borderRadius: 16, padding: 32, width: 380, boxShadow: '0 8px 30px rgba(120,90,50,.1)' }}>
        <div style={{ fontSize: 48, textAlign: 'center' }}>🦉</div>
        <h2 style={{ textAlign: 'center', margin: '8px 0' }}>Đăng nhập Học Tốt!</h2>
        {hint && <p style={{ textAlign: 'center', color: '#8a7a62', fontSize: 14 }}>{hint}</p>}
        <input placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required style={inp} />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required style={inp} />
        {error && <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <button disabled={busy} style={{ ...inp, background: '#b08d57', color: '#fff', border: 0, cursor: 'pointer', fontWeight: 700 }}>
          {busy ? 'Đang vào...' : 'Đăng nhập'}
        </button>
        <div style={{ fontSize: 12, color: '#8a7a62', marginTop: 12, textAlign: 'center' }}>
          Demo: <a href="#" onClick={(e) => { e.preventDefault(); fill('gv'); }}>gv</a> (giáo viên) ·{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); fill('hs1'); }}>hs1</a> (học sinh) — mật khẩu 123456
        </div>
      </form>
    </div>
  );
}

const inp = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '12px 14px', margin: '10px 0', border: '1px solid #e0d3bd', borderRadius: 10, fontSize: 15 };
