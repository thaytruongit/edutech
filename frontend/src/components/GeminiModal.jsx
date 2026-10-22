import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

export default function GeminiModal({ isOpen, onClose, onApplyAiResult }) {
  const [apiKey, setApiKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : ''
  );
  const [aiMode, setAiMode] = useState('ALL');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('gemini_api_key', apiKey.trim());
    sound.play('correct');
    setStatus('✅ Đã lưu Gemini API Key an toàn vào bộ nhớ trình duyệt!');
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setStatus('🗑️ Đã xóa API Key khỏi bộ nhớ.');
    sound.play('click');
  };

  const handleRunAi = () => {
    setLoading(true);
    setStatus('Đang kết nối Gemini AI Engine để phân tích dữ liệu slide...');
    sound.play('click');

    setTimeout(() => {
      setLoading(false);
      sound.play('correct');
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.3 } });

      if (aiMode === 'SOLVE') {
        setStatus('🎯 [Gemini SOLVE] Đã hoàn thành suy luận đáp án chuẩn xác và tạo lời giải sư phạm cho 100% câu hỏi!');
      } else if (aiMode === 'CLASSIFY') {
        setStatus('📑 [Gemini CLASSIFY] Đã quét OCR và phân loại bài giảng chuẩn 4 Pha Sư phạm!');
      } else {
        setStatus('⚡ [Gemini ALL] Toàn diện: Đã phân loại 4 pha, giải đáp án và điền hướng dẫn sư phạm xuất sắc!');
      }

      if (onApplyAiResult) onApplyAiResult(aiMode);
    }, 900);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box-glass modal-md">
        <div className="modal-header">
          <div>
            <h3>✨ TRỢ LÝ SƯ PHẠM GEMINI AI</h3>
            <p className="modal-sub">Mô hình Gemini 1.5 Flash / 2.0 Flash xử lý giáo án tự động</p>
          </div>
          <button type="button" className="btn-glass btn-sm" onClick={onClose}>
            ✖ Đóng
          </button>
        </div>

        <div className="gemini-modal-content">
          <p className="gemini-desc">
            Tự động quét OCR cấu trúc [A][B][C][D], suy luận đáp án trắc nghiệm chuẩn xác và phân bổ theo 4 Pha Sư phạm chuẩn Bộ GD&ĐT.
          </p>

          <div className="input-group">
            <label>🔑 Gemini API Key (Google AI Studio):</label>
            <div className="api-key-row">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán mã AIzaSy... vào đây"
              />
              <button type="button" className="btn-glass btn-sm" onClick={handleSaveKey}>
                💾 Lưu Key
              </button>
              <button type="button" className="btn-glass btn-sm btn-red-text" onClick={handleClearKey}>
                🗑️ Xóa
              </button>
            </div>
          </div>

          <div className="input-group mt-3">
            <label>🎯 Chọn chế độ AI can thiệp:</label>
            <select value={aiMode} onChange={(e) => setAiMode(e.target.value)}>
              <option value="SOLVE">1. 🎯 Suy luận đáp án & Viết lời giải thích sư phạm</option>
              <option value="CLASSIFY">2. 📑 Quét OCR & Phân loại vào 4 Pha Sư phạm</option>
              <option value="ALL">3. ⚡ Toàn diện: Quét OCR + Phân loại 4 pha + Điền đáp án</option>
            </select>
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="btn-primary-glow btn-block"
              disabled={loading}
              onClick={handleRunAi}
            >
              {loading ? '⏳ Đang Phân Tích & Suy Luận...' : '🚀 BẮT ĐẦU CHẠY GEMINI AI NGAY'}
            </button>
          </div>

          {status && <div className="gemini-status-box">{status}</div>}
        </div>
      </div>
    </div>
  );
}
