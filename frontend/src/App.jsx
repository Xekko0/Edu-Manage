import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/layout/DashboardLayout';
import FloatingChatWidget from './components/chat/FloatingChatWidget';

import AdminDashboard from './pages/admin/Dashboard';
import Assignments from './pages/admin/Assignments';
import Students from './pages/admin/Students';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import Classes from './pages/admin/Classes';
import Subjects from './pages/admin/Subjects';
import Tuitions from './pages/admin/Tuitions';
import ScheduleManager from './pages/admin/ScheduleManager';
import CurriculumStandards from './pages/admin/CurriculumStandards';
import Rooms from './pages/admin/Rooms';

import DashboardHR from './pages/teacher/DashboardHR';
import DashboardSub from './pages/teacher/DashboardSub';
import ScoreEntry from './pages/teacher/ScoreEntry';
import AttendancePage from './pages/teacher/Attendance';
import TeacherStudents from './pages/teacher/Students';
import TeacherParents from './pages/teacher/Parents';
import Journal from './pages/teacher/Journal';
import TeacherEvaluations from './pages/teacher/Evaluations';
import TeacherReports from './pages/teacher/Reports';

import FamilyDashboard from './pages/family/Dashboard';
import Scores from './pages/family/Scores';
import Gradebook from './pages/family/Gradebook';
import FamilyEvaluations from './pages/family/Evaluations';
import FamilyTuition from './pages/family/Tuition';

import Schedule from './pages/shared/Schedule';
import Extracurricular from './pages/shared/Extracurricular';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';
import HomeroomOnly from './components/auth/HomeroomOnly';
import FamilyStudentGate from './components/family/FamilyStudentGate';

const Protected = ({ children, allow }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'subject' || user.role === 'homeroom') {
    if (user.capabilities?.is_homeroom) return <Navigate to="/teacher/homeroom" replace />;
    return <Navigate to="/teacher/subject" replace />;
  }
  return <Navigate to="/family" replace />;
};

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <Protected>
              <DashboardLayout />
            </Protected>
          }
        >
          {/* Admin */}
          <Route path="/admin" element={<Protected allow={['admin']}><AdminDashboard /></Protected>} />
          <Route path="/admin/assignments" element={<Protected allow={['admin']}><Assignments /></Protected>} />
          <Route path="/admin/students" element={<Protected allow={['admin']}><Students /></Protected>} />
          <Route path="/admin/users" element={<Protected allow={['admin']}><Users /></Protected>} />
          <Route path="/admin/classes" element={<Protected allow={['admin']}><Classes /></Protected>} />
          <Route path="/admin/subjects" element={<Protected allow={['admin']}><Subjects /></Protected>} />
          <Route path="/admin/tuitions" element={<Protected allow={['admin']}><Tuitions /></Protected>} />
          <Route path="/admin/reports" element={<Protected allow={['admin']}><Reports /></Protected>} />
          <Route path="/admin/schedules" element={<Protected allow={['admin']}><ScheduleManager /></Protected>} />
          <Route path="/admin/curriculum" element={<Protected allow={['admin']}><CurriculumStandards /></Protected>} />
          <Route path="/admin/rooms" element={<Protected allow={['admin']}><Rooms /></Protected>} />

          {/* Teacher */}
          <Route path="/teacher/homeroom" element={<Protected allow={['subject','admin']}><DashboardHR /></Protected>} />
          <Route path="/teacher/subject" element={<Protected allow={['subject','admin']}><DashboardSub /></Protected>} />
          <Route path="/teacher/score-entry" element={<Protected allow={['admin','subject']}><ScoreEntry /></Protected>} />
          <Route path="/teacher/attendance" element={<Protected allow={['admin','subject']}><HomeroomOnly><AttendancePage /></HomeroomOnly></Protected>} />
          <Route path="/teacher/students" element={<Protected allow={['admin','subject']}><HomeroomOnly><TeacherStudents /></HomeroomOnly></Protected>} />
          <Route path="/teacher/parents" element={<Protected allow={['admin','subject']}><HomeroomOnly><TeacherParents /></HomeroomOnly></Protected>} />
          <Route path="/teacher/journal" element={<Protected allow={['admin','subject']}><Journal /></Protected>} />
          <Route path="/teacher/evaluations" element={<Protected allow={['admin','subject']}><TeacherEvaluations /></Protected>} />
          <Route path="/teacher/reports" element={<Protected allow={['admin','subject']}><HomeroomOnly><TeacherReports /></HomeroomOnly></Protected>} />
          <Route path="/profile" element={<Profile />} />

          {/* Family (PH/HS) */}
          <Route path="/family" element={<Protected allow={['parent','student']}><FamilyDashboard /></Protected>} />
          <Route path="/family/scores" element={<Protected allow={['parent','student']}><FamilyStudentGate><Scores /></FamilyStudentGate></Protected>} />
          <Route path="/family/gradebook" element={<Protected allow={['parent','student']}><FamilyStudentGate><Gradebook /></FamilyStudentGate></Protected>} />
          <Route path="/family/evaluations" element={<Protected allow={['parent','student']}><FamilyStudentGate><FamilyEvaluations /></FamilyStudentGate></Protected>} />
          <Route path="/family/tuition" element={<Protected allow={['parent','student']}><FamilyStudentGate><FamilyTuition /></FamilyStudentGate></Protected>} />

          {/* Shared */}
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/extracurricular" element={<Extracurricular />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="/" element={<RoleHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chatbot Widget — 5 persona (Admin/GVCN/GVBM/PH/HS) */}
      <FloatingChatWidget />
    </>
  );
}
