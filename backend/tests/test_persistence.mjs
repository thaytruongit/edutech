// Kiểm thử bền vững: phiên đăng nhập + phòng + sổ điểm sống sót qua khởi động lại server
import { spawn } from 'node:child_process';
import { io } from 'socket.io-client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 4100, B = `http://localhost:${PORT}`;
const DB = path.join(os.tmpdir(), `app_test_${Date.now()}.db`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const start = async () => {
  const p = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT, APP_DB: DB }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(B + '/api/health'); return p; } catch { await sleep(250); } }
  throw new Error('server không lên');
};
const api = async (p, o = {}, t) => (await fetch(B + p, { ...o, headers: { 'Content-Type': 'application/json', ...(t && { Authorization: `Bearer ${t}` }) } })).json();
const login = async (u) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: '123456' }) });
const conn = (token) => new Promise((r) => { const s = io(B, { auth: { token } }); s.on('connect', () => r(s)); });
const ask = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };

let srv = await start();
const gv = await login('gv'), hs = await login('hs1');
const g = await conn(gv.token), h = await conn(hs.token);
const { pin } = await ask(g, 'host:create', { title: 'Test' });
await ask(h, 'player:join', { pin, name: 'A', cls: '9A' });
h.on('game:question', async () => { await ask(h, 'player:answer', { key: 'B' }); });
await ask(g, 'host:start');
await sleep(500);

// --- khởi động lại server giữa trận ---
g.close(); h.close(); srv.kill(); await sleep(800);
srv = await start();

ok((await api('/api/auth/me', {}, gv.token)).user?.role === 'teacher', 'phiên đăng nhập còn sau khi restart');
const g2 = await conn(gv.token), h2 = await conn(hs.token);
const r = await ask(g2, 'host:resume');
ok(r.pin === pin && ['question', 'reveal'].includes(r.state), `GV nhận lại phòng ${r.pin} (state=${r.state})`);
const j = await ask(h2, 'player:join', { pin, name: 'A', cls: '9A' });
ok(j.ok && j.score > 0 && j.answeredKey === 'B', `HS vào lại, giữ điểm ${j.score}, giữ đáp án ${j.answeredKey}`);

h2.on('game:question', () => ask(h2, 'player:answer', { key: 'B' }));
// Kết thúc trận -> ghi sổ điểm
g2.on('game:reveal', () => ask(g2, 'host:next'));
const fin = new Promise((res) => g2.on('game:finished', res));
await ask(g2, 'host:next');
await fin;
await sleep(300);
const rows = await api('/api/gradebook/arena', {}, gv.token);
ok(rows.some((x) => x.pin === pin && x.username === 'hs1' && x.score > 0), `sổ điểm có kết quả: ${JSON.stringify(rows[0])}`);
ok((await api('/api/gradebook/arena', {}, hs.token)).error, 'HS không xem được sổ điểm');

g2.close(); h2.close(); srv.kill();
await sleep(500);
try { fs.rmSync(DB, { force: true }); } catch { /* tệp tạm sẽ được hệ điều hành dọn */ }
process.exit();
