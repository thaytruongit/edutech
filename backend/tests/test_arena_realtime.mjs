// Kiểm thử realtime: 1 GV + 2 HS chơi trọn 1 trận
import { io } from 'socket.io-client';
const B = 'http://localhost:4000';
const login = async (u) => (await (await fetch(B + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: '123456' }) })).json());
const conn = (token) => new Promise((r) => { const s = io(B, { auth: { token } }); s.on('connect', () => r(s)); });
const ask = (s, e, p) => new Promise((r) => s.emit(e, p, r));

const gv = await conn((await login('gv')).token);
const h1 = await conn((await login('hs1')).token);
const h2 = await conn((await login('hs2')).token);
const { pin } = await ask(gv, 'host:create', {});
console.log('PIN', pin, 'bad pin ->', (await ask(h1, 'player:join', { pin: '000000' })).error);
console.log('join', await ask(h1, 'player:join', { pin, name: 'A', cls: '9A' }), await ask(h2, 'player:join', { pin, name: 'B', cls: '9A' }));
let total = 3;
for (const s of [h1, h2]) s.on('game:question', async (q) => {
  const key = s === h1 ? 'B' : 'A';
  console.log(s === h1 ? 'A' : 'B', 'Q', q.index, 'answer', JSON.stringify(await ask(s, 'player:answer', { key })));
});
gv.on('game:reveal', async () => { await ask(gv, 'host:next'); });
gv.on('game:finished', (r) => { console.log('FINAL', JSON.stringify(r.leaderboard)); process.exit(0); });
await ask(gv, 'host:start');
setTimeout(() => { console.log('timeout'); process.exit(1); }, 20000);
