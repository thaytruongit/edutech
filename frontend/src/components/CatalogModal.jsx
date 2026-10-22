import React, { useState } from 'react';
import { sound } from '../utils/audio';

export default function CatalogModal({ isOpen, onClose, catalog, onLoadLesson }) {
  const [gradeFilter, setGradeFilter] = useState('ALL');

  if (!isOpen) return null;

  const filtered = catalog.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-box-glass modal-lg">
        <div className="modal-header">
          <div>
            <h3>🗂️ KHO LƯU TRỮ BÀI GIẢNG & TIẾT HỌC SỐ PHÂN CẤP</h3>
            <p className="modal-sub">Mỗi bài học được lưu theo Khối - Học kỳ - Tiết PPCT, tự động đồng bộ E-Learning</p>
          </div>
          <button type="button" className="btn-glass btn-sm" onClick={onClose}>
            ✖ Đóng
          </button>
        </div>

        <div className="catalog-tabs-bar">
          {['ALL', 'Khối 6', 'Khối 7', 'Khối 8', 'Khối 9'].map((g) => (
            <button
              key={g}
              type="button"
              className={`catalog-tab-btn ${gradeFilter === g ? 'active' : ''}`}
              onClick={() => {
                sound.play('click');
                setGradeFilter(g);
              }}
            >
              {g === 'ALL' ? '📚 Tất cả các khối' : g}
            </button>
          ))}
        </div>

        <div className="table-responsive mt-3">
          <table className="gradebook-table">
            <thead>
              <tr>
                <th>Khối Lớp</th>
                <th>Học Kỳ</th>
                <th>Tiết PPCT</th>
                <th>Tên Bài Giảng / Chủ Đề</th>
                <th>Cấu Trúc 4 Pha</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge-k8">{item.grade}</span></td>
                  <td>{item.semester}</td>
                  <td><strong>{item.period}</strong></td>
                  <td>{item.title}</td>
                  <td><span className="badge-pill">{item.phasesSummary}</span></td>
                  <td>
                    <button
                      type="button"
                      className="btn-primary-glow btn-xs"
                      onClick={() => {
                        sound.play('correct');
                        onLoadLesson(item);
                        onClose();
                      }}
                    >
                      📂 Mở Bài Này
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
