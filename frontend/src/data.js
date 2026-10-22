// Dữ liệu mẫu chuẩn kiến thức Tin học THCS (Khối 6, 7, 8, 9) tích hợp Năng lực số & AI
export const pedagogicalStepsData = [
  // PHA 1: KHỞI ĐỘNG (3 bước)
  {
    id: 1,
    phase: 1,
    phaseName: "Pha 1: Khởi động",
    kind: "lecture",
    title: "Khởi động: Thử thách tính toán thủ công vs Bảng tính tự động",
    typeBadge: "Slide Mở đầu",
    points: 0,
    slideColor: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    content: "Quan sát bảng điểm lớp 8A với 45 học sinh. Hãy so sánh thời gian tính trung bình cộng bằng máy tính cầm tay so với dùng phần mềm bảng tính.",
    tip: "Học sinh trao đổi cặp đôi 2 phút để nhận thấy ưu thế vượt trội của bảng tính điện tử."
  },
  {
    id: 2,
    phase: 1,
    phaseName: "Pha 1: Khởi động",
    kind: "quiz",
    title: "Khởi động nhanh: Nhận diện biểu tượng phần mềm",
    typeBadge: "Câu hỏi tương tác (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #047857, #10b981)",
    question: "Biểu tượng nào dưới đây là của phần mềm bảng tính thông dụng nhất?",
    options: ["Microsoft Word", "Microsoft Excel", "PowerPoint", "Paint"],
    correct: 1,
    tip: "Thời gian trả lời: 30 giây. Đếm ngược trên máy chiếu."
  },
  {
    id: 3,
    phase: 1,
    phaseName: "Pha 1: Khởi động",
    kind: "video",
    title: "Video tình huống: Ứng dụng bảng tính trong thực tế đời sống",
    typeBadge: "Video ngắt đoạn",
    points: 0,
    slideColor: "linear-gradient(135deg, #b45309, #f59e0b)",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    content: "Video minh họa kế toán trường học quản lý học phí và thống kê ngân sách tự động.",
    tip: "Mốc dừng thảo luận tại 01:45: Nêu các thông tin hiển thị trên bảng thống kê."
  },

  // PHA 2: HÌNH THÀNH KIẾN THỨC (7 bước)
  {
    id: 4,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "lecture",
    title: "Khám phá 1: Cấu trúc địa chỉ ô tính và khối ô tính",
    typeBadge: "Lý thuyết trực quan",
    points: 0,
    slideColor: "linear-gradient(135deg, #1e293b, #334155)",
    content: "Ô tính được giao giữa Cột (chữ cái A, B, C...) và Hàng (chữ số 1, 2, 3...). Khối ô tính được ký hiệu từ Ô đầu : Ô cuối (ví dụ: A1:D10).",
    tip: "Giáo viên thao tác mẫu trên máy chiếu để học sinh quan sát thanh công thức."
  },
  {
    id: 5,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "notebook",
    title: "Ghi vở trọng tâm: Cách gọi tên ô và khối ô",
    typeBadge: "Ghi vở học sinh",
    points: 0,
    slideColor: "linear-gradient(135deg, #4338ca, #6366f1)",
    content: "Ghi nhớ:\n- Tên ô = Tên cột + Tên hàng (VD: B5, C12)\n- Khối ô = Ô góc trên trái : Ô góc dưới phải (VD: B2:D8)",
    tip: "Học sinh ghi vào vở bài học trong 3 phút."
  },
  {
    id: 6,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "lecture",
    title: "Khám phá 2: Phân biệt địa chỉ tương đối & tuyệt đối",
    typeBadge: "Lý thuyết cốt lõi",
    points: 0,
    slideColor: "linear-gradient(135deg, #0e7490, #06b6d4)",
    content: "Địa chỉ tương đối (A1) tự động dịch chuyển khi sao chép. Địa chỉ tuyệt đối ($A$1) được cố định nhờ dấu đô la $ trước tên cột và hàng.",
    tip: "Trọng tâm bài học: Nhấn mạnh phím tắt F4 để chuyển đổi nhanh giữa các loại địa chỉ."
  },
  {
    id: 7,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "quiz",
    title: "Kiểm tra nhanh: Ý nghĩa của dấu $ trong địa chỉ ô",
    typeBadge: "Trắc nghiệm tương tác (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
    question: "Trong công thức =B2*$C$1, khi sao chép công thức xuống hàng dưới, địa chỉ nào sẽ thay đổi?",
    options: ["B2 đổi thành B3, còn $C$1 giữ nguyên", "Cả hai địa chỉ đều đổi", "Cả hai đều giữ nguyên", "B2 giữ nguyên, $C$1 đổi"],
    correct: 0,
    tip: "AI tự động chấm và hiển thị tỉ lệ phần trăm học sinh trả lời đúng."
  },
  {
    id: 8,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "lecture",
    title: "Khám phá 3: Các hàm thống kê cơ bản SUM, AVERAGE, MAX, MIN",
    typeBadge: "Lý thuyết hàm",
    points: 0,
    slideColor: "linear-gradient(135deg, #15803d, #22c55e)",
    content: "Cú pháp chuẩn: =TÊN_HÀM(danh_sách_đối_số)\nVí dụ: =SUM(C2:C10) tính tổng, =AVERAGE(C2:C10) tính trung bình cộng.",
    tip: "Khắc sâu quy tắc: Mọi công thức và hàm trong Excel bắt buộc phải bắt đầu bằng dấu bằng (=)."
  },
  {
    id: 9,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "notebook",
    title: "Ghi vở trọng tâm: Cú pháp và ý nghĩa 4 hàm tính toán",
    typeBadge: "Ghi vở học sinh",
    points: 0,
    slideColor: "linear-gradient(135deg, #3730a3, #4f46e5)",
    content: "1. =SUM(khoi): Tính tổng các số\n2. =AVERAGE(khoi): Tính trung bình\n3. =MAX(khoi): Tìm giá trị lớn nhất\n4. =MIN(khoi): Tìm giá trị nhỏ nhất",
    tip: "Học sinh đóng khung 4 hàm vào sổ tay tin học."
  },
  {
    id: 10,
    phase: 2,
    phaseName: "Pha 2: Hình thành kiến thức",
    kind: "lecture",
    title: "Tích hợp Năng lực AI: Dùng AI gợi ý công thức bảng tính",
    typeBadge: "Tích hợp AI & NLS",
    points: 0,
    slideColor: "linear-gradient(135deg, #701a75, #a21caf)",
    content: "Hướng dẫn học sinh đặt câu lệnh (prompt) hỏi AI cách viết hàm điều kiện =IF kết hợp =AND để xếp loại học lực học sinh tự động.",
    tip: "Rèn luyện phẩm chất đạo đức số: Kiểm chứng kết quả do AI gợi ý trước khi áp dụng."
  },

  // PHA 3: LUYỆN TẬP (4 bước)
  {
    id: 11,
    phase: 3,
    phaseName: "Pha 3: Luyện tập",
    kind: "quiz",
    title: "Thực hành 1: Tính tiền giảm giá sản phẩm",
    typeBadge: "Luyện tập trắc nghiệm (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #be123c, #f43f5e)",
    question: "Ô D2 chứa Đơn giá, ô E1 chứa Tỉ lệ thuế VAT (10%). Công thức tính tiền thuế tại ô E2 sao cho copy xuống dưới vẫn đúng là:",
    options: ["=D2*E1", "=D2*$E$1", "=$D$2*E1", "=D2*10%"],
    correct: 1,
    tip: "Học sinh bấm gửi đáp án trên thiết bị cá nhân."
  },
  {
    id: 12,
    phase: 3,
    phaseName: "Pha 3: Luyện tập",
    kind: "quiz",
    title: "Thực hành 2: Sửa lỗi hiển thị #NAME? trong bảng tính",
    typeBadge: "Luyện tập trắc nghiệm (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #c2410c, #ea580c)",
    question: "Khi nhập công thức =SAM(A1:A5) bảng tính báo lỗi #NAME?. Nguyên nhân chính là gì?",
    options: ["Chia cho số 0", "Viết sai tên hàm SUM thành SAM", "Độ rộng cột quá hẹp", "Dữ liệu dạng văn bản"],
    correct: 1,
    tip: "Gợi ý: Kiểm tra chính tả tên hàm tiếng Anh."
  },
  {
    id: 13,
    phase: 3,
    phaseName: "Pha 3: Luyện tập",
    kind: "quiz",
    title: "Thực hành 3: Tìm điểm thi cao nhất khối",
    typeBadge: "Luyện tập trắc nghiệm (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    question: "Muốn tìm điểm Tin học cao nhất của các bạn học sinh từ ô C2 đến C45, em nhập lệnh nào?",
    options: ["=HIGH(C2:C45)", "=TOP(C2:C45)", "=MAX(C2:C45)", "=MAXIMUM(C2:C45)"],
    correct: 2,
    tip: "Hàm MAX trả về giá trị số lớn nhất trong khối ô."
  },
  {
    id: 14,
    phase: 3,
    phaseName: "Pha 3: Luyện tập",
    kind: "lecture",
    title: "Sửa bài tập chung: Các lỗi thường gặp khi dùng hàm",
    typeBadge: "Chữa bài trực tiếp",
    points: 0,
    slideColor: "linear-gradient(135deg, #0f766e, #14b8a6)",
    content: "Tổng hợp biểu đồ kết quả: 85% học sinh trả lời đúng cả 3 câu thực hành. Giáo viên giải đáp thắc mắc về lỗi tham chiếu vòng.",
    tip: "Khen ngợi các nhóm có tốc độ trả lời chính xác cao nhất."
  },

  // PHA 4: TỔNG KẾT & VẬN DỤNG (2 bước)
  {
    id: 15,
    phase: 4,
    phaseName: "Pha 4: Tổng kết",
    kind: "quiz",
    title: "Vận dụng thực tế: Thiết lập bảng kế hoạch chi tiêu gia đình",
    typeBadge: "Vận dụng đánh giá (1đ)",
    points: 1,
    slideColor: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    question: "Để tính số tiền tiết kiệm còn lại sau khi trừ chi tiêu khỏi thu nhập, công thức nào đúng?",
    options: ["=Thu_nhập + Chi_tiêu", "=Thu_nhập - Chi_tiêu", "=AVERAGE(Thu_nhập, Chi_tiêu)", "=SUM(Thu_nhập : Chi_tiêu)"],
    correct: 1,
    tip: "Bài toán thực tế phục vụ quản lý tài chính cá nhân thông minh."
  },
  {
    id: 16,
    phase: 4,
    phaseName: "Pha 4: Tổng kết",
    kind: "notebook",
    title: "Nhiệm vụ về nhà & Vinh danh học sinh tích cực",
    typeBadge: "Dặn dò & Bế mạc",
    points: 0,
    slideColor: "linear-gradient(135deg, #0369a1, #0284c7)",
    content: "1. Tự hoàn thành bảng tính chi tiêu cá nhân trong 1 tuần.\n2. Luyện tập thêm 10 câu trắc nghiệm trên hệ thống Học Tốt!.\n3. Chuẩn bị Tiết 8: Tạo biểu đồ cột và hình tròn.",
    tip: "Bấm kết thúc để mở Bục vinh danh Top 3 Podium trên máy chiếu."
  }
];

// Danh sách câu hỏi luyện tập tự học (Duolingo style)
export const practiceQuizList = [
  {
    id: 6,
    question: "Trong bảng tính Excel, địa chỉ ô nào sau đây là địa chỉ ô tuyệt đối?",
    options: ["A1", "$A1", "$A$1", "A$1"],
    correct: 2,
    explain: "Ký hiệu $ trước cả tên cột và chỉ số hàng ($A$1) tạo thành địa chỉ ô tuyệt đối cố định khi sao chép công thức."
  },
  {
    id: 7,
    question: "Muốn tính tổng các giá trị trong khối ô từ B2 đến B15, công thức đúng là gì?",
    options: ["=SUM(B2:B15)", "=TOTAL(B2..B15)", "=SUM(B2-B15)", "=AVERAGE(B2:B15)"],
    correct: 0,
    explain: "Hàm =SUM(B2:B15) dùng dấu hai chấm (:) để phân cách điểm đầu và điểm cuối của khối ô tính."
  },
  {
    id: 8,
    question: "Phím tắt nào trên bàn phím dùng để chuyển đổi nhanh giữa địa chỉ tương đối và tuyệt đối?",
    options: ["F2", "F4", "F8", "F12"],
    correct: 1,
    explain: "Phím F4 giúp tự động thêm hoặc bỏ các ký tự $ quanh tên ô tính một cách nhanh chóng."
  }
];

// Danh sách học sinh tham gia phòng máy / đấu trường
export const liveStudentsList = [
  { id: "HS01", name: "Nguyễn Quang Minh", class: "8A1", avatar: "👦", scoreP1: 4.0, scoreP2: 3.5, scoreP3: 1.75, tabSwitches: 0, total: 9.25, essay: "Dùng hàm AVERAGE giúp tính trung bình nhanh và tự cập nhật khi sửa điểm." },
  { id: "HS02", name: "Trần Lan Anh", class: "8A1", avatar: "👧", scoreP1: 4.0, scoreP2: 4.0, scoreP3: 1.5, tabSwitches: 0, total: 9.5, essay: "Hàm AVERAGE tự động bỏ qua các ô trống hoặc văn bản, tránh sai số thủ công." },
  { id: "HS03", name: "Lê Hoàng Long", class: "8A1", avatar: "🧒", scoreP1: 3.5, scoreP2: 3.0, scoreP3: 1.25, tabSwitches: 1, total: 7.75, essay: "Thao tác: gõ dấu bằng, tên hàm và chọn vùng cần tính rồi enter." },
  { id: "HS04", name: "Phạm Thúy Mai", class: "8A1", avatar: "👧", scoreP1: 4.0, scoreP2: 3.5, scoreP3: 2.0, tabSwitches: 0, total: 9.5, essay: "Sử dụng hàm là nền tảng để tự động hóa bảng tính trong quản lý tài chính doanh nghiệp." },
  { id: "HS05", name: "Đỗ Quốc Tuấn", class: "8A1", avatar: "👦", scoreP1: 3.0, scoreP2: 2.5, scoreP3: 1.0, tabSwitches: 2, total: 6.5, essay: "Hàm tính toán nhanh hơn cách cộng bằng tay." },
  { id: "HS06", name: "Vũ Phương Linh", class: "8A1", avatar: "👧", scoreP1: 4.0, scoreP2: 4.0, scoreP3: 1.75, tabSwitches: 0, total: 9.75, essay: "Cú pháp =AVERAGE(number1, [number2]...). Hàm giúp tiết kiệm 90% thời gian khi tính dữ liệu lớn." },
  { id: "HS07", name: "Bùi Đức Bảo", class: "8A1", avatar: "🧒", scoreP1: 3.5, scoreP2: 3.5, scoreP3: 1.5, tabSwitches: 0, total: 8.5, essay: "Bảng tính tự động cập nhật kết quả khi thay đổi số liệu trong ô thành phần." },
  { id: "HS08", name: "Ngô Khánh Vy", class: "8A1", avatar: "👧", scoreP1: 4.0, scoreP2: 3.0, scoreP3: 1.5, tabSwitches: 0, total: 8.5, essay: "Các bước thực hiện chuẩn 3 bước như sách giáo khoa Tin học Kết nối tri thức." }
];
