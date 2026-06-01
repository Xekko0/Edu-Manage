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
  if (user.role === 'subject') return <Navigate to="/teacher/subject" replace />;
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

          {/* Teacher */}
          <Route path="/teacher/homeroom" element={<Protected allow={['subject','admin']}><DashboardHR /></Protected>} />
          <Route path="/teacher/subject" element={<Protected allow={['subject','admin']}><DashboardSub /></Protected>} />
          <Route path="/teacher/score-entry" element={<Protected allow={['admin','subject']}><ScoreEntry /></Protected>} />
          <Route path="/teacher/attendance" element={<Protected allow={['admin','subject']}><AttendancePage /></Protected>} />
          <Route path="/teacher/students" element={<Protected allow={['admin','subject']}><TeacherStudents /></Protected>} />
          <Route path="/teacher/parents" element={<Protected allow={['admin','subject']}><TeacherParents /></Protected>} />
          <Route path="/teacher/journal" element={<Protected allow={['admin','subject']}><Journal /></Protected>} />
          <Route path="/teacher/evaluations" element={<Protected allow={['admin','subject']}><TeacherEvaluations /></Protected>} />
          <Route path="/teacher/reports" element={<Protected allow={['admin','subject']}><TeacherReports /></Protected>} />
          <Route path="/profile" element={<Profile />} />

          {/* Family (PH/HS) */}
          <Route path="/family" element={<Protected allow={['parent','student']}><FamilyDashboard /></Protected>} />
          <Route path="/family/scores" element={<Protected allow={['parent','student']}><Scores /></Protected>} />
          <Route path="/family/gradebook" element={<Protected allow={['parent','student']}><Gradebook /></Protected>} />
          <Route path="/family/evaluations" element={<Protected allow={['parent','student']}><FamilyEvaluations /></Protected>} />
          <Route path="/family/tuition" element={<Protected allow={['parent','student']}><FamilyTuition /></Protected>} />

          {/* Shared */}
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/extracurricular" element={<Extracurricular />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="/" element={<RoleHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chatbot Widget — chỉ hiện với PH/HS, tự xử lý ở component */}
      <FloatingChatWidget />
    </>
  );
}
