/**
 * CollapsibleSidebar — Thanh điều hướng dọc thu gọn (Icon-only mode).
 * Desktop: icon-only, mở rộng khi hover. Mobile: drawer overlay.
 * Phân chia danh mục: Dashboard, Academic, Finance, Schedule, Logistics, Settings.
 */
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, BookOpen, DollarSign, Calendar,
  DoorOpen, Bell, Settings, ChevronLeft, ChevronRight, X,
  ClipboardCheck, Users, School, PenLine, NotebookPen, MessageSquare,
  BarChart3, Wallet, FileText, Library, Sparkles, UserCheck, Home,
} from 'lucide-react';
import { resolveNavPersona } from './navConfig';

// Icon mapping theo danh mục
const CATEGORIES = {
  admin: [
    {
      label: 'Tổng quan',
      items: [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      ],
    },
    {
      label: 'Học thuật',
      items: [
        { to: '/admin/students', icon: GraduationCap, label: 'Học sinh' },
        { to: '/admin/classes', icon: School, label: 'Lớp học' },
        { to: '/admin/subjects', icon: BookOpen, label: 'Môn học' },
        { to: '/admin/assignments', icon: UserCheck, label: 'Phân công' },
        { to: '/admin/curriculum', icon: FileText, label: 'Khung CT' },
        { to: '/admin/schedules', icon: Calendar, label: 'TKB' },
        { to: '/admin/rooms', icon: DoorOpen, label: 'Phòng học' },
      ],
    },
    {
      label: 'Tài chính',
      items: [
        { to: '/admin/tuitions', icon: Wallet, label: 'Học phí' },
        { to: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        { to: '/admin/users', icon: Users, label: 'Tài khoản' },
        { to: '/admin/grading-periods', icon: ClipboardCheck, label: 'Kỳ chốt' },
        { to: '/notifications', icon: Bell, label: 'Thông báo' },
      ],
    },
  ],
  gvcn: [
    {
      label: 'Lớp chủ nhiệm',
      items: [
        { to: '/teacher/homeroom', icon: Home, label: 'Tổng quan', end: true },
        { to: '/teacher/students', icon: GraduationCap, label: 'Học sinh' },
        { to: '/teacher/parents', icon: Users, label: 'Phụ huynh' },
        { to: '/teacher/attendance', icon: ClipboardCheck, label: 'Điểm danh' },
        { to: '/teacher/reports', icon: BarChart3, label: 'Báo cáo' },
      ],
    },
    {
      label: 'Giảng dạy',
      items: [
        { to: '/teacher/score-entry', icon: PenLine, label: 'Nhập điểm' },
        { to: '/teacher/journal', icon: NotebookPen, label: 'Sổ đầu bài' },
        { to: '/teacher/evaluations', icon: MessageSquare, label: 'Đánh giá' },
      ],
    },
    {
      label: 'Tiện ích',
      items: [
        { to: '/schedule', icon: Calendar, label: 'Lịch học' },
        { to: '/notifications', icon: Bell, label: 'Thông báo' },
      ],
    },
  ],
  gvbm: [
    {
      label: 'Giảng dạy',
      items: [
        { to: '/teacher/subject', icon: Home, label: 'Tổng quan', end: true },
        { to: '/teacher/score-entry', icon: PenLine, label: 'Nhập điểm' },
        { to: '/teacher/journal', icon: NotebookPen, label: 'Sổ đầu bài' },
        { to: '/teacher/evaluations', icon: MessageSquare, label: 'Đánh giá' },
      ],
    },
    {
      label: 'Tiện ích',
      items: [
        { to: '/schedule', icon: Calendar, label: 'Lịch học' },
        { to: '/notifications', icon: Bell, label: 'Thông báo' },
      ],
    },
  ],
  parent: [
    {
      label: 'Con em',
      items: [
        { to: '/family', icon: Home, label: 'Tổng quan', end: true },
        { to: '/family/scores', icon: PenLine, label: 'Bảng điểm' },
        { to: '/family/gradebook', icon: BookOpen, label: 'Học bạ' },
        { to: '/family/competency', icon: BarChart3, label: 'Năng lực' },
        { to: '/family/evaluations', icon: MessageSquare, label: 'Đánh giá' },
        { to: '/family/tuition', icon: Wallet, label: 'Học phí' },
      ],
    },
    {
      label: 'Tiện ích',
      items: [
        { to: '/family/link-student', icon: Users, label: 'Liên kết con' },
        { to: '/schedule', icon: Calendar, label: 'Lịch học' },
        { to: '/notifications', icon: Bell, label: 'Thông báo' },
      ],
    },
  ],
  student: [
    {
      label: 'Học tập',
      items: [
        { to: '/family', icon: Home, label: 'Tổng quan', end: true },
        { to: '/family/scores', icon: PenLine, label: 'Bảng điểm' },
        { to: '/family/gradebook', icon: BookOpen, label: 'Học bạ' },
        { to: '/family/competency', icon: BarChart3, label: 'Năng lực' },
        { to: '/family/evaluations', icon: MessageSquare, label: 'Đánh giá' },
        { to: '/family/tuition', icon: Wallet, label: 'Học phí' },
      ],
    },
    {
      label: 'Tiện ích',
      items: [
        { to: '/schedule', icon: Calendar, label: 'Lịch học' },
        { to: '/notifications', icon: Bell, label: 'Thông báo' },
      ],
    },
  ],
};

export default function CollapsibleSidebar({ user, open, onClose, onExpandChange }) {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const persona = resolveNavPersona(user);
  const categories = CATEGORIES[persona] || CATEGORIES.student;
  // Mobile drawer always shows text (it's always 256px wide)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const showText = expanded || (open && isMobile);

  // Notify parent when expanded state changes
  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded, onExpandChange]);

  // Auto-collapse on mobile (but keep text visible in mobile drawer)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setExpanded(false);
    };
    // Only collapse if not on mobile initially
    if (window.innerWidth >= 1024) setExpanded(true);
    else setExpanded(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) onClose?.();
  }, [location.pathname]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className={`text-sm font-bold text-white truncate transition-opacity duration-200 ${showText ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            EduSmart
          </span>
        </div>
        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="hidden lg:flex p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-opacity duration-200 ${showText ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              {cat.label}
            </div>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`
                  }
                  title={!showText ? item.label : undefined}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className={`truncate transition-opacity duration-200 ${showText ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`
          }
        >
          <Settings size={18} className="shrink-0" />
          <span className={`transition-opacity duration-200 ${showText ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Cài đặt
          </span>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-zinc-900 border-r border-zinc-800 z-40 transition-all duration-300 ${
          expanded ? 'w-56' : 'w-16'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-zinc-900 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
