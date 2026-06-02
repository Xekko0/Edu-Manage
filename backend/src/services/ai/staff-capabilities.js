/**
 * Chức năng & menu theo persona — Admin / GVCN / GVBM.
 */
const ADMIN_FEATURES = [
  { label: 'Tổng quan hệ thống', path: '/admin', action: 'Xem dashboard, thống kê' },
  { label: 'Quản lý tài khoản', path: '/admin/users', action: 'Tạo/sửa/khóa user, reset mật khẩu' },
  { label: 'Quản lý học sinh', path: '/admin/students', action: 'CRUD hồ sơ HS toàn trường' },
  { label: 'Lớp & khối', path: '/admin/classes', action: 'Tạo lớp, gán GVCN' },
  { label: 'Môn học', path: '/admin/subjects', action: 'Danh mục môn' },
  { label: 'Phân công GV', path: '/admin/assignments', action: 'Gán GVBM — lớp × môn' },
  { label: 'Phân bổ TKB', path: '/admin/schedules', action: 'Lập thời khóa biểu' },
  { label: 'Học phí', path: '/admin/tuitions', action: 'Cấu hình học phí theo lớp/kỳ' },
  { label: 'Báo cáo', path: '/admin/reports', action: 'Báo cáo toàn trường' },
  { label: 'Lịch học', path: '/schedule', action: 'Xem TKB' },
  { label: 'Thông báo', path: '/notifications', action: 'Gửi/xem thông báo' },
];

const TEACHER_SUBJECT_FEATURES = [
  { label: 'Lớp dạy (GVBM)', path: '/teacher/subject', action: 'Xem lớp-môn được phân công' },
  { label: 'Nhập điểm', path: '/teacher/score-entry', action: 'Nhập/sửa điểm môn được phân công' },
  { label: 'Sổ đầu bài', path: '/teacher/journal', action: 'Ghi sổ tiết học' },
  { label: 'Đánh giá HS', path: '/teacher/evaluations', action: 'Nhận xét môn/lớp được dạy' },
  { label: 'Lịch học', path: '/schedule', action: 'Xem TKB lớp' },
  { label: 'Thông báo', path: '/notifications', action: 'Xem thông báo' },
];

const TEACHER_HOMEROOM_FEATURES = [
  { label: 'Lớp chủ nhiệm', path: '/teacher/homeroom', action: 'Dashboard lớp CN' },
  { label: 'Học sinh lớp tôi', path: '/teacher/students', action: 'Danh sách HS, tạo HS/PH' },
  { label: 'Phụ huynh lớp tôi', path: '/teacher/parents', action: 'Liên kết PH ↔ HS' },
  { label: 'Điểm danh', path: '/teacher/attendance', action: 'Điểm danh buổi học' },
  { label: 'Báo cáo lớp', path: '/teacher/reports', action: 'Thống kê điểm lớp CN' },
  { label: 'Nhập điểm (nếu dạy môn)', path: '/teacher/score-entry', action: 'Nhập điểm môn được phân công' },
  { label: 'Đánh giá / hạnh kiểm', path: '/teacher/evaluations', action: 'Đánh giá tổng, hạnh kiểm' },
];

const HOW_TO_GUIDES = {
  score_entry: 'Vào **Nhập điểm** (/teacher/score-entry) → chọn lớp + môn được phân công → nhập điểm miệng/15p/1 tiết/Cuối kỳ → Lưu.',
  attendance: 'Vào **Điểm danh** (/teacher/attendance) — chỉ GVCN → chọn ngày/buổi → đánh dấu có mặt/vắng.',
  students: 'GVCN: **HS lớp tôi** (/teacher/students) → Thêm học sinh / sửa hồ sơ. Admin: **Quản lý học sinh** (/admin/students).',
  assignment: 'Admin: **Phân công GV** (/admin/assignments) → gán giáo viên + lớp + môn + năm học.',
  schedule: 'Admin: **Phân bổ TKB** (/admin/schedules). Mọi role xem tại **Lịch học** (/schedule).',
  tuition: 'Admin: **Học phí** (/admin/tuitions) → cấu hình mức phí theo lớp/kỳ.',
  evaluation: '**Đánh giá HS** (/teacher/evaluations) → chọn HS → nhận xét môn hoặc hạnh kiểm (GVCN).',
  parents: 'GVCN: **PH lớp tôi** (/teacher/parents) → liên kết tài khoản phụ huynh với học sinh.',
  link_parent: 'GVCN: **PH lớp tôi** (/teacher/parents) → chọn HS → liên kết email PH.',
};

const getStaffCapabilities = (role, { persona, isHomeroom = false } = {}) => {
  if (role === 'admin' || persona === 'admin') {
    return {
      persona: 'admin',
      role_label: 'Quản trị viên',
      features: ADMIN_FEATURES,
      how_to: HOW_TO_GUIDES,
    };
  }

  if (persona === 'gvbm' || (!isHomeroom && persona !== 'gvcn')) {
    return {
      persona: 'gvbm',
      role_label: 'Giáo viên bộ môn (GVBM)',
      features: [...TEACHER_SUBJECT_FEATURES],
      how_to: HOW_TO_GUIDES,
    };
  }

  return {
    persona: 'gvcn',
    role_label: 'Giáo viên chủ nhiệm (GVCN)',
    features: [...TEACHER_HOMEROOM_FEATURES, ...TEACHER_SUBJECT_FEATURES.filter(
      (f) => !TEACHER_HOMEROOM_FEATURES.some((h) => h.path === f.path),
    )],
    how_to: HOW_TO_GUIDES,
  };
};

const formatFeaturesText = (caps) => {
  let text = `Vai trò: ${caps.role_label}\n\nChức năng bạn có thể dùng:\n`;
  caps.features.forEach((f, i) => {
    text += `${i + 1}. **${f.label}** — ${f.action}\n   → ${f.path}\n`;
  });
  return text.trim();
};

module.exports = {
  getStaffCapabilities,
  formatFeaturesText,
  HOW_TO_GUIDES,
  ADMIN_FEATURES,
};
