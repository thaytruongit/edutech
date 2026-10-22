import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import TeacherOcrModal from './TeacherOcrModal';

export default function TeacherEditorView({
  steps,
  onStepsChange,
  onSaveAllToCatalog,
  onOpenGeminiModal,
  onOpenZoom
}) {
  // Top Sub-tabs (From Image 1)
  // 1: Soạn bài học (Chuẩn 2.jpg), 2: Tạo bài thi theo tiết & khối, 3: Đề cương & Flashcards
  const [subTab, setSubTab] = useState('exam_builder'); // default 'exam_builder' to match Image 1
  const [phaseFilter, setPhaseFilter] = useState('P1');
  const [ocrModalOpen, setOcrModalOpen] = useState(false);

  // States for Image 1: Tạo bài thi theo tiết & khối
  const [examMeta, setExamMeta] = useState({
    grade: 'Khối 9',
    periodExam: '🏆 Kiểm tra Giữa kỳ I (Tiết 1-7)',
    examCode: 'DE1',
    duration: '45 Phút',
    title: 'Đề Kiểm tra Giữa kỳ I - Tin học 9 (Đề Chính thức)'
  });

  const [examQuestions, setExamQuestions] = useState([
    {
      id: 1,
      text: 'Câu 1: Địa chỉ ô nào sau đây là địa chỉ tuyệt đối trong Excel?',
      options: [
        { key: 'A', text: 'A1' },
        { key: 'B', text: '$A$1' },
        { key: 'C', text: '$A1' },
        { key: 'D', text: 'A$1' }
      ],
      correct: 'B'
    },
    {
      id: 2,
      text: 'Câu 2: Công thức =C4*$E$1 tại ô D4 khi sao chép xuống D5 sẽ thành:',
      options: [
        { key: 'A', text: '=C4*$E$1' },
        { key: 'B', text: '=C5*$E$1' },
        { key: 'C', text: '=C5*E2' },
        { key: 'D', text: '=$C$5*E1' }
      ],
      correct: 'B'
    }
  ]);

  // States for Image 2: Soạn bài học & Trình chiếu phòng học
  const [lessonMeta, setLessonMeta] = useState({
    grade: 'Khối 6',
    semester: 'Học kỳ I',
    period: 'Tiết 12',
    title: 'Ôn tập chương 1'
  });
  const [roomCode, setRoomCode] = useState('542455');
  const [joinedCount, setJoinedCount] = useState(18);
  const [totalStudents, setTotalStudents] = useState(35);

  // Add question in exam builder
  const handleAddQuestion = () => {
    sound.play('click');
    const newId = examQuestions.length + 1;
    setExamQuestions((prev) => [
      ...prev,
      {
        id: newId,
        text: `Câu ${newId}: Nội dung câu hỏi kiểm tra mới...`,
        options: [
          { key: 'A', text: 'Phương án A' },
          { key: 'B', text: 'Phương án B' },
          { key: 'C', text: 'Phương án C' },
          { key: 'D', text: 'Phương án D' }
        ],
        correct: 'A'
      }
    ]);
  };

  const handleDeleteQuestion = (id) => {
    sound.play('click');
    setExamQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSaveExam = () => {
    sound.play('correct');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.3 } });
    alert(`💾 Đã lưu và xuất bản thành công "${examMeta.title}"!\nHọc sinh có thể vào mục "📝 Thi" để làm bài.`);
  };

  return (
    <div className="teacher-suite-container">
      {/* Sub-Tabs Navigation (Từ ảnh Image 1) */}
      <div className="teacher-subtabs-bar">
        <div className="subtabs-left-group">
          <button
            type="button"
            className={`subtab-btn ${subTab === 'lesson_builder' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('lesson_builder');
              sound.play('click');
            }}
          >
            💻 1. Soạn bài học (Chuẩn 2.jpg)
          </button>

          <button
            type="button"
            className={`subtab-btn btn-highlight ${subTab === 'exam_builder' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('exam_builder');
              sound.play('click');
            }}
          >
            📑 2. Tạo bài thi theo tiết & khối
          </button>

          <button
            type="button"
            className={`subtab-btn ${subTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => {
              setSubTab('flashcards');
              sound.play('click');
            }}
          >
            📚 3. Đề cương & Flashcards
          </button>
        </div>

        <div className="teacher-profile-chip-sub">
          <span className="teacher-avatar">👨‍🏫</span>
          <span className="teacher-name">GV: Đỗ Mạnh Trường</span>
        </div>
      </div>

      {/* =========================================================================
          TAB 2: TẠO BÀI THI THEO TIẾT & KHỐI (HÌNH ẢNH 1)
          ========================================================================= */}
      {subTab === 'exam_builder' && (
        <div className="exam-builder-screen">
          {/* Header Banner */}
          <div className="exam-banner-card">
            <div className="banner-badge-tag">
              ✨ TẠO BÀI THI & ĐỀ KIỂM TRA THEO TIẾT THEO KHỐI
            </div>
            <div className="banner-title-row">
              <div>
                <h1 className="banner-main-title">
                  BIÊN SOẠN MA TRẬN, ĐỀ KIỂM TRA 15 PHÚT & ĐỀ THI GIỮA KỲ / CUỐI KỲ ✨
                </h1>
                <p className="banner-sub-text">
                  Giáo viên chọn Khối và Tiết học để tạo bài thi, nhập câu hỏi trắc nghiệm, điền khuyết và tự luận. Sau khi lưu, đề thi sẽ tự động xuất hiện tại mục 📝 <strong>Thi</strong> cho học sinh làm bài.
                </p>
              </div>

              <button
                type="button"
                className="btn-save-publish-exam"
                onClick={handleSaveExam}
              >
                💾 Lưu & Xuất bản Đề thi này
              </button>
            </div>

            {/* 4 Configuration Boxes */}
            <div className="exam-config-boxes-grid">
              {/* Box 1: Khối lớp */}
              <div className="config-box-card">
                <div className="config-box-icon backpack">🎒</div>
                <div className="config-box-body">
                  <label className="config-label">1. KHỐI LỚP (*)</label>
                  <select
                    className="config-select"
                    value={examMeta.grade}
                    onChange={(e) => setExamMeta({ ...examMeta, grade: e.target.value })}
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                  </select>
                </div>
              </div>

              {/* Box 2: Tiết PPCT / Kỳ thi */}
              <div className="config-box-card">
                <div className="config-box-icon calendar">📅</div>
                <div className="config-box-body">
                  <label className="config-label">2. TIẾT PPCT / KỲ THI (*)</label>
                  <select
                    className="config-select"
                    value={examMeta.periodExam}
                    onChange={(e) => setExamMeta({ ...examMeta, periodExam: e.target.value })}
                  >
                    <option value="🏆 Kiểm tra Giữa kỳ I (Tiết 1-7)">🏆 Kiểm tra Giữa kỳ I (Tiết 1-7)</option>
                    <option value="🥇 Kiểm tra Cuối kỳ I (Tiết 18)">🥇 Kiểm tra Cuối kỳ I (Tiết 18)</option>
                    <option value="⏱️ Kiểm tra 15 phút (Tiết 5)">⏱️ Kiểm tra 15 phút (Tiết 5)</option>
                  </select>
                </div>
              </div>

              {/* Box 3: Mã đề */}
              <div className="config-box-card">
                <div className="config-box-icon tag">🏷️</div>
                <div className="config-box-body">
                  <label className="config-label">3. MÃ ĐỀ</label>
                  <input
                    type="text"
                    className="config-input"
                    value={examMeta.examCode}
                    onChange={(e) => setExamMeta({ ...examMeta, examCode: e.target.value })}
                  />
                </div>
              </div>

              {/* Box 4: Thời gian làm bài */}
              <div className="config-box-card">
                <div className="config-box-icon clock">⏰</div>
                <div className="config-box-body">
                  <label className="config-label">4. THỜI GIAN LÀM BÀI</label>
                  <select
                    className="config-select"
                    value={examMeta.duration}
                    onChange={(e) => setExamMeta({ ...examMeta, duration: e.target.value })}
                  >
                    <option value="15 Phút">15 Phút</option>
                    <option value="45 Phút">45 Phút</option>
                    <option value="60 Phút">60 Phút</option>
                    <option value="90 Phút">90 Phút</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tiêu đề đề thi / bài kiểm tra */}
            <div className="exam-title-input-section">
              <label className="exam-title-label">TIÊU ĐỀ ĐỀ THI / BÀI KIỂM TRA</label>
              <input
                type="text"
                className="exam-title-input-rainbow"
                value={examMeta.title}
                onChange={(e) => setExamMeta({ ...examMeta, title: e.target.value })}
              />
            </div>
          </div>

          {/* Section: PHẦN I. TRẮC NGHIỆM KHÁCH QUAN */}
          <div className="exam-questions-section">
            <div className="section-header-banner">
              <div className="section-title-pill">
                PHẦN I. TRẮC NGHIỆM KHÁCH QUAN (5.0 ĐIỂM) — 10 câu
              </div>

              <div className="section-actions-group">
                <button
                  type="button"
                  className="btn-upload-exam-file"
                  onClick={() => alert('📁 Chọn tệp đề thi (.pdf, .docx) để AI tự động trích xuất!')}
                >
                  <span className="file-badge">PDF/DOCX</span>
                  ⬆ Tải lên file đề (.pdf, .docx)
                </button>

                <button
                  type="button"
                  className="btn-add-question-tn"
                  onClick={handleAddQuestion}
                >
                  + Thêm câu hỏi TN
                </button>
              </div>
            </div>

            {/* Two-Column Question Cards matching Image 1 */}
            <div className="exam-questions-two-col-grid">
              {examQuestions.map((q, idx) => (
                <div key={q.id} className="exam-builder-question-card">
                  <div className="card-top-row">
                    <span className="card-question-tag">Câu #{idx + 1}</span>
                    <button
                      type="button"
                      className="btn-delete-q"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      Xóa 🗑️
                    </button>
                  </div>

                  <div className="card-question-box">
                    <textarea
                      className="question-edit-text"
                      value={q.text}
                      onChange={(e) => {
                        const newQ = [...examQuestions];
                        newQ[idx].text = e.target.value;
                        setExamQuestions(newQ);
                      }}
                      rows={2}
                    />
                  </div>

                  <div className="options-grid-builder">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct === opt.key;
                      const colorClass = ['color-blue', 'color-yellow', 'color-green', 'color-coral'][optIdx % 4];

                      return (
                        <div
                          key={opt.key}
                          className={`option-builder-chip ${colorClass} ${isCorrect ? 'is-correct' : ''}`}
                          onClick={() => {
                            const newQ = [...examQuestions];
                            newQ[idx].correct = opt.key;
                            setExamQuestions(newQ);
                            sound.play('click');
                          }}
                        >
                          <span className="opt-key-circle">{opt.key}:</span>
                          <input
                            type="text"
                            className="opt-input-text"
                            value={opt.text}
                            onChange={(e) => {
                              const newQ = [...examQuestions];
                              newQ[idx].options[optIdx].text = e.target.value;
                              setExamQuestions(newQ);
                            }}
                          />
                          {isCorrect && <span className="correct-check-icon">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: SOẠN BÀI HỌC & TRÌNH CHIẾU PHÒNG HỌC (HÌNH ẢNH 2)
          ========================================================================= */}
      {subTab === 'lesson_builder' && (
        <div className="lesson-builder-screen">
          {/* Top Bar matching Image 2 */}
          <div className="lesson-top-bar">
            <div className="brand-group">
              <span className="brand-logo-txt">Học Tốt!</span>
              <span className="version-pill">PHIÊN BẢN 8.1</span>
              <span className="system-title">HỆ THỐNG BÀI GIẢNG 4 PHA</span>
            </div>

            <div className="selectors-group">
              <select
                className="select-pill"
                value={lessonMeta.grade}
                onChange={(e) => setLessonMeta({ ...lessonMeta, grade: e.target.value })}
              >
                <option value="Khối 6">Khối 6</option>
                <option value="Khối 7">Khối 7</option>
                <option value="Khối 8">Khối 8</option>
                <option value="Khối 9">Khối 9</option>
              </select>

              <select
                className="select-pill"
                value={lessonMeta.semester}
                onChange={(e) => setLessonMeta({ ...lessonMeta, semester: e.target.value })}
              >
                <option value="Học kỳ I">Học kỳ I</option>
                <option value="Học kỳ II">Học kỳ II</option>
              </select>

              <select
                className="select-pill"
                value={lessonMeta.period}
                onChange={(e) => setLessonMeta({ ...lessonMeta, period: e.target.value })}
              >
                <option value="Tiết 12">Tiết 12</option>
                <option value="Tiết 7">Tiết 7</option>
              </select>

              <input
                type="text"
                className="lesson-name-input"
                value={`Tên bài: ${lessonMeta.title}`}
                onChange={(e) => setLessonMeta({ ...lessonMeta, title: e.target.value.replace('Tên bài: ', '') })}
              />

              <button
                type="button"
                className="btn-save-all-green"
                onClick={() => {
                  sound.play('correct');
                  alert('💾 Đã lưu toàn bộ bài giảng thành công!');
                }}
              >
                💾 Lưu toàn bộ bài giảng
              </button>
            </div>
          </div>

          {/* Main 2-Column Layout */}
          <div className="lesson-split-layout">
            {/* Left Sidebar: Uploaded Media Box & AI Toolbar */}
            <aside className="lesson-left-sidebar">
              <div className="sidebar-group-box">
                <span className="group-title">Uploaded Media Box</span>
                <button
                  type="button"
                  className="btn-media-upload"
                  onClick={() => alert('📁 Chọn tệp PDF / PPTX để tải lên')}
                >
                  <span className="upload-arrow">⬆</span>
                  <div className="upload-txt">
                    <strong>Tải PDF/PPTX/Ảnh HD</strong>
                    <small>(.pdf, .pptx, .jpg, .png)</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-media-upload"
                  onClick={() => alert('🎬 Nhúng link video YouTube/MP4')}
                >
                  <span className="upload-arrow">⬆</span>
                  <div className="upload-txt">
                    <strong>Tải Video</strong>
                    <small>(.mp4, .mov)</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-media-upload"
                  onClick={() => alert('✏️ Nhập nhanh chuỗi đáp án 1A, 2B, 3C...')}
                >
                  <span className="upload-arrow">⬆</span>
                  <div className="upload-txt">
                    <strong>Nhập nhanh đáp án</strong>
                    <small>(Dạng: 1A, 2B...)</small>
                  </div>
                </button>
              </div>

              {/* AI Toolbar */}
              <div className="sidebar-group-box ai-toolbar-box">
                <span className="group-title">AI Toolbar</span>
                <button
                  type="button"
                  className="btn-ai-tool"
                  onClick={() => setOcrModalOpen(true)}
                >
                  🔍 Quét OCR Dạng Slide
                </button>
                <button
                  type="button"
                  className="btn-ai-tool"
                  onClick={() => onOpenGeminiModal()}
                >
                  🪄 AI Điền Đáp Án
                </button>
                <button
                  type="button"
                  className="btn-ai-tool"
                  onClick={() => alert('🎯 Bắt đầu quét toàn diện toàn bộ slide bài giảng')}
                >
                  🎯 Quét Toàn Diện
                </button>
                <button
                  type="button"
                  className="btn-ai-tool"
                  onClick={() => alert('🧠 AI đang tạo lời giải bài tập mẫu...')}
                >
                  🧠 Giải Bài Tập
                </button>
                <button
                  type="button"
                  className="btn-ai-tool"
                  onClick={() => alert('⇅ Sắp xếp lại thứ tự slide')}
                >
                  ⇅ Sắp Xếp
                </button>
              </div>
            </aside>

            {/* Right Main Content */}
            <main className="lesson-right-content">
              {/* 4 Phases Navigation */}
              <div className="phases-bar-top">
                <button
                  type="button"
                  className={`phase-btn ${phaseFilter === 'P1' ? 'active' : ''}`}
                  onClick={() => setPhaseFilter('P1')}
                >
                  Pha 1: KHỞI ĐỘNG
                </button>
                <button
                  type="button"
                  className={`phase-btn ${phaseFilter === 'P2' ? 'active' : ''}`}
                  onClick={() => setPhaseFilter('P2')}
                >
                  Pha 2: VƯỢT CHƯỚNG NGẠI VẬT
                </button>
                <button
                  type="button"
                  className={`phase-btn ${phaseFilter === 'P3' ? 'active' : ''}`}
                  onClick={() => setPhaseFilter('P3')}
                >
                  Pha 3: TĂNG TỐC
                </button>
                <button
                  type="button"
                  className={`phase-btn ${phaseFilter === 'P4' ? 'active' : ''}`}
                  onClick={() => setPhaseFilter('P4')}
                >
                  Pha 4: VỀ ĐÍCH
                </button>
                <span className="guide-link">HƯỚNG DẪN TỰ HỌC</span>
              </div>

              {/* Slide Question Item Card with Colored 4 Bars */}
              <div className="slide-question-edit-card">
                <div className="card-header-line">
                  <strong>Câu hỏi 1 (Pha 1)</strong>
                  <span className="card-dots">•••</span>
                </div>

                <div className="slide-inner-grid">
                  {/* Left: Slide preview */}
                  <div className="slide-preview-box">
                    <div className="mock-slide-art">
                      <span className="art-icon">🖼️</span>
                      <small>Xem trước slide</small>
                    </div>
                    <button type="button" className="btn-upload-slide-img">
                      Upload ảnh
                    </button>
                  </div>

                  {/* Right: Colored Multiple Choice Options */}
                  <div className="colored-options-list">
                    <span className="colored-opts-title">
                      Colored Multiple Choice Options • <em>Mark or star answer</em>
                    </span>

                    <div className="color-bar-row red-bar">
                      <span className="bar-tag">A</span>
                      <input type="text" className="bar-input" defaultValue="Địa chỉ A1" />
                      <input type="checkbox" className="bar-chk" />
                    </div>

                    <div className="color-bar-row blue-bar">
                      <span className="bar-tag">B</span>
                      <input type="text" className="bar-input" defaultValue="Địa chỉ $A$1" />
                      <input type="checkbox" className="bar-chk" defaultChecked />
                    </div>

                    <div className="color-bar-row yellow-bar">
                      <span className="bar-tag">C</span>
                      <input type="text" className="bar-input" defaultValue="Địa chỉ $A1" />
                      <input type="checkbox" className="bar-chk" />
                    </div>

                    <div className="color-bar-row green-bar">
                      <span className="bar-tag">D</span>
                      <input type="text" className="bar-input" defaultValue="Địa chỉ A$1" />
                      <input type="checkbox" className="bar-chk" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section: TRÌNH CHIẾU PHÒNG HỌC - HỌC TỐT! (Từ Image 2) */}
              <div className="classroom-projection-box">
                <div className="projection-blue-header">
                  TRÌNH CHIẾU PHÒNG HỌC - HỌC TỐT!
                </div>

                <div className="projection-body">
                  <div className="entry-line">
                    Giant Classroom Entry: <span className="giant-code">{roomCode}</span> MÃ PHÒNG HỌC
                  </div>

                  <div className="projection-content-grid">
                    {/* Left: QR Code */}
                    <div className="qr-col">
                      <div className="qr-box-graphic">
                        <span className="qr-icon-big">📱</span>
                        <strong>QR</strong>
                      </div>
                      <small>Quét mã để tham gia</small>
                    </div>

                    {/* Center: Live student counter & chips */}
                    <div className="students-status-col">
                      <div className="counter-row">
                        HỌC SINH ĐÃ VÀO: <strong className="green-txt">{joinedCount} / {totalStudents}</strong>
                      </div>
                      <div className="calc-mode-txt">
                        Tính điểm: Ngay khi HS chọn đáp án
                      </div>

                      <div className="joined-chips-flow">
                        {['An', 'Bình', 'Chi', 'Đức', 'Lan', 'Nam', 'Trang', 'Tú'].map((name, i) => (
                          <span key={i} className={`student-chip-tag color-${i % 5}`}>
                            👤 {name}
                          </span>
                        ))}
                        <span className="student-chip-tag dots">...</span>
                      </div>
                    </div>

                    {/* Right: Big Action Buttons */}
                    <div className="actions-col">
                      <button
                        type="button"
                        className="btn-start-class-space"
                        onClick={() => {
                          sound.play('streak');
                          alert('🚀 Tiết học đã chính thức bắt đầu!');
                        }}
                      >
                        BẮT ĐẦU TIẾT HỌC (SPACE)
                      </button>

                      <button
                        type="button"
                        className="btn-next-step-space"
                        onClick={() => {
                          sound.play('click');
                          alert('▶ Đã chuyển sang bước tiếp theo!');
                        }}
                      >
                        Bước Tiếp • Chốt & Xem ĐA (SPACE)
                      </button>
                    </div>
                  </div>

                  {/* Bottom Drawing Toolbar */}
                  <div className="drawing-toolbar-bottom">
                    <div className="tools-left">
                      <span className="draw-tool" title="Bút vẽ">✏️</span>
                      <span className="draw-tool" title="Bút dạ quang">🖍️</span>
                      <span className="draw-tool" title="Phóng to">🔍</span>
                    </div>

                    <div className="tools-center">
                      <button className="btn-nav-page">‹</button>
                      <span className="page-indicator">1 / 15</span>
                      <button className="btn-nav-page">›</button>
                    </div>

                    <div className="tools-right">
                      <span className="timer-badge">⏱️ 00:00</span>
                      <span className="draw-tool" title="Toàn màn hình">⛶</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ĐỀ CƯƠNG & FLASHCARDS
          ========================================================================= */}
      {subTab === 'flashcards' && (
        <div className="flashcards-screen">
          <div className="flashcards-card-box">
            <h2>📚 Đề Cương Ôn Tập & Flashcards Thông Minh</h2>
            <p>Hệ thống tự động trích xuất các từ khóa trọng tâm để học sinh ôn tập trước bài kiểm tra.</p>

            <div className="flashcards-grid">
              <div className="flashcard-item">
                <span className="card-badge">Địa chỉ tuyệt đối</span>
                <h3>$A$1</h3>
                <p>Cố định cả cột và hàng khi sao chép công thức.</p>
              </div>

              <div className="flashcard-item">
                <span className="card-badge">Hàm tính tổng</span>
                <h3>=SUM(địa_chỉ_vùng)</h3>
                <p>Cộng dồn tất cả giá trị số trong phạm vi ô được chọn.</p>
              </div>

              <div className="flashcard-item">
                <span className="card-badge">Phím tắt nhanh</span>
                <h3>F4</h3>
                <p>Chuyển đổi luân phiên giữa địa chỉ tương đối và tuyệt đối.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Modal */}
      <TeacherOcrModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        onAddGeneratedStep={() => {}}
      />
    </div>
  );
}
