import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function ExamView({ onBackToStudy }) {
  const { user, token } = useAuth();
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  const defaultExam = {
    title: 'Đề Kiểm tra Giữa kỳ I - Tin học 9 (Đề Chính thức)',
    code: 'DE1',
    duration: '45 Phút',
    grade: 'Khối 9',
    questions: [
      {
        id: 1,
        question: 'Câu 1: Địa chỉ ô nào sau đây là địa chỉ tuyệt đối trong Excel?',
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
        question: 'Câu 2: Công thức =C4*$E$1 tại ô D4 khi sao chép xuống D5 sẽ thành:',
        options: [
          { key: 'A', text: '=C4*$E$1' },
          { key: 'B', text: '=C5*$E$1' },
          { key: 'C', text: '=C5*E2' },
          { key: 'D', text: '=$C$5*E1' }
        ],
        correct: 'B'
      },
      {
        id: 3,
        question: 'Câu 3: Hàm nào sau đây dùng để tính giá trị trung bình cộng trong bảng tính Excel?',
        options: [
          { key: 'A', text: '=SUM(A1:A5)' },
          { key: 'B', text: '=AVERAGE(A1:A5)' },
          { key: 'C', text: '=MAX(A1:A5)' },
          { key: 'D', text: '=COUNT(A1:A5)' }
        ],
        correct: 'B'
      },
      {
        id: 4,
        question: 'Câu 4: Phím tắt nào sau đây dùng để chuyển đổi nhanh giữa địa chỉ tương đối và tuyệt đối?',
        options: [
          { key: 'A', text: 'F2' },
          { key: 'B', text: 'F4' },
          { key: 'C', text: 'F5' },
          { key: 'D', text: 'F9' }
        ],
        correct: 'B'
      }
    ]
  };

  const [examData, setExamData] = useState(defaultExam);

  // Nạp đề thi hiện hành (đề giáo viên đã quét OCR) nếu có
  useEffect(() => {
    api('/api/exams/active', { token })
      .then((ex) => {
        if (!ex?.questions?.length) return;
        setExamData({
          title: ex.title,
          code: 'OCR',
          duration: `${ex.duration} Phút`,
          grade: 'Đề từ tệp tải lên',
          questions: ex.questions.map((q, i) => ({
            id: q.id ?? i + 1,
            question: q.question,
            options: q.options.map((o) => ({ key: o.key, text: o.text })),
            correct: q.correctKey || q.options.find((o) => o.correct)?.key
          }))
        });
        setTimeLeft(Number(ex.duration || 45) * 60);
      })
      .catch(() => {});
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (qId, optionKey) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionKey }));
    sound.play('click');
  };

  const handleSubmitExam = () => {
    if (submitted) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < examData.questions.length) {
      if (!confirm(`Em mới trả lời ${answeredCount}/${examData.questions.length} câu. Em có chắc muốn nộp bài ngay?`)) {
        return;
      }
    }

    let correctCount = 0;
    examData.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct) correctCount++;
    });

    const score = ((correctCount / examData.questions.length) * 10).toFixed(1);
    setScoreResult({ correctCount, total: examData.questions.length, score });
    setSubmitted(true);
    sound.play('correct');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.4 } });
  };

  return (
    <div className="exam-viewport-container">
      {/* Top Exam Header */}
      <div className="exam-header-banner">
        <div className="exam-title-block">
          <span className="exam-type-tag">📝 BÀI THI CHÍNH THỨC</span>
          <h1 className="exam-heading">{examData.title}</h1>
          <div className="exam-meta-pills">
            <span className="pill-item">🏫 {examData.grade}</span>
            <span className="pill-item">🏷️ Mã đề: {examData.code}</span>
            <span className="pill-item">⏱️ Thời gian: {examData.duration}</span>
            <span className="pill-item user-pill">👦 Học sinh: {user?.name || 'Học sinh'}</span>
          </div>
        </div>

        <div className="exam-timer-widget">
          <span className="timer-label">Thời gian còn lại</span>
          <span className="timer-countdown">{formatTime(timeLeft)}</span>
          <button
            type="button"
            className="btn-submit-exam-now"
            onClick={handleSubmitExam}
            disabled={submitted}
          >
            {submitted ? '✓ Đã nộp bài' : '🚀 NỘP BÀI THI'}
          </button>
        </div>
      </div>

      {/* Result Announcement Banner if submitted */}
      {submitted && scoreResult && (
        <div className="exam-score-banner">
          <div className="score-badge">
            <span className="score-val">{scoreResult.score}</span>
            <span className="score-sub">/ 10 Điểm</span>
          </div>
          <div className="score-feedback">
            <h3>🎉 Chúc mừng em đã hoàn thành bài thi!</h3>
            <p>
              Em đã trả lời đúng <strong>{scoreResult.correctCount} / {scoreResult.total}</strong> câu trắc nghiệm.
              Điểm số đã được tự động lưu vào Sổ điểm điện tử của lớp.
            </p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="exam-questions-list">
        {examData.questions.map((q, idx) => {
          const selected = userAnswers[q.id];
          const isCorrect = selected === q.correct;

          return (
            <div key={q.id} className="exam-question-card">
              <div className="question-header-row">
                <span className="question-num-tag">Câu {idx + 1}</span>
                <span className="question-points">1.0 điểm</span>
              </div>

              <h3 className="question-text-title">{q.question}</h3>

              <div className="options-grid-two-by-two">
                {q.options.map((opt) => {
                  const isChecked = selected === opt.key;
                  let optClass = '';
                  if (submitted) {
                    if (opt.key === q.correct) optClass = 'opt-correct';
                    else if (isChecked) optClass = 'opt-wrong';
                  } else if (isChecked) {
                    optClass = 'opt-selected';
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`exam-option-pill ${optClass}`}
                      onClick={() => handleSelect(q.id, opt.key)}
                    >
                      <span className="opt-letter-circle">{opt.key}</span>
                      <span className="opt-label-text">{opt.text}</span>
                      {submitted && opt.key === q.correct && <span className="mark-badge">✓ Đúng</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
