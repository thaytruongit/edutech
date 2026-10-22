// Phòng Đấu trường thời gian thực (Socket.IO) có lưu bền vững vào SQLite.
// Điểm được tính ở server; kết thúc trận tự ghi vào sổ điểm.
import { Server } from 'socket.io';
import { roomStore, resultStore } from './store.js';

const rooms = new Map();
const ROOM_TTL = 24 * 3600 * 1000;

export const DEFAULT_QUESTIONS = [
  { title: 'Địa chỉ ô nào sau đây là địa chỉ tuyệt đối trong Excel?', options: ['A1', '$A$1', '$A1', 'A$1'], correct: 1 },
  { title: 'Hàm nào dùng để tính trung bình cộng?', options: ['SUM', 'AVERAGE', 'MAX', 'COUNT'], correct: 1 },
  { title: 'Phím tắt chuyển đổi nhanh sang địa chỉ tuyệt đối?', options: ['F2', 'F4', 'F5', 'F9'], correct: 1 }
].map((q, i) => ({
  id: i + 1,
  title: q.title,
  options: q.options.map((t, k) => ({ key: 'ABCD'[k], text: t, correct: k === q.correct })),
  correctKey: 'ABCD'[q.correct],
  timeLimit: 20
}));

const newPin = () => {
  let p;
  do p = String(Math.floor(100000 + Math.random() * 900000)); while (rooms.has(p));
  return p;
};

const board = (room) =>
  [...room.players.values()]
    .map((p) => ({ name: p.name, cls: p.cls, score: p.score, streak: p.streak }))
    .sort((a, b) => b.score - a.score);

const publicQ = (room) => {
  const q = room.questions[room.qIndex];
  return {
    index: room.qIndex,
    total: room.questions.length,
    title: q.title,
    options: q.options.map((o) => ({ key: o.key, text: o.text })),
    timeLimit: q.timeLimit || 20,
    endsAt: room.endsAt
  };
};

export function attachArena(httpServer, getUser, corsOrigin = '*') {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });
  const persist = (room) => { try { roomStore.save(room); } catch (e) { console.error('Lưu phòng lỗi:', e.message); } };

  io.use((socket, next) => {
    const user = getUser(socket.handshake.auth?.token);
    if (!user) return next(new Error('Chưa đăng nhập'));
    socket.data.user = user;
    next();
  });

  const lobby = (room) => io.to(room.pin).emit('room:update', { pin: room.pin, state: room.state, players: board(room) });

  function armTimer(room) {
    clearTimeout(room.timer);
    room.timer = setTimeout(() => reveal(room), Math.max(0, room.endsAt - Date.now()) + 300);
  }

  function reveal(room) {
    if (room.state !== 'question') return;
    clearTimeout(room.timer);
    room.state = 'reveal';
    const q = room.questions[room.qIndex];
    persist(room);
    io.to(room.pin).emit('game:reveal', {
      correctKey: q.correctKey,
      leaderboard: board(room),
      answered: [...room.players.values()].filter((p) => p.answers[room.qIndex]).length
    });
  }

  // Ghi điểm vào sổ điểm (chỉ một lần mỗi phòng)
  function record(room) {
    if (room.recorded) return;
    const ranked = [...room.players.entries()].sort((a, b) => b[1].score - a[1].score);
    const rows = ranked.map(([username, p], i) => ({
      pin: room.pin, title: room.title, username, name: p.name, cls: p.cls, score: p.score,
      correct: room.questions.reduce((n, q, idx) => n + (p.answers[idx] === q.correctKey ? 1 : 0), 0),
      total: room.questions.length, rank: i + 1
    }));
    try { resultStore.addMany(rows); room.recorded = true; } catch (e) { console.error('Ghi sổ điểm lỗi:', e.message); }
  }

  function nextQuestion(room) {
    if (room.qIndex + 1 >= room.questions.length) {
      room.state = 'finished';
      record(room);
      persist(room);
      io.to(room.pin).emit('game:finished', { leaderboard: board(room) });
      return;
    }
    room.qIndex += 1;
    room.state = 'question';
    const q = room.questions[room.qIndex];
    room.endsAt = Date.now() + q.timeLimit * 1000;
    persist(room);
    io.to(room.pin).emit('game:question', publicQ(room));
    armTimer(room);
  }

  // Trạng thái hiện tại để máy khách (HS/GV) khôi phục sau khi mất kết nối hoặc server khởi động lại
  const snapshot = (room) => ({
    state: room.state,
    question: room.state === 'question' || room.state === 'reveal' ? publicQ(room) : null,
    correctKey: room.state === 'reveal' ? room.questions[room.qIndex].correctKey : null,
    leaderboard: board(room)
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;

    socket.on('host:create', ({ questions, title } = {}, ack) => {
      if (user.role !== 'teacher') return ack?.({ error: 'Chỉ giáo viên được tạo phòng' });
      // mỗi giáo viên chỉ một phòng đang mở: đóng phòng cũ nếu có
      for (const r of rooms.values()) if (r.hostUser === user.username) { clearTimeout(r.timer); io.to(r.pin).emit('game:closed'); rooms.delete(r.pin); roomStore.delete(r.pin); }
      const qs = (questions?.length ? questions : DEFAULT_QUESTIONS).map((q, i) => ({ ...q, id: i + 1, timeLimit: q.timeLimit || 20 }));
      const pin = newPin();
      const room = { pin, title: title || 'Đấu trường', hostUser: user.username, host: socket.id, questions: qs, state: 'lobby', qIndex: -1, players: new Map(), timer: null, endsAt: 0, recorded: false };
      rooms.set(pin, room);
      socket.join(pin);
      socket.data.hostRoom = pin;
      persist(room);
      ack?.({ pin, total: qs.length });
      lobby(room);
    });

    // GV kết nối lại (tải lại trang / server khởi động lại): nhận lại quyền điều khiển phòng
    socket.on('host:resume', (_, ack) => {
      if (user.role !== 'teacher') return ack?.({ error: 'Không có quyền' });
      const room = [...rooms.values()].find((r) => r.hostUser === user.username);
      if (!room) return ack?.({ none: true });
      room.host = socket.id;
      socket.join(room.pin);
      socket.data.hostRoom = room.pin;
      ack?.({ pin: room.pin, total: room.questions.length, ...snapshot(room), players: board(room) });
    });

    socket.on('player:join', ({ pin, name, cls }, ack) => {
      if (user.role !== 'student') return ack?.({ error: 'Chỉ học sinh được tham gia' });
      const room = rooms.get(String(pin || '').trim());
      if (!room) return ack?.({ error: 'Không tìm thấy phòng, kiểm tra lại mã PIN' });
      const key = user.username;
      const existing = room.players.get(key);
      if (room.state === 'finished' && !existing) return ack?.({ error: 'Phòng đã kết thúc' });
      room.players.set(key, existing ? { ...existing, sid: socket.id } : { sid: socket.id, name: (name || user.name).trim(), cls: cls || '', score: 0, streak: 0, answers: {} });
      socket.join(room.pin);
      socket.data.playRoom = room.pin;
      socket.data.playKey = key;
      persist(room);
      const me = room.players.get(key);
      ack?.({ ok: true, ...snapshot(room), score: me.score, answeredKey: room.qIndex >= 0 ? me.answers[room.qIndex] || null : null });
      lobby(room);
    });

    socket.on('host:start', (_, ack) => {
      const room = rooms.get(socket.data.hostRoom);
      if (!room || room.state !== 'lobby') return ack?.({ error: 'Không thể bắt đầu' });
      room.qIndex = -1;
      nextQuestion(room);
      ack?.({ ok: true });
    });

    socket.on('host:next', (_, ack) => {
      const room = rooms.get(socket.data.hostRoom);
      if (!room) return ack?.({ error: 'Không có phòng' });
      if (room.state === 'question') { reveal(room); return ack?.({ ok: true }); }
      if (room.state === 'finished') return ack?.({ ok: true });
      nextQuestion(room);
      ack?.({ ok: true });
    });

    socket.on('host:close', () => {
      const room = rooms.get(socket.data.hostRoom);
      if (!room) return;
      clearTimeout(room.timer);
      io.to(room.pin).emit('game:closed');
      rooms.delete(room.pin);
      roomStore.delete(room.pin);
    });

    socket.on('player:answer', ({ key }, ack) => {
      const room = rooms.get(socket.data.playRoom);
      const p = room?.players.get(socket.data.playKey);
      if (!room || !p || room.state !== 'question') return ack?.({ error: 'Không thể trả lời lúc này' });
      if (p.answers[room.qIndex]) return ack?.({ error: 'Đã trả lời rồi' });
      const q = room.questions[room.qIndex];
      const correct = key === q.correctKey;
      const left = Math.max(0, room.endsAt - Date.now()) / 1000;
      const gained = correct ? Math.round(500 + 500 * (left / q.timeLimit) + p.streak * 50) : 0;
      p.score += gained;
      p.streak = correct ? p.streak + 1 : 0;
      p.answers[room.qIndex] = key;
      persist(room);
      ack?.({ correct, gained, score: p.score });
      lobby(room);
      if (room.host) io.to(room.host).emit('host:answered', { count: [...room.players.values()].filter((x) => x.answers[room.qIndex]).length, total: room.players.size });
      if ([...room.players.values()].every((x) => x.answers[room.qIndex])) reveal(room);
    });

    // Mất kết nối GV/HS: giữ nguyên phòng để khôi phục (không đóng phòng)
    socket.on('disconnect', () => {
      const room = rooms.get(socket.data.hostRoom);
      if (room && room.host === socket.id) room.host = null;
    });
  });

  // Khôi phục phòng sau khi server khởi động lại
  for (const room of roomStore.loadAll()) {
    rooms.set(room.pin, room);
    if (room.state === 'question') {
      if (room.endsAt <= Date.now()) reveal(room); else armTimer(room);
    }
  }
  if (rooms.size) console.log(`Đã khôi phục ${rooms.size} phòng đấu trường`);

  setInterval(() => {
    roomStore.purge(ROOM_TTL);
    for (const [pin, r] of rooms) if (!r.timer && r.state === 'finished' && Date.now() - (r.endsAt || 0) > ROOM_TTL) rooms.delete(pin);
  }, 3600 * 1000).unref();

  return io;
}
