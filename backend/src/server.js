import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extract } from './ocr.js';
import * as storage from './storage.js';
import { attachArena } from './arena.js';
import { sessionStore, resultStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const META_FILE = path.join(UPLOAD_DIR, 'meta.json');
const ACTIVE_EXAM_FILE = path.join(UPLOAD_DIR, 'active_exam.json');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = process.env.PORT || 4000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// ---- Mock tài khoản ----
const USERS = [
  { username: 'gv', password: '123456', role: 'teacher', name: 'GV: Đỗ Mạnh Trường' },
  { username: 'hs1', password: '123456', role: 'student', name: 'Trần Hoàng Minh' },
  { username: 'hs2', password: '123456', role: 'student', name: 'Nguyễn Thu Hà' }
];
const getUser = (token) => sessionStore.get(token);
sessionStore.purge();

const readMeta = () => (fs.existsSync(META_FILE) ? JSON.parse(fs.readFileSync(META_FILE, 'utf8')) : []);
const writeMeta = (m) => fs.writeFileSync(META_FILE, JSON.stringify(m, null, 2));
const readActiveExam = () => (fs.existsSync(ACTIVE_EXAM_FILE) ? JSON.parse(fs.readFileSync(ACTIVE_EXAM_FILE, 'utf8')) : null);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/files', (req, res, next) => (req.path.endsWith('.json') ? res.status(404).end() : next()), express.static(UPLOAD_DIR, { index: false }));

function auth(roles) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user = getUser(token);
    if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });
    if (roles && !roles.includes(user.role)) return res.status(403).json({ error: 'Không đủ quyền' });
    req.user = user;
    next();
  };
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = USERS.find((x) => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  const token = crypto.randomUUID();
  const user = { username: u.username, role: u.role, name: u.name };
  sessionStore.create(token, user);
  res.json({ token, user });
});

app.get('/api/auth/me', auth(), (req, res) => res.json({ user: req.user }));

app.post('/api/auth/logout', auth(), (req, res) => {
  sessionStore.delete((req.headers.authorization || '').replace('Bearer ', ''));
  res.json({ ok: true });
});

// ---- Sổ điểm đấu trường ----
app.get('/api/gradebook/arena', auth(['teacher']), (req, res) => res.json(resultStore.list()));
app.delete('/api/gradebook/arena/:id', auth(['teacher']), (req, res) => { resultStore.remove(Number(req.params.id)); res.json({ ok: true }); });
app.get('/api/my/results', auth(['student']), (req, res) => res.json(resultStore.forUser(req.user.username)));

const ALLOWED = {
  slide: ['.pdf', '.pptx', '.png', '.jpg', '.jpeg'],
  video: ['.mp4', '.webm', '.mov'],
  exam: ['.docx', '.pdf', '.png', '.jpg', '.jpeg']
};
const TYPES = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[^\w.\-]+/g, '_')}`)
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/upload/:kind', auth(['teacher']), upload.single('file'), async (req, res) => {
  const { kind } = req.params;
  if (!ALLOWED[kind]) return res.status(400).json({ error: 'Loại tệp không hợp lệ' });
  if (!req.file) return res.status(400).json({ error: 'Thiếu tệp' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!ALLOWED[kind].includes(ext)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `Định dạng ${ext} không được hỗ trợ cho ${kind}` });
  }
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  try {
    const entry = {
      id: crypto.randomUUID(),
      kind,
      name: originalName,
      size: req.file.size,
      uploadedBy: req.user.username,
      createdAt: new Date().toISOString()
    };
    // OCR trước (cần tệp cục bộ), sau đó đẩy lên kho lưu trữ
    if (kind !== 'video') entry.ocr = await extract(kind, req.file.path, originalName, ext, GEMINI_KEY);
    Object.assign(entry, await storage.save(req.file.path, req.file.filename, TYPES[ext]));
    if (entry.storage === 'gcs') fs.unlink(req.file.path, () => {});
    const meta = readMeta();
    meta.unshift(entry);
    writeMeta(meta);
    res.json({ ...entry, url: await storage.resolveUrl(entry) });
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: `Lưu trữ thất bại: ${e.message}` });
  }
});

app.get('/api/files', auth(), async (req, res) => {
  const { kind } = req.query;
  const items = readMeta().filter((m) => !kind || m.kind === kind);
  const active = readActiveExam();
  res.json(await Promise.all(items.map(async (m) => ({ ...m, url: await storage.resolveUrl(m), active: active?.id === m.id }))));
});

app.delete('/api/files/:id', auth(['teacher']), async (req, res) => {
  const meta = readMeta();
  const item = meta.find((m) => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
  await storage.remove(item, UPLOAD_DIR);
  writeMeta(meta.filter((m) => m.id !== item.id));
  if (readActiveExam()?.id === item.id) fs.unlink(ACTIVE_EXAM_FILE, () => {});
  res.json({ ok: true });
});

// ---- Đề thi hiện hành (đề OCR được nạp vào trang Thi) ----
app.post('/api/exams/active', auth(['teacher']), (req, res) => {
  const item = readMeta().find((m) => m.id === req.body?.id && m.kind === 'exam');
  if (!item?.ocr) return res.status(404).json({ error: 'Không tìm thấy đề thi đã quét' });
  const ex = item.ocr.result;
  fs.writeFileSync(ACTIVE_EXAM_FILE, JSON.stringify({ id: item.id, title: ex.title || item.name, duration: ex.duration || 45, questions: ex.questions }, null, 2));
  res.json({ ok: true });
});

app.delete('/api/exams/active', auth(['teacher']), (req, res) => {
  fs.unlink(ACTIVE_EXAM_FILE, () => res.json({ ok: true }));
});

app.get('/api/exams/active', auth(), (req, res) => res.json(readActiveExam()));

app.get('/api/health', (req, res) => res.json({ ok: true, ocr: GEMINI_KEY ? 'gemini' : 'mock', storage: storage.mode }));

const server = http.createServer(app);
attachArena(server, getUser);
server.listen(PORT, () =>
  console.log(`Backend chạy tại http://localhost:${PORT} (OCR: ${GEMINI_KEY ? 'Gemini' : 'mock'}, lưu trữ: ${storage.mode})`)
);
