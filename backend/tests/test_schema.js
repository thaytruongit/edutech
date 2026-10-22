import { getDatabase } from '../database/db.js';
import assert from 'node:assert';

export function runSchemaTest() {
  console.log('\n🔍 [TEST 1] Kiểm tra tính toàn vẹn của Database Schema (14 Bảng & Ràng buộc)...');
  
  const db = getDatabase();

  // 1. Kiểm tra đủ 14 bảng trong sqlite_master
  const requiredTables = [
    'users', 'teachers', 'students', 'curriculum_periods',
    'lessons', 'lesson_steps', 'questions', 'arena_sessions',
    'arena_participants', 'arena_answers', 'exam_submissions',
    'anti_cheat_logs', 'student_notes', 'student_badges'
  ];

  const tablesInDb = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all().map(t => t.name);

  requiredTables.forEach(table => {
    assert(tablesInDb.includes(table), `Thiếu bảng cơ sở dữ liệu: ${table}`);
  });
  console.log(`  ✔ Đã xác nhận đầy đủ ${requiredTables.length} bảng cơ sở dữ liệu chuẩn.`);

  // 2. Kiểm tra ràng buộc CHECK constraint: phase_number chỉ được từ 1 đến 4
  try {
    db.prepare(`
      INSERT INTO lesson_steps (lesson_id, step_number, phase_number, kind, title)
      VALUES (1, 99, 5, 'lecture', 'Test invalid phase')
    `).run();
    assert.fail('Ràng buộc CHECK(phase_number IN (1,2,3,4)) phải chặn giá trị 5!');
  } catch (err) {
    assert(err.message.includes('CHECK constraint failed'), 'CHECK constraint pha sư phạm hoạt động chính xác.');
    console.log('  ✔ Ràng buộc CHECK pha sư phạm (1-4) hoạt động chuẩn xác.');
  }

  // 3. Kiểm tra ràng buộc Khóa ngoại (Foreign Key)
  try {
    db.prepare(`
      INSERT INTO lesson_steps (lesson_id, step_number, phase_number, kind, title)
      VALUES (99999, 1, 1, 'lecture', 'Test non-existent lesson')
    `).run();
    assert.fail('Ràng buộc Foreign Key phải chặn lesson_id không tồn tại!');
  } catch (err) {
    assert(err.message.includes('FOREIGN KEY constraint failed'), 'Ràng buộc Foreign Key hoạt động chính xác.');
    console.log('  ✔ Ràng buộc Khóa ngoại (Foreign Keys) hoạt động chuẩn xác.');
  }

  return true;
}

if (process.argv[1]?.endsWith('test_schema.js')) {
  runSchemaTest();
}
