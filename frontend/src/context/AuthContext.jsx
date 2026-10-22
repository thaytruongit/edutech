import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORE = 'edulearn_auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; }
  });

  // Kiểm tra phiên đã lưu còn hiệu lực không (chỉ đăng xuất khi server báo 401; lỗi mạng thì giữ nguyên)
  useEffect(() => {
    if (!auth?.token) return;
    api('/api/auth/me', { token: auth.token })
      .then((r) => setAuth((a) => (a ? { ...a, user: r.user } : a)))
      .catch((e) => {
        if (e.message === 'Chưa đăng nhập') { setAuth(null); localStorage.removeItem(STORE); }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { username, password } });
    setAuth(data);
    localStorage.setItem(STORE, JSON.stringify(data));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (auth?.token) await api('/api/auth/logout', { method: 'POST', token: auth.token }).catch(() => {});
    setAuth(null);
    localStorage.removeItem(STORE);
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user: auth?.user || null, token: auth?.token || null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
