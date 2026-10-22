import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { connectSocket, emitAsync } from '../utils/socket';

const PADS = [
  { shape: '▲', color: 'pad-red' },
  { shape: '■', color: 'pad-blue' },
  { shape: '●', color: 'pad-yellow' },
  { shape: '◆', color: 'pad-green' }
];

// Giao diện học sinh: nhập PIN -> chờ giáo viên -> thi đấu đồng bộ thời gian thực
export default function ArenaLobbyView() {
  const { user, token } = useAuth();
  const [pin, setPin] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [cls, setCls] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('join'); // join | lobby | question | reveal | finished
  const [players, setPlayers] = useState([]);
  const [q, setQ] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const sock = useRef(null);

  const SAVE_KEY = 'arena_session';

  useEffect(() => () => sock.current?.disconnect(), []);

  const startQuestion = (data, answeredKey = null) => {
    setQ(data); setSelected(answeredKey); setResult(null); setReveal(null); setPhase('question');
  };

  // Áp dụng trạng thái hiện tại của phòng (khi vào phòng / kết nối lại / server khởi động lại)
  const applySnapshot = (res) => {
    if (typeof res.score === 'number') setScore(res.score);
    setLeaderboard(res.leaderboard || []);
    if (res.state === 'question') startQuestion(res.question, res.answeredKey);
    else if (res.state === 'reveal') {
      setQ(res.question); setSelected(res.answeredKey); setReveal({ correctKey: res.correctKey, leaderboard: res.leaderboard }); setPhase('reveal');
    } else if (res.state === 'finished') setPhase('finished');
    else setPhase('lobby');
  };

  const connectAndJoin = async (info) => {
    sock.current?.disconnect();
    const s = connectSocket(token);
    sock.current = s;
    const doJoin = () => emitAsync(s, 'player:join', info);
    await new Promise((res, rej) => { s.once('connect', res); s.once('connect_error', (er) => rej(new Error(er.message === 'xhr poll error' ? 'Không kết nối được backend' : er.message))); });
    s.on('room:update', (r) => setPlayers(r.players));
    s.on('game:question', (d) => startQuestion(d));
    s.on('game:reveal', (r) => { setReveal(r); setLeaderboard(r.leaderboard); setPhase('reveal'); });
    s.on('game:finished', (r) => {
      setLeaderboard(r.leaderboard); setPhase('finished');
      sound.play('correct'); confetti({ particleCount: 90, spread: 80, origin: { y: 0.4 } });
    });
    s.on('game:closed', () => { sessionStorage.removeItem(SAVE_KEY); setPhase('join'); setError('Giáo viên đã đóng phòng'); s.disconnect(); });
    // Mất mạng / server khởi động lại: socket.io tự nối lại, ta vào lại phòng và lấy trạng thái mới nhất
    s.io.on('reconnect', () => doJoin().then(applySnapshot).catch((e) => { setError(e.message); setPhase('join'); }));
    const res = await doJoin();
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(info));
    applySnapshot(res);
  };

  const join = async (e) => {
    e?.preventDefault();
    setError('');
    sound.play('click');
    try { await connectAndJoin({ pin, name, cls }); }
    catch (err) { setError(err.message); sock.current?.disconnect(); }
  };

  // Tải lại trang: tự vào lại phòng đang chơi
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SAVE_KEY));
      if (!saved) return;
      setPin(saved.pin); setName(saved.name); setCls(saved.cls);
      connectAndJoin(saved).catch(() => sessionStorage.removeItem(SAVE_KEY));
    } catch { /* bỏ qua */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng hồ đếm ngược dựa trên mốc kết thúc từ server
  useEffect(() => {
    if (phase !== 'question' || !q) return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((q.endsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [phase, q]);

  const answer = async (key) => {
    if (selected || phase !== 'question') return;
    setSelected(key);
    sound.play('click');
    try {
      const r = await emitAsync(sock.current, 'player:answer', { key });
      setResult(r); setScore(r.score);
      if (r.correct) { sound.play('streak'); confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } }); }
      else sound.play('wrong');
    } catch { /* hết giờ */ }
  };

  const myRank = leaderboard.findIndex((p) => p.name === name.trim()) + 1;

  if (phase === 'join') {
    return (
      <div className="arena-page-wrapper">
        <div className="arena-left-pin-screen" style={{ margin: '0 auto', maxWidth: 520 }}>
          <div className="pin-form-inner-content">
            <h1 className="pin-brand-3d-title">Học Tốt!</h1>
            <form className="pin-entry-card-box" onSubmit={join}>
              <h2 className="card-heading-title">VÀO ĐẤU TRƯỜNG</h2>
              <div className="pin-inputs-stack">
                <input className="pin-text-input" placeholder="Mã PIN (6 số)" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required />
                <input className="pin-text-input" placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="pin-text-input" placeholder="Lớp 6A1" value={cls} onChange={(e) => setCls(e.target.value)} />
                <button type="submit" className="btn-pin-participate-yellow">Tham gia</button>
              </div>
              {error && <div style={{ color: '#c0392b', marginTop: 10 }}>⚠ {error}</div>}
            </form>
            <p className="pin-quote-footer">“Học, học nữa, học mãi” - V.I. Lênin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-page-wrapper">
      <div className="arena-right-play-screen" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="play-top-status-bar">
          <div className="student-profile-lead">
            <span className="badge-ver">Phòng {pin}</span>
            <div className="user-info-row"><span className="user-icon">👤</span><strong>{name} {cls && `- ${cls}`}</strong></div>
          </div>
          {phase === 'question' && <div className="timer-countdown-tag">⏱️ {timeLeft}s</div>}
          <div className="score-privacy-box">
            <div className="score-privacy-badge"><span className="check-ico">✔</span><span>Điểm: <strong>{score}</strong></span></div>
          </div>
        </div>

        {phase === 'lobby' && (
          <div className="arena-question-display-box" style={{ textAlign: 'center', padding: 40 }}>
            <h3 className="arena-q-title">🟢 Đã vào phòng! Chờ giáo viên bắt đầu…</h3>
            <p>{players.length} bạn đang chờ: {players.map((p) => p.name).join(', ')}</p>
          </div>
        )}

        {(phase === 'question' || phase === 'reveal') && q && (
          <>
            <div className="arena-question-display-box">
              <h3 className="arena-q-title">Câu {q.index + 1}/{q.total}: {q.title}</h3>
            </div>
            <div className="arena-four-pads-grid">
              {q.options.map((opt, i) => {
                const pad = PADS[i % 4];
                const isSel = selected === opt.key;
                const showCorrect = reveal && opt.key === reveal.correctKey;
                const showWrong = reveal && isSel && opt.key !== reveal.correctKey;
                return (
                  <button key={opt.key} type="button" disabled={phase !== 'question' || !!selected}
                    className={`kahoot-answer-button ${pad.color} ${isSel ? 'is-selected' : ''} ${showCorrect ? 'opt-is-correct' : ''} ${showWrong ? 'opt-is-wrong' : ''}`}
                    onClick={() => answer(opt.key)}>
                    <span className="pad-shape">{pad.shape}</span>
                    <span className="pad-text">{opt.key}: {opt.text}</span>
                    {showCorrect && <span className="selection-checkmark">✔</span>}
                    {showWrong && <span className="selection-checkmark wrong">✕</span>}
                  </button>
                );
              })}
            </div>
            {phase === 'question' && selected && <div className="arena-next-q-bar"><span className="feedback-answer-msg">✅ Đã gửi đáp án, chờ cả lớp…</span></div>}
            {phase === 'reveal' && (
              <div className="arena-next-q-bar">
                <span className="feedback-answer-msg">
                  {result?.correct ? `🎉 Chính xác! +${result.gained} điểm` : `❌ ${selected ? 'Chưa chính xác' : 'Chưa trả lời'}! Đáp án đúng: ${reveal.correctKey}`}
                </span>
              </div>
            )}
          </>
        )}

        {(phase === 'reveal' || phase === 'finished') && (
          <div className="arena-question-display-box" style={{ marginTop: 16 }}>
            <h3 className="arena-q-title">{phase === 'finished' ? `🏆 Tổng kết${myRank ? ` — bạn hạng ${myRank}` : ''}` : 'Bảng xếp hạng'}</h3>
            {leaderboard.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontWeight: p.name === name.trim() ? 700 : 400 }}>
                <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {p.name}</span><span>{p.score}</span>
              </div>
            ))}
            {phase === 'finished' && <button className="btn-next-arena-q" onClick={() => { sessionStorage.removeItem(SAVE_KEY); sock.current?.disconnect(); setPhase('join'); setScore(0); }}>Chơi phòng khác</button>}
          </div>
        )}
      </div>
    </div>
  );
}
