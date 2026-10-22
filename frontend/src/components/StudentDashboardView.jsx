import React, { useState } from 'react';
import StudentView from './StudentView';
import { sound } from '../utils/audio';

export default function StudentDashboardView({
  steps,
  currentStepIndex,
  onOpenZoom,
  savedCatalog,
  onWordCloudSubmit,
  studentName = 'Trần Hoàng Minh'
}) {
  const [subTab, setSubTab] = useState('dashboard'); // 'dashboard', 'video', 'practice', 'live_lab'
  const [selectedLesson, setSelectedLesson] = useState(3); // Lesson 3 "Luyện gõ phím"
  const [smartNotes, setSmartNotes] = useState([
    { id: 1, time: '02:15', tag: 'Định nghĩa bảng tính', content: 'Bảng tính gồm các hàng và cột giao nhau tạo thành ô tính.' },
    { id: 2, time: '05:40', tag: 'Công thức tính toán', content: 'Luôn bắt đầu bằng dấu bằng (=), ví dụ =SUM(A1:A5)' }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [practiceAnswer, setPracticeAnswer] = useState(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);

  // Road map lessons
  const roadmapLessons = [
    { id: 1, title: 'Bài 1: Làm quen máy tính', status: 'done', icon: '💻', stepNum: 1 },
    { id: 2, title: 'Bài 2: Chuột & bàn phím', status: 'done', icon: '🖱️', stepNum: 2 },
    { id: 3, title: 'Bài 3: Luyện gõ phím', status: 'current', icon: '⌨️', stepNum: 3 },
    { id: 4, title: 'Bài 4: Khám phá Internet', status: 'locked', icon: '🌐', stepNum: 4 },
    { id: 5, title: 'Bài 5: An toàn trực tuyến', status: 'locked', icon: '🛡️', stepNum: 5 },
    { id: 6, title: 'Bài 6: Ôn tập chương', status: 'quiz', icon: '📝', stepNum: 6 }
  ];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    sound.play('click');
    setSmartNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: '08:42',
        tag: 'Ghi chú tự do',
        content: newNoteText.trim()
      }
    ]);
    setNewNoteText('');
  };

  const handlePracticeSelect = (option) => {
    setPracticeAnswer(option);
    sound.play('click');
  };

  const handlePracticeSubmit = () => {
    if (!practiceAnswer) return;
    setPracticeSubmitted(true);
    if (practiceAnswer === 'C') {
      sound.play('correct');
    } else {
      sound.play('wrong');
    }
  };

  return (
    <div className="student-portal-wrapper">
      {/* Student Sub-Navigation Bar */}
      <div className="student-subnav-bar">
        <div className="student-brand-badge">
          <span className="student-owl-mascot">🦉</span>
          <div>
            <h2 className="student-portal-title">HỌC TẬP</h2>
            <span className="student-portal-sub">Không gian số dành cho học sinh</span>
          </div>
        </div>

        <div className="student-subnav-tabs">
          <button
            type="button"
            className={`subnav-pill ${subTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('dashboard');
              sound.play('click');
            }}
          >
            🗺️ Lộ Trình & Nhiệm Vụ
          </button>

          <button
            type="button"
            className={`subnav-pill ${subTab === 'video' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('video');
              sound.play('click');
            }}
          >
            🎥 Video & Ghi Chú
          </button>

          <button
            type="button"
            className={`subnav-pill ${subTab === 'practice' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('practice');
              sound.play('click');
            }}
          >
            ✏️ Tự Luyện Tập
          </button>

          <button
            type="button"
            className={`subnav-pill live-lab-pill ${subTab === 'live_lab' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('live_lab');
              sound.play('click');
            }}
          >
            🔴 Kết Nối TV Lớp Học
          </button>
        </div>

        <div className="student-user-badge">
          <span className="streak-tag">🔥 15 ngày</span>
          <div className="avatar-chip">
            <span className="avatar-circle">👦</span>
            <span className="avatar-name">{studentName}</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: LỘ TRÌNH VÀ DASHBOARD (Từ ảnh Student_study_dashboard_with_pro…_20261021193949.jpg) */}
      {subTab === 'dashboard' && (
        <div className="student-dashboard-grid">
          {/* Left Badges Sidebar */}
          <aside className="student-badges-sidebar">
            <div className="sidebar-section-title">HUY HIỆU ĐẠT ĐƯỢC</div>

            <div className="badge-item-card earned">
              <div className="badge-icon-disc gold">🏆</div>
              <div className="badge-info">
                <strong>Nhà vô địch</strong>
                <small>Top 1 Đấu trường lớp</small>
              </div>
            </div>

            <div className="badge-item-card earned">
              <div className="badge-icon-disc fire">❤️‍🔥</div>
              <div className="badge-info">
                <strong>Chăm chỉ</strong>
                <small>Học liên tục 15 ngày</small>
              </div>
            </div>

            <div className="badge-item-card earned">
              <div className="badge-icon-disc book">📖</div>
              <div className="badge-info">
                <strong>Mọt sách</strong>
                <small>Đọc hết 16 slide bài giảng</small>
              </div>
            </div>

            <div className="badge-item-card locked">
              <div className="badge-icon-disc star">⭐</div>
              <div className="badge-info">
                <strong>Siêu sao</strong>
                <small>Đạt 10/10 bài kiểm tra</small>
              </div>
            </div>
          </aside>

          {/* Main Road Map & Mission Cards */}
          <section className="student-roadmap-main">
            <div className="greeting-banner">
              <h2>Chào {studentName.split(' ').slice(-1)[0]}! ✨</h2>
              <p>Hôm nay chúng ta tiếp tục khám phá bài học <strong>Tin Học 8: Sử dụng bảng tính</strong> nhé!</p>
            </div>

            {/* Winding Map Box */}
            <div className="roadmap-path-box">
              <div className="roadmap-header">
                <h3>LỘ TRÌNH BÀI HỌC: CHỦ ĐỀ 4 - TIN HỌC ỨNG DỤNG</h3>
                <span className="roadmap-progress-percent">Tiến độ: 60%</span>
              </div>

              <div className="winding-road-container">
                <div className="road-dashed-line"></div>
                <div className="road-nodes-row">
                  {roadmapLessons.map((item) => (
                    <div
                      key={item.id}
                      className={`road-node-card ${item.status}`}
                      onClick={() => {
                        setSelectedLesson(item.id);
                        sound.play('click');
                      }}
                    >
                      <div className="node-circle-icon">
                        <span>{item.icon}</span>
                        {item.status === 'done' && <span className="check-badge">✓</span>}
                        {item.status === 'locked' && <span className="lock-badge">🔒</span>}
                      </div>
                      <span className="node-step-tag">{item.stepNum}</span>
                      <strong className="node-title">{item.title}</strong>
                      <span className="node-status-label">
                        {item.status === 'done' && 'Đã hoàn thành'}
                        {item.status === 'current' && 'Đang học'}
                        {item.status === 'locked' && 'Chưa mở'}
                        {item.status === 'quiz' && 'Bài kiểm tra'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Mission Cards */}
            <div className="mission-cards-grid">
              <div className="mission-card video-card" onClick={() => setSubTab('video')}>
                <div className="mission-icon">▶️</div>
                <div className="mission-content">
                  <span className="mission-type">Video bài giảng</span>
                  <div className="mission-bar">
                    <div className="mission-fill" style={{ width: '100%' }}></div>
                  </div>
                  <div className="mission-footer">
                    <span>100% Hoàn thành</span>
                    <button className="btn-pill-action">Đã xong ✓</button>
                  </div>
                </div>
              </div>

              <div className="mission-card practice-card" onClick={() => setSubTab('practice')}>
                <div className="mission-icon">📝</div>
                <div className="mission-content">
                  <span className="mission-type">Luyện tập trắc nghiệm</span>
                  <div className="mission-bar">
                    <div className="mission-fill" style={{ width: '60%' }}></div>
                  </div>
                  <div className="mission-footer">
                    <span>60% Hoàn thành</span>
                    <button className="btn-pill-action">Luyện tiếp ▶</button>
                  </div>
                </div>
              </div>

              <div className="mission-card lab-card" onClick={() => setSubTab('live_lab')}>
                <div className="mission-icon">🎮</div>
                <div className="mission-content">
                  <span className="mission-type">Đấu trường trực tiếp TV</span>
                  <div className="mission-bar">
                    <div className="mission-fill" style={{ width: '40%' }}></div>
                  </div>
                  <div className="mission-footer">
                    <span>Phòng máy trực tuyến</span>
                    <button className="btn-pill-action highlight">Vào thi đấu ⚡</button>
                  </div>
                </div>
              </div>

              <div className="mission-card exam-card">
                <div className="mission-icon">🔒</div>
                <div className="mission-content">
                  <span className="mission-type">Kiểm tra định kỳ</span>
                  <div className="mission-bar">
                    <div className="mission-fill" style={{ width: '0%' }}></div>
                  </div>
                  <div className="mission-footer">
                    <span>Chưa mở</span>
                    <span className="badge-locked">Cần xong bài 5</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: VIDEO BÀI GIẢNG & GHI CHÚ THÔNG MINH (Từ ảnh Student_app_lesson_video_interface_20261021193938.jpg) */}
      {subTab === 'video' && (
        <div className="video-lesson-layout">
          <div className="video-main-column">
            <div className="video-player-frame">
              <div className="video-mockup-screen">
                <div className="video-teacher-overlay">
                  <span className="video-live-badge">HD 1080p</span>
                  <h3>Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế</h3>
                  <p>Giáo viên hướng dẫn cách nhập công thức tự động và sử dụng hàm SUM, AVERAGE</p>
                </div>
                <div className="video-controls-bar">
                  <button className="btn-play">▶</button>
                  <span className="video-time">08:42 / 24:15</span>
                  <div className="video-scrubber">
                    <div className="scrubber-fill" style={{ width: '35%' }}></div>
                  </div>
                  <button className="btn-fullscreen">⛶</button>
                </div>
              </div>
            </div>

            {/* Smart Timestamp Notes Section */}
            <div className="smart-notes-card">
              <div className="smart-notes-header">
                <h3>📌 Ghi chú thông minh</h3>
                <span className="note-auto-hint">Tự động gắn mốc thời gian xem video (08:42)</span>
              </div>

              <form onSubmit={handleAddNote} className="add-note-form">
                <textarea
                  className="note-textarea"
                  placeholder="Nhập ghi chú quan trọng của em tại đây..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  rows={2}
                />
                <button type="submit" className="btn-save-note">
                  Lưu ghi chú
                </button>
              </form>

              <div className="notes-list">
                {smartNotes.map((n) => (
                  <div key={n.id} className="note-entry">
                    <span className="note-time-chip">{n.time}</span>
                    <strong className="note-tag-title">{n.tag}:</strong>
                    <span className="note-text-body">{n.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Playlist Column */}
          <aside className="video-playlist-sidebar">
            <h4 className="playlist-title">Nội dung khóa học</h4>

            <div className="playlist-item completed">
              <span className="pl-thumb">🎬</span>
              <div className="pl-info">
                <strong>Bài 4: Khái niệm hàm tính</strong>
                <small>15:30 • Hoàn thành ✓</small>
              </div>
            </div>

            <div className="playlist-item active">
              <span className="pl-thumb">▶️</span>
              <div className="pl-info">
                <strong>Bài 5: Sử dụng bảng tính (Tiết 2)</strong>
                <small>24:15 • Đang phát...</small>
              </div>
            </div>

            <div className="playlist-item">
              <span className="pl-thumb">🔒</span>
              <div className="pl-info">
                <strong>Bài 6: Định dạng dữ liệu</strong>
                <small>18:45 • Khóa</small>
              </div>
            </div>

            <div className="playlist-item">
              <span className="pl-thumb">🔒</span>
              <div className="pl-info">
                <strong>Bài 7: Luyện tập tổng hợp</strong>
                <small>22:10 • Khóa</small>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* VIEW 3: LUYỆN TẬP TRẮC NGHIỆM (Từ ảnh App_practice_page_quiz_layout_20261021192859.jpg) */}
      {subTab === 'practice' && (
        <div className="practice-quiz-wrapper">
          <div className="practice-quiz-card">
            <div className="practice-quiz-header">
              <span className="quiz-progress-text">Câu 6 / 10</span>
              <div className="quiz-progress-track">
                <div className="quiz-progress-fill" style={{ width: '60%' }}></div>
              </div>
              <button
                type="button"
                className="btn-quiz-hint"
                onClick={() => alert('💡 Gợi ý: Bắt đầu công thức trong phần mềm bảng tính Excel luôn phải có dấu bằng (=)')}
              >
                💡 Gợi ý
              </button>
            </div>

            <div className="practice-question-box">
              <span className="question-lead">Câu 6: Chọn đáp án đúng</span>
              <h3 className="question-content">
                Trong bảng tính điện tử, công thức tính tổng các ô từ A1 đến A5 nào sau đây là đúng chuẩn cú pháp?
              </h3>
            </div>

            <div className="practice-answers-grid">
              {[
                { key: 'A', text: '=SUM(A1..A5)' },
                { key: 'B', text: '=TOTAL(A1:A5)' },
                { key: 'C', text: '=SUM(A1:A5)' },
                { key: 'D', text: 'SUM=A1:A5' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`quiz-option-btn ${practiceAnswer === opt.key ? 'selected' : ''} ${practiceSubmitted && opt.key === 'C' ? 'correct' : ''}`}
                  onClick={() => handlePracticeSelect(opt.key)}
                >
                  <span className="opt-letter">{opt.key}</span>
                  <span className="opt-text">{opt.text}</span>
                  {practiceSubmitted && opt.key === 'C' && <span className="check-mark">✓</span>}
                </button>
              ))}
            </div>

            {!practiceSubmitted ? (
              <div className="practice-action-row">
                <button
                  type="button"
                  className="btn-submit-practice"
                  disabled={!practiceAnswer}
                  onClick={handlePracticeSubmit}
                >
                  Kiểm tra đáp án
                </button>
              </div>
            ) : (
              <div className="practice-feedback-banner">
                <div className="feedback-text">
                  <strong>🎉 Chính xác!</strong>
                  <p>Hàm SUM dùng dấu hai chấm (:) để phân cách địa chỉ ô đầu và ô cuối của vùng dữ liệu liên tiếp.</p>
                </div>
                <button
                  type="button"
                  className="btn-next-question"
                  onClick={() => {
                    setPracticeSubmitted(false);
                    setPracticeAnswer(null);
                    sound.play('click');
                  }}
                >
                  Tiếp tục câu 7 ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: BÀN HỌC PHÒNG MÁY TÍNH KẾT NỐI TRỰC TIẾP VỚI TV GIÁO VIÊN (StudentView với anti-cheat) */}
      {subTab === 'live_lab' && (
        <div className="live-lab-integrated-view">
          <StudentView
            steps={steps}
            currentStepIndex={currentStepIndex}
            onOpenZoom={onOpenZoom}
            savedCatalog={savedCatalog}
            onWordCloudSubmit={onWordCloudSubmit}
          />
        </div>
      )}
    </div>
  );
}
