import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getRoleHomePath } from '../../utils/navigation';
import useTeacherClasses from '../../hooks/useTeacherClasses';

const homeroomMenu = [
  { to: '/teacher/homeroom', label: 'Lớp chủ nhiệm' },
  { to: '/teacher/students', label: 'HS lớp tôi' },
  { to: '/teacher/parents', label: 'PH lớp tôi' },
  { to: '/teacher/attendance', label: 'Điểm danh' },
  { to: '/teacher/reports', label: 'Báo cáo lớp' },
];

const MENU = {
  admin: [
    { to: '/admin', label: 'Tổng quan' },
    { to: '/admin/users', label: 'Tài khoản' },
    { to: '/admin/students', label: 'Học sinh' },
    { to: '/admin/classes', label: 'Lớp & khối' },
    { to: '/admin/subjects', label: 'Môn học' },
    { to: '/admin/assignments', label: 'Phân công GV' },
    { to: '/admin/curriculum', label: 'Khung CT khối' },
    { to: '/admin/rooms', label: 'Phòng học' },
    { to: '/admin/schedules', label: 'Phân bổ TKB' },
    { to: '/admin/tuitions', label: 'Học phí' },
    { to: '/admin/reports', label: 'Báo cáo' },
    { to: '/schedule', label: 'Lịch học' },
    { to: '/extracurricular', label: 'Hoạt động' },
    { to: '/notifications', label: 'Thông báo' },
  ],
  subject: [
    { to: '/teacher/subject', label: 'Lớp dạy' },
    // Các mục "GVCN" sẽ được chèn động nếu giáo viên đang được gán chủ nhiệm lớp
    { to: '/teacher/score-entry', label: 'Nhập điểm' },
    { to: '/teacher/journal', label: 'Sổ đầu bài' },
    { to: '/teacher/evaluations', label: 'Đánh giá HS' },
    { to: '/schedule', label: 'Lịch học' },
    { to: '/notifications', label: 'Thông báo' },
  ],
  parent: [
    { to: '/family', label: 'Tổng quan' },
    { to: '/family/scores', label: 'Bảng điểm' },
    { to: '/family/gradebook', label: 'Học bạ' },
    { to: '/family/evaluations', label: 'Đánh giá' },
    { to: '/family/tuition', label: 'Học phí' },
    { to: '/schedule', label: 'Lịch học' },
    { to: '/extracurricular', label: 'Hoạt động' },
    { to: '/notifications', label: 'Thông báo' },
  ],
  student: [
    { to: '/family', label: 'Tổng quan' },
    { to: '/family/scores', label: 'Bảng điểm' },
    { to: '/family/gradebook', label: 'Học bạ' },
    { to: '/family/evaluations', label: 'Đánh giá' },
    { to: '/family/tuition', label: 'Học phí' },
    { to: '/schedule', label: 'Lịch học' },
    { to: '/extracurricular', label: 'Hoạt động' },
    { to: '/notifications', label: 'Thông báo' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const { homeroomClass } = useTeacherClasses();
  let items = MENU[user?.role] || [];

  const showHomeroom = user?.capabilities?.is_homeroom ?? (user?.role === 'subject' && !!homeroomClass);
  if ((user?.role === 'subject' || user?.role === 'homeroom') && showHomeroom) {
    items = [
      ...items.slice(0, 1),
      ...homeroomMenu,
      ...items.slice(1),
    ];
  }
  const homePath = getRoleHomePath(user?.role, user?.capabilities);

  return (
    <aside className="w-60 bg-white border-r min-h-screen p-4 hidden md:block">
      <NavLink to={homePath} className="block text-xl font-bold text-brand mb-6 hover:opacity-80">
        EduSmart
      </NavLink>
      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${
                isActive ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
