import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

// Sổ điểm Đấu trường: kết quả lưu bền vững trong CSDL, tự ghi khi trận kết thúc
export default function ArenaResultsTable() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    api('/api/gradebook/arena', { token }).then((r) => { setRows(r); setError(''); }).catch((e) => setError(e.message));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const shown = rows.filter((r) => `${r.name} ${r.cls} ${r.title}`.toLowerCase().includes(q.toLowerCase()));

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    let csv = '\uFEFFSTT,Thời gian,Mã phòng,Bộ câu hỏi,Họ và tên,Lớp,Hạng,Số câu đúng,Tổng số câu,Điểm\n';
    shown.forEach((r, i) => {
      csv += [i + 1, esc(new Date(r.created_at).toLocaleString('vi-VN')), r.pin, esc(r.title), esc(r.name), esc(r.cls), r.rank, r.correct, r.total, r.score].join(',') + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'So_diem_Dau_truong.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = async (id) => {
    if (!confirm('Xóa kết quả này khỏi sổ điểm?')) return;
    await api(`/api/gradebook/arena/${id}`, { method: 'DELETE', token });
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="gradebook-table-card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, flex: 1 }}>🔠 Điểm Đấu trường ({shown.length})</h3>
        <input placeholder="Tìm tên / lớp / bộ câu hỏi" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e0d3bd' }} />
        <button type="button" className="btn-glass btn-sm" onClick={load}>↻ Làm mới</button>
        <button type="button" className="btn-primary-glow btn-sm" onClick={exportCsv}>📥 Xuất CSV</button>
      </div>
      {error && <div style={{ color: '#c0392b', padding: '0 16px' }}>⚠ {error}</div>}
      <div className="table-responsive">
        <table className="gradebook-table">
          <thead>
            <tr><th>STT</th><th>Thời gian</th><th>Phòng</th><th>Bộ câu hỏi</th><th>Họ và tên</th><th>Lớp</th><th>Hạng</th><th>Đúng</th><th>Điểm</th><th></th></tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 20 }}>Chưa có kết quả. Kết quả tự lưu khi giáo viên kết thúc một trận Đấu trường.</td></tr>}
            {shown.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                <td><code>{r.pin}</code></td>
                <td>{r.title}</td>
                <td><strong>{r.name}</strong></td>
                <td>{r.cls}</td>
                <td>{['🥇', '🥈', '🥉'][r.rank - 1] || r.rank}</td>
                <td>{r.correct}/{r.total}</td>
                <td><strong className="total-score-text">{r.score}</strong></td>
                <td><button type="button" className="btn-glass btn-xs" onClick={() => remove(r.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
