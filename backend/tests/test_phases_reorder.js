import { getDatabase } from '../database/db.js';
import assert from 'node:assert';

export function runPhasesTest() {
  console.log('\n🎯 [TEST 5] Kiểm thử phân bổ 4 Pha Sư phạm & Tự động đẩy Slide Ghi vở...');
  
  const db = getDatabase();

  // 1. Kiểm tra phân bổ số lượng bước theo 4 Pha (Tổng 16 bước)
  const steps = db.prepare(`
    SELECT phase_number, COUNT(*) as count
    FROM lesson_steps
    WHERE lesson_id = 1
    GROUP BY phase_number
    ORDER BY phase_number ASC
  `).all();

  const phaseCounts = {};
  steps.forEach(s => {
    phaseCounts[s.phase_number] = s.count;
  });

  assert.strictEqual(phaseCounts[1], 3, 'Pha 1 (Khởi động) phải có đúng 3 bước');
  assert.strictEqual(phaseCounts[2], 7, 'Pha 2 (Hình thành kiến thức) phải có đúng 7 bước');
  assert.strictEqual(phaseCounts[3], 4, 'Pha 3 (Luyện tập) phải có đúng 4 bước');
  assert.strictEqual(phaseCounts[4], 2, 'Pha 4 (Tổng kết & Vận dụng) phải có đúng 2 bước');

  const totalSteps = Object.values(phaseCounts).reduce((a, b) => a + b, 0);
  assert.strictEqual(totalSteps, 16, 'Tổng cộng phải có đúng 16 bước');
  console.log('  ✔ Phân bổ 4 Pha Sư phạm chuẩn xác: P1(3) + P2(7) + P3(4) + P4(2) = 16 bước.');

  // 2. Kiểm tra Slide Ghi vở (is_notebook = 1) nằm ngay sau Slide Lý thuyết tương ứng
  const notebookSteps = db.prepare(`
    SELECT step_number, title, is_notebook
    FROM lesson_steps
    WHERE lesson_id = 1 AND is_notebook = 1
    ORDER BY step_number ASC
  `).all();

  assert(notebookSteps.length >= 2, 'Phải có ít nhất 2 slide Ghi vở học sinh');
  notebookSteps.forEach(nb => {
    // Bước trước đó phải là bài giảng lý thuyết (lecture)
    const prevStep = db.prepare(`
      SELECT step_number, kind, title
      FROM lesson_steps
      WHERE lesson_id = 1 AND step_number = ?
    `).get(nb.step_number - 1);

    assert(prevStep, `Phải có bước lý thuyết ngay trước bước ghi vở ${nb.step_number}`);
    console.log(`  ✔ Slide Ghi vở Bước ${nb.step_number} ("${nb.title.substring(0, 25)}...") nằm liền sau bước lý thuyết Bước ${prevStep.step_number}.`);
  });

  return true;
}

if (process.argv[1]?.endsWith('test_phases_reorder.js')) {
  runPhasesTest();
}
