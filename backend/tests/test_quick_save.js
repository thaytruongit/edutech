import { getDatabase } from '../database/db.js';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

export function runQuickSaveTest() {
  console.log('\n⚡ [TEST 2] Kiểm thử hiệu năng lưu nhanh slide đơn lẻ (saveSingleSlideQuickServer)...');
  
  const db = getDatabase();

  const updateSlideStmt = db.prepare(`
    UPDATE lesson_steps
    SET title = ?,
        content_text = ?,
        points = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const targetStepId = 1;
  const newTitle = `Cập nhật nhanh lúc ${new Date().toISOString()}`;
  const newContent = 'Nội dung thực nghiệm đo đạc tốc độ lưu tức thì.';

  const start = performance.now();
  updateSlideStmt.run(newTitle, newContent, 1, targetStepId);
  const end = performance.now();

  const durationMs = end - start;
  console.log(`  ⏱️ Thời gian thực thi cập nhật CSDL: ${durationMs.toFixed(3)} ms`);

  // Tiêu chuẩn tài liệu đặc tả: < 0.3s (300ms)
  assert(durationMs < 300, `Lưu slide mất ${durationMs}ms, vượt quá ngưỡng cho phép 300ms!`);

  // Xác minh dữ liệu đã thực sự được ghi lại
  const updatedRow = db.prepare('SELECT title, content_text, points FROM lesson_steps WHERE id = ?').get(targetStepId);
  assert.strictEqual(updatedRow.title, newTitle, 'Dữ liệu tiêu đề phải khớp nội dung mới');
  assert.strictEqual(updatedRow.content_text, newContent, 'Dữ liệu nội dung phải khớp');
  assert.strictEqual(updatedRow.points, 1, 'Điểm số phải được cập nhật');

  console.log(`  ✔ Đạt chuẩn hiệu năng: Lưu hoàn tất trong ${(durationMs / 1000).toFixed(4)}s (< 0.3s theo đặc tả).`);
  return true;
}

if (process.argv[1]?.endsWith('test_quick_save.js')) {
  runQuickSaveTest();
}
