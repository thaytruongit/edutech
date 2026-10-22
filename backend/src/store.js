// Lưu trữ bền vững (SQLite): phiên đăng nhập, phòng đấu trường, kết quả sổ điểm.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(process.env.APP_DB || path.join(dir, 'app.db'));
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, username TEXT NOT NULL, role TEXT NOT NULL, name TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rooms (
  pin TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS arena_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pin TEXT NOT NULL, title TEXT, username TEXT NOT NULL, name TEXT NOT NULL, cls TEXT,
  score INTEGER NOT NULL, correct INTEGER NOT NULL, total INTEGER NOT NULL,
  rank INTEGER, created_at INTEGER NOT NULL,
  UNIQUE(pin, username)
);
`);

const SESSION_TTL = 30 * 24 * 3600 * 1000;

// ---- Phiên đăng nhập ----
export const sessionStore = {
  create(token, user) {
    db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').run(token, user.username, user.role, user.name, Date.now() + SESSION_TTL);
  },
  get(token) {
    if (!token) return null;
    const r = db.prepare('SELECT username, role, name, expires_at FROM sessions WHERE token = ?').get(token);
    if (!r) return null;
    if (r.expires_at < Date.now()) { this.delete(token); return null; }
    return { username: r.username, role: r.role, name: r.name };
  },
  delete(token) { db.prepare('DELETE FROM sessions WHERE token = ?').run(token); },
  purge() { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); }
};

// ---- Phòng đấu trường ----
export const roomStore = {
  save(room) {
    const data = JSON.stringify({
      pin: room.pin, title: room.title, hostUser: room.hostUser, questions: room.questions,
      state: room.state, qIndex: room.qIndex, endsAt: room.endsAt, recorded: !!room.recorded,
      players: [...room.players.entries()]
    });
    db.prepare('INSERT INTO rooms (pin,data,updated_at) VALUES (?,?,?) ON CONFLICT(pin) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
      .run(room.pin, data, Date.now());
  },
  delete(pin) { db.prepare('DELETE FROM rooms WHERE pin = ?').run(pin); },
  loadAll() {
    return db.prepare('SELECT data FROM rooms').all().map((r) => {
      const d = JSON.parse(r.data);
      return { ...d, players: new Map(d.players), host: null, timer: null };
    });
  },
  purge(olderThanMs) { db.prepare('DELETE FROM rooms WHERE updated_at < ?').run(Date.now() - olderThanMs); }
};

// ---- Sổ điểm đấu trường ----
export const resultStore = {
  addMany(rows) {
    const st = db.prepare(`INSERT INTO arena_results (pin,title,username,name,cls,score,correct,total,rank,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(pin,username) DO UPDATE SET score=excluded.score, correct=excluded.correct, rank=excluded.rank`);
    db.exec('BEGIN');
    try { rows.forEach((r) => st.run(r.pin, r.title, r.username, r.name, r.cls, r.score, r.correct, r.total, r.rank, Date.now())); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  },
  list() { return db.prepare('SELECT * FROM arena_results ORDER BY created_at DESC, rank ASC LIMIT 1000').all(); },
  forUser(username) { return db.prepare('SELECT * FROM arena_results WHERE username = ? ORDER BY created_at DESC').all(username); },
  remove(id) { db.prepare('DELETE FROM arena_results WHERE id = ?').run(id); }
};
