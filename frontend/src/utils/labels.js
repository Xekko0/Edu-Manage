export const TUITION_STATUS = {
  paid: { label: 'Đã đóng', color: 'bg-green-100 text-green-800' },
  partial: { label: 'Đóng một phần', color: 'bg-amber-100 text-amber-800' },
  unpaid: { label: 'Chưa đóng', color: 'bg-red-100 text-red-800' },
};

export const EVALUATION_TYPE = {
  homeroom: 'Nhận xét tổng (GVCN)',
  subject: 'Nhận xét môn học',
  conduct: 'Hạnh kiểm',
};

export const CONDUCT_GRADE = {
  excellent: 'Tốt',
  good: 'Khá',
  fair: 'Trung bình',
  weak: 'Yếu',
};

export const JOURNAL_RATING = {
  good: 'Tốt',
  fair: 'Khá',
  average: 'Trung bình',
  poor: 'Yếu',
};

export const DAY_OF_WEEK = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

export const SCHEDULE_DAYS = [1, 2, 3, 4, 5, 6, 7];
export const TEACHER_MAX_PERIODS_WEEK = 20;
export const SCHEDULE_PERIODS = [1, 2, 3, 4, 5];
export const SESSION_LABEL = { morning: 'Ca sáng', afternoon: 'Ca chiều' };
export const SESSIONS = ['morning', 'afternoon'];

export const MAX_PERIODS_PER_SESSION = 5;

export const CONFLICT_LABEL = {
  class: 'Trùng ô lớp',
  teacher: 'Trùng lịch GV',
  room: 'Trùng phòng',
  weekly_limit: 'Vượt giới hạn tiết/tuần',
  daily_limit: 'Vượt 7 tiết/ngày (GDPT)',
  curriculum: 'Lệch khung CT khối',
  session_cap: 'Vượt 5 tiết/buổi',
};

export const PROGRAM_COMPONENT_LABEL = {
  required_core: 'Môn bắt buộc',
  required_activity: 'Hoạt động bắt buộc',
  elective: 'Môn lựa chọn',
  specialty_cluster: 'Chuyên đề',
  optional_elective: 'Tự chọn',
};

export const PROGRAM_COMPONENT_BADGE = {
  required_core: 'bg-blue-100 text-blue-800',
  required_activity: 'bg-slate-200 text-slate-800',
  elective: 'bg-amber-100 text-amber-900',
  specialty_cluster: 'bg-violet-100 text-violet-800',
  optional_elective: 'bg-teal-100 text-teal-800',
};

export const ROOM_TYPE_LABEL = {
  classroom: 'Lớp học',
  lab: 'Phòng Lab',
  computer: 'Tin học',
  gym: 'Thể dục',
  special: 'Đặc biệt',
};

export const CURRENT_SCHOOL_YEAR = '2024-2025';

export const ROLE_LABEL = {
  admin: 'Quản trị',
  subject: 'GVBM',
  parent: 'Phụ huynh',
  student: 'Học sinh',
};

export const ATTENDANCE_STATUS = {
  present: { label: 'Có mặt', color: 'bg-green-100 text-green-800' },
  excused: { label: 'Vắng có phép', color: 'bg-amber-100 text-amber-800' },
  absent: { label: 'Vắng KP', color: 'bg-red-100 text-red-800' },
};

export const NOTIFICATION_TYPE = {
  system: 'Hệ thống',
  score: 'Điểm số',
  attendance: 'Điểm danh',
  event: 'Sự kiện',
  message: 'Tin nhắn',
};

export const SCORE_TYPE_LABEL = {
  oral: 'Miệng',
  '15min': '15 phút',
  '1period': '1 tiết',
  semester: 'Học kỳ',
};
