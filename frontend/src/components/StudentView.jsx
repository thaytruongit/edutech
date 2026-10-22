import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { sync } from '../utils/sync';

export default function StudentView({
  steps,
  currentStepIndex,
  onOpenZoom,
  savedCatalog,
  onWordCloudSubmit
}) {
  const [subMode, setSubMode] = useState('LIVE'); // 'LIVE' | 'ELEARNING'
  const [liveState, setLiveState] = useState('LOGIN'); // 'LOGIN' | 'WAIT' | 'PAD' | 'PENDING' | 'FEEDBACK' | 'PODIUM'
  
  // Student Info
  const [studentInfo, setStudentInfo] = useState({
    name: 'Nguyễn Quang Minh',
    className: '8A1',
    pin: '689204'
  });

  // Answering & Points State
  const [selectedPad, setSelectedPad] = useState(-1);
  const [multiSelected, setMultiSelected] = useState(new Set());
  const [streak, setStreak] = useState(1);
  const [totalScore, setTotalScore] = useState(1950);
  const [lastEarned, setLastEarned] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [notesHistory, setNotesHistory] = useState([
    'B5 = Cột B, Hàng 5',
    'Địa chỉ $A$1 là tuyệt đối, phím tắt F4'
  ]);

  // Anti-Cheat State
  const [cheatViolations, setCheatViolations] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);

  // E-Learning State
  const [elGradeFilter, setElGradeFilter] = useState('ALL');
  const [elActiveLesson, setElActiveLesson] = useState(null);
  const [elStepIdx, setElStepIdx] = useState(0);
  const [elCompletedSteps, setElCompletedSteps] = useState(new Set());
  const [elCorrectCount, setElCorrectCount] = useState(0);
  const [elFeedback, setElFeedback] = useState(null); // { correct: boolean, text: string }

  const currentStep = steps[currentStepIndex] || steps[1] || {};
  const isQuiz = currentStep.kind === 'quiz';
  const isMulti = currentStep.type === 'MULTI';
  const isWordCloud = currentStep.type === 'WORDCLOUD';
  const isNotebook = currentStep.kind === 'notebook';

  // Listen to BroadcastChannel events from TV
  useEffect(() => {
    const unsubscribe = sync.subscribe((data) => {
      if (!data) return;
      if (data.type === 'START_GAME') {
        if (subMode === 'LIVE') {
          setLiveState('PAD');
          setSelectedPad(-1);
          setMultiSelected(new Set());
        }
      } else if (data.type === 'REVEAL_ANSWER') {
        if (subMode === 'LIVE') {
          handleTvReveal(data.correctIdx);
        }
      } else if (data.type === 'SHOW_PODIUM') {
        if (subMode === 'LIVE') {
          setLiveState('PODIUM');
        }
      }
    });
    return () => unsubscribe();
  }, [subMode, selectedPad, currentStep]);

  // Anti-cheat tab switch monitoring
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && subMode === 'LIVE' && (liveState === 'PAD' || liveState === 'PENDING')) {
        recordCheatViolation();
      }
    };
    const handleBlur = () => {
      if (subMode === 'LIVE' && (liveState === 'PAD' || liveState === 'PENDING')) {
        recordCheatViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [subMode, liveState]);

  const recordCheatViolation = () => {
    sound.play('cheat_alert');
    setCheatViolations((prev) => prev + 1);
    setShowCheatAlert(true);
    setTimeout(() => setShowCheatAlert(false), 5000);
  };

  // Student joins room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim() || !studentInfo.pin.trim()) {
      alert('Vui lòng nhập đầy đủ họ tên và mã PIN phòng học!');
      return;
    }
    sound.play('click');
    setLiveState('WAIT');
    setTimeout(() => {
      setLiveState('PAD');
    }, 700);
  };

  // Student selects a single pad (Confidential lock)
  const handlePadClick = (padIdx) => {
    if (isMulti) {
      const next = new Set(multiSelected);
      if (next.has(padIdx)) next.delete(padIdx);
      else next.add(padIdx);
      setMultiSelected(next);
      sound.play('click');
      return;
    }

    sound.play('click');
    setSelectedPad(padIdx);

    // Transition immediately to Pending screen (scoreOnTimeUpOnly)
    setLiveState('PENDING');

    sync.send({
      type: 'STUDENT_SUBMIT_ANSWER',
      studentName: studentInfo.name,
      answer: padIdx
    });
  };

  // Student submits multi choice
  const handleSubmitMulti = () => {
    sound.play('click');
    setLiveState('PENDING');
    sync.send({
      type: 'STUDENT_SUBMIT_ANSWER',
      studentName: studentInfo.name,
      multiAnswers: Array.from(multiSelected)
    });
  };

  // Triggered when TV reveals answer
  const handleTvReveal = (correctIdx) => {
    const correct = selectedPad === correctIdx;
    setIsCorrect(correct);

    if (correct) {
      sound.play('correct');
      const earned = 950;
      setLastEarned(earned);
      setTotalScore((prev) => prev + earned);
      setStreak((prev) => prev + 1);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
    } else {
      sound.play('wrong');
      setLastEarned(0);
      setStreak(0);
    }
    setLiveState('FEEDBACK');
  };

  // Submit word to wordcloud
  const handleSendWordCloud = (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    sound.play('correct');
    if (onWordCloudSubmit) onWordCloudSubmit(wordInput.trim());
    sync.send({
      type: 'WORDCLOUD_UPDATE',
      word: wordInput.trim(),
      studentName: studentInfo.name
    });
    setWordInput('');
    alert('🚀 Đã gửi ý kiến của em bay lên màn hình Tivi lớp học!');
  };

  // Save student note
  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    sound.play('click');
    setNotesHistory((prev) => [noteInput.trim(), ...prev]);
    setNoteInput('');
  };

  // E-Learning Controls
  const handleStartElearning = (lesson) => {
    sound.play('click');
    setElActiveLesson(lesson);
    setElStepIdx(0);
    setElCompletedSteps(new Set([0]));
    setElCorrectCount(0);
    setElFeedback(null);
  };

  const handleElPadTap = (idx) => {
    const step = steps[elStepIdx];
    if (!step || step.kind !== 'quiz') return;
    const correct = idx === (step.correct !== undefined ? step.correct : 1);

    if (correct) {
      sound.play('correct');
      setElCorrectCount((prev) => prev + 1);
      setElFeedback({
        correct: true,
        text: '🎉 Chính xác! Bạn đã ghi nhớ đúng kiến thức cốt lõi.'
      });
    } else {
      sound.play('wrong');
      setElFeedback({
        correct: false,
        text: '💔 Chưa chính xác! Hãy đọc lại hướng dẫn sư phạm ở phần slide.'
      });
    }
  };

  const handleElNextStep = () => {
    if (elStepIdx < steps.length - 1) {
      const nextIdx = elStepIdx + 1;
      setElStepIdx(nextIdx);
      setElCompletedSteps((prev) => new Set([...prev, nextIdx]));
      setElFeedback(null);
      sound.play('click');
    } else {
      sound.play('streak');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      alert(`🎉 Chúc mừng ${studentInfo.name}! Bạn đã hoàn thành 16/16 bước tự học!`);
    }
  };

  return (
    <div className="student-desktop-shell">
      {/* Anti-cheat banner */}
      {showCheatAlert && (
        <div className="student-cheat-banner">
          ⚠️ <strong>CẢNH BÁO GIAN LẬN:</strong> Bạn vừa rời khỏi màn hình kiểm tra lần thứ {cheatViolations}!
          Hệ thống đã trừ <strong>-{(cheatViolations * 0.25).toFixed(2)}đ</strong> vào bảng điểm của Thầy/Cô.
        </div>
      )}

      {/* Top Mode Bar */}
      <div className="student-top-controls">
        <div className="student-mode-pills">
          <button
            type="button"
            className={`btn-mode-tab ${subMode === 'LIVE' ? 'active' : ''}`}
            onClick={() => {
              setSubMode('LIVE');
              sound.play('click');
            }}
          >
            🎮 Đấu Trường Trực Tiếp (Mã PIN: {studentInfo.pin})
          </button>
          <button
            type="button"
            className={`btn-mode-tab ${subMode === 'ELEARNING' ? 'active' : ''}`}
            onClick={() => {
              setSubMode('ELEARNING');
              sound.play('click');
            }}
          >
            📚 Cổng Tự Học E-Learning Theo Tiết
          </button>
        </div>

        <div className="student-user-pill">
          <span>👤 {studentInfo.name}</span>
          <span className="user-class-tag">{studentInfo.className}</span>
          <span className="user-score-tag">🔒 Điểm: {totalScore} đ</span>
        </div>
      </div>

      {/* ========================================================
          SUB-MODE 1: LIVE ARENA ON COMPUTER LAB
          ======================================================== */}
      {subMode === 'LIVE' && (
        <>
          {/* LOGIN SCREEN */}
          {liveState === 'LOGIN' && (
            <div className="student-center-card">
              <div className="login-box-glass">
                <span className="login-icon">🎮</span>
                <h2 className="login-title">Vào Phòng Thi Đấu Trực Tiếp</h2>
                <p className="login-desc">
                  Nhìn mã PIN 6 số trên màn hình Tivi của Thầy/Cô và nhập thông tin để kết nối:
                </p>

                <form onSubmit={handleJoinRoom} className="login-form">
                  <div className="input-field">
                    <label>Mã PIN Phòng Học (6 số):</label>
                    <input
                      type="number"
                      value={studentInfo.pin}
                      onChange={(e) => setStudentInfo({ ...studentInfo, pin: e.target.value })}
                      placeholder="VD: 689204"
                      required
                    />
                  </div>

                  <div className="input-field">
                    <label>Họ và tên của em:</label>
                    <input
                      type="text"
                      value={studentInfo.name}
                      onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                      placeholder="Nhập họ và tên..."
                      required
                    />
                  </div>

                  <div className="input-field">
                    <label>Lớp học:</label>
                    <input
                      type="text"
                      value={studentInfo.className}
                      onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                      placeholder="VD: 8A1"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary-glow btn-block">
                    🚀 THAM GIA ĐẤU TRƯỜNG NGAY
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* WAIT SCREEN */}
          {liveState === 'WAIT' && (
            <div className="student-center-card">
              <div className="wait-box-glass">
                <span className="wait-spin-icon">⏳</span>
                <h2>Đã Kết Nối Phòng Học!</h2>
                <p>Hãy chú ý lên màn hình Tivi lớn của Thầy/Cô để chờ hiệu lệnh bắt đầu.</p>
              </div>
            </div>
          )}

          {/* PAD & SPLIT INTERACTION SCREEN */}
          {liveState === 'PAD' && (
            <div className="student-split-layout">
              {/* Left Column: Slide View & Question Text */}
              <div className="student-left-col">
                <div className="student-card-glass">
                  <div className="student-q-header">
                    <span className="student-phase-pill">{currentStep.phaseName}</span>
                    <span className="student-step-tag">Bước {currentStep.id} / {steps.length}</span>
                  </div>

                  <h2 className="student-q-title">
                    {currentStep.question || currentStep.title}
                  </h2>

                  {/* Slide Graphic (Click to zoom) */}
                  <div className="student-slide-container" onClick={() => onOpenZoom && onOpenZoom(currentStep)}>
                    <svg viewBox="0 0 400 225" className="student-slide-svg">
                      <rect width="400" height="225" fill="#0f172a" rx="8" />
                      <rect x="15" y="15" width="370" height="195" fill="none" stroke="#2563eb" strokeDasharray="4" rx="6" />
                      <text x="30" y="45" fill="#facc15" fontSize="13" fontWeight="bold">
                        {currentStep.phaseName?.toUpperCase()}
                      </text>
                      <text x="30" y="80" fill="#ffffff" fontSize="13" fontWeight="600">
                        {currentStep.title}
                      </text>
                      <rect x="30" y="105" width="340" height="80" fill="#1e293b" rx="6" />
                      <text x="45" y="135" fill="#cbd5e1" fontSize="11">
                        {isQuiz ? '❓ ' + (currentStep.question || '') : currentStep.content || ''}
                      </text>
                      <circle cx="360" cy="180" r="14" fill="#2563eb" />
                      <text x="360" y="184" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                        B{currentStep.id}
                      </text>
                    </svg>
                    <span className="student-zoom-hint">🔍 Nhấp vào để phóng to hình ảnh Slide</span>
                  </div>

                  {/* Personal Notebook Note-taker if type === GHIVO */}
                  {isNotebook && (
                    <div className="student-notebook-box">
                      <label>📓 Ghi chép nhanh vào sổ tay cá nhân của em:</label>
                      <form onSubmit={handleSaveNote} className="note-input-row">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Ghi lại công thức hoặc mẹo làm bài..."
                        />
                        <button type="submit" className="btn-glass btn-sm">Lưu vào vở</button>
                      </form>
                      <div className="notes-list">
                        {notesHistory.slice(0, 3).map((n, i) => (
                          <div key={i} className="note-item">📝 {n}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interaction Pads or Word Cloud */}
              <div className="student-right-col">
                <div className="student-card-glass">
                  {/* MULTI HINT */}
                  {isMulti && (
                    <div className="student-multi-banner">
                      ☑️ CÂU HỎI CHỌN NHIỀU ĐÁP ÁN: Chọn các phương án đúng rồi bấm Nộp Bài!
                    </div>
                  )}

                  {/* WORD CLOUD INPUT */}
                  {isWordCloud ? (
                    <div className="student-wc-form-wrap">
                      <h3>💬 Gửi Ý Kiến / Từ Khóa Lên Màn Hình Tivi</h3>
                      <p>Ý kiến của em sẽ hiển thị trực tiếp lên màn hình máy chiếu phòng học:</p>
                      <form onSubmit={handleSendWordCloud} className="wc-form">
                        <input
                          type="text"
                          value={wordInput}
                          onChange={(e) => setWordInput(e.target.value)}
                          placeholder="VD: =SUM(), Phím tắt F4, Tự động hóa..."
                          required
                        />
                        <button type="submit" className="btn-primary-glow btn-block">
                          🚀 GỬI TỪ KHÓA LÊN TIVI
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* 4 KAHOOT PADS */
                    <div className="student-pads-grid">
                      {(currentStep.options || ['Microsoft Word', 'Microsoft Excel', 'PowerPoint', 'Paint']).map(
                        (optText, idx) => {
                          const colors = ['pad-red', 'pad-blue', 'pad-yellow', 'pad-green'];
                          const symbols = ['▲ A', '◆ B', '● C', '■ D'];
                          const isSel = isMulti ? multiSelected.has(idx) : selectedPad === idx;

                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`student-pad-btn ${colors[idx]} ${isSel ? 'selected' : ''}`}
                              onClick={() => handlePadClick(idx)}
                            >
                              <div className="pad-badge">{symbols[idx]}</div>
                              <div className="pad-label">{optText}</div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}

                  {isMulti && (
                    <button
                      type="button"
                      className="btn-primary-glow btn-block mt-3"
                      onClick={handleSubmitMulti}
                    >
                      🚀 NỘP CÁC ĐÁP ÁN ĐÃ CHỌN ({multiSelected.size})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONFIDENTIAL PENDING SCREEN (scoreOnTimeUpOnly) */}
          {liveState === 'PENDING' && (
            <div className="student-center-card">
              <div className="pending-box-glass">
                <span className="pending-lock-icon">🔒</span>
                <h2 className="pending-title">ĐÃ GHI NHẬN CÂU TRẢ LỜI!</h2>
                <div className="pending-desc">
                  <p>
                    Điểm số và kết quả câu trả lời đang được <strong>bảo mật tuyệt đối</strong>.
                  </p>
                  <p className="sub-hint">
                    Học sinh ngồi cạnh không thể nhìn trộm điểm của em để đoán đáp án đúng!
                  </p>
                </div>
                <div className="pending-pulse-dot">
                  ⏳ Hãy chú ý lên màn hình Tivi của Thầy/Cô để chờ chốt kết quả...
                </div>
              </div>
            </div>
          )}

          {/* FEEDBACK SCREEN (REVEALED ON TIMER UP) */}
          {liveState === 'FEEDBACK' && (
            <div className="student-center-card">
              <div className={`feedback-box-glass ${isCorrect ? 'fb-correct' : 'fb-wrong'}`}>
                <span className="fb-big-icon">{isCorrect ? '🎉' : '💔'}</span>
                <h1 className="fb-status-title">
                  {isCorrect ? 'CHÍNH XÁC!' : 'CHƯA CHÍNH XÁC!'}
                </h1>
                <div className="fb-points-badge">
                  {isCorrect ? `+${lastEarned} Điểm` : '+0 Điểm'} • Chuỗi đúng: 🔥 x{streak}
                </div>
                <p className="fb-explanation">
                  {isCorrect
                    ? 'Bạn đã chọn đúng phương án Microsoft Excel là phần mềm bảng tính tiêu chuẩn.'
                    : 'Hãy lưu ý: Biểu tượng chữ X màu xanh lá là đặc trưng của bảng tính Excel.'}
                </p>
                <div className="fb-footer-note">
                  Đang chờ Thầy/Cô chuyển sang câu hỏi tiếp theo trên Tivi...
                </div>
              </div>
            </div>
          )}

          {/* PODIUM FINAL SCREEN */}
          {liveState === 'PODIUM' && (
            <div className="student-center-card">
              <div className="podium-result-glass">
                <span className="crown-badge">🏆</span>
                <h2>TIẾT HỌC KẾT THÚC!</h2>
                <div className="score-summary-pill">
                  Tổng điểm của em: <strong>{totalScore} đ</strong> • Xếp hạng: <strong>Top 1 🥇</strong>
                </div>
                <p>Chúc mừng em đã hoàn thành xuất sắc đợt thi đấu trên lớp hôm nay!</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================
          SUB-MODE 2: E-LEARNING SELF-STUDY PORTAL
          ======================================================== */}
      {subMode === 'ELEARNING' && (
        <div className="student-elearning-container">
          {!elActiveLesson ? (
            /* Catalog Picker */
            <div className="elearning-catalog-section">
              <div className="catalog-filter-bar">
                <div className="filter-pills">
                  {['ALL', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`filter-pill ${elGradeFilter === g ? 'active' : ''}`}
                      onClick={() => setElGradeFilter(g)}
                    >
                      {g === 'ALL' ? '📚 Tất cả các khối' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="elearning-lessons-grid">
                {(savedCatalog || []).map((cat) => (
                  <div key={cat.id} className="elearning-card-glass">
                    <div className="el-card-header">
                      <span className="el-grade-tag">{cat.grade} • {cat.period}</span>
                      <span className="el-steps-tag">{cat.stepsCount} Bước</span>
                    </div>
                    <h3 className="el-card-title">{cat.title}</h3>
                    <p className="el-card-summary">{cat.phasesSummary}</p>
                    <button
                      type="button"
                      className="btn-primary-glow btn-block"
                      onClick={() => handleStartElearning(cat)}
                    >
                      🚀 BẮT ĐẦU TỰ HỌC
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* E-Learning Player */
            <div className="elearning-player-section">
              <div className="el-player-topbar">
                <div>
                  <span className="badge-k8">{elActiveLesson.grade} • {elActiveLesson.period}</span>
                  <strong className="el-player-title">{elActiveLesson.title}</strong>
                </div>
                <button
                  type="button"
                  className="btn-glass btn-sm"
                  onClick={() => setElActiveLesson(null)}
                >
                  🔙 Chọn Tiết Khác
                </button>
              </div>

              {/* 16 Step Dots */}
              <div className="el-step-dots-bar">
                {steps.map((st, i) => (
                  <div
                    key={st.id}
                    className={`el-dot ${i === elStepIdx ? 'active' : ''} ${
                      elCompletedSteps.has(i) ? 'completed' : ''
                    }`}
                    onClick={() => {
                      setElStepIdx(i);
                      setElCompletedSteps((prev) => new Set([...prev, i]));
                      setElFeedback(null);
                    }}
                    title={`Bước ${i + 1}: ${st.title}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="el-content-card">
                <div className="el-step-meta">
                  <span className="el-phase-label">{steps[elStepIdx]?.phaseName}</span>
                  <span>Bước {elStepIdx + 1} / {steps.length}</span>
                </div>

                <h2 className="el-step-title">{steps[elStepIdx]?.title}</h2>
                <p className="el-step-body">{steps[elStepIdx]?.content || steps[elStepIdx]?.question}</p>

                {/* Instant Feedback Banner */}
                {elFeedback && (
                  <div className={`el-feedback-banner ${elFeedback.correct ? 'banner-correct' : 'banner-wrong'}`}>
                    <span>{elFeedback.text}</span>
                    <button type="button" className="btn-glass btn-sm" onClick={handleElNextStep}>
                      Bước Tiếp Theo ➡️
                    </button>
                  </div>
                )}

                {/* Pads for Quiz */}
                {steps[elStepIdx]?.kind === 'quiz' && (
                  <div className="el-pads-row">
                    {(steps[elStepIdx]?.options || ['A', 'B', 'C', 'D']).map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className="el-pad-choice-btn"
                        onClick={() => handleElPadTap(i)}
                      >
                        <span className="choice-key">{['A', 'B', 'C', 'D'][i]}</span>
                        <span className="choice-val">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="el-bottom-nav-row">
                  <button
                    type="button"
                    className="btn-glass btn-sm"
                    disabled={elStepIdx === 0}
                    onClick={() => {
                      if (elStepIdx > 0) setElStepIdx(elStepIdx - 1);
                    }}
                  >
                    ⬅️ Bước Trước
                  </button>
                  <button
                    type="button"
                    className="btn-primary-glow btn-sm"
                    onClick={handleElNextStep}
                  >
                    {elStepIdx >= steps.length - 1 ? '🏁 Hoàn Thành' : 'Bước Tiếp Theo ➡️'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
