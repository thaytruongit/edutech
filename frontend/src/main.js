import confetti from 'canvas-confetti';
import { pedagogicalStepsData as initialSteps, liveStudentsList } from './data.js';

// =========================================================
// 1. ADVANCED STATE & BROADCAST CHANNEL (0ms Cross-Tab Sync)
// =========================================================
const SYNC_CHANNEL_NAME = 'kahoot_arena_live_sync_v9';
let syncChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this browser:', e);
}

let currentView = 'editor'; // 'editor' | 'host' | 'student'
let steps = JSON.parse(JSON.stringify(initialSteps));
let currentStepFilter = 'ALL';
let currentHostStepIdx = 1; // Step 2 (Question)
let currentHostTimer = null;
let hostTimeLeft = 20;
let soundEnabled = true;
let hostSuspenseInterval = null;

// Student State & Anti-Cheat
let studentMode = 'LIVE'; // 'LIVE' | 'ELEARNING'
let studentInfo = { name: 'Nguyễn Quang Minh', class: '8A1', pin: '689204' };
let currentElStepIdx = 0;
let elCompletedSteps = new Set();
let elCorrectCount = 0;
let studentMultiSelected = new Set();
let studentAnswerTime = 0;
let studentLastSelectedPad = -1;
let studentStreak = 1;
let tabSwitchViolations = 0;
let studentScore = 0;

// Host Word Cloud & Live Stats
let wordCloudData = {
  'Bảng tính tự động': 5,
  'Hàm SUM': 4,
  'Địa chỉ F4': 3,
  'Công thức': 3,
  'Địa chỉ tuyệt đối': 2,
  'Quản lý chi tiêu': 2
};

// Mock Saved Lessons Catalog
let savedLessonsCatalog = [
  {
    grade: 'Khối 8',
    semester: 'HK1',
    period: 'Tiết 7',
    title: 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế (Tiết 2)',
    stepsCount: 16,
    phasesSummary: 'P1 (3) • P2 (7) • P3 (4) • P4 (2)',
    updatedAt: '21/10/2026 20:30'
  },
  {
    grade: 'Khối 8',
    semester: 'HK1',
    period: 'Tiết 6',
    title: 'Bài 5: Sử dụng bảng tính giải quyết bài toán thực tế (Tiết 1)',
    stepsCount: 14,
    phasesSummary: 'P1 (2) • P2 (6) • P3 (4) • P4 (2)',
    updatedAt: '20/10/2026 14:15'
  },
  {
    grade: 'Khối 8',
    semester: 'HK1',
    period: 'Tiết 4',
    title: 'Bài 4: Sắp xếp và lọc dữ liệu trong bảng tính',
    stepsCount: 15,
    phasesSummary: 'P1 (3) • P2 (6) • P3 (4) • P4 (2)',
    updatedAt: '18/10/2026 09:00'
  },
  {
    grade: 'Khối 7',
    semester: 'HK1',
    period: 'Tiết 8',
    title: 'Bài 4: Định dạng bảng tính và căn chỉnh lề in',
    stepsCount: 12,
    phasesSummary: 'P1 (2) • P2 (5) • P3 (3) • P4 (2)',
    updatedAt: '15/10/2026 11:20'
  },
  {
    grade: 'Khối 6',
    semester: 'HK1',
    period: 'Tiết 5',
    title: 'Bài 3: Mạng có dây và mạng không dây',
    stepsCount: 14,
    phasesSummary: 'P1 (2) • P2 (6) • P3 (4) • P4 (2)',
    updatedAt: '12/10/2026 16:45'
  }
];

// =========================================================
// 2. WEB AUDIO SYNTHESIZER (Classic Kahoot Rhythm & Audio)
// =========================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      // Arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'wrong') {
      // Downward sawtooth buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'streak') {
      // Flame streak bonus chime
      [659.25, 783.99, 987.77, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } else if (type === 'cheat_alert') {
      // Warning buzzer for tab switch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn('Audio synthesis note:', err);
  }
}

// Start Kahoot Countdown Suspense Loop (Synthesized)
function startSuspenseMusic() {
  stopSuspenseMusic();
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
  let beat = 0;

  hostSuspenseInterval = setInterval(() => {
    if (!soundEnabled || hostTimeLeft <= 0) {
      stopSuspenseMusic();
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = notes[beat % notes.length];
      osc.frequency.setValueAtTime(freq, now);
      
      // Louder pulse if time is running out (<5s)
      const vol = hostTimeLeft <= 5 ? 0.08 : 0.035;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      beat++;
    } catch (e) {}
  }, hostTimeLeft <= 5 ? 300 : 500);
}

function stopSuspenseMusic() {
  if (hostSuspenseInterval) {
    clearInterval(hostSuspenseInterval);
    hostSuspenseInterval = null;
  }
}

// Toast Notification
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toastMsg');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// =========================================================
// 3. BROADCAST CHANNEL MESSAGE LISTENER (Zero Latency)
// =========================================================
function setupBroadcastChannel() {
  if (!syncChannel) return;
  syncChannel.onmessage = (event) => {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'START_GAME') {
      // Host launched question
      if (currentView === 'student' && studentMode === 'LIVE') {
        showStudentLiveScreen('pad');
        loadStudentLiveQuestion(data.stepIndex);
      }
    } else if (data.type === 'REVEAL_ANSWER') {
      // Host revealed answer
      if (currentView === 'student' && studentMode === 'LIVE') {
        onHostRevealAnswer(data.correctIdx, data.step);
      }
    } else if (data.type === 'SHOW_PODIUM') {
      // Host opened podium
      if (currentView === 'student' && studentMode === 'LIVE') {
        showStudentFinishedPodium();
      }
    } else if (data.type === 'WORDCLOUD_UPDATE') {
      // Student submitted word cloud
      if (data.word) {
        wordCloudData[data.word] = (wordCloudData[data.word] || 0) + 1;
        renderWordCloudOnHost();
      }
    } else if (data.type === 'STUDENT_SUBMIT_ANSWER') {
      // Student submitted answer in live room
      const countBadge = document.getElementById('hostAnswersCountBadge');
      if (countBadge) {
        countBadge.textContent = `Đã nộp: ${liveStudentsList.length} / ${liveStudentsList.length} học sinh`;
      }
    }
  };
}

// =========================================================
// 4. TOP NAVIGATION & VIEW SWITCHER
// =========================================================
function setView(viewName) {
  currentView = viewName;
  playSound('click');

  document.getElementById('btnTabTeacher')?.classList.toggle('active-mode', viewName === 'editor');
  document.getElementById('btnTabHost')?.classList.toggle('active-mode', viewName === 'host');
  document.getElementById('btnTabStudent')?.classList.toggle('active-mode', viewName === 'student');

  document.getElementById('editorView')?.classList.toggle('active', viewName === 'editor');
  document.getElementById('hostView')?.classList.toggle('active', viewName === 'host');
  document.getElementById('studentView')?.classList.toggle('active', viewName === 'student');

  if (viewName === 'editor') {
    renderStepsList();
  } else if (viewName === 'host') {
    initHostLobby();
  } else if (viewName === 'student') {
    if (studentMode === 'LIVE') {
      showStudentLiveScreen('login');
    } else {
      renderElearningCatalog();
    }
  }
}

function setupTopNavigation() {
  document.getElementById('btnTabTeacher')?.addEventListener('click', () => setView('editor'));
  document.getElementById('btnTabHost')?.addEventListener('click', () => setView('host'));
  document.getElementById('btnTabStudent')?.addEventListener('click', () => setView('student'));

  const soundBtn = document.getElementById('btnSoundToggle');
  soundBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    if (!soundEnabled) stopSuspenseMusic();
    showToast(soundEnabled ? '🔊 Đã bật âm thanh hiệu ứng & nhạc nền!' : '🔇 Đã tắt âm thanh.');
  });

  document.getElementById('btnCopyStudentLink')?.addEventListener('click', () => {
    const studentUrl = `${window.location.origin}${window.location.pathname}?mode=student`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(studentUrl).then(() => {
        showToast('📋 Đã sao chép link học sinh vào bộ nhớ tạm: ' + studentUrl);
      }).catch(() => {
        showToast('📋 Link học sinh: ' + studentUrl);
      });
    } else {
      showToast('📋 Link học sinh: ' + studentUrl);
    }
  });

  // Toggle Gemini AI Modal
  document.getElementById('btnToggleGemini')?.addEventListener('click', () => {
    const modal = document.getElementById('geminiModal');
    modal?.classList.remove('hidden');
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const keyInput = document.getElementById('geminiApiKeyInput');
    if (keyInput) keyInput.value = savedKey;
  });

  document.getElementById('btnCloseGeminiModal')?.addEventListener('click', () => {
    document.getElementById('geminiModal')?.classList.add('hidden');
  });

  document.getElementById('btnSaveGeminiKey')?.addEventListener('click', () => {
    const key = document.getElementById('geminiApiKeyInput').value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      playSound('correct');
      document.getElementById('geminiStatusMsg').textContent = '✅ Đã lưu Gemini API Key an toàn trong bộ nhớ trình duyệt!';
      showToast('🔑 Đã lưu Gemini API Key thành công!');
    }
  });

  document.getElementById('btnClearGeminiKey')?.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_key');
    document.getElementById('geminiApiKeyInput').value = '';
    document.getElementById('geminiStatusMsg').textContent = '🗑️ Đã xóa API Key khỏi bộ nhớ.';
    showToast('Đã xóa Gemini API Key.');
  });

  document.getElementById('btnRunGeminiAction')?.addEventListener('click', () => {
    runGeminiAiAction();
  });

  // Toggle Catalog Panel
  document.getElementById('btnToggleCatalog')?.addEventListener('click', () => {
    const panel = document.getElementById('catalogPanel');
    panel?.classList.toggle('hidden');
    if (!panel?.classList.contains('hidden')) {
      renderCatalogTable('ALL');
    }
  });

  document.getElementById('btnCloseCatalog')?.addEventListener('click', () => {
    document.getElementById('catalogPanel')?.classList.add('hidden');
  });

  // Toggle E-Learning Report Panel
  document.getElementById('btnToggleElearningReport')?.addEventListener('click', () => {
    const panel = document.getElementById('elearningReportPanel');
    panel?.classList.toggle('hidden');
    if (!panel?.classList.contains('hidden')) {
      renderElearningReportTable();
    }
  });

  document.getElementById('btnCloseReport')?.addEventListener('click', () => {
    document.getElementById('elearningReportPanel')?.classList.add('hidden');
  });

  // Image Zoom Overlay
  const zoomOverlay = document.getElementById('imgZoomOverlay');
  const zoomTarget = document.getElementById('imgZoomTarget');
  zoomOverlay?.addEventListener('click', () => {
    zoomOverlay.classList.remove('active');
  });

  window.openZoomImage = (src) => {
    if (zoomTarget && zoomOverlay) {
      zoomTarget.src = src;
      zoomOverlay.classList.add('active');
    }
  };
}

function runGeminiAiAction() {
  const mode = document.getElementById('geminiModeSelect').value;
  const statusEl = document.getElementById('geminiStatusMsg');
  const btn = document.getElementById('btnRunGeminiAction');

  btn.textContent = '⏳ Đang gọi Gemini AI Engine...';
  playSound('click');

  setTimeout(() => {
    btn.textContent = '🚀 Bắt Đầu Chạy AI Ngay';
    playSound('correct');
    if (mode === 'SOLVE') {
      statusEl.innerHTML = '🎯 <strong>[Gemini SOLVE]</strong> Đã suy luận đáp án chuẩn cho toàn bộ câu hỏi và tạo lời giải thích sư phạm!';
      showToast('✨ Gemini AI đã điền đáp án và lời giải sư phạm vào giáo án!');
    } else if (mode === 'CLASSIFY') {
      statusEl.innerHTML = '📑 <strong>[Gemini CLASSIFY]</strong> Đã quét OCR và phân bổ 16 slide vào 4 Pha Sư phạm chuẩn Bộ GD&ĐT!';
      showToast('✨ Gemini AI đã phân loại 4 Pha sư phạm!');
    } else {
      statusEl.innerHTML = '⚡ <strong>[Gemini ALL]</strong> Hoàn tất 100%: Quét OCR + Phân loại 4 Pha + Điền đáp án & lời giải!';
      showToast('🎉 Toàn bộ giáo án đã được Gemini AI chuẩn hóa xuất sắc!');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.3 } });
    }
    renderStepsList();
  }, 900);
}

// =========================================================
// 5. VIEW 1: TEACHER EDITOR LOGIC (4 PHASES & QUICK SAVE)
// =========================================================
function setupTeacherEditor() {
  document.querySelectorAll('#phaseBar .phase-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#phaseBar .phase-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentStepFilter = tab.dataset.phase;
      renderStepsList();
    });
  });

  document.getElementById('btnStepPeriodInc')?.addEventListener('click', () => {
    const input = document.getElementById('lessonPeriod');
    const match = input.value.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0]) + 1;
      input.value = `Tiết ${nextNum}`;
      updateCanonicalPreview();
      showToast(`⚡ Đã tăng lên Tiết ${nextNum}!`);
    }
  });

  ['lessonGrade', 'lessonSemester', 'lessonPeriod', 'topicInput'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', updateCanonicalPreview);
    document.getElementById(id)?.addEventListener('change', updateCanonicalPreview);
  });

  function updateCanonicalPreview() {
    const grade = document.getElementById('lessonGrade').value;
    const sem = document.getElementById('lessonSemester').value;
    const period = document.getElementById('lessonPeriod').value;
    const topic = document.getElementById('topicInput').value;
    const preview = document.getElementById('canonicalKeyPreview');
    if (preview) {
      preview.textContent = `[${grade} | ${sem} | ${period}] ${topic}`;
    }
  }

  // Quick Answer Batch Assignment (e.g. "B AC D BCD A")
  document.getElementById('btnApplyQuickAnswers')?.addEventListener('click', () => {
    const keyStr = document.getElementById('quickAnswerKey').value.trim();
    if (!keyStr) {
      showToast('⚠️ Vui lòng nhập chuỗi đáp án (VD: B AC D BCD A)');
      return;
    }

    const tokens = keyStr.split(/\s+/);
    let quizIdx = 0;
    let appliedCount = 0;

    steps.forEach((step) => {
      if (step.kind === 'quiz' && quizIdx < tokens.length) {
        const token = tokens[quizIdx].toUpperCase();
        if (token.length === 1) {
          const letterMap = { A: 0, B: 1, C: 2, D: 3 };
          if (letterMap[token] !== undefined) {
            step.correct = letterMap[token];
            step.type = 'QUIZ';
            appliedCount++;
          }
        } else {
          step.type = 'MULTI';
          step.correctMulti = token.split('').filter((c) => ['A', 'B', 'C', 'D'].includes(c));
          appliedCount++;
        }
        quizIdx++;
      }
    });

    renderStepsList();
    playSound('correct');
    showToast(`✅ Đã áp dụng thành công ${appliedCount} đáp án nhanh vào các bước trắc nghiệm!`);
  });

  // Add Step from unified toolbar
  document.getElementById('btnAddStep')?.addEventListener('click', () => {
    const type = document.getElementById('newStepTypeSelect').value;
    const newId = steps.length + 1;
    const isQuiz = type === 'QUIZ' || type === 'MULTI';
    const isNotebook = type === 'GHIVO';
    const isWordCloud = type === 'WORDCLOUD';

    const newStep = {
      id: newId,
      phase: 2,
      phaseName: 'Pha 2: Hình thành kiến thức',
      kind: isQuiz ? 'quiz' : isNotebook ? 'notebook' : 'lecture',
      type: type,
      title: `Bước ${newId}: ${isWordCloud ? 'Thảo luận mở & Đóng góp từ khóa' : isNotebook ? 'Ghi vở trọng tâm kiến thức' : 'Nội dung bài giảng mới'}`,
      typeBadge: type === 'QUIZ' ? 'Trắc nghiệm 1 ĐA' : type === 'MULTI' ? 'Trắc nghiệm Nhiều ĐA' : type === 'GHIVO' ? 'Ghi vở học sinh' : type === 'WORDCLOUD' ? 'Thảo luận Word Cloud' : 'Slide Bài giảng',
      points: isQuiz ? 1 : 0,
      slideColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      question: isQuiz ? 'Nội dung câu hỏi kiểm tra...' : isWordCloud ? 'Hãy nêu các từ khóa ấn tượng nhất về nội dung vừa học:' : '',
      content: isNotebook || type === 'SLIDE' ? 'Nội dung lý thuyết trọng tâm...' : '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correct: 1,
      tip: 'Nhấp chỉnh sửa trực tiếp nội dung bước này.'
    };
    steps.push(newStep);
    renderStepsList();
    playSound('click');
    showToast(`➕ Đã thêm Bước ${newId} (${newStep.typeBadge}) vào giáo án!`);
  });

  document.getElementById('btnOpenReorderModal')?.addEventListener('click', openReorderModal);
  document.getElementById('btnCloseReorder')?.addEventListener('click', () => {
    document.getElementById('reorderModal')?.classList.add('hidden');
  });

  document.getElementById('btnSaveAllSheet')?.addEventListener('click', () => {
    const btn = document.getElementById('btnSaveAllSheet');
    btn.textContent = '⏳ Đang lưu cơ sở dữ liệu...';
    playSound('click');

    setTimeout(() => {
      btn.textContent = '💾 LƯU BÀI GIẢNG & XUẤT E-LEARNING';
      const grade = document.getElementById('lessonGrade').value;
      const sem = document.getElementById('lessonSemester').value;
      const period = document.getElementById('lessonPeriod').value;
      const topic = document.getElementById('topicInput').value;

      savedLessonsCatalog.unshift({
        grade,
        semester: sem,
        period,
        title: topic,
        stepsCount: steps.length,
        phasesSummary: 'P1 (3) • P2 (7) • P3 (4) • P4 (2)',
        updatedAt: 'Vừa xong'
      });

      document.getElementById('totalSavedCount').textContent = savedLessonsCatalog.length;
      playSound('correct');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
      showToast(`🎉 Đã lưu bài giảng "${topic}" vào CSDL và tự động xuất bản lên Cổng Tự Học E-Learning!`);
    }, 450);
  });

  document.getElementById('btnSelectSlideDeck')?.addEventListener('click', () => {
    simulateUploadDeck();
  });

  document.getElementById('btnTriggerAiOcr')?.addEventListener('click', () => {
    document.getElementById('geminiModal')?.classList.remove('hidden');
  });
}

function simulateUploadDeck() {
  const pBox = document.getElementById('uploadProgressBox');
  const pText = document.getElementById('uploadProgressText');
  const pPct = document.getElementById('uploadProgressPercent');
  const pFill = document.getElementById('uploadProgressFill');

  pBox.style.display = 'block';
  let pct = 0;
  const timer = setInterval(() => {
    pct += 12;
    if (pct > 100) pct = 100;
    pPct.textContent = `${pct}%`;
    pFill.style.width = `${pct}%`;
    pText.textContent = pct < 50 ? 'Đang giải mã slide HD...' : pct < 90 ? 'Đang quét OCR chữ & ký hiệu...' : 'Hoàn tất trích xuất 16 slide!';

    if (pct >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        pBox.style.display = 'none';
        playSound('correct');
        showToast('📁 Đã tách và nạp 16 trang Slide Full HD cùng cấu trúc [A][B][C][D] vào các bước!');
      }, 500);
    }
  }, 100);
}

function renderStepsList() {
  const container = document.getElementById('stepsListContainer');
  if (!container) return;

  const filtered = steps.filter((step) => {
    if (currentStepFilter === 'ALL') return true;
    return `P${step.phase}` === currentStepFilter;
  });

  const counts = { ALL: steps.length, P1: 0, P2: 0, P3: 0, P4: 0 };
  steps.forEach((s) => {
    if (counts[`P${s.phase}`] !== undefined) counts[`P${s.phase}`]++;
  });
  document.getElementById('cntALL').textContent = counts.ALL;
  document.getElementById('cntP1').textContent = counts.P1;
  document.getElementById('cntP2').textContent = counts.P2;
  document.getElementById('cntP3').textContent = counts.P3;
  document.getElementById('cntP4').textContent = counts.P4;

  container.innerHTML = '';

  filtered.forEach((step) => {
    const card = document.createElement('div');
    card.className = `step-card phase-${step.phase}`;
    card.id = `stepCard_${step.id}`;

    const isQuiz = step.kind === 'quiz';
    const isNotebook = step.kind === 'notebook';

    const slideSvg = `
      <svg viewBox="0 0 400 225" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius:6px; cursor:zoom-in;">
        <defs>
          <linearGradient id="grad_${step.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#312e81"/>
          </linearGradient>
        </defs>
        <rect width="400" height="225" fill="url(#grad_${step.id})"/>
        <rect x="15" y="15" width="370" height="195" fill="none" stroke="#6366f1" stroke-dasharray="4" rx="6"/>
        <text x="30" y="45" fill="#facc15" font-size="14" font-weight="bold">${step.phaseName.toUpperCase()}</text>
        <text x="30" y="75" fill="#ffffff" font-size="13" font-weight="600">Bước ${step.id}: ${step.title.substring(0, 32)}...</text>
        <rect x="30" y="95" width="340" height="70" fill="#0f172a" rx="4"/>
        <text x="45" y="125" fill="#94a3b8" font-size="11">${isQuiz ? '❓ ' + (step.question || 'Câu hỏi trắc nghiệm').substring(0, 38) + '...' : isNotebook ? '📓 ' + (step.content || 'Nội dung ghi vở').substring(0, 38) + '...' : '📖 ' + (step.content || 'Lý thuyết minh họa').substring(0, 38) + '...'}</text>
        <text x="45" y="145" fill="#38bdf8" font-size="10">${isQuiz ? 'A. ... | B. ... | C. ... | D. ...' : 'Bài 5 • Bảng tính điện tử Tin học 8'}</text>
        <circle cx="360" cy="180" r="14" fill="#2563eb"/>
        <text x="360" y="184" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">B${step.id}</text>
      </svg>
    `;

    card.innerHTML = `
      <div class="step-card-header">
        <div class="step-card-badge-row">
          <span class="step-badge">BƯỚC ${step.id}</span>
          <select class="step-phase-select" data-id="${step.id}">
            <option value="1" ${step.phase === 1 ? 'selected' : ''}>Pha 1: Khởi động</option>
            <option value="2" ${step.phase === 2 ? 'selected' : ''}>Pha 2: Hình thành kiến thức</option>
            <option value="3" ${step.phase === 3 ? 'selected' : ''}>Pha 3: Luyện tập</option>
            <option value="4" ${step.phase === 4 ? 'selected' : ''}>Pha 4: Tổng kết & Vận dụng</option>
          </select>
          <span class="step-kind-pill">${step.typeBadge}</span>
          <span class="step-points-tag">${step.points > 0 ? `${step.points} Điểm` : '0 Điểm (Lý thuyết)'}</span>
        </div>
        <div class="step-card-actions">
          <button type="button" class="btn-step-act btn-quick-save" data-id="${step.id}" title="Lưu nhanh bước này (0.3s)">💾 Lưu nhanh</button>
          <button type="button" class="btn-step-act btn-move-up" data-id="${step.id}" title="Đẩy bước lên trên">⬆️</button>
          <button type="button" class="btn-step-act btn-move-down" data-id="${step.id}" title="Hạ bước xuống dưới">⬇️</button>
          <button type="button" class="btn-step-act btn-delete-step" data-id="${step.id}" title="Xóa bước này">🗑️</button>
        </div>
      </div>

      <div class="step-card-body">
        <div class="step-slide-thumb" id="slideThumb_${step.id}">
          ${slideSvg}
        </div>

        <div class="step-form-fields">
          <div class="step-field-line">
            <label>Tiêu đề bước:</label>
            <input type="text" class="input-step-title" data-id="${step.id}" value="${step.title}" />
          </div>

          ${isQuiz ? `
            <div class="step-field-line">
              <label>Câu hỏi trắc nghiệm:</label>
              <textarea class="textarea-step-q" data-id="${step.id}">${step.question || ''}</textarea>
            </div>
            <div class="step-opts-grid">
              ${(step.options || ['A', 'B', 'C', 'D']).map((opt, optIdx) => `
                <div class="step-opt-item ${step.correct === optIdx ? 'correct' : ''}">
                  <span class="opt-key-label" data-id="${step.id}" data-opt="${optIdx}">
                    ${['A', 'B', 'C', 'D'][optIdx]} ${step.correct === optIdx ? '✔' : ''}
                  </span>
                  <input type="text" class="input-step-opt" data-id="${step.id}" data-opt="${optIdx}" value="${opt}" />
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="step-field-line">
              <label>${isNotebook ? 'Nội dung ghi vở học sinh:' : 'Nội dung bài giảng / Slide:'}</label>
              <textarea class="textarea-step-q" data-id="${step.id}">${step.content || ''}</textarea>
            </div>
          `}

          <div class="step-tip-banner">
            💡 <em>Hướng dẫn sư phạm:</em> ${step.tip}
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.btn-quick-save').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      btn.textContent = '⏳ Lưu...';
      const start = performance.now();
      setTimeout(() => {
        const elapsed = (performance.now() - start).toFixed(0);
        btn.textContent = '💾 Lưu nhanh';
        playSound('correct');
        showToast(`⚡ [saveSingleSlideQuickServer] Đã lưu độc lập Bước ${id} vào SQLite Database trong ${elapsed}ms!`);
      }, 280);
    });
  });

  container.querySelectorAll('.btn-move-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      moveStep(parseInt(btn.dataset.id), -1);
    });
  });

  container.querySelectorAll('.btn-move-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      moveStep(parseInt(btn.dataset.id), 1);
    });
  });

  container.querySelectorAll('.btn-delete-step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      if (confirm(`Bạn có chắc chắn muốn xóa Bước ${id}?`)) {
        steps = steps.filter((s) => s.id !== id);
        steps.forEach((s, idx) => (s.id = idx + 1));
        renderStepsList();
        showToast(`🗑️ Đã xóa bước thành công!`);
      }
    });
  });

  container.querySelectorAll('.step-phase-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = parseInt(sel.dataset.id);
      const st = steps.find((s) => s.id === id);
      if (st) {
        st.phase = parseInt(sel.value);
        const names = {
          1: 'Pha 1: Khởi động',
          2: 'Pha 2: Hình thành kiến thức',
          3: 'Pha 3: Luyện tập',
          4: 'Pha 4: Tổng kết & Vận dụng'
        };
        st.phaseName = names[st.phase];
        renderStepsList();
        showToast(`Đã chuyển Bước ${id} sang ${st.phaseName}`);
      }
    });
  });

  container.querySelectorAll('.opt-key-label').forEach((label) => {
    label.addEventListener('click', () => {
      const id = parseInt(label.dataset.id);
      const optIdx = parseInt(label.dataset.opt);
      const st = steps.find((s) => s.id === id);
      if (st) {
        st.correct = optIdx;
        playSound('click');
        renderStepsList();
        showToast(`✅ Đã chọn phương án [${['A', 'B', 'C', 'D'][optIdx]}] làm đáp án đúng cho Bước ${id}`);
      }
    });
  });
}

function moveStep(id, direction) {
  const idx = steps.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= steps.length) return;

  const temp = steps[idx];
  steps[idx] = steps[targetIdx];
  steps[targetIdx] = temp;
  steps.forEach((s, i) => (s.id = i + 1));
  playSound('click');
  renderStepsList();
  showToast(`🔀 Đã đổi vị trí Bước ${temp.id} thành công!`);
}

function openReorderModal() {
  const modal = document.getElementById('reorderModal');
  const body = document.getElementById('reorderModalBody');
  if (!modal || !body) return;

  body.innerHTML = '';
  steps.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'reorder-item';
    item.innerHTML = `
      <div class="reorder-info">
        <span class="reorder-num">#${idx + 1}</span>
        <strong>${step.title}</strong>
        <span class="reorder-meta">${step.phaseName} • ${step.typeBadge}</span>
      </div>
      <div class="reorder-btns">
        <button type="button" class="btn btn-sm btn-outline-light btn-reorder-up" data-idx="${idx}">⬆️ Lên</button>
        <button type="button" class="btn btn-sm btn-outline-light btn-reorder-down" data-idx="${idx}">⬇️ Xuống</button>
      </div>
    `;
    body.appendChild(item);
  });

  body.querySelectorAll('.btn-reorder-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      if (idx > 0) {
        const t = steps[idx];
        steps[idx] = steps[idx - 1];
        steps[idx - 1] = t;
        steps.forEach((s, i) => (s.id = i + 1));
        openReorderModal();
        renderStepsList();
      }
    });
  });

  body.querySelectorAll('.btn-reorder-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      if (idx < steps.length - 1) {
        const t = steps[idx];
        steps[idx] = steps[idx + 1];
        steps[idx + 1] = t;
        steps.forEach((s, i) => (s.id = i + 1));
        openReorderModal();
        renderStepsList();
      }
    });
  });

  modal.classList.remove('hidden');
}

// =========================================================
// 6. VIEW 2: HOST PROJECTOR ARENA (KAHOOT STYLE)
// =========================================================
function setupHostProjector() {
  document.getElementById('btnHostStartGame')?.addEventListener('click', () => {
    startHostQuestion(1); // Start at step 2 (Question)
  });

  document.getElementById('btnHostRevealAnswer')?.addEventListener('click', () => {
    revealHostAnswer();
  });

  document.getElementById('btnHostNextStep')?.addEventListener('click', () => {
    advanceHostToNextStep();
  });

  document.getElementById('btnHostBackLobby')?.addEventListener('click', () => {
    initHostLobby();
  });

  document.getElementById('btnHostSaveToGradebook')?.addEventListener('click', () => {
    const reportPanel = document.getElementById('elearningReportPanel');
    reportPanel?.classList.remove('hidden');
    renderElearningReportTable();
    showToast('📊 Đã chuyển và đồng bộ điểm số sang Sổ Điểm Điện Tử!');
  });
}

function initHostLobby() {
  stopSuspenseMusic();
  clearInterval(currentHostTimer);
  document.getElementById('hostLobbyStage')?.classList.remove('hidden');
  document.getElementById('hostQuestionStage')?.classList.add('hidden');
  document.getElementById('hostPodiumStage')?.classList.add('hidden');

  const grid = document.getElementById('hostPlayerLobbyGrid');
  if (!grid) return;
  grid.innerHTML = '';

  liveStudentsList.forEach((st) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.innerHTML = `<span>${st.avatar}</span> <span>${st.name}</span>`;
    grid.appendChild(chip);
  });

  document.getElementById('hostPlayerCount').textContent = liveStudentsList.length;
}

function startHostQuestion(stepIndex) {
  currentHostStepIdx = stepIndex;
  const step = steps[stepIndex] || steps[1];

  document.getElementById('hostLobbyStage')?.classList.add('hidden');
  document.getElementById('hostQuestionStage')?.classList.remove('hidden');
  document.getElementById('hostPodiumStage')?.classList.add('hidden');

  document.getElementById('hostCurrentPhaseTag').textContent = step.phaseName;
  document.getElementById('hostStepCounter').textContent = `Bước ${step.id} / ${steps.length}`;
  document.getElementById('hostQuestionTitle').textContent = step.question || step.title;

  const isWordCloud = step.type === 'WORDCLOUD';
  const wcArea = document.getElementById('hostWordCloudArea');
  const optsGrid = document.getElementById('hostOptsGrid');
  
  if (isWordCloud) {
    wcArea?.classList.remove('hidden');
    optsGrid?.classList.add('hidden');
    renderWordCloudOnHost();
  } else {
    wcArea?.classList.add('hidden');
    optsGrid?.classList.remove('hidden');
  }

  // Options
  const opts = step.options || ['Microsoft Word', 'Microsoft Excel', 'PowerPoint', 'Paint'];
  opts.forEach((optText, i) => {
    const card = document.getElementById(`hostOptCard${i}`);
    const label = document.getElementById(`hostOptText${i}`);
    if (label) label.textContent = optText;
    if (card) card.classList.remove('correct-opt', 'dimmed-opt');
  });

  document.getElementById('hostChartArea')?.classList.add('hidden');
  document.getElementById('hostAiExplainBox')?.classList.add('hidden');

  const revealBtn = document.getElementById('btnHostRevealAnswer');
  revealBtn.style.display = 'inline-block';
  revealBtn.textContent = 'Chốt Đáp Án & Xem Biểu Đồ ➔';

  const nextBtn = document.getElementById('btnHostNextStep');
  nextBtn?.classList.add('hidden');

  document.getElementById('hostAnswersCountBadge').textContent = `Đã nộp: ${liveStudentsList.length} / ${liveStudentsList.length} học sinh`;

  // Start 20s countdown
  hostTimeLeft = 20;
  const timerCircle = document.getElementById('hostTimerCircle');
  if (timerCircle) timerCircle.textContent = hostTimeLeft;

  startSuspenseMusic();

  clearInterval(currentHostTimer);
  currentHostTimer = setInterval(() => {
    hostTimeLeft--;
    if (timerCircle) timerCircle.textContent = hostTimeLeft;
    if (hostTimeLeft <= 5 && hostTimeLeft > 0) {
      playSound('tick');
    }
    if (hostTimeLeft <= 0) {
      clearInterval(currentHostTimer);
      revealHostAnswer();
    }
  }, 1000);

  // Broadcast to student tabs
  if (syncChannel) {
    syncChannel.postMessage({
      type: 'START_GAME',
      stepIndex: stepIndex,
      step: step
    });
  }
}

function revealHostAnswer() {
  stopSuspenseMusic();
  clearInterval(currentHostTimer);
  const step = steps[currentHostStepIdx] || steps[1];
  const correctIdx = step.correct !== undefined ? step.correct : 1;

  for (let i = 0; i < 4; i++) {
    const card = document.getElementById(`hostOptCard${i}`);
    if (card) {
      if (i === correctIdx) {
        card.classList.add('correct-opt');
      } else {
        card.classList.add('dimmed-opt');
      }
    }
  }

  // Reveal bar chart & AI explanation
  document.getElementById('hostChartArea')?.classList.remove('hidden');
  const aiBox = document.getElementById('hostAiExplainBox');
  const aiText = document.getElementById('hostAiExplainContent');
  if (aiBox && aiText) {
    aiBox.classList.remove('hidden');
    aiText.textContent = `Phương án đúng là [${['A', 'B', 'C', 'D'][correctIdx]}]. ${step.tip || 'Kiến thức cốt lõi của chương trình Tin học Kết nối tri thức.'}`;
  }

  playSound('correct');

  // Broadcast to student tabs to reveal confidential answer
  if (syncChannel) {
    syncChannel.postMessage({
      type: 'REVEAL_ANSWER',
      correctIdx: correctIdx,
      step: step
    });
  }

  // Switch buttons: show "Bước tiếp theo ➡️"
  const revealBtn = document.getElementById('btnHostRevealAnswer');
  revealBtn.style.display = 'none';

  const nextBtn = document.getElementById('btnHostNextStep');
  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    if (currentHostStepIdx >= steps.length - 1 || currentHostStepIdx >= 3) {
      nextBtn.textContent = '🏆 Bục Vinh Danh Top 3 ➔';
    } else {
      nextBtn.textContent = 'Bước tiếp theo ➡️';
    }
  }
}

function advanceHostToNextStep() {
  if (currentHostStepIdx >= steps.length - 1 || currentHostStepIdx >= 3) {
    showHostPodium();
  } else {
    startHostQuestion(currentHostStepIdx + 1);
  }
}

function showHostPodium() {
  stopSuspenseMusic();
  document.getElementById('hostQuestionStage')?.classList.add('hidden');
  document.getElementById('hostPodiumStage')?.classList.remove('hidden');

  playSound('correct');
  confetti({
    particleCount: 160,
    spread: 100,
    origin: { y: 0.5 }
  });

  if (syncChannel) {
    syncChannel.postMessage({ type: 'SHOW_PODIUM' });
  }
}

function renderWordCloudOnHost() {
  const container = document.getElementById('hostWordCloudTags');
  if (!container) return;
  container.innerHTML = '';

  const entries = Object.entries(wordCloudData);
  entries.forEach(([word, count]) => {
    const tag = document.createElement('span');
    tag.className = 'wordcloud-tag';
    const fontSize = Math.min(28, Math.max(14, 12 + count * 3));
    tag.style.fontSize = `${fontSize}px`;
    tag.textContent = `${word} (${count})`;
    container.appendChild(tag);
  });
}

// =========================================================
// 7. VIEW 3: STUDENT APP (CONFIDENTIALITY & ANTI-CHEAT)
// =========================================================
function setupStudentView() {
  const tabLive = document.getElementById('tabLiveBtn');
  const tabEl = document.getElementById('tabElearningBtn');

  tabLive?.addEventListener('click', () => {
    tabLive.classList.add('active');
    tabEl.classList.remove('active');
    studentMode = 'LIVE';
    showStudentLiveScreen('login');
  });

  tabEl?.addEventListener('click', () => {
    tabEl.classList.add('active');
    tabLive.classList.remove('active');
    studentMode = 'ELEARNING';
    showStudentElearningScreen('portal');
    renderElearningCatalog();
  });

  document.getElementById('btnStJoinRoom')?.addEventListener('click', () => {
    const pin = document.getElementById('stPinInput').value.trim();
    const name = document.getElementById('stNameInput').value.trim();
    const cls = document.getElementById('stClassInput').value.trim();

    if (!pin || pin.length < 4) {
      document.getElementById('stErrMsg').textContent = '⚠️ Vui lòng nhập mã PIN hợp lệ!';
      return;
    }
    if (!name) {
      document.getElementById('stErrMsg').textContent = '⚠️ Vui lòng nhập họ và tên của em!';
      return;
    }

    studentInfo = { name, class: cls || '8A1', pin };
    document.getElementById('stNameDisplay').textContent = `${name} (${cls || '8A1'})`;
    playSound('click');

    showStudentLiveScreen('wait');

    // Simulate instant broadcast join
    if (syncChannel) {
      syncChannel.postMessage({ type: 'STUDENT_JOIN', student: studentInfo });
    }

    // Auto load current host question
    setTimeout(() => {
      showStudentLiveScreen('pad');
      loadStudentLiveQuestion(currentHostStepIdx);
    }, 800);
  });

  // Pads Click (Live Mode)
  for (let i = 0; i < 4; i++) {
    const pad = document.getElementById(`padBtn${i}`);
    pad?.addEventListener('click', () => {
      handleStudentPadClick(i);
    });
  }

  document.getElementById('btnSubmitMulti')?.addEventListener('click', () => {
    submitStudentMultiAnswer();
  });

  // Student Word Cloud Send
  document.getElementById('btnStSendWordCloud')?.addEventListener('click', () => {
    const input = document.getElementById('stWordCloudInput');
    const word = input.value.trim();
    if (word) {
      playSound('correct');
      wordCloudData[word] = (wordCloudData[word] || 0) + 1;
      renderWordCloudOnHost();
      if (syncChannel) {
        syncChannel.postMessage({ type: 'WORDCLOUD_UPDATE', word: word });
      }
      input.value = '';
      showToast('🚀 Đã gửi ý kiến / từ khóa thành công lên máy chiếu lớp học!');
    }
  });

  // Student Notebook Save
  document.getElementById('btnStSaveNotebook')?.addEventListener('click', () => {
    const input = document.getElementById('stNotebookInput');
    const txt = input.value.trim();
    if (txt) {
      playSound('click');
      showToast('📝 Đã lưu vào sổ tay cá nhân của học sinh!');
      input.value = '';
    }
  });

  // Anti-Cheat Window / Tab switch listener
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentView === 'student' && studentMode === 'LIVE') {
      onStudentTabSwitchViolation();
    }
  });

  window.addEventListener('blur', () => {
    if (currentView === 'student' && studentMode === 'LIVE') {
      onStudentTabSwitchViolation();
    }
  });

  // E-Learning controls
  setupElearningControls();
}

function onStudentTabSwitchViolation() {
  tabSwitchViolations++;
  playSound('cheat_alert');
  const banner = document.getElementById('stCheatWarningBanner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.innerHTML = `⚠️ <strong>CẢNH BÁO GIAN LẬN:</strong> Bạn vừa rời tab lần thứ ${tabSwitchViolations}! Hệ thống tự động trừ -${(tabSwitchViolations * 0.25).toFixed(2)}đ vào điểm tổng kết.`;
  }
}

function showStudentLiveScreen(screenName) {
  document.getElementById('studentLoginScreen')?.classList.toggle('hidden', screenName !== 'login');
  document.getElementById('studentWaitScreen')?.classList.toggle('hidden', screenName !== 'wait');
  document.getElementById('studentPadScreen')?.classList.toggle('hidden', screenName !== 'pad');
  document.getElementById('studentPendingScreen')?.classList.toggle('hidden', screenName !== 'pending');
  document.getElementById('studentFeedbackScreen')?.classList.toggle('hidden', screenName !== 'feedback');

  document.getElementById('elearningPortalScreen')?.classList.add('hidden');
  document.getElementById('elearningPlayerScreen')?.classList.add('hidden');
  document.getElementById('elearningSummaryScreen')?.classList.add('hidden');
}

function showStudentElearningScreen(screenName) {
  document.getElementById('studentLoginScreen')?.classList.add('hidden');
  document.getElementById('studentWaitScreen')?.classList.add('hidden');
  document.getElementById('studentPadScreen')?.classList.add('hidden');
  document.getElementById('studentPendingScreen')?.classList.add('hidden');
  document.getElementById('studentFeedbackScreen')?.classList.add('hidden');

  document.getElementById('elearningPortalScreen')?.classList.toggle('hidden', screenName !== 'portal');
  document.getElementById('elearningPlayerScreen')?.classList.toggle('hidden', screenName !== 'player');
  document.getElementById('elearningSummaryScreen')?.classList.toggle('hidden', screenName !== 'summary');
}

function loadStudentLiveQuestion(stepIdx) {
  const step = steps[stepIdx] || steps[1];
  studentAnswerTime = Date.now();
  studentLastSelectedPad = -1;

  document.getElementById('stPhaseTag').textContent = step.phaseName;
  document.getElementById('stQText').textContent = step.question || step.title;

  const isMulti = step.type === 'MULTI';
  const isWordCloud = step.type === 'WORDCLOUD';
  const isNotebook = step.kind === 'notebook';

  document.getElementById('stMultiHint')?.classList.toggle('hidden', !isMulti);
  document.getElementById('btnSubmitMulti')?.classList.toggle('hidden', !isMulti);
  document.getElementById('stWordCloudWrap')?.classList.toggle('hidden', !isWordCloud);
  document.getElementById('stNotebookWrap')?.classList.toggle('hidden', !isNotebook);

  const padsGrid = document.getElementById('stPadsGrid');
  if (padsGrid) {
    padsGrid.style.display = isWordCloud ? 'none' : 'grid';
  }

  const opts = step.options || ['Microsoft Word', 'Microsoft Excel', 'PowerPoint', 'Paint'];
  opts.forEach((txt, i) => {
    const el = document.getElementById(`stOpt${i}`);
    if (el) el.textContent = txt;
    const btn = document.getElementById(`padBtn${i}`);
    btn?.classList.remove('multi-selected');
  });

  studentMultiSelected.clear();
}

function handleStudentPadClick(padIndex) {
  const step = steps[currentHostStepIdx] || steps[1];

  if (step.type === 'MULTI') {
    if (studentMultiSelected.has(padIndex)) {
      studentMultiSelected.delete(padIndex);
      document.getElementById(`padBtn${padIndex}`)?.classList.remove('multi-selected');
    } else {
      studentMultiSelected.add(padIndex);
      document.getElementById(`padBtn${padIndex}`)?.classList.add('multi-selected');
    }
    playSound('click');
    const submitBtn = document.getElementById('btnSubmitMulti');
    if (submitBtn) {
      submitBtn.textContent = `🚀 NỘP ĐÁP ÁN ĐÃ CHỌN (${studentMultiSelected.size})`;
    }
    return;
  }

  // Single Choice: Lock in answer immediately
  studentLastSelectedPad = padIndex;
  playSound('click');

  // Transition immediately to Pending screen (Confidential scoreOnTimeUpOnly)
  showStudentLiveScreen('pending');

  if (syncChannel) {
    syncChannel.postMessage({ type: 'STUDENT_SUBMIT_ANSWER' });
  }
}

function submitStudentMultiAnswer() {
  playSound('click');
  showStudentLiveScreen('pending');
  if (syncChannel) {
    syncChannel.postMessage({ type: 'STUDENT_SUBMIT_ANSWER' });
  }
}

// Called when Host Projector Timer Expired or Teacher clicked "Chốt Đáp Án"
function onHostRevealAnswer(correctIdx, step) {
  showStudentLiveScreen('feedback');

  const elapsedMs = Math.max(500, Date.now() - studentAnswerTime);
  const limitMs = 20000;
  const isCorrect = studentLastSelectedPad === correctIdx;

  const fbIcon = document.getElementById('fbIcon');
  const fbTitle = document.getElementById('fbTitle');
  const fbPoints = document.getElementById('fbPoints');
  const fbExplain = document.getElementById('fbAiExplain');

  if (isCorrect) {
    playSound('correct');
    studentStreak++;
    const speedRatio = Math.max(0, Math.min(1, 1 - (elapsedMs / limitMs)));
    let earned = Math.round(500 + 500 * speedRatio);
    if (studentStreak >= 2) earned += 100;
    studentScore += earned;

    fbIcon.textContent = '🎉';
    fbTitle.textContent = 'CHÍNH XÁC!';
    fbTitle.style.color = '#10b981';
    fbPoints.textContent = `+${earned} Điểm • Chuỗi đúng: 🔥 x${studentStreak}`;
    fbExplain.textContent = `💡 Phương án [${['A', 'B', 'C', 'D'][correctIdx]}] là câu trả lời chuẩn xác!`;
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
  } else {
    playSound('wrong');
    studentStreak = 0;
    fbIcon.textContent = '💔';
    fbTitle.textContent = 'CHƯA CHÍNH XÁC!';
    fbTitle.style.color = '#ef4444';
    fbPoints.textContent = `+0 Điểm • Chuỗi đúng: 0`;
    fbExplain.textContent = `💡 Đáp án đúng là [${['A', 'B', 'C', 'D'][correctIdx]}]. Hãy chú ý bài giảng để bứt phá câu sau!`;
  }
}

function showStudentFinishedPodium() {
  showStudentLiveScreen('feedback');
  document.getElementById('fbIcon').textContent = '🏆';
  document.getElementById('fbTitle').textContent = 'TIẾT HỌC HOÀN THÀNH!';
  document.getElementById('fbTitle').style.color = '#ffdd33';
  document.getElementById('fbPoints').textContent = `Tổng điểm: ${studentScore} đ • Xếp hạng chung cuộc: Top 1`;
  document.getElementById('fbAiExplain').textContent = 'Chúc mừng em đã hoàn thành xuất sắc đợt thi đấu trên lớp hôm nay!';
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
}

// =========================================================
// 8. E-LEARNING PORTAL & PLAYER
// =========================================================
function setupElearningControls() {
  document.querySelectorAll('#elGradePills .el-grade-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#elGradePills .el-grade-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      filterElearningLessons(pill.dataset.grade);
    });
  });

  document.getElementById('btnElPrev')?.addEventListener('click', () => {
    if (currentElStepIdx > 0) loadElearningStep(currentElStepIdx - 1);
  });

  document.getElementById('btnElNext')?.addEventListener('click', () => {
    if (currentElStepIdx < steps.length - 1) loadElearningStep(currentElStepIdx + 1);
  });

  document.getElementById('btnElNextStep')?.addEventListener('click', () => {
    if (currentElStepIdx < steps.length - 1) {
      loadElearningStep(currentElStepIdx + 1);
    } else {
      finishElearningLesson();
    }
  });

  document.getElementById('btnElRetry')?.addEventListener('click', () => {
    document.getElementById('elFeedbackBanner')?.classList.add('hidden');
  });

  for (let i = 0; i < 4; i++) {
    const pad = document.getElementById(`elPad${i}`);
    pad?.addEventListener('click', () => {
      handleElearningPadClick(i);
    });
  }

  document.getElementById('btnFinishElearning')?.addEventListener('click', () => {
    finishElearningLesson();
  });

  document.getElementById('btnExitElearning')?.addEventListener('click', () => {
    showStudentElearningScreen('portal');
  });

  document.getElementById('btnRestartLesson')?.addEventListener('click', () => {
    currentElStepIdx = 0;
    elCompletedSteps.clear();
    elCorrectCount = 0;
    showStudentElearningScreen('player');
    loadElearningStep(0);
  });

  document.getElementById('btnBackToCatalog')?.addEventListener('click', () => {
    showStudentElearningScreen('portal');
  });
}

function renderElearningCatalog() {
  filterElearningLessons('ALL');
}

function filterElearningLessons(gradeFilter) {
  const grid = document.getElementById('elLessonGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = savedLessonsCatalog.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  filtered.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'el-lesson-card';
    card.innerHTML = `
      <div class="el-lesson-card-top">
        <span class="badge-grade bg-k8">${item.grade} • ${item.period}</span>
        <span class="el-steps-badge">16 Bước • 4 Pha</span>
      </div>
      <h3 class="el-lesson-title">${item.title}</h3>
      <p class="el-lesson-meta">${item.phasesSummary}</p>
      <div class="el-progress-row">
        <span>Tiến độ học:</span>
        <div class="el-progress-bar"><div class="fill" style="width: ${idx === 0 ? '75%' : '0%'}"></div></div>
        <span>${idx === 0 ? '75%' : '0%'}</span>
      </div>
      <button type="button" class="btn btn-yellow btn-start-lesson" data-idx="${idx}">
        🚀 BẮT ĐẦU TỰ HỌC
      </button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-start-lesson').forEach((btn) => {
    btn.addEventListener('click', () => {
      showStudentElearningScreen('player');
      currentElStepIdx = 0;
      elCompletedSteps.clear();
      elCorrectCount = 0;
      loadElearningStep(0);
    });
  });
}

function loadElearningStep(stepIdx) {
  currentElStepIdx = stepIdx;
  const step = steps[stepIdx];
  if (!step) return;

  elCompletedSteps.add(stepIdx);

  const dotsContainer = document.getElementById('elStepDots');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    steps.forEach((s, idx) => {
      const dot = document.createElement('div');
      dot.className = `el-dot ${idx === stepIdx ? 'active' : ''} ${elCompletedSteps.has(idx) ? 'completed' : ''}`;
      dot.textContent = idx + 1;
      dot.title = `Bước ${idx + 1}: ${s.title}`;
      dot.addEventListener('click', () => loadElearningStep(idx));
      dotsContainer.appendChild(dot);
    });
  }

  document.getElementById('elPhaseTag').textContent = step.phaseName;
  document.getElementById('elStepCounter').textContent = `Bước ${step.id} / ${steps.length}`;
  document.getElementById('elQText').textContent = step.kind === 'quiz' ? step.question : step.title + ' — ' + (step.content || '');

  document.getElementById('elFeedbackBanner')?.classList.add('hidden');

  const opts = step.options || ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];
  opts.forEach((txt, i) => {
    const el = document.getElementById(`elOpt${i}`);
    if (el) el.textContent = txt;
  });

  const padsGrid = document.getElementById('elPadsGrid');
  if (padsGrid) {
    padsGrid.style.display = step.kind === 'quiz' ? 'grid' : 'none';
  }
}

function handleElearningPadClick(padIndex) {
  const step = steps[currentElStepIdx];
  if (!step || step.kind !== 'quiz') return;

  const isCorrect = padIndex === (step.correct !== undefined ? step.correct : 1);
  const banner = document.getElementById('elFeedbackBanner');
  const txt = document.getElementById('elFeedbackText');

  banner?.classList.remove('hidden');

  if (isCorrect) {
    playSound('correct');
    elCorrectCount++;
    if (txt) {
      txt.innerHTML = '🎉 <strong>Chính xác!</strong> Bạn đã nắm vững kiến thức phần này.';
      txt.style.color = '#10b981';
    }
  } else {
    playSound('wrong');
    if (txt) {
      txt.innerHTML = '💔 <strong>Chưa chính xác!</strong> Hãy xem lại hướng dẫn ở slide bài giảng.';
      txt.style.color = '#ef4444';
    }
  }
}

function finishElearningLesson() {
  showStudentElearningScreen('summary');
  playSound('correct');
  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

  const totalQuiz = steps.filter((s) => s.kind === 'quiz').length;
  const score = totalQuiz > 0 ? ((elCorrectCount / totalQuiz) * 10).toFixed(1) : '10.0';

  document.getElementById('elCertStudent').textContent = studentInfo.name + ` (${studentInfo.class})`;
  document.getElementById('elCertSteps').textContent = `${elCompletedSteps.size} / ${steps.length} bước`;
  document.getElementById('elCertScore').textContent = `${score} đ`;
  document.getElementById('elCertAccuracy').textContent = `${Math.round((elCorrectCount / (totalQuiz || 1)) * 100)}%`;
  document.getElementById('elCertStatus').textContent = parseFloat(score) >= 8.5 ? 'XUẤT SẮC 🏆' : parseFloat(score) >= 6.5 ? 'ĐẠT YÊU CẦU ⭐' : 'CẦN CỐ GẮNG 📖';
}

// =========================================================
// 9. CATALOG & E-LEARNING REPORT (UNICODE BOM EXPORT)
// =========================================================
function renderCatalogTable(gradeFilter) {
  const tbody = document.getElementById('catalogTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = savedLessonsCatalog.filter((item) => {
    if (gradeFilter === 'ALL') return true;
    return item.grade === gradeFilter;
  });

  filtered.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge-grade bg-k8">${item.grade}</span></td>
      <td>${item.semester}</td>
      <td><strong>${item.period}</strong></td>
      <td>${item.title}</td>
      <td><span class="step-kind-pill">${item.phasesSummary}</span></td>
      <td>
        <button type="button" class="btn btn-sm btn-yellow btn-load-catalog-item" data-idx="${idx}">📂 Mở bài này</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-load-catalog-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('catalogPanel')?.classList.add('hidden');
      setView('editor');
      showToast('📂 Đã tải nội dung tiết học vào màn hình soạn thảo!');
    });
  });
}

function renderElearningReportTable() {
  const tbody = document.getElementById('elearningReportBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  liveStudentsList.forEach((st) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>21/10 20:15</td>
      <td><strong>${st.name}</strong></td>
      <td>${st.class}</td>
      <td>Khối 8 • Tiết 7</td>
      <td>Bài 5: Bảng tính thực tế</td>
      <td>16/16 (100%)</td>
      <td>${st.scoreP1.toFixed(1)} / 4.0 câu</td>
      <td><span class="total-score-badge">${st.total.toFixed(2)}</span></td>
      <td><span class="cheat-tag ${st.total >= 8.5 ? 'clean' : 'warning'}">${st.total >= 8.5 ? 'Xuất sắc' : 'Đạt'}</span></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('btnExportCsvUnicode')?.addEventListener('click', () => {
    exportElearningScoresToCsv();
  });
}

function exportElearningScoresToCsv() {
  // UTF-8 BOM \uFEFF ensures Microsoft Excel correctly decodes Vietnamese diacritics
  let csv = '\uFEFF';
  csv += 'STT,Họ và Tên,Lớp,Khối Lớp,Tiết PPCT,Tên Bài Học,Số Bước Hoàn Thành,Điểm Trắc Nghiệm,Cảnh Báo Rời Tab,Tổng Điểm\n';

  liveStudentsList.forEach((st, idx) => {
    csv += `${idx + 1},"${st.name}",${st.class},Khối 8,Tiết 7,"Bài 5: Sử dụng bảng tính",16/16,${st.scoreP1},${st.tabSwitches},${st.total}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Theo_Doi_Hoc_Sinh_Elearning_Khoi8_Tiet7.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('📥 Đã xuất tệp Excel Unicode chuẩn UTF-8 (\\uFEFF) thành công!');
}

// =========================================================
// 10. APP INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  setupBroadcastChannel();
  setupTopNavigation();
  setupTeacherEditor();
  setupHostProjector();
  setupStudentView();

  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'student') {
    setView('student');
  } else if (params.get('page') === 'teacher' || params.get('mode') === 'teacher') {
    setView('editor');
  } else {
    setView('editor');
  }
});
