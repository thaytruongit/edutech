-- ==============================================================================
-- DATABASE SCHEMA: HỌC TỐT! & EDU CRAFT STUDIO
-- Standard: Tin học THCS (Khối 6-9), 4 Pha Sư Phạm, Phòng máy & Đấu trường trực tiếp
-- Engine: SQLite 3 / node:sqlite
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. BẢNG NGƯỜI DÙNG TỔNG QUÁT
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('teacher', 'student', 'admin')),
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG GIÁO VIÊN (Teacher Login Gate)
CREATE TABLE IF NOT EXISTS teachers (
    user_id INTEGER PRIMARY KEY,
    school_name VARCHAR(150) NOT NULL DEFAULT 'THCS Mão Điền',
    subject VARCHAR(50) NOT NULL DEFAULT 'Tin học',
    teacher_pin VARCHAR(10) NOT NULL DEFAULT '123456',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. BẢNG HỌC SINH (Student Profile & Gamification)
CREATE TABLE IF NOT EXISTS students (
    user_id INTEGER PRIMARY KEY,
    student_code VARCHAR(30) UNIQUE NOT NULL,
    class_name VARCHAR(20) NOT NULL,
    grade_level INTEGER NOT NULL CHECK(grade_level IN (6, 7, 8, 9)),
    streak_days INTEGER DEFAULT 1,
    total_exp INTEGER DEFAULT 0,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. BẢNG PHÂN PHỐI CHƯƠNG TRÌNH (Curriculum Periods)
CREATE TABLE IF NOT EXISTS curriculum_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_level INTEGER NOT NULL CHECK(grade_level IN (6, 7, 8, 9)),
    semester INTEGER NOT NULL CHECK(semester IN (1, 2)),
    period_number INTEGER NOT NULL,
    topic_name VARCHAR(150) NOT NULL,
    lesson_title VARCHAR(255) NOT NULL,
    nls_ai_spec TEXT,
    UNIQUE(grade_level, semester, period_number)
);

-- 5. BẢNG BÀI GIẢNG (Lessons)
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES curriculum_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE
);

-- 6. BẢNG BƯỚC BÀI GIẢNG 4 PHA (Lesson Steps)
CREATE TABLE IF NOT EXISTS lesson_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    phase_number INTEGER NOT NULL CHECK(phase_number IN (1, 2, 3, 4)),
    kind VARCHAR(20) NOT NULL CHECK(kind IN ('lecture', 'quiz', 'notebook', 'video')),
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    slide_color VARCHAR(100) DEFAULT 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    video_url TEXT,
    video_stop_at VARCHAR(10),
    video_prompt TEXT,
    points INTEGER DEFAULT 0,
    tip_text TEXT,
    is_notebook BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- 7. BẢNG NGÂN HÀNG CÂU HỎI & AI (Questions)
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER,
    step_id INTEGER,
    question_type VARCHAR(20) DEFAULT 'single' CHECK(question_type IN ('single', 'multiple', 'true_false', 'essay')),
    prompt TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_idx INTEGER NOT NULL,
    ai_explanation TEXT,
    is_ai_generated BOOLEAN DEFAULT 0,
    ocr_source TEXT,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (step_id) REFERENCES lesson_steps(id) ON DELETE SET NULL
);

-- 8. BẢNG PHIÊN ĐẤU TRƯỜNG MÁY CHIẾU (Arena Sessions)
CREATE TABLE IF NOT EXISTS arena_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pin_code VARCHAR(10) NOT NULL,
    lesson_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'lobby' CHECK(status IN ('lobby', 'active', 'podium', 'ended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE
);

-- 9. BẢNG HỌC SINH THAM GIA ĐẤU TRƯỜNG (Arena Participants)
CREATE TABLE IF NOT EXISTS arena_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER,
    nickname VARCHAR(100) NOT NULL,
    avatar_seed VARCHAR(50) DEFAULT 'Student',
    total_score INTEGER DEFAULT 0,
    rank_pos INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES arena_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE SET NULL
);

-- 10. BẢNG ĐÁP ÁN NỘP TRỰC TIẾP TRONG ĐẤU TRƯỜNG (Arena Answers)
CREATE TABLE IF NOT EXISTS arena_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    participant_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    selected_choice INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_ms INTEGER NOT NULL,
    awarded_points INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES arena_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES arena_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES lesson_steps(id) ON DELETE CASCADE
);

-- 11. BẢNG BÀI KIỂM TRA PHÒNG MÁY (Exam Submissions)
CREATE TABLE IF NOT EXISTS exam_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    exam_title VARCHAR(255) NOT NULL,
    score_part1 REAL DEFAULT 0.0,
    score_part2 REAL DEFAULT 0.0,
    score_part3 REAL DEFAULT 0.0,
    essay_submission TEXT,
    teacher_feedback TEXT,
    tab_switch_count INTEGER DEFAULT 0,
    penalty_deduction REAL DEFAULT 0.0,
    final_score REAL DEFAULT 0.0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

-- 12. BẢNG NHẬT KÝ CHỐNG GIAN LẬN (Anti-Cheat Logs)
CREATE TABLE IF NOT EXISTS anti_cheat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    duration_sec INTEGER DEFAULT 1,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES exam_submissions(id) ON DELETE CASCADE
);

-- 13. BẢNG GHI CHÚ THÔNG MINH CỦA HỌC SINH (Student Notes)
CREATE TABLE IF NOT EXISTS student_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    timestamp_mark VARCHAR(20) NOT NULL,
    note_content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- 14. BẢNG HUY HIỆU GAMIFICATION (Student Badges)
CREATE TABLE IF NOT EXISTS student_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    badge_key VARCHAR(50) NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
    UNIQUE(student_id, badge_key)
);

-- INDEXES CHO TRUY VẤN TỐC ĐỘ CAO
CREATE INDEX IF NOT EXISTS idx_steps_lesson ON lesson_steps(lesson_id, step_number);
CREATE INDEX IF NOT EXISTS idx_steps_phase ON lesson_steps(lesson_id, phase_number);
CREATE INDEX IF NOT EXISTS idx_arena_pin ON arena_sessions(pin_code, status);
CREATE INDEX IF NOT EXISTS idx_exam_student ON exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lookup ON curriculum_periods(grade_level, semester, period_number);
