// OCR / phân tích tài liệu: dùng Gemini nếu có GEMINI_API_KEY, ngược lại trả dữ liệu mock.
import fs from 'node:fs';

const MIME = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

export function mockSlides(name) {
  return [
    { type: 'lecture', title: `Mở đầu: ${name}`, content: 'Giới thiệu mục tiêu bài học và kiến thức cần nhớ.' },
    { type: 'lecture', title: 'Nội dung trọng tâm', content: 'Các khái niệm chính được trích xuất từ tài liệu.' },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      question: 'Hàm nào dùng để tính tổng trong bảng tính?',
      options: [
        { key: 'A', text: 'SUM', correct: true },
        { key: 'B', text: 'IF', correct: false },
        { key: 'C', text: 'COUNT', correct: false },
        { key: 'D', text: 'AVERAGE', correct: false }
      ],
      correctKey: 'A'
    }
  ];
}

export function mockExam(name) {
  return {
    title: `Đề kiểm tra từ ${name}`,
    duration: 15,
    questions: [1, 2, 3].map((i) => ({
      id: i,
      question: `Câu ${i}: Nội dung câu hỏi trích xuất từ tệp (mock).`,
      options: [
        { key: 'A', text: 'Đáp án A', correct: i % 4 === 1 },
        { key: 'B', text: 'Đáp án B', correct: i % 4 === 2 },
        { key: 'C', text: 'Đáp án C', correct: i % 4 === 3 },
        { key: 'D', text: 'Đáp án D', correct: false }
      ],
      correctKey: ['A', 'B', 'C'][i - 1]
    }))
  };
}

async function callGemini(filePath, ext, prompt, apiKey) {
  const data = fs.readFileSync(filePath).toString('base64');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: MIME[ext] || 'application/pdf', data } }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  return JSON.parse(json.candidates[0].content.parts[0].text);
}

export async function extract(kind, filePath, originalName, ext, apiKey) {
  const mock = kind === 'exam' ? mockExam(originalName) : mockSlides(originalName);
  if (!apiKey) return { source: 'mock', result: mock };
  const prompt =
    kind === 'exam'
      ? 'Trích xuất đề thi trắc nghiệm thành JSON {title,duration,questions:[{id,question,options:[{key,text,correct}],correctKey}]}. Tiếng Việt.'
      : 'Chuyển tài liệu thành mảng JSON slide [{type:"lecture"|"quiz",title,content,question,options:[{key,text,correct}],correctKey}]. Tiếng Việt.';
  try {
    return { source: 'gemini', result: await callGemini(filePath, ext, prompt, apiKey) };
  } catch (e) {
    return { source: 'mock', result: mock, warning: e.message };
  }
}
