/**
 * Menu sidebar theo persona — một nguồn cho desktop + mobile drawer.
 */
export function resolveNavPersona(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  if (user.role === 'parent') return 'parent';
  if (user.role === 'student') return 'student';
  if (user.capabilities?.persona === 'gvcn' || user.capabilities?.is_homeroom) return 'gvcn';
  if (user.role === 'subject' || user.role === 'homeroom') return 'gvbm';
  return user.role;
}

const ICON = {
  home: 'LayoutDashboard',
  users: 'Users',
  students: 'GraduationCap',
  classes: 'School',
  subjects: 'BookOpen',
  assignments: 'UserCheck',
  schedules: 'Calendar',
  tuitions: 'Wallet',
  reports: 'BarChart3',
  schedule: 'CalendarDays',
  activities: 'Sparkles',
  notifications: 'Bell',
  score: 'PenLine',
  journal: 'NotebookPen',
  evaluations: 'MessageSquare',
  homeroom: 'Home',
  attendance: 'ClipboardCheck',
  parents: 'UsersRound',
};

/** @type {Record<string, { sections: { title?: string, items: { to: string, label: string, icon?: string, end?: boolean }[] }[] }>} */
export const NAV_BY_PERSONA = {
  admin: {
    sections: [
      {
        title: 'Quản trị',
        items: [
          { to: '/admin', label: 'Tổng quan', icon: ICON.home, end: true },
          { to: '/admin/users', label: 'Tài khoản', icon: ICON.users },
          { to: '/admin/students', label: 'Học sinh', icon: ICON.students },
        ],
      },
      {
        title: 'Học tập',
        items: [
          { to: '/admin/classes', label: 'Lớp & khối', icon: ICON.classes },
          { to: '/admin/subjects', label: 'Môn học', icon: ICON.subjects },
          { to: '/admin/assignments', label: 'Phân công GV', icon: ICON.assignments },
          { to: '/admin/curriculum', label: 'Khung CT khối', icon: ICON.subjects },
          { to: '/admin/rooms', label: 'Phòng học', icon: ICON.classes },
          { to: '/admin/schedules', label: 'Phân bổ TKB', icon: ICON.schedules },
        ],
      },
      {
        title: 'Tài chính & báo cáo',
        items: [
          { to: '/admin/tuitions', label: 'Học phí', icon: ICON.tuitions },
          { to: '/admin/reports', label: 'Báo cáo', icon: ICON.reports },
        ],
      },
      {
        title: 'Tiện ích',
        items: [
          { to: '/schedule', label: 'Lịch học', icon: ICON.schedule },
          { to: '/extracurricular', label: 'Hoạt động', icon: ICON.activities },
          { to: '/notifications', label: 'Thông báo', icon: ICON.notifications },
        ],
      },
    ],
  },
  gvcn: {
    sections: [
      {
        title: 'Lớp chủ nhiệm',
        items: [
          { to: '/teacher/homeroom', label: 'Tổng quan lớp', icon: ICON.homeroom, end: true },
          { to: '/teacher/students', label: 'Học sinh lớp', icon: ICON.students },
          { to: '/teacher/parents', label: 'Phụ huynh', icon: ICON.parents },
          { to: '/teacher/attendance', label: 'Điểm danh', icon: ICON.attendance },
          { to: '/teacher/reports', label: 'Báo cáo lớp', icon: ICON.reports },
        ],
      },
      {
        title: 'Giảng dạy',
        items: [
          { to: '/teacher/subject', label: 'Lớp dạy', icon: ICON.classes },
          { to: '/teacher/score-entry', label: 'Nhập điểm', icon: ICON.score },
          { to: '/teacher/journal', label: 'Sổ đầu bài', icon: ICON.journal },
          { to: '/teacher/evaluations', label: 'Đánh giá HS', icon: ICON.evaluations },
        ],
      },
      {
        title: 'Tiện ích',
        items: [
          { to: '/schedule', label: 'Lịch học', icon: ICON.schedule },
          { to: '/notifications', label: 'Thông báo', icon: ICON.notifications },
        ],
      },
    ],
  },
  gvbm: {
    sections: [
      {
        title: 'Lớp dạy',
        items: [
          { to: '/teacher/subject', label: 'Tổng quan', icon: ICON.home, end: true },
          { to: '/teacher/score-entry', label: 'Nhập điểm', icon: ICON.score },
          { to: '/teacher/journal', label: 'Sổ đầu bài', icon: ICON.journal },
          { to: '/teacher/evaluations', label: 'Đánh giá HS', icon: ICON.evaluations },
        ],
      },
      {
        title: 'Tiện ích',
        items: [
          { to: '/schedule', label: 'Lịch học', icon: ICON.schedule },
          { to: '/notifications', label: 'Thông báo', icon: ICON.notifications },
        ],
      },
    ],
  },
  parent: {
    sections: [
      {
        title: 'Gia đình',
        items: [
          { to: '/family', label: 'Tổng quan', icon: ICON.home, end: true },
        ],
      },
      {
        title: 'Học tập',
        items: [
          { to: '/family/scores', label: 'Bảng điểm', icon: ICON.score },
          { to: '/family/gradebook', label: 'Học bạ', icon: ICON.subjects },
          { to: '/family/evaluations', label: 'Đánh giá', icon: ICON.evaluations },
          { to: '/family/tuition', label: 'Học phí', icon: ICON.tuitions },
        ],
      },
      {
        title: 'Tiện ích',
        items: [
          { to: '/schedule', label: 'Lịch học', icon: ICON.schedule },
          { to: '/extracurricular', label: 'Hoạt động', icon: ICON.activities },
          { to: '/notifications', label: 'Thông báo', icon: ICON.notifications },
        ],
      },
    ],
  },
  student: {
    sections: [],
  },
};

NAV_BY_PERSONA.student = {
  sections: [
    {
      title: 'Cá nhân',
      items: [{ to: '/family', label: 'Tổng quan', icon: ICON.home, end: true }],
    },
    {
      title: 'Học tập',
      items: [
        { to: '/family/scores', label: 'Bảng điểm', icon: ICON.score },
        { to: '/family/gradebook', label: 'Học bạ', icon: ICON.subjects },
        { to: '/family/evaluations', label: 'Đánh giá', icon: ICON.evaluations },
        { to: '/family/tuition', label: 'Học phí', icon: ICON.tuitions },
      ],
    },
    {
      title: 'Tiện ích',
      items: [
        { to: '/schedule', label: 'Lịch học', icon: ICON.schedule },
        { to: '/extracurricular', label: 'Hoạt động', icon: ICON.activities },
        { to: '/notifications', label: 'Thông báo', icon: ICON.notifications },
      ],
    },
  ],
};

export function getNavSections(user) {
  const persona = resolveNavPersona(user);
  return NAV_BY_PERSONA[persona]?.sections || [];
}
