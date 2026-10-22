import React from 'react';

export default function ImageZoomModal({ isOpen, onClose, step }) {
  if (!isOpen || !step) return null;

  return (
    <div className="modal-backdrop zoom-backdrop" onClick={onClose}>
      <div className="zoom-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="zoom-header">
          <span className="zoom-title">
            {step.phaseName} • Bước {step.id}: {step.title}
          </span>
          <button type="button" className="btn-glass btn-sm" onClick={onClose}>
            ✖ Đóng (ESC)
          </button>
        </div>

        <div className="zoom-svg-wrap">
          <svg viewBox="0 0 800 450" className="zoom-full-svg">
            <rect width="800" height="450" fill="#0b0f19" rx="16" />
            <rect x="25" y="25" width="750" height="400" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6" rx="12" />
            <text x="50" y="80" fill="#facc15" fontSize="24" fontWeight="bold">
              {step.phaseName?.toUpperCase()}
            </text>
            <text x="50" y="130" fill="#ffffff" fontSize="26" fontWeight="bold">
              Bước {step.id}: {step.title}
            </text>
            <rect x="50" y="160" width="700" height="180" fill="#1e293b" rx="12" />
            <text x="80" y="210" fill="#cbd5e1" fontSize="18" fontWeight="500">
              {step.content || step.question || 'Nội dung bài học chuẩn hóa'}
            </text>
            <text x="80" y="250" fill="#38bdf8" fontSize="16">
              Môn Tin học THCS • Năng lực Số & Năng lực Trí tuệ Nhân tạo (AI)
            </text>
            {step.options && (
              <text x="80" y="300" fill="#a78bfa" fontSize="16">
                Các phương án lựa chọn: A. {step.options[0]} | B. {step.options[1]} | C. {step.options[2]} | D. {step.options[3]}
              </text>
            )}
            <circle cx="710" cy="380" r="28" fill="#2563eb" />
            <text x="710" y="388" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle">
              B{step.id}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
