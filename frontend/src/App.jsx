import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePinView from './components/HomePinView';
import StudentDashboardView from './components/StudentDashboardView';
import TvProjectorView from './components/TvProjectorView';
import TeacherEditorView from './components/TeacherEditorView';
import ArenaLobbyView from './components/ArenaLobbyView';
import GradebookView from './components/GradebookView';
import ExamView from './components/ExamView';
import CatalogModal from './components/CatalogModal';
import GeminiModal from './components/GeminiModal';
import ImageZoomModal from './components/ImageZoomModal';
import UploadCenterView from './components/UploadCenterView';
import ArenaHostView from './components/ArenaHostView';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

import { initialStepsData, liveStudentsList, initialCatalog } from './data/curriculumData';
import { sound } from './utils/audio';

const TEACHER_ROUTES = ['tv', 'editor', 'upload', 'gradebook', 'host'];

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, logout } = useAuth();
  const roleOk = (r) => user && (user.role === 'teacher') === TEACHER_ROUTES.includes(r);
  // Navigation Route: 'home', 'student', 'tv', 'exam', 'editor', 'arena', 'gradebook'
  const [activeRoute, setActiveRoute] = useState('editor');

  // Shared Data States
  const [steps, setSteps] = useState(initialStepsData);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [students, setStudents] = useState(liveStudentsList);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentStudentName, setCurrentStudentName] = useState('Trần Hoàng Minh');

  // Word Cloud Data
  const [wordCloudData, setWordCloudData] = useState({
    'Bảng tính tự động': 5,
    'Hàm SUM': 4,
    'Địa chỉ F4': 3,
    'Công thức': 3,
    'Địa chỉ tuyệt đối': 2,
    'Quản lý chi tiêu': 2
  });

  // Modals
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [zoomStep, setZoomStep] = useState(null);

  // Check URL query parameters for direct links (e.g. ?view=tv, ?view=student)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || params.get('mode') || params.get('page');
    if (view === 'tv' || view === 'host' || view === 'projector') {
      setActiveRoute('tv');
    } else if (view === 'student' || view === 'study') {
      setActiveRoute('student');
    } else if (view === 'exam' || view === 'thi') {
      setActiveRoute('exam');
    } else if (view === 'gradebook') {
      setActiveRoute('gradebook');
    } else if (view === 'editor' || view === 'teacher' || view === 'create') {
      setActiveRoute('editor');
    } else if (view === 'arena' || view === 'lobby') {
      setActiveRoute('arena');
    } else if (view === 'home') {
      setActiveRoute('home');
    }
  }, []);

  // Khi đăng nhập/đăng xuất: chuyển về trang phù hợp vai trò
  useEffect(() => {
    if (!user) return;
    const isTeacherRoute = TEACHER_ROUTES.includes(activeRoute);
    if (user.role === 'teacher' && !isTeacherRoute) setActiveRoute('editor');
    if (user.role === 'student' && isTeacherRoute) setActiveRoute('student');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update Route and URL
  const handleRouteChange = (route) => {
    setActiveRoute(route);
    const url = new URL(window.location.href);
    url.searchParams.set('view', route);
    window.history.replaceState({}, '', url.toString());
  };

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  // Add lesson to catalog
  const handleSaveAllToCatalog = (newCatItem) => {
    setCatalog((prev) => [
      { id: Date.now(), ...newCatItem },
      ...prev
    ]);
  };

  // Word cloud submission
  const handleWordCloudSubmit = (word) => {
    setWordCloudData((prev) => ({
      ...prev,
      [word]: (prev[word] || 0) + 1
    }));
  };

  // Update student score
  const handleUpdateStudentScore = (studentId, updates) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s))
    );
  };

  // Join via PIN on Home
  const handleJoinWithPin = (pin, name) => {
    if (name) setCurrentStudentName(name);
    // Add student to live arena list if not present
    if (!students.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setStudents((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: name,
          avatar: '👦',
          score: 0,
          streak: 0,
          tabSwitches: 0,
          status: 'online'
        }
      ]);
    }
    handleRouteChange('student');
  };

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar
        activeRoute={activeRoute}
        onRouteChange={handleRouteChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenCatalog={() => setCatalogModalOpen(true)}
        onOpenGeminiModal={() => setGeminiModalOpen(true)}
        savedCatalogCount={catalog.length}
        user={user}
        onLogout={logout}
      />

      {/* Main Content Rendered by Active Route */}
      <main className="main-content-viewport">
        {!user && <ProtectedRoute><div /></ProtectedRoute>}
        {user && activeRoute === 'home' && (
          <HomePinView
            onJoinWithPin={handleJoinWithPin}
            onNavigate={handleRouteChange}
          />
        )}

        {user && activeRoute === 'upload' && (
          <ProtectedRoute roles={['teacher']}>
            <UploadCenterView
              onImportSlides={(slides) => {
                const colors = { lecture: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', quiz: 'linear-gradient(135deg, #047857, #10b981)' };
                setSteps((prev) => [
                  ...prev,
                  ...slides.map((s, i) => {
                    const isQuiz = s.type === 'quiz' && s.options?.length;
                    const base = { id: Date.now() + i, phase: 2, phaseName: 'Pha 2: Nhập từ tệp (OCR)', title: s.title || `Slide ${i + 1}`, tip: '' };
                    return isQuiz
                      ? { ...base, kind: 'quiz', type: 'QUIZ', typeBadge: 'Trắc nghiệm (OCR)', points: 1, timeLimit: 20, slideColor: colors.quiz, question: s.question, options: s.options.map((o) => o.text), correct: Math.max(0, s.options.findIndex((o) => o.correct)) }
                      : { ...base, kind: 'lecture', type: 'SLIDE', typeBadge: 'Slide bài giảng (OCR)', points: 0, timeLimit: 0, slideColor: colors.lecture, content: s.content || '' };
                  })
                ]);
                handleRouteChange('editor');
              }}
            />
          </ProtectedRoute>
        )}

        {user && roleOk('student') && activeRoute === 'student' && (
          <StudentDashboardView
            steps={steps}
            currentStepIndex={currentStepIndex}
            onOpenZoom={(step) => setZoomStep(step)}
            savedCatalog={catalog}
            onWordCloudSubmit={handleWordCloudSubmit}
            studentName={currentStudentName}
          />
        )}

        {user && roleOk('tv') && activeRoute === 'tv' && (
          <TvProjectorView
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepIndexChange={setCurrentStepIndex}
            liveStudents={students}
            roomPin="689204"
            wordCloudData={wordCloudData}
            onWordCloudUpdate={handleWordCloudSubmit}
          />
        )}

        {user && roleOk('exam') && activeRoute === 'exam' && (
          <ExamView onBackToStudy={() => handleRouteChange('student')} />
        )}

        {user && roleOk('editor') && activeRoute === 'editor' && (
          <TeacherEditorView
            steps={steps}
            onStepsChange={setSteps}
            onSaveAllToCatalog={handleSaveAllToCatalog}
            onOpenGeminiModal={() => setGeminiModalOpen(true)}
            onOpenZoom={(step) => setZoomStep(step)}
          />
        )}

        {user && roleOk('arena') && activeRoute === 'arena' && <ArenaLobbyView />}
        {user && roleOk('host') && activeRoute === 'host' && <ArenaHostView />}

        {user && roleOk('gradebook') && activeRoute === 'gradebook' && (
          <GradebookView
            students={students}
            onUpdateStudentScore={handleUpdateStudentScore}
          />
        )}
      </main>

      {/* Global Modals */}
      <CatalogModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        catalog={catalog}
        onLoadLesson={(lesson) => {
          handleRouteChange('editor');
          alert(`📂 Đã nạp thành công giáo án "${lesson.title}" vào màn hình soạn thảo!`);
        }}
      />

      <GeminiModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        onApplyAiResult={() => {}}
      />

      <ImageZoomModal
        isOpen={Boolean(zoomStep)}
        onClose={() => setZoomStep(null)}
        step={zoomStep}
      />
    </div>
  );
}
