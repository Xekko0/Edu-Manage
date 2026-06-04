import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getRoleHomePath } from '../../utils/navigation';
import { resolveNavPersona } from './navConfig';
import RoleBadge from '../ui/RoleBadge';
import Button from '../ui/Button';
import SchoolYearSemesterSelect from './SchoolYearSemesterSelect';
import MobileNavDrawer from './MobileNavDrawer';

const PATH_TITLES = {
  '/admin': 'Tổng quan',
  '/admin/users': 'Tài khoản',
  '/admin/students': 'Học sinh',
  '/admin/classes': 'Lớp & khối',
  '/admin/subjects': 'Môn học',
  '/admin/assignments': 'Phân công GV',
  '/admin/schedules': 'Phân bổ TKB',
  '/admin/tuitions': 'Học phí',
  '/admin/reports': 'Báo cáo',
  '/teacher/homeroom': 'Lớp chủ nhiệm',
  '/teacher/subject': 'Lớp dạy',
  '/teacher/score-entry': 'Nhập điểm',
  '/teacher/attendance': 'Điểm danh',
  '/teacher/students': 'Học sinh lớp',
  '/teacher/parents': 'Phụ huynh',
  '/teacher/reports': 'Báo cáo lớp',
  '/teacher/journal': 'Sổ đầu bài',
  '/teacher/evaluations': 'Đánh giá',
  '/family': 'Tổng quan',
  '/family/scores': 'Bảng điểm',
  '/family/gradebook': 'Học bạ',
  '/family/evaluations': 'Đánh giá',
  '/family/tuition': 'Học phí',
  '/schedule': 'Lịch học',
  '/notifications': 'Thông báo',
  '/extracurricular': 'Hoạt động',
  '/profile': 'Tài khoản',
};

function pageTitle(pathname) {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  const match = Object.entries(PATH_TITLES).find(([p]) => pathname.startsWith(p) && p !== '/');
  return match?.[1] || 'EduSmart';
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const persona = resolveNavPersona(user);
  const title = pageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-slate-900 truncate">{title}</h1>
              <p className="text-caption truncate hidden sm:block">
                {user?.full_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SchoolYearSemesterSelect className="hidden sm:flex" />
            <RoleBadge persona={persona} />
            <Button
              variant="ghost"
              size="sm"
              className="!min-h-[40px] !px-2"
              onClick={() => navigate('/notifications')}
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex !min-h-[40px]"
              onClick={() => navigate('/profile')}
            >
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">Tài khoản</span>
            </Button>
            <Button variant="ghost" size="sm" className="!min-h-[40px] !px-2" onClick={handleLogout} aria-label="Đăng xuất">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <SchoolYearSemesterSelect className="sm:hidden mt-2" />
      </header>
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
    </>
  );
}
