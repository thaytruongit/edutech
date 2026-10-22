import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, uploadFile, fileUrl } from '../utils/api';

const TABS = [
  { id: 'slide', label: '📑 Slide bài giảng', accept: '.pdf,.pptx,.png,.jpg,.jpeg', hint: 'PDF, PPTX, ảnh → tự quét OCR thành slide bài giảng / trắc nghiệm' },
  { id: 'video', label: '🎬 Video', accept: '.mp4,.webm,.mov', hint: 'MP4, WebM, MOV (tối đa 500MB)' },
  { id: 'exam', label: '📝 Đề thi', accept: '.docx,.pdf,.png,.jpg,.jpeg', hint: 'DOCX/PDF/ảnh → quét ra khung đề trắc nghiệm' }
];

const fmt = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.ceil(b / 1024) + ' KB');

export default function UploadCenterView({ onImportSlides }) {
  const { token } = useAuth();
  const [tab, setTab] = useState('slide');
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const cur = TABS.find((t) => t.id === tab);

  const load = useCallback(async () => {
    try { setItems(await api(`/api/files?kind=${tab}`, { token })); setError(''); }
    catch (e) { setError(e.message === 'Failed to fetch' ? 'Chưa bật backend: cd backend && npm start' : e.message); }
  }, [tab, token]);

  useEffect(() => { load(); setPreview(null); }, [load]);

  const doUpload = async (file) => {
    if (!file) return;
    setError(''); setProgress(0);
    try {
      const entry = await uploadFile(tab, file, token, setProgress);
      setItems((p) => [entry, ...p]);
      if (entry.ocr) setPreview(entry);
    } catch (e) { setError(e.message); }
    finally { setProgress(null); }
  };

  const activate = async (id) => {
    try {
      await api('/api/exams/active', { method: 'POST', body: { id }, token });
      setItems((p) => p.map((i) => ({ ...i, active: i.id === id })));
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    await api(`/api/files/${id}`, { method: 'DELETE', token });
    setItems((p) => p.filter((i) => i.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  const card = { background: '#fff', border: '1px solid #e8dcc8', borderRadius: 14, padding: 20 };

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
      <h2>☁️ Trung tâm tải lên</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid #d9c9a8', cursor: 'pointer', background: tab === t.id ? '#b08d57' : '#fff', color: tab === t.id ? '#fff' : '#5a4a32', fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); doUpload(e.dataTransfer.files[0]); }}
        style={{ ...card, display: 'block', textAlign: 'center', borderStyle: 'dashed', background: drag ? '#f7efe0' : '#fffdf8', cursor: 'pointer', padding: 40 }}
      >
        <input type="file" accept={cur.accept} hidden onChange={(e) => { doUpload(e.target.files[0]); e.target.value = ''; }} />
        <div style={{ fontSize: 40 }}>📤</div>
        <b>Kéo thả hoặc bấm để chọn tệp</b>
        <div style={{ color: '#8a7a62', fontSize: 13, marginTop: 6 }}>{cur.hint}</div>
        {progress !== null && (
          <div style={{ marginTop: 14, height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#b08d57', transition: 'width .2s' }} />
          </div>
        )}
      </label>
      {error && <div style={{ color: '#c0392b', margin: '10px 0' }}>⚠ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 16, marginTop: 20 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Kho lưu trữ ({items.length})</h3>
          {items.length === 0 && <p style={{ color: '#8a7a62' }}>Chưa có tệp nào.</p>}
          {items.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0e8d8' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                <div style={{ fontSize: 12, color: '#8a7a62' }}>{fmt(i.size)} · {new Date(i.createdAt).toLocaleString('vi-VN')}{i.ocr && ` · OCR: ${i.ocr.source}`}</div>
              </div>
              {i.kind === 'video' && <a href={fileUrl(i.url)} target="_blank" rel="noreferrer">▶ Xem</a>}
              {i.kind === 'exam' && (i.active
                ? <b style={{ color: '#2e7d32' }}>✓ Đang là đề thi</b>
                : <button onClick={() => activate(i.id)}>Dùng làm đề thi</button>)}
              {i.ocr && <button onClick={() => setPreview(i)}>Xem kết quả</button>}
              <button onClick={() => remove(i.id)} title="Xóa">🗑</button>
            </div>
          ))}
        </div>

        {preview && (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Kết quả OCR: {preview.name}</h3>
            {preview.ocr.warning && <div style={{ color: '#c0392b', fontSize: 12 }}>Gemini lỗi ({preview.ocr.warning}), dùng dữ liệu mock.</div>}
            {preview.kind === 'slide' ? (
              <>
                {preview.ocr.result.map((s, idx) => (
                  <div key={idx} style={{ padding: 10, margin: '8px 0', background: '#faf4e6', borderRadius: 10 }}>
                    <b>{idx + 1}. [{s.type === 'quiz' ? 'Trắc nghiệm' : 'Bài giảng'}] {s.title}</b>
                    <div style={{ fontSize: 14 }}>{s.question || s.content}</div>
                    {s.options?.map((o) => <div key={o.key} style={{ fontSize: 13, color: o.correct ? '#2e7d32' : '#555' }}>{o.key}. {o.text}{o.correct && ' ✓'}</div>)}
                  </div>
                ))}
                {onImportSlides && <button onClick={() => onImportSlides(preview.ocr.result)} style={{ padding: '10px 16px', background: '#b08d57', color: '#fff', border: 0, borderRadius: 10, cursor: 'pointer' }}>➕ Nạp vào trình soạn thảo</button>}
              </>
            ) : (
              <>
                <b>{preview.ocr.result.title}</b> · {preview.ocr.result.duration} phút
                {!preview.active && <button onClick={() => activate(preview.id)} style={{ marginLeft: 10 }}>📌 Nạp vào trang Thi</button>}
                {preview.ocr.result.questions.map((q) => (
                  <div key={q.id} style={{ padding: 10, margin: '8px 0', background: '#faf4e6', borderRadius: 10 }}>
                    <div>{q.question}</div>
                    {q.options.map((o) => <div key={o.key} style={{ fontSize: 13, color: o.correct ? '#2e7d32' : '#555' }}>{o.key}. {o.text}{o.correct && ' ✓'}</div>)}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
