import { db } from './db.js';

export function seedDatabase() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu chuẩn Tin học THCS...');

  // 1. Users & Teachers
  db.exec(`
    DELETE FROM users;
    DELETE FROM teachers;
    DELETE FROM students;
    DELETE FROM curriculum_periods;
    DELETE FROM lessons;
    DELETE FROM lesson_steps;
    DELETE FROM questions;
    DELETE FROM exam_submissions;
    DELETE FROM arena_sessions;
    DELETE FROM arena_participants;
  `);

  // Insert Teacher
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, role, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(1, 'giaovien_tin', 'hash_123456', 'Thầy Nguyễn Văn Mạnh', 'teacher', 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherManh');
  
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, school_name, subject, teacher_pin)
    VALUES (?, ?, ?, ?)
  `);
  insertTeacher.run(1, 'THCS Mão Điền - TX Thuận Thành', 'Tin học', '123456');

  // Insert 8 Students
  const studentList = [
    { id: 2, code: 'HS0801', name: 'Nguyễn Quang Minh', class: '8A1', streak: 15, exp: 1250 },
    { id: 3, code: 'HS0802', name: 'Trần Lan Anh', class: '8A1', streak: 14, exp: 1400 },
    { id: 4, code: 'HS0803', name: 'Lê Hoàng Long', class: '8A1', streak: 8, exp: 950 },
    { id: 5, code: 'HS0804', name: 'Phạm Thúy Mai', class: '8A1', streak: 20, exp: 1600 },
    { id: 6, code: 'HS0805', name: 'Đỗ Quốc Tuấn', class: '8A1', streak: 5, exp: 700 },
    { id: 7, code: 'HS0806', name: 'Vũ Phương Linh', class: '8A1', streak: 18, exp: 1520 },
    { id: 8, code: 'HS0807', name: 'Bùi Đức Bảo', class: '8A1', streak: 12, exp: 1100 },
    { id: 9, code: 'HS0808', name: 'Ngô Khánh Vy', class: '8A1', streak: 10, exp: 1050 }
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_code, class_name, grade_level, streak_days, total_exp)
    VALUES (?, ?, ?, 8, ?, ?)
  `);

  studentList.forEach(s => {
    insertUser.run(s.id, s.code.toLowerCase(), 'hash_student', s.name, 'student', `https://api.dicebear.com/7.x/bottts/svg?seed=${s.code}`);
    insertStudent.run(s.id, s.code, s.class, s.streak, s.exp);
  });

  // 2. Curriculum Period
  const insertPeriod = db.prepare(`
    INSERT INTO curriculum_periods (id, grade_level, semester, period_number, topic_name, lesson_title, nls_ai_spec)
    VALUES (?, 8, 1, 7, 'Chủ đề 4: Ứng dụng Tin học', 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế (Tiết 2)', 'Tích hợp Năng lực số (CV 3456) & Năng lực AI (QĐ 3439)')
  `);
  insertPeriod.run(1);

  // 3. Lesson
  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, period_id, teacher_id, title, status, version)
    VALUES (1, 1, 1, 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế (Tiết 2)', 'published', 1)
  `);
  insertLesson.run();

  // 4. 16 Lesson Steps (4 Pedagogical Phases)
  const insertStep = db.prepare(`
    INSERT INTO lesson_steps (id, lesson_id, step_number, phase_number, kind, title, content_text, slide_color, points, tip_text, is_notebook)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stepsData = [
    // Phase 1 (3 steps)
    [1, 1, 1, 'lecture', 'Khởi động: Thử thách tính toán thủ công vs Bảng tính', 'So sánh thời gian tính toán thủ công và tự động hóa bảng tính.', 'linear-gradient(135deg, #1e3a8a, #3b82f6)', 0, 'Trao đổi cặp đôi 2 phút', 0],
    [2, 2, 1, 'quiz', 'Khởi động nhanh: Biểu tượng phần mềm bảng tính', 'Phần mềm bảng tính thông dụng nhất hiện nay là gì?', 'linear-gradient(135deg, #047857, #10b981)', 1, 'Thời gian: 30s', 0],
    [3, 3, 1, 'video', 'Video tình huống: Ứng dụng thực tế đời sống', 'Quản lý thu chi và tài chính gia đình thông minh.', 'linear-gradient(135deg, #b45309, #f59e0b)', 0, 'Mốc dừng thảo luận 01:45', 0],

    // Phase 2 (7 steps)
    [4, 4, 2, 'lecture', 'Khám phá 1: Địa chỉ ô tính và khối ô tính', 'Ô tính giao giữa cột và hàng. Khối ô phân cách bằng dấu hai chấm.', 'linear-gradient(135deg, #1e293b, #334155)', 0, 'Thao tác mẫu trên máy chiếu', 0],
    [5, 5, 2, 'notebook', 'Ghi vở trọng tâm: Cách gọi tên ô và khối ô', 'Tên ô = Cột + Hàng (VD: B5). Khối ô = Ô góc trái : Ô góc phải (VD: A1:D10).', 'linear-gradient(135deg, #4338ca, #6366f1)', 0, 'Học sinh ghi vở 3 phút', 1],
    [6, 6, 2, 'lecture', 'Khám phá 2: Phân biệt địa chỉ tương đối & tuyệt đối', 'Địa chỉ tương đối tự đổi khi sao chép. Địa chỉ tuyệt đối có ký hiệu $ giữ nguyên.', 'linear-gradient(135deg, #0e7490, #06b6d4)', 0, 'Nhấn mạnh phím tắt F4', 0],
    [7, 7, 2, 'quiz', 'Kiểm tra nhanh: Ý nghĩa của dấu $ trong địa chỉ ô', 'Trong công thức =B2*$C$1, địa chỉ nào đổi khi sao chép?', 'linear-gradient(135deg, #6d28d9, #8b5cf6)', 1, 'AI chấm và phân tích tỷ lệ', 0],
    [8, 8, 2, 'lecture', 'Khám phá 3: Các hàm thống kê SUM, AVERAGE, MAX, MIN', 'Cú pháp: =TÊN_HÀM(danh_sách_đối_số). Bắt buộc bắt đầu bằng dấu =.', 'linear-gradient(135deg, #15803d, #22c55e)', 0, 'Khắc sâu quy tắc dấu bằng', 0],
    [9, 9, 2, 'notebook', 'Ghi vở trọng tâm: Cú pháp 4 hàm tính toán', '1. =SUM(khoi)\n2. =AVERAGE(khoi)\n3. =MAX(khoi)\n4. =MIN(khoi)', 'linear-gradient(135deg, #3730a3, #4f46e5)', 0, 'Đóng khung vào sổ tay', 1],
    [10, 10, 2, 'lecture', 'Tích hợp Năng lực AI: Dùng AI gợi ý công thức', 'Hướng dẫn đặt câu lệnh prompt hỏi AI cách viết hàm lồng nhau.', 'linear-gradient(135deg, #701a75, #a21caf)', 0, 'Rèn luyện đạo đức số', 0],

    // Phase 3 (4 steps)
    [11, 11, 3, 'quiz', 'Thực hành 1: Tính tiền giảm giá sản phẩm', 'Tính tiền thuế VAT tại ô E2 sao cho copy xuống dưới vẫn đúng.', 'linear-gradient(135deg, #be123c, #f43f5e)', 1, 'Học sinh bấm máy cá nhân', 0],
    [12, 12, 3, 'quiz', 'Thực hành 2: Sửa lỗi hiển thị #NAME? trong bảng tính', 'Nhập =SAM(A1:A5) bị lỗi #NAME?. Nguyên nhân là gì?', 'linear-gradient(135deg, #c2410c, #ea580c)', 1, 'Kiểm tra chính tả tên hàm', 0],
    [13, 13, 3, 'quiz', 'Thực hành 3: Tìm điểm thi cao nhất khối', 'Tìm điểm Tin học cao nhất từ C2 đến C45 dùng hàm nào?', 'linear-gradient(135deg, #1d4ed8, #2563eb)', 1, 'Dùng hàm MAX', 0],
    [14, 14, 3, 'lecture', 'Sửa bài tập chung: Các lỗi thường gặp', 'Tổng hợp kết quả: 85% học sinh trả lời đúng.', 'linear-gradient(135deg, #0f766e, #14b8a6)', 0, 'Giải đáp thắc mắc', 0],

    // Phase 4 (2 steps)
    [15, 15, 4, 'quiz', 'Vận dụng thực tế: Thiết lập bảng kế hoạch chi tiêu', 'Công thức tính số tiền tiết kiệm còn lại sau chi tiêu.', 'linear-gradient(135deg, #4c1d95, #7c3aed)', 1, 'Quản lý tài chính thông minh', 0],
    [16, 16, 4, 'notebook', 'Nhiệm vụ về nhà & Vinh danh học sinh tích cực', 'Làm bài tập về nhà và chuẩn bị Tiết 8.', 'linear-gradient(135deg, #0369a1, #0284c7)', 0, 'Mở bục vinh danh Podium', 1]
  ];

  stepsData.forEach(row => insertStep.run(...row));

  // 5. Exam Submissions & Anti-cheat
  const insertSubmission = db.prepare(`
    INSERT INTO exam_submissions (student_id, exam_title, score_part1, score_part2, score_part3, essay_submission, teacher_feedback, tab_switch_count, penalty_deduction, final_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const submissions = [
    [2, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 4.0, 3.5, 1.75, 'Dùng hàm AVERAGE giúp tính trung bình nhanh và tự cập nhật khi sửa điểm.', 'Trình bày đủ 3 bước chuẩn.', 0, 0.0, 9.25],
    [3, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 4.0, 4.0, 1.5, 'Hàm AVERAGE tự động bỏ qua các ô trống, tránh sai số thủ công.', 'Rất tốt, mạch lạc.', 0, 0.0, 9.5],
    [4, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 3.5, 3.0, 1.25, 'Thao tác: gõ dấu bằng, tên hàm và chọn vùng cần tính rồi enter.', 'Cần nêu thêm lợi ích tự động hóa.', 1, 0.25, 7.5],
    [5, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 4.0, 3.5, 2.0, 'Sử dụng hàm là nền tảng để tự động hóa bảng tính trong quản lý tài chính.', 'Xuất sắc!', 0, 0.0, 9.5],
    [6, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 3.0, 2.5, 1.0, 'Hàm tính toán nhanh hơn cách cộng bằng tay.', 'Rời tab 2 lần, trừ 0.5đ.', 2, 0.5, 6.0],
    [7, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 4.0, 4.0, 1.75, 'Cú pháp =AVERAGE(number1, [number2]...). Tiết kiệm 90% thời gian.', 'Bài làm xuất sắc.', 0, 0.0, 9.75],
    [8, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 3.5, 3.5, 1.5, 'Bảng tính tự động cập nhật kết quả khi thay đổi số liệu.', 'Đúng yêu cầu trọng tâm.', 0, 0.0, 8.5],
    [9, 'Kiểm tra định kỳ Tin học 8 - Đợt 1', 4.0, 3.0, 1.5, 'Các bước thực hiện chuẩn 3 bước như sách giáo khoa.', 'Tốt.', 0, 0.0, 8.5]
  ];

  submissions.forEach(sub => insertSubmission.run(...sub));

  // 6. Arena Session
  const insertArena = db.prepare(`
    INSERT INTO arena_sessions (id, pin_code, lesson_id, teacher_id, status)
    VALUES (1, '689204', 1, 1, 'lobby')
  `);
  insertArena.run();

  console.log('✅ Đã nạp thành công:');
  console.log('  - 1 Giáo viên (Thầy Nguyễn Văn Mạnh, PIN: 123456)');
  console.log('  - 8 Học sinh lớp 8A1');
  console.log('  - 1 Bài giảng 4 Pha Sư phạm gồm 16 bước slide');
  console.log('  - 8 Bài kiểm tra phòng máy với điểm số và log gian lận');
  console.log('  - 1 Phiên Đấu trường PIN 689204 sẵn sàng thi đấu');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
