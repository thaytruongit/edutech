import { runSchemaTest } from './tests/test_schema.js';
import { runQuickSaveTest } from './tests/test_quick_save.js';
import { runGradebookTest } from './tests/test_gradebook.js';
import { runExcelExportTest } from './tests/test_excel_export.js';
import { runPhasesTest } from './tests/test_phases_reorder.js';
import { performance } from 'node:perf_hooks';

console.log('================================================================');
console.log('🚀 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)');
console.log('Hệ thống: Học Tốt! / EduCraft Studio - Tin học THCS');
console.log('================================================================');

const startTime = performance.now();
let passedCount = 0;
let totalTests = 5;

try {
  runSchemaTest();
  passedCount++;

  runQuickSaveTest();
  passedCount++;

  runGradebookTest();
  passedCount++;

  runExcelExportTest();
  passedCount++;

  runPhasesTest();
  passedCount++;

  const endTime = performance.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(3);

  console.log('\n================================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedCount}/${totalTests} BÀI TEST ĐẠT ĐIỂM TUYỆT ĐỐI (PASSED)`);
  console.log(`⏱️ Tổng thời gian chạy: ${totalDuration} giây`);
  console.log('Tất cả các ràng buộc CSDL, quy tắc 4 pha, tốc độ lưu <0.3s và mã hóa Unicode');
  console.log('đều hoạt động hoàn hảo và sẵn sàng phục vụ giảng dạy!');
  console.log('================================================================');

  process.exit(0);
} catch (error) {
  console.error('\n❌ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
