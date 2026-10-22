import React, { useState } from 'react';
import { sound } from '../utils/audio';

export default function HomePinView({ onJoinWithPin, onNavigate }) {
  const [pin, setPin] = useState('');
  const [studentName, setStudentName] = useState('Trần Hoàng Minh');
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    { text: '“Học, học nữa, học mãi”', author: 'V.I. Lênin' },
    { text: '“Học tập là hạt giống của kiến thức, kiến thức là hạt giống của hạnh phúc”', author: 'Ngạn ngữ' },
    { text: '“Hiền tài là nguyên khí của quốc gia”', author: 'Thân Nhân Trung' },
    { text: '“Đầu tư vào tri thức luôn mang lại lợi nhuận cao nhất”', author: 'Benjamin Franklin' }
  ];

  const handleJoin = (e) => {
    e.preventDefault();
    sound.play('click');
    const targetPin = pin.trim() || '689204';
    onJoinWithPin(targetPin, studentName);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
    sound.play('click');
  };

  return (
    <div className="home-pin-hero-container">
      {/* Decorative Floating Doodle SVGs */}
      <div className="doodle-pattern-overlay" aria-hidden="true">
        {/* Books */}
        <span className="doodle-item d-book-1">📖</span>
        <span className="doodle-item d-book-2">📚</span>
        <span className="doodle-item d-pencil-1">✏️</span>
        <span className="doodle-item d-pencil-2">📝</span>
        <span className="doodle-item d-pi-1">π</span>
        <span className="doodle-item d-pi-2">π</span>
        <span className="doodle-item d-cap-1">🎓</span>
        <span className="doodle-item d-cap-2">🎓</span>
        <span className="doodle-item d-math-1">＋</span>
        <span className="doodle-item d-math-2">✖</span>
        <span className="doodle-item d-flask-1">🧪</span>
        <span className="doodle-item d-flask-2">🔬</span>
        <span className="doodle-item d-star-1">⭐</span>
        <span className="doodle-item d-star-2">✨</span>
        <span className="doodle-item d-ruler-1">📐</span>
        <span className="doodle-item d-atom-1">⚛️</span>
      </div>

      <div className="home-pin-card-wrapper">
        {/* Large Playful 3D Title */}
        <h1 className="home-brand-title">Học Tốt!</h1>

        {/* Central White Rounded Box */}
        <div className="home-pin-box">
          <h2 className="home-pin-heading">Mã PIN</h2>

          <form onSubmit={handleJoin} className="home-pin-form">
            <div className="home-input-group">
              <input
                type="text"
                className="home-pin-input"
                placeholder="Nhập mã PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                autoFocus
              />
            </div>

            <div className="home-student-name-input-wrap">
              <label className="home-name-label">Tên của em:</label>
              <input
                type="text"
                className="home-name-input"
                placeholder="Họ và tên học sinh"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <button type="submit" className="home-pin-submit-btn">
              Tham gia
            </button>
          </form>

          <div className="home-pin-quick-hints">
            <span>Gợi ý mã PIN mẫu phòng học: </span>
            <button
              type="button"
              className="badge-pin-hint"
              onClick={() => {
                setPin('689204');
                sound.play('click');
              }}
            >
              689204
            </button>
          </div>
        </div>

        {/* Footer Educational Quote */}
        <div className="home-quote-container" onClick={handleNextQuote} title="Bấm để đổi danh ngôn học tập">
          <p className="home-quote-text">
            {quotes[quoteIndex].text} <span className="home-quote-author">- {quotes[quoteIndex].author}</span>
          </p>
          <span className="home-quote-tip">💡 Bấm để đổi câu danh ngôn</span>
        </div>

        {/* Quick Portal Switcher for Teacher & Student */}
        <div className="home-role-switcher">
          <div className="role-tag-card" onClick={() => onNavigate('student')}>
            <span className="role-icon">💻</span>
            <div>
              <strong>Góc Học Sinh</strong>
              <small>Lộ trình, xem video bài giảng & làm bài tập</small>
            </div>
          </div>

          <div className="role-tag-card" onClick={() => onNavigate('tv')}>
            <span className="role-icon">📺</span>
            <div>
              <strong>Màn Hình Tivi</strong>
              <small>Trình chiếu bài giảng 4 pha trên lớp</small>
            </div>
          </div>

          <div className="role-tag-card" onClick={() => onNavigate('editor')}>
            <span className="role-icon">🪄</span>
            <div>
              <strong>Soạn Giáo Án</strong>
              <small>Giáo viên thiết kế slide & đề trắc nghiệm</small>
            </div>
          </div>

          <div className="role-tag-card" onClick={() => onNavigate('arena')}>
            <span className="role-icon">🔠</span>
            <div>
              <strong>Sảnh Đấu Trường</strong>
              <small>Đấu trường trắc nghiệm trực tiếp</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
