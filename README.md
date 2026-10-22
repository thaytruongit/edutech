# EduTech – Học Tốt!

Ứng dụng trình chiếu bài giảng tương tác & đấu trường trực tiếp trên lớp học.

- **Giáo viên**: Tạo bài giảng, Tải lên (slide/video/đề thi + OCR), Thuyết trình, Phòng đấu trường, Sổ điểm.
- **Học sinh**: Học tập, Thi, Đấu trường (nhập mã PIN, đồng bộ thời gian thực).

## Chạy thử

```bash
# Backend (Node.js ≥ 22, cổng 4000)
cd backend && npm install && npm start

# Frontend (Vite)
cd frontend && npm install && npm run dev
```

Tài khoản demo: `gv` (giáo viên), `hs1`, `hs2` (học sinh) – mật khẩu `123456`.

## Cấu hình (biến môi trường backend)

| Biến | Ý nghĩa |
|---|---|
| `GEMINI_API_KEY` | Bật OCR thật bằng Gemini (không đặt = dữ liệu mock) |
| `GCS_BUCKET`, `GOOGLE_APPLICATION_CREDENTIALS` | Lưu tệp lên Google Cloud Storage (không đặt = lưu cục bộ) |
| `APP_DB` | Đường dẫn CSDL SQLite (mặc định `backend/data/app.db`) |
| `PORT` | Cổng backend (mặc định 4000) |

Frontend: `VITE_API_URL` trỏ tới backend khi chạy giữa nhiều máy.
