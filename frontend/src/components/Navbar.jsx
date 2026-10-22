import React from 'react';
import { sound } from '../utils/audio';

export default function Navbar({
  activeRoute,
  onRouteChange,
  soundEnabled,
  onToggleSound,
  onOpenCatalog,
  onOpenGeminiModal,
  savedCatalogCount,
  user,
  onLogout
}) {
  const allItems = [
    { id: 'student', label: 'Học tập', icon: '🎓', colorClass: 'btn-nav-study', role: 'student' },
    { id: 'tv', label: 'Thuyết trình', icon: '▶', colorClass: 'btn-nav-present', role: 'teacher' },
    { id: 'exam', label: 'Thi', icon: '📝', colorClass: 'btn-nav-exam', role: 'student' },
    { id: 'editor', label: 'Tạo', icon: '🪄', colorClass: 'btn-nav-create', role: 'teacher' },
    { id: 'upload', label: 'Tải lên', icon: '☁️', colorClass: 'btn-nav-create', role: 'teacher' },
    { id: 'host', label: 'Phòng đấu trường', icon: '🔠', colorClass: 'btn-nav-arena', role: 'teacher' },
    { id: 'arena', label: 'Đấu trường', icon: '🔠', colorClass: 'btn-nav-arena', role: 'student' }
  ];
  const navItems = user ? allItems.filter((i) => i.role === user.role) : [];

  return (
    <header className="navbar-container">
      {/* Brand Logo with Owl Mascot - Click returns to Home PIN Screen */}
      <div
        className="navbar-brand"
        onClick={() => {
          onRouteChange('home');
          sound.play('click');
        }}
        title="Quay về trang chủ"
      >
        <span className="brand-mascot-owl">🦉</span>
        <div className="brand-title-group">
          <span className="brand-logo-text">Học Tốt!</span>
        </div>
      </div>

      {/* 5 Main Navigation Pills from User Screenshots */}
      <nav className="navbar-routes-group">
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`main-nav-pill ${item.colorClass} ${isActive ? 'active' : ''}`}
              onClick={() => {
                onRouteChange(item.id);
                sound.play('click');
              }}
            >
              <span className="nav-pill-icon">{item.icon}</span>
              <span className="nav-pill-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Tools: Gradebook, Teacher Profile, Sound */}
      <div className="navbar-quick-tools">
        {user?.role === 'teacher' && (
          <button
            type="button"
            className={`btn-subtool ${activeRoute === 'gradebook' ? 'active-subtool' : ''}`}
            onClick={() => {
              onRouteChange('gradebook');
              sound.play('click');
            }}
            title="Sổ điểm điện tử"
          >
            📊 Sổ điểm
          </button>
        )}

        <button
          type="button"
          className={`btn-subtool btn-sound-toggle ${soundEnabled ? 'sound-on' : 'sound-off'}`}
          onClick={onToggleSound}
          title="Bật/Tắt âm thanh"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {user && (
          <div className="teacher-badge-chip" title="Bấm để đăng xuất" onClick={onLogout} style={{ cursor: 'pointer' }}>
            <span className="teacher-avatar">{user.role === 'teacher' ? '👨‍🏫' : '🧑‍🎓'}</span>
            <span className="teacher-name">{user.name} ⎋</span>
          </div>
        )}
      </div>
    </header>
  );
}
