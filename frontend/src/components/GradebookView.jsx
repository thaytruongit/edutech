import React, { useState } from 'react';
import { sound } from '../utils/audio';
import ArenaResultsTable from './ArenaResultsTable';

export default function GradebookView({ students, onUpdateStudentScore }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [essayScoreInput, setEssayScoreInput] = useState(1.5);
  const [feedbackInput, setFeedbackInput] = useState('');

  const handleOpenGrading = (st) => {
    sound.play('click');
    setSelectedStudent(st);
    setEssayScoreInput(st.scoreP3);
    setFeedbackInput(st.essay || '');
  };

  const handleSaveGrading = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const scoreVal = Math.min(2.0, Math.max(0, parseFloat(essayScoreInput) || 0));
    
    onUpdateStudentScore(selectedStudent.id, {
      scoreP3: scoreVal,
      essay: feedbackInput,
      total: selectedStudent.scoreP1 + selectedStudent.scoreP2 + scoreVal - (selectedStudent.tabSwitches * 0.25)
    });

    sound.play('correct');
    alert(`✅ Đã cập nhật điểm tự luận cho học sinh ${selectedStudent.name}!`);
    setSelectedStudent(null);
  };

  // Export to Excel with Unicode UTF-8 BOM \uFEFF
  const handleExportExcel = () => {
    sound.play('click');
    let csv = '\uFEFF';
    csv += 'STT,Mã Học Sinh,Họ và Tên,Lớp,Phần I (Trắc nghiệm),Phần II (Đúng Sai),Phần III (Tự luận),Gian lận Rời Tab,Điểm Trừ,Tổng Điểm,Nội Dung Tự Luận\n';

    students.forEach((st, idx) => {
      const deduction = (st.tabSwitches * 0.25).toFixed(2);
      csv += `${idx + 1},${st.id},"${st.name}",${st.class},${st.scoreP1},${st.scoreP2},${st.scoreP3},${st.tabSwitches},-${deduction},${st.total.toFixed(2)},"${st.essay || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bang_Diem_Kiem_Tra_Dinh_Ky_TinHoc8_Lop8A1.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    sound.play('streak');
    alert('📥 Đã xuất tệp Bảng điểm Excel chuẩn Unicode UTF-8 (\\uFEFF) thành công!');
  };

  return (
    <div className="gradebook-shell">
      <div className="gradebook-header-card">
        <div>
          <h2 className="gradebook-title">📊 SỔ ĐIỂM ĐIỆN TỬ & CHẤM THI ĐỊNH KỲ</h2>
          <p className="gradebook-sub">
            Lớp 8A1 • Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế • Giám sát gian lận phòng máy
          </p>
        </div>

        <div className="gradebook-actions">
          <button type="button" className="btn-primary-glow" onClick={handleExportExcel}>
            📥 Xuất Bảng Điểm Excel Unicode (\uFEFF)
          </button>
        </div>
      </div>

      <div className="gradebook-table-card">
        <div className="table-responsive">
          <table className="gradebook-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã HS</th>
                <th>Họ và Tên</th>
                <th>Lớp</th>
                <th>Phần I (4.0đ)</th>
                <th>Phần II (4.0đ)</th>
                <th>Phần III (2.0đ)</th>
                <th>Giám Sát Rời Tab</th>
                <th>Tổng Điểm</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, i) => (
                <tr key={st.id}>
                  <td><strong>{i + 1}</strong></td>
                  <td><code>{st.id}</code></td>
                  <td><strong>{st.name}</strong></td>
                  <td>{st.class}</td>
                  <td>{st.scoreP1.toFixed(1)}</td>
                  <td>{st.scoreP2.toFixed(1)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-glass btn-xs"
                      onClick={() => handleOpenGrading(st)}
                    >
                      ✏️ {st.scoreP3.toFixed(2)}đ (Chấm)
                    </button>
                  </td>
                  <td>
                    <span className={`cheat-badge ${st.tabSwitches > 0 ? 'badge-warning' : 'badge-clean'}`}>
                      {st.tabSwitches > 0
                        ? `⚠️ Rời ${st.tabSwitches} lần (-${(st.tabSwitches * 0.25).toFixed(2)}đ)`
                        : '✔ Trung thực'}
                    </span>
                  </td>
                  <td>
                    <strong className="total-score-text">{st.total.toFixed(2)}</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-glass btn-xs"
                      onClick={() => alert(`Đã gửi thông báo điểm ${st.total.toFixed(2)} cho phụ huynh em ${st.name}!`)}
                    >
                      📩 Gửi PH
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ArenaResultsTable />

      {/* ESSAY GRADING MODAL */}
      {selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal-box-glass modal-md">
            <div className="modal-header">
              <h3>✏️ Chấm Điểm Tự Luận: {selectedStudent.name} ({selectedStudent.class})</h3>
              <button type="button" className="btn-glass btn-sm" onClick={() => setSelectedStudent(null)}>
                ✖ Đóng
              </button>
            </div>

            <form onSubmit={handleSaveGrading} className="grading-form-body">
              <div className="essay-prompt-box">
                <span className="prompt-label">Đề bài tự luận:</span>
                <p>Nêu lợi ích của việc sử dụng các hàm tính toán SUM, AVERAGE trong bảng tính điện tử.</p>
              </div>

              <div className="student-answer-box">
                <span className="answer-label">Bài làm của học sinh:</span>
                <blockquote className="answer-quote">"{selectedStudent.essay}"</blockquote>
              </div>

              <div className="grade-input-group">
                <label>Cho điểm tự luận (Thang điểm 0.0 - 2.0 đ):</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="2"
                  value={essayScoreInput}
                  onChange={(e) => setEssayScoreInput(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glass btn-sm" onClick={() => setSelectedStudent(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary-glow btn-sm">
                  💾 Lưu Điểm & Cập Nhật Sổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
