import React, { useState } from 'react';
import { sound } from '../utils/audio';

export default function TeacherOcrModal({ isOpen, onClose, onAddGeneratedStep }) {
  const [scanProgress, setScanProgress] = useState(82);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedText, setScannedText] = useState(
    'BÀI 1: LỊCH SỬ LÀ GÌ?\n\nLịch sử là những gì đã xảy ra trong quá khứ, bao gồm toàn bộ những hoạt động của con người từ khi xuất hiện đến nay.'
  );
  const [aiQuestion, setAiQuestion] = useState({
    title: 'Theo đoạn văn trên, lịch sử được định nghĩa là gì?',
    options: [
      { key: 'A', text: 'Những gì đã xảy ra trong quá khứ, bao gồm toàn bộ hoạt động của con người', isCorrect: true },
      { key: 'B', text: 'Các sự kiện tương lai của loài người', isCorrect: false },
      { key: 'C', text: 'Chỉ là những câu chuyện cổ tích và thần thoại', isCorrect: false },
      { key: 'D', text: 'Các hiện tượng tự nhiên không có con người', isCorrect: false }
    ],
    explanation: 'Giải thích: Đoạn văn nêu rõ "Lịch sử là những gì đã xảy ra trong quá khứ, bao gồm toàn bộ hoạt động của con người".'
  });

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    sound.play('click');
    setScanProgress(30);
    setTimeout(() => setScanProgress(60), 400);
    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      sound.play('streak');
    }, 900);
  };

  const handleInsertToLesson = () => {
    sound.play('correct');
    onAddGeneratedStep({
      title: 'P3: Luyện tập - ' + aiQuestion.title,
      type: 'quiz_single',
      points: 1000,
      timeLimit: 30,
      phase: 'Pha 3: Luyện tập',
      question: aiQuestion.title,
      options: aiQuestion.options,
      correctKey: 'A',
      explanation: aiQuestion.explanation,
      image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80'
    });
    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="ocr-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="ocr-modal-header">
          <div className="header-icon-text">
            <span className="ocr-chip-icon">🔍</span>
            <div>
              <h3>Trình Quét Slide & Nhận Diện OCR Tích Hợp AI</h3>
              <small>Chuyển đổi tài liệu SGK, PDF, PPTX thành câu hỏi trắc nghiệm tương tác tự động</small>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-modal-body-grid">
          {/* Left Column: Upload & OCR Scanner Visual */}
          <div className="ocr-scan-preview-col">
            <div className="ocr-doc-header">
              <span className="pdf-icon">📄</span>
              <div className="pdf-meta">
                <strong>Lich_su_va_dia_ly_8.pdf</strong>
                <small>13 trang • 4.5 MB</small>
              </div>
              <button
                type="button"
                className="btn-re-upload"
                onClick={handleSimulateScan}
              >
                {isScanning ? 'Đang quét...' : '⚡ Quét lại OCR'}
              </button>
            </div>

            <div className="ocr-scan-viewport">
              <div className="ocr-scan-laser-line" style={{ top: `${scanProgress}%` }}></div>
              <div className="ocr-status-pill">
                <span>ĐANG QUÉT & NHẬN DIỆN... {scanProgress}%</span>
              </div>
              <div className="scanned-page-mock">
                <h4>BÀI 1: LỊCH SỬ LÀ GÌ?</h4>
                <p>
                  Lịch sử là những gì đã xảy ra trong quá khứ, bao gồm toàn bộ những hoạt động của con người.
                  Con người cần học tập lịch sử để hiểu rõ nguồn cội dân tộc và phát triển tương lai...
                </p>
                <div className="ocr-bounding-box">
                  [Vùng văn bản được nhận diện tự động]
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Auto-Generated Question Form */}
          <div className="ocr-ai-form-col">
            <div className="ai-assistant-badge-card">
              <span className="ai-sparkle">✨</span>
              <div>
                <strong>AI Trợ lý - Tự động tạo câu hỏi trắc nghiệm</strong>
                <small>Đã phân tích đoạn văn và trích xuất phương án chính xác</small>
              </div>
            </div>

            <div className="ai-question-editor-card">
              <label className="editor-sub-label">Câu hỏi trắc nghiệm tạo bởi AI:</label>
              <textarea
                className="ocr-question-input"
                value={aiQuestion.title}
                onChange={(e) => setAiQuestion({ ...aiQuestion, title: e.target.value })}
                rows={2}
              />

              <label className="editor-sub-label">Các phương án lựa chọn:</label>
              <div className="ocr-options-editor-list">
                {aiQuestion.options.map((opt, i) => (
                  <div key={opt.key} className={`ocr-option-input-row ${opt.isCorrect ? 'correct-highlight' : ''}`}>
                    <span className="opt-key-badge">{opt.key}</span>
                    <input
                      type="text"
                      className="opt-text-field"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...aiQuestion.options];
                        newOpts[i].text = e.target.value;
                        setAiQuestion({ ...aiQuestion, options: newOpts });
                      }}
                    />
                    <label className="correct-toggle-label">
                      <input
                        type="radio"
                        name="ocrCorrect"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const newOpts = aiQuestion.options.map((o, idx) => ({
                            ...o,
                            isCorrect: idx === i
                          }));
                          setAiQuestion({ ...aiQuestion, options: newOpts, correctKey: opt.key });
                          sound.play('click');
                        }}
                      />
                      {opt.isCorrect ? 'Đúng ✓' : 'Sai'}
                    </label>
                  </div>
                ))}
              </div>

              <div className="ai-explanation-box">
                <span className="ai-bulb">💡</span>
                <div>
                  <strong>Giải thích chi tiết:</strong>
                  <p>{aiQuestion.explanation}</p>
                </div>
              </div>
            </div>

            <div className="ocr-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-insert-lesson"
                onClick={handleInsertToLesson}
              >
                📥 Chèn câu hỏi này vào bài giảng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
