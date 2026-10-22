import { getDatabase } from '../database/db.js';
import assert from 'node:assert';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function runExcelExportTest() {
  console.log('\n📥 [TEST 4] Kiểm thử xuất file Excel Unicode UTF-8 with BOM (\\uFEFF)...');
  
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT s.student_code, u.full_name, s.class_name, e.score_part1, e.score_part2, e.score_part3, e.tab_switch_count, e.final_score
    FROM exam_submissions e
    JOIN students s ON e.student_id = s.user_id
    JOIN users u ON s.user_id = u.id
    ORDER BY s.student_code ASC
  `).all();

  // Bắt buộc có ký tự \uFEFF ở đầu file CSV/Excel để Microsoft Excel hiển thị đúng tiếng Việt
  let csv = '\uFEFF';
  csv += 'STT,Mã Học Sinh,Họ và Tên,Lớp,Phần I (Trắc nghiệm),Phần II (Đúng/Sai),Phần III (Tự luận),Gian lận Rời Tab,Tổng Điểm\n';

  rows.forEach((r, idx) => {
    csv += `${idx + 1},${r.student_code},"${r.full_name}",${r.class_name},${r.score_part1},${r.score_part2},${r.score_part3},${r.tab_switch_count},${r.final_score}\n`;
  });

  const testFilePath = join(__dirname, 'test_export_bang_diem.csv');
  writeFileSync(testFilePath, csv, 'utf-8');

  // Đọc lại file dưới dạng buffer nhị phân để kiểm tra BOM
  const fileBuffer = readFileSync(testFilePath);
  
  // UTF-8 BOM gồm 3 bytes: 0xEF, 0xBB, 0xBF
  assert.strictEqual(fileBuffer[0], 0xEF, 'Byte đầu tiên phải là 0xEF (BOM)');
  assert.strictEqual(fileBuffer[1], 0xBB, 'Byte thứ hai phải là 0xBB (BOM)');
  assert.strictEqual(fileBuffer[2], 0xBF, 'Byte thứ ba phải là 0xBF (BOM)');

  // Kiểm tra chuỗi chứa tiếng Việt
  const contentStr = fileBuffer.toString('utf-8');
  assert(contentStr.includes('Nguyễn Quang Minh'), 'Phải chứa tên học sinh có dấu tiếng Việt chuẩn');
  assert(contentStr.includes('Trắc nghiệm'), 'Phải chứa tiêu đề cột tiếng Việt chuẩn');
  assert(contentStr.includes('Gian lận Rời Tab'), 'Phải có cột giám sát gian lận');

  console.log(`  ✔ Xác nhận tệp CSV/Excel có chứa UTF-8 BOM chuẩn (0xEF 0xBB 0xBF) và hiển thị hoàn hảo dấu tiếng Việt Unicode.`);

  // Dọn dẹp tệp test
  if (existsSync(testFilePath)) {
    unlinkSync(testFilePath);
  }

  return true;
}

if (process.argv[1]?.endsWith('test_excel_export.js')) {
  runExcelExportTest();
}
