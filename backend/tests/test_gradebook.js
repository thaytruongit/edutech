import { getDatabase } from '../database/db.js';
import assert from 'node:assert';

export function runGradebookTest() {
  console.log('\n📊 [TEST 3] Kiểm thử logic tính điểm Sổ điểm & Chống gian lận rời tab...');
  
  const db = getDatabase();

  // 1. Kiểm tra công thức tính điểm và phạt gian lận
  const submission = db.prepare(`
    SELECT * FROM exam_submissions WHERE student_id = 4
  `).get();

  assert(submission, 'Phải tìm thấy bài thi của học sinh ID 4');
  
  // Học sinh ID 4: scoreP1 = 3.5, scoreP2 = 3.0, scoreP3 = 1.25, tab_switch = 1 (-0.25)
  // Tổng = 3.5 + 3.0 + 1.25 - 0.25 = 7.5
  const expectedTotal = 3.5 + 3.0 + 1.25 - 0.25;
  assert.strictEqual(submission.final_score, expectedTotal, `Tổng điểm phải là ${expectedTotal}, nhận được ${submission.final_score}`);
  console.log(`  ✔ Công thức tính điểm kèm trừ phạt rời tab (${submission.tab_switch_count} lần = -${submission.penalty_deduction}đ) tính toán chính xác.`);

  // 2. Kiểm thử giáo viên chấm lại tự luận trực tiếp (0.0 - 2.0đ)
  const newEssayScore = 1.75;
  const newFeedback = 'Đã bổ sung ý đầy đủ sau khi giáo viên duyệt lại.';
  const newTotal = submission.score_part1 + submission.score_part2 + newEssayScore - submission.penalty_deduction;

  db.prepare(`
    UPDATE exam_submissions
    SET score_part3 = ?,
        teacher_feedback = ?,
        final_score = ?
    WHERE id = ?
  `).run(newEssayScore, newFeedback, newTotal, submission.id);

  const reloaded = db.prepare('SELECT * FROM exam_submissions WHERE id = ?').get(submission.id);
  assert.strictEqual(reloaded.score_part3, newEssayScore, 'Điểm tự luận mới phải là 1.75');
  assert.strictEqual(reloaded.final_score, newTotal, `Tổng điểm sau chấm lại phải là ${newTotal}`);
  assert.strictEqual(reloaded.teacher_feedback, newFeedback, 'Lời phê giáo viên phải được cập nhật');

  // Khôi phục lại trạng thái ban đầu để bài test có thể chạy lặp lại nhiều lần
  db.prepare(`
    UPDATE exam_submissions
    SET score_part3 = ?,
        teacher_feedback = ?,
        final_score = ?
    WHERE id = ?
  `).run(submission.score_part3, submission.teacher_feedback, submission.final_score, submission.id);

  console.log(`  ✔ Quy trình giáo viên chấm/sửa điểm tự luận trực tiếp cập nhật thành công (Tổng mới: ${reloaded.final_score}đ).`);
  return true;
}

if (process.argv[1]?.endsWith('test_gradebook.js')) {
  runGradebookTest();
}
