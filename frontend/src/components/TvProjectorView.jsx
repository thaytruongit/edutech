import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

export default function TvProjectorView({
  steps,
  currentStepIndex = 0,
  onStepIndexChange,
  liveStudents = [],
  roomPin = '542455',
  wordCloudData = {},
  onWordCloudUpdate
}) {
  const [selectedGrade, setSelectedGrade] = useState('Khối 8');
  const [selectedPeriod, setSelectedPeriod] = useState('Tiết 7');
  const [activeStepNum, setActiveStepNum] = useState(1);
  const [elearningScore, setElearningScore] = useState(0);
  const [viewMode, setViewMode] = useState('elearning'); // 'elearning' (Image 3) or 'tv_arena' (Kahoot TV 16:9)

  // Arena TV Mode state
  const [arenaTimer, setArenaTimer] = useState(15);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showAnswerResult, setShowAnswerResult] = useState(false);
  const [answerDistribution, setAnswerDistribution] = useState({ A: 3, B: 18, C: 4, D: 1 });

  // 6 Interactive Steps content
  const stepsLibrary = {
    1: {
      phase: 'Pha 1: Khởi động 🏃',
      title: 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế',
      subtitle: 'Địa chỉ tương đối tự động thay đổi khi sao chép công thức. D',
      noteTitle: 'Khái niệm địa chỉ ô tính',
      noteDesc: 'Địa chỉ tương đối tự động thay đổi khi sao chép công thức. Địa chỉ tuyệt đối ($E$1) có dấu $ trên tên cột và hàng, cố định không đổi.',
      bullet1: 'Tương đối: A1, C5 tự thay đổi khi sao chép.',
      bullet2: 'Tuyệt đối: $E$1, $B$2 luôn cố định.',
      bullet3: 'Phím tắt chuyển tuyệt đối: F4.',
      formula: '=C4*$E$1',
      cells: [
        { label: 'C4', color: 'c-blue' },
        { label: '$E$1', color: 'c-green' },
        { label: 'D4', color: 'c-yellow' }
      ]
    },
    2: {
      phase: 'Pha 2: Khám phá kiến thức 📖',
      title: 'Quy tắc nhập công thức và sử dụng hàm tính',
      subtitle: 'Các hàm cơ bản thường dùng trong Excel: SUM, AVERAGE, MAX, MIN',
      noteTitle: 'Quy tắc vàng khi nhập công thức',
      noteDesc: 'Mọi công thức hoặc hàm tính toán trong Excel bắt buộc phải bắt đầu bằng dấu bằng (=). Dấu hai chấm (:) dùng để xác định khối ô liên tục.',
      bullet1: 'Hàm tính tổng: =SUM(ô_đầu:ô_cuối).',
      bullet2: 'Hàm trung bình cộng: =AVERAGE(ô_đầu:ô_cuối).',
      bullet3: 'Hàm giá trị lớn nhất/nhỏ nhất: =MAX(...) / =MIN(...).',
      formula: '=SUM(D4:D10)',
      cells: [
        { label: 'D4:D10', color: 'c-green' },
        { label: 'SUM', color: 'c-blue' },
        { label: 'TOTAL', color: 'c-yellow' }
      ]
    },
    3: {
      phase: 'Pha 3: Luyện tập trắc nghiệm 🎯',
      title: 'Câu hỏi kiểm tra nhanh: Cú pháp hàm chuẩn',
      subtitle: 'Học sinh quan sát câu hỏi và bấm đáp án trên màn hình máy tính',
      noteTitle: 'Phân tích lỗi sai thường gặp',
      noteDesc: 'Học sinh thường quên dấu bằng (=) hoặc dùng sai dấu chấm (.) thay cho dấu hai chấm (:) khi chỉ định vùng dữ liệu.',
      bullet1: 'Đúng: =SUM(A1:A5) hoặc =AVERAGE(B2:B8).',
      bullet2: 'Sai: SUM(A1:A5) - Thiếu dấu =.',
      bullet3: 'Sai: =SUM(A1..A5) - Sai ký hiệu phân cách.',
      formula: '=AVERAGE(B2:B8)',
      cells: [
        { label: 'B2:B8', color: 'c-yellow' },
        { label: 'AVG', color: 'c-green' },
        { label: 'RES', color: 'c-blue' }
      ]
    },
    4: {
      phase: 'Pha 3: Luyện tập nâng cao 🎯',
      title: 'Giải quyết bài toán: Bảng theo dõi chi tiêu gia đình',
      subtitle: 'Áp dụng công thức có kết hợp địa chỉ tương đối và tuyệt đối',
      noteTitle: 'Ứng dụng thực tế bài toán',
      noteDesc: 'Khi tính tỉ lệ phần trăm chi tiêu của từng khoản so với tổng chi tiêu, ô chứa Tổng chi tiêu phải để ở dạng địa chỉ tuyệt đối ($D$15).',
      bullet1: 'Công thức ô E4: =D4/$D$15 * 100%.',
      bullet2: 'Khi sao chép xuống E5, E6... thì D4 tự nhảy thành D5, D6.',
      bullet3: '$D$15 luôn được giữ cố định.',
      formula: '=D4/$D$15',
      cells: [
        { label: 'D4', color: 'c-blue' },
        { label: '$D$15', color: 'c-green' },
        { label: '% TỈ LỆ', color: 'c-yellow' }
      ]
    },
    5: {
      phase: 'Pha 4: Về đích & Thảo luận ☁️',
      title: 'Đám mây từ khóa (Word Cloud) bài học hôm nay',
      subtitle: 'Học sinh gửi các từ khóa ghi nhớ nhất về máy chiếu lớp học',
      noteTitle: 'Tổng hợp từ khóa học tập',
      noteDesc: 'Những kiến thức cốt lõi được cả lớp cùng thảo luận và đúc kết thành cẩm nang ghi nhớ.',
      bullet1: 'Từ khóa 1: Địa chỉ tuyệt đối ($A$1) - Phím F4.',
      bullet2: 'Từ khóa 2: Dấu bằng (=) bắt đầu mọi công thức.',
      bullet3: 'Từ khóa 3: Tự động hóa tính toán giúp tiết kiệm thời gian.',
      formula: 'WORD_CLOUD',
      cells: [
        { label: 'F4', color: 'c-green' },
        { label: '$A$1', color: 'c-blue' },
        { label: 'SUM', color: 'c-yellow' }
      ]
    },
    6: {
      phase: 'Pha 4: Vinh danh xuất sắc 🏆',
      title: 'Bục vinh danh Top 3 Đấu trường lớp học',
      subtitle: 'Chúc mừng các em học sinh có điểm số và tốc độ cao nhất',
      noteTitle: 'Bảng xếp hạng tổng kết',
      noteDesc: 'Điểm số được tính dựa trên độ chính xác kết hợp tốc độ trả lời và chuỗi câu trả lời đúng liên tiếp.',
      bullet1: '🥇 Hạng 1: Nguyễn Văn An - 9,850 điểm.',
      bullet2: '🥈 Hạng 2: Trần Hoàng Minh - 9,200 điểm.',
      bullet3: '🥉 Hạng 3: Lê Thị Mai - 8,950 điểm.',
      formula: 'TOP_PODIUM',
      cells: [
        { label: 'TOP 1', color: 'c-yellow' },
        { label: 'TOP 2', color: 'c-blue' },
        { label: 'TOP 3', color: 'c-green' }
      ]
    }
  };

  const currentStep = stepsLibrary[activeStepNum] || stepsLibrary[1];

  // Timer countdown in Arena mode
  useEffect(() => {
    let interval = null;
    if (viewMode === 'tv_arena' && isTimerRunning && arenaTimer > 0) {
      interval = setInterval(() => {
        setArenaTimer((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setShowAnswerResult(true);
            sound.play('wrong');
            return 0;
          }
          sound.play('countdown');
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewMode, isTimerRunning, arenaTimer]);

  const handlePrev = () => {
    if (activeStepNum > 1) {
      setActiveStepNum((prev) => prev - 1);
      sound.play('click');
    }
  };

  const handleNext = () => {
    if (activeStepNum < 6) {
      setActiveStepNum((prev) => prev + 1);
      sound.play('click');
      if (activeStepNum + 1 === 6) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.4 } });
      }
    }
  };

  const handleSaveResult = () => {
    sound.play('correct');
    setElearningScore((prev) => prev + 10);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
    alert('🎉 Đã hoàn thành và tự động cộng 10 điểm vào sổ học tập E-Learning!');
  };

  const handleStartArenaTimer = () => {
    setArenaTimer(15);
    setShowAnswerResult(false);
    setIsTimerRunning(true);
    sound.play('click');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="elearning-presentation-shell">
      {/* View Mode Toggle: E-learning 4 Pha vs Màn hình TV Đấu trường */}
      <div className="view-mode-bar">
        <button
          type="button"
          className={`mode-toggle-pill ${viewMode === 'elearning' ? 'active' : ''}`}
          onClick={() => setViewMode('elearning')}
        >
          📖 Slide Bài Giảng E-Learning (Chuẩn Ảnh 3)
        </button>

        <button
          type="button"
          className={`mode-toggle-pill ${viewMode === 'tv_arena' ? 'active' : ''}`}
          onClick={() => setViewMode('tv_arena')}
        >
          📺 Chiếu TV Đấu Trường Kahoot 16:9
        </button>

        <button
          type="button"
          className="mode-toggle-pill fullscreen-btn"
          onClick={handleToggleFullscreen}
          title="Toàn màn hình chiếu TV"
        >
          ⛶ Toàn Màn Hình TV
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: HỌC BÀI GIẢNG E-LEARNING (CHÍNH XÁC HÌNH ẢNH 3)
          ========================================================================= */}
      {viewMode === 'elearning' && (
        <div className="elearning-screen-card">
          {/* Header Banner */}
          <div className="elearning-header-row">
            <div>
              <span className="elearning-badge-tag">▶ THUYẾT TRÌNH BÀI GIẢNG E-LEARNING</span>
              <h1 className="elearning-main-heading">
                HỌC BÀI GIẢNG E-LEARNING (SLIDE 4 PHA & CÂU HỎI TƯƠNG TÁC)
              </h1>
              <p className="elearning-sub-desc">
                Trình chiếu bài giảng E-Learning sinh động từng bước, ghi chép kiến thức và tự động cộng điểm.
              </p>
            </div>

            <div className="elearning-score-chip">
              ⭐ Điểm E-Learning: <strong>{elearningScore} đ</strong>
            </div>
          </div>

          {/* Grade & Lesson Pills */}
          <div className="elearning-filters-row">
            <div className="grade-pills-group">
              {['Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`grade-pill ${selectedGrade === grade ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGrade(grade);
                    sound.play('click');
                  }}
                >
                  {grade}
                </button>
              ))}
            </div>

            <div className="period-pills-group">
              {['Tiết 1', 'Tiết 7'].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`period-pill ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPeriod(period);
                    sound.play('click');
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Steps Bar: Bước 1 .. Bước 6 */}
          <div className="steps-bar-row">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                className={`step-circle-pill ${activeStepNum === num ? 'active' : ''}`}
                onClick={() => {
                  setActiveStepNum(num);
                  sound.play('click');
                  if (num === 6) {
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
                  }
                }}
              >
                {activeStepNum === num && <span className="star-lead">⭐</span>}
                Bước {num}
              </button>
            ))}
          </div>

          {/* Interactive Slide & Note Viewport matching Image 3 */}
          <div className="slide-content-viewport-box">
            {/* Top Phase Header Line */}
            <div className="viewport-header-line">
              <div className="phase-pill-indicator">
                <span className="phase-txt">{currentStep.phase}</span>
                <span className="step-txt">Bước {activeStepNum}/6</span>
              </div>

              <div className="lesson-breadcrumb">
                {selectedGrade} • {selectedPeriod} — {currentStep.title}
              </div>
            </div>

            {/* Split Content Body */}
            <div className="viewport-split-grid">
              {/* Left Column: Slide Graphic */}
              <div className="slide-graphic-box">
                <div className="slide-card-inner">
                  <h3 className="slide-title-text">{currentStep.title}</h3>
                  <p className="slide-subtitle-text">{currentStep.subtitle}</p>

                  <div className="spreadsheet-mockup">
                    <div className="table-browser-header">
                      <span className="dot red"></span>
                      <span className="dot yellow"></span>
                      <span className="dot green"></span>
                    </div>
                    <div className="table-cells-visual">
                      <div className="formula-box">{currentStep.formula}</div>
                      <div className="grid-cells-demo">
                        {currentStep.cells.map((c, i) => (
                          <div key={i} className={`cell ${c.color}`}>
                            {c.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mascot Owl */}
                  <div className="mascot-speech-bubble">
                    <span className="owl-icon">🦉</span>
                    <span className="bubble-txt">{currentStep.phase} • Bước {activeStepNum}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Note & Key Knowledge Box */}
              <div className="slide-note-box">
                <h3 className="note-box-title">{currentStep.noteTitle}</h3>
                <p className="note-desc-paragraph">{currentStep.noteDesc}</p>

                <div className="knowledge-bullets-list">
                  <div className="bullet-entry">
                    <span className="b-icon">✏️</span>
                    <div>{currentStep.bullet1}</div>
                  </div>

                  <div className="bullet-entry">
                    <span className="b-icon">🔑</span>
                    <div>{currentStep.bullet2}</div>
                  </div>

                  <div className="bullet-entry">
                    <span className="b-icon">✔️</span>
                    <div>{currentStep.bullet3}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="viewport-footer-actions">
              <button
                type="button"
                className="btn-nav-step prev"
                onClick={handlePrev}
                disabled={activeStepNum === 1}
              >
                ← Bước trước
              </button>

              <button
                type="button"
                className="btn-save-complete"
                onClick={handleSaveResult}
              >
                ✔ Hoàn thành & Lưu kết quả
              </button>

              <button
                type="button"
                className="btn-nav-step next"
                onClick={handleNext}
                disabled={activeStepNum === 6}
              >
                Bước tiếp theo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CHIẾU TV ĐẤU TRƯỜNG KAHOOT 16:9 TRÊN LỚP
          ========================================================================= */}
      {viewMode === 'tv_arena' && (
        <div className="tv-arena-widescreen-frame">
          <div className="arena-tv-top-bar">
            <span className="arena-live-tag">🔴 TV TRÌNH CHIẾU ĐẤU TRƯỜNG • MÃ PHÒNG: {roomPin}</span>
            <h2>Câu 1: Địa chỉ ô nào sau đây là địa chỉ tuyệt đối trong Excel?</h2>
            <div className="arena-timer-circle" onClick={handleStartArenaTimer} title="Bấm để kích hoạt đếm ngược">
              {arenaTimer}s
            </div>
          </div>

          {/* Teacher control bar for Arena */}
          <div className="arena-teacher-control-subbar">
            <button
              type="button"
              className="btn-arena-start-time"
              onClick={handleStartArenaTimer}
            >
              ⏱️ {isTimerRunning ? 'Đang đếm ngược...' : 'Bắt đầu đếm ngược 15s'}
            </button>

            <button
              type="button"
              className="btn-arena-reveal-ans"
              onClick={() => {
                setShowAnswerResult(true);
                sound.play('correct');
                confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 } });
              }}
            >
              ✓ Chốt & Xem đáp án đúng
            </button>

            <span className="answers-counter-tag">
              Đã nhận: <strong>26 / 35</strong> học sinh
            </span>
          </div>

          {/* 4 Colored Kahoot Answer Cards */}
          <div className="arena-kahoot-four-grid">
            <div className={`kahoot-pad-box pad-red ${showAnswerResult ? 'opacity-40' : ''}`}>
              <span className="shape">▲</span>
              <span className="pad-text">A: A1</span>
              <span className="live-stat-pct">{answerDistribution.A} phiếu (11%)</span>
            </div>

            <div className={`kahoot-pad-box pad-blue ${showAnswerResult ? 'is-correct-glow' : ''}`}>
              <span className="shape">■</span>
              <span className="pad-text">B: $A$1</span>
              <span className="live-stat-pct">{answerDistribution.B} phiếu (69%)</span>
              {showAnswerResult && <span className="correct-crown">👑 ĐÁP ÁN ĐÚNG ✓</span>}
            </div>

            <div className={`kahoot-pad-box pad-yellow ${showAnswerResult ? 'opacity-40' : ''}`}>
              <span className="shape">●</span>
              <span className="pad-text">C: $A1</span>
              <span className="live-stat-pct">{answerDistribution.C} phiếu (15%)</span>
            </div>

            <div className={`kahoot-pad-box pad-green ${showAnswerResult ? 'opacity-40' : ''}`}>
              <span className="shape">◆</span>
              <span className="pad-text">D: A$1</span>
              <span className="live-stat-pct">{answerDistribution.D} phiếu (5%)</span>
            </div>
          </div>

          {/* Live response distribution bar chart */}
          <div className="live-distribution-bar-panel">
            <div className="dist-col">
              <div className="bar-track"><div className="bar-fill red" style={{ height: '35px' }}></div></div>
              <span>A (3)</span>
            </div>
            <div className="dist-col">
              <div className="bar-track"><div className="bar-fill blue" style={{ height: '140px' }}></div></div>
              <span>B (18) ✓</span>
            </div>
            <div className="dist-col">
              <div className="bar-track"><div className="bar-fill yellow" style={{ height: '45px' }}></div></div>
              <span>C (4)</span>
            </div>
            <div className="dist-col">
              <div className="bar-track"><div className="bar-fill green" style={{ height: '15px' }}></div></div>
              <span>D (1)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
