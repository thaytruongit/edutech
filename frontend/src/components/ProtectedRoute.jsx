import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginView from './LoginView';

// Chặn truy cập nếu chưa đăng nhập hoặc sai vai trò
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <LoginView hint="Vui lòng đăng nhập để tiếp tục" />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>🚫 Không đủ quyền truy cập</h2>
        <p>Trang này chỉ dành cho {roles.includes('teacher') ? 'giáo viên' : 'học sinh'}.</p>
      </div>
    );
  }
  return children;
}
