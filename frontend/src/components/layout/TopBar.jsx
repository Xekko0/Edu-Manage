/**
 * TopBar — Thanh tiện ích đỉnh (Sticky).
 * Bên trái: Hamburger + Omni-Search. Bên phải: Context + Notifications + Avatar.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Search } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import RoleBadge from '../ui/RoleBadge';
import Button from '../ui/Button';
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Mở menu"
            >
              <Menu size={20} className="text-zinc-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-zinc-900 truncate">{title}</h1>
            </div>
          </div>

          {/* Center: Omni-Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm text-zinc-500 transition-colors max-w-xs"
          >
            <Search size={14} />
            <span className="truncate">Tìm kiếm...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 rounded text-zinc-400">
              ⌘K
            </kbd>
          </button>

          {/* Right: Context + Notifications + Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <SchoolYearSemesterSelect className="hidden sm:flex" />
            <RoleBadge persona={persona} />

            {/* Notifications */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Thông báo"
            >
              <Bell size={18} className="text-zinc-500" />
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden lg:inline text-sm font-medium text-zinc-700 max-w-[100px] truncate">
                {user?.full_name}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Omni-Search Modal */}
      <OmniSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
