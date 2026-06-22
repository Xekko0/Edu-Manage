/**
 * TopBar — Thanh tiện ích đỉnh (Sticky).
 * Bên trái: Hamburger + Omni-Search. Bên phải: Context + Notifications + Avatar.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, Search } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import RoleBadge from '../ui/RoleBadge';
import SchoolYearSemesterSelect from './SchoolYearSemesterSelect';
import OmniSearch from '../search/OmniSearch';
import { resolveNavPersona } from './navConfig';

// Page titles
const PATH_TITLES = {
  '/admin': 'Dashboard',
  '/admin/users': 'Tài khoản',
  '/admin/students': 'Học sinh',
  '/admin/classes': 'Lớp học',
  '/admin/subjects': 'Môn học',
  '/admin/assignments': 'Phân công',
  '/admin/schedules': 'Thời khóa biểu',
  '/admin/tuitions': 'Học phí',
  '/admin/reports': 'Báo cáo',
  '/admin/curriculum': 'Khung CT',
  '/admin/rooms': 'Phòng học',
  '/admin/grading-periods': 'Kỳ chốt điểm',
  '/teacher/homeroom': 'Lớp chủ nhiệm',
  '/teacher/subject': 'Lớp dạy',
  '/teacher/score-entry': 'Nhập điểm',
  '/teacher/attendance': 'Điểm danh',
  '/teacher/students': 'Học sinh lớp',
  '/teacher/parents': 'Phụ huynh',
  '/teacher/reports': 'Báo cáo',
  '/teacher/journal': 'Sổ đầu bài',
  '/teacher/evaluations': 'Đánh giá',
  '/family': 'Tổng quan',
  '/family/scores': 'Bảng điểm',
  '/family/gradebook': 'Học bạ',
  '/family/competency': 'Năng lực',
  '/family/evaluations': 'Đánh giá',
  '/family/tuition': 'Học phí',
  '/family/link-student': 'Liên kết con',
  '/schedule': 'Lịch học',
  '/notifications': 'Thông báo',
  '/profile': 'Tài khoản',
};

function getPageTitle(pathname) {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  const match = Object.entries(PATH_TITLES).find(([p]) => pathname.startsWith(p) && p !== '/');
  return match?.[1] || 'EduSmart';
}

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const persona = resolveNavPersona(user);
  const title = getPageTitle(location.pathname);
  const section = location.pathname.split('/').filter(Boolean)[0] || 'home';
  const sectionLabel = {
    admin: 'Quản trị',
    teacher: 'Giáo viên',
    family: 'Gia đình',
    schedule: 'Lịch học',
    notifications: 'Thông báo',
    profile: 'Tài khoản',
  }[section] || 'EduSmart';

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-7">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-md text-ink-muted hover:bg-slate-100 hover:text-ink transition-colors focus-ring"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] font-semibold uppercase text-ink-soft">{sectionLabel}</p>
              <h1 className="text-base font-semibold text-ink truncate">{title}</h1>
            </div>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex min-w-[260px] max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink-soft shadow-sm transition-colors hover:border-slate-300 hover:bg-white focus-ring"
            aria-label="Tìm kiếm"
          >
            <Search size={14} />
            <span className="truncate">Tìm kiếm học sinh, lớp, chức năng</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <SchoolYearSemesterSelect className="hidden sm:flex" />
            <RoleBadge persona={persona} />

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-md text-ink-muted hover:bg-slate-100 hover:text-ink transition-colors focus-ring"
              aria-label="Thông báo"
            >
              <Bell size={18} />
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 rounded-md border border-transparent p-1.5 hover:border-slate-200 hover:bg-slate-50 transition-colors focus-ring"
              aria-label="Tài khoản"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden xl:inline text-sm font-medium text-ink max-w-[140px] truncate">{user?.full_name}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors focus-ring"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Omni-Search Modal */}
      <OmniSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
