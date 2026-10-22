import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { connectSocket, emitAsync } from '../utils/socket';

const card = { background: '#fff', border: '1px solid #e8dcc8', borderRadius: 14, padding: 20 };
const btn = { padding: '12px 22px', borderRadius: 10, border: 0, background: '#b08d57', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 16 };

// Giáo viên: tạo phòng, hiển thị PIN lớn (chiếu lên tivi), điều khiển trận đấu
export default function ArenaHostView() {
  const { token } = useAuth();
  const [source, setSource] = useState('default');
  const [exam, setExam] = useState(null);
  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState('setup'); // setup | lobby | question | reveal | finished
  const [players, setPlayers] = useState([]);
  const [q, setQ] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState({ count: 0, total: 0 });
  const [error, setError] = useState('');
  const sock = useRef(null);

  const bind = async () => {
    const s = connectSocket(token);
    sock.current = s;
    await new Promise((res, rej) => { s.once('connect', res); s.once('connect_error', () => rej(new Error('Không kết nối được backend'))); });
    s.on('room:update', (r) => setPlayers(r.players));
    s.on('game:question', (d) => { setQ(d); setAnswered({ count: 0, total: 0 }); setPhase('question'); });
    s.on('host:answered', setAnswered);
    s.on('game:reveal', (r) => { setPlayers(r.leaderboard); setPhase('reveal'); });
    s.on('game:finished', (r) => { setPlayers(r.leaderboard); setPhase('finished'); });
    return s;
  };

  // Nhận lại quyền điều khiển phòng đang mở (tải lại trang / server khởi động lại)
  const resume = async (s) => {
    const r = await emitAsync(s, 'host:resume');
    if (r.none) return false;
    setPin(r.pin); setPlayers(r.leaderboard || []);
    if (r.question) setQ(r.question);
    setPhase(r.state);
    return true;
  };

  useEffect(() => {
    api('/api/exams/active', { token }).then(setExam).catch(() => {});
    bind().then((s) => {
      s.io.on('reconnect', () => resume(s).catch(() => {}));
      return resume(s);
    }).catch(() => {});
    return () => sock.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (phase !== 'question' || !q) return;
    const t = setInterval(() => setTimeLeft(Math.max(0, Math.ceil((q.endsAt - Date.now()) / 1000))), 250);
    return () => clearInterval(t);
  }, [phase, q]);

  const create = async () => {
    setError('');
    try {
      const s = sock.current?.connected ? sock.current : await bind();
      let questions;
      if (source === 'exam' && exam) {
        questions = exam.questions.map((x) => ({
          title: x.question,
          options: x.options.map((o) => ({ key: o.key, text: o.text, correct: !!o.correct || o.key === x.correctKey || o.key === x.correct })),
          correctKey: x.correctKey || x.correct || x.options.find((o) => o.correct)?.key,
          timeLimit: 20
        }));
      }
      const res = await emitAsync(s, 'host:create', { questions, title: source === 'exam' && exam ? exam.title : 'Bộ câu hỏi mẫu (Excel)' });
      setPin(res.pin);
      setPhase('lobby');
    } catch (e) { setError(e.message); }
  };

  const act = (ev) => emitAsync(sock.current, ev).catch((e) => setError(e.message));
  const close = () => { sock.current?.emit('host:close'); sock.current?.disconnect(); setPhase('setup'); setPin(''); setPlayers([]); };

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
      <h2>🔠 Phòng Đấu trường (giáo viên)</h2>
      {error && <div style={{ color: '#c0392b' }}>⚠ {error}</div>}

      {phase === 'setup' && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Chọn bộ câu hỏi</h3>
          <label style={{ display: 'block', margin: '8px 0' }}><input type="radio" checked={source === 'default'} onChange={() => setSource('default')} /> Bộ câu hỏi mẫu (3 câu Excel)</label>
          <label style={{ display: 'block', margin: '8px 0', opacity: exam ? 1 : 0.5 }}>
            <input type="radio" disabled={!exam} checked={source === 'exam'} onChange={() => setSource('exam')} /> Đề thi hiện hành {exam ? `— ${exam.title} (${exam.questions.length} câu)` : '(chưa có, vào Tải lên → Đề thi → “Dùng làm đề thi”)'}
          </label>
          <button style={btn} onClick={create}>Tạo phòng</button>
        </div>
      )}

      {phase !== 'setup' && (
        <div style={{ ...card, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ color: '#8a7a62' }}>Học sinh vào mục Đấu trường và nhập mã PIN</div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: 12, color: '#8b6a35' }}>{pin}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {phase === 'lobby' && <button style={btn} disabled={!players.length} onClick={() => act('host:start')}>▶ Bắt đầu ({players.length} HS)</button>}
            {phase === 'question' && <button style={btn} onClick={() => act('host:next')}>⏭ Kết thúc câu ({answered.count}/{answered.total || players.length})</button>}
            {phase === 'reveal' && <button style={btn} onClick={() => act('host:next')}>{q.index + 1 >= q.total ? '🏆 Xem tổng kết' : 'Câu tiếp theo →'}</button>}
            <button style={{ ...btn, background: '#999' }} onClick={close}>Đóng phòng</button>
          </div>
        </div>
      )}

      {(phase === 'question' || phase === 'reveal') && q && (
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Câu {q.index + 1}/{q.total} {phase === 'question' && <span style={{ float: 'right' }}>⏱ {timeLeft}s</span>}</h3>
          <div style={{ fontSize: 20 }}>{q.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {q.options.map((o) => <div key={o.key} style={{ padding: 12, background: '#faf4e6', borderRadius: 8 }}><b>{o.key}.</b> {o.text}</div>)}
          </div>
        </div>
      )}

      {phase !== 'setup' && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>{phase === 'lobby' ? `Học sinh đã vào (${players.length})` : 'Bảng xếp hạng'}</h3>
          {players.length === 0 && <p style={{ color: '#8a7a62' }}>Đang chờ học sinh tham gia…</p>}
          {players.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0e8d8' }}>
              <span>{phase === 'lobby' ? '🧑‍🎓' : ['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {p.name} {p.cls && <small style={{ color: '#8a7a62' }}>({p.cls})</small>}</span>
              {phase !== 'lobby' && <b>{p.score}</b>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
