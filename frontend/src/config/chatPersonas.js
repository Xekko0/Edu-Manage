/**
 * Cấu hình UI AI Widget theo 5 persona SRS.
 */
export const PERSONAS = ['admin', 'gvcn', 'gvbm', 'parent', 'student'];

export const CHAT_PERSONAS = {
  admin: {
    title: 'Trợ lý AI — Admin',
    welcome: 'Hỏi về thống kê trường, quản lý user/HS/lớp, phân công, TKB, học phí…',
    placeholder: 'Hỏi về chức năng quản trị…',
    starterChips: [
      'Tôi có thể làm gì?',
      'Thống kê toàn trường',
      'Cách phân công giáo viên',
      'Danh sách lớp',
    ],
    errorChips: ['Tôi có thể làm gì?', 'Thống kê toàn trường', 'Thử lại'],
  },
  gvcn: {
    title: 'Trợ lý AI — GVCN',
    welcome: 'Tra cứu lớp chủ nhiệm: HS, PH, điểm danh, điểm lớp, liên kết phụ huynh…',
    placeholder: 'Hỏi về lớp chủ nhiệm…',
    starterChips: [
      'Tôi có thể làm gì?',
      'Danh sách học sinh lớp',
      'Thời khóa biểu lớp',
      'Điểm danh lớp',
    ],
    errorChips: ['Tôi có thể làm gì?', 'Danh sách HS', 'Cách điểm danh'],
  },
  gvbm: {
    title: 'Trợ lý AI — GVBM',
    welcome: 'Tra cứu lớp-môn được phân công, nhập điểm, sổ đầu bài, đánh giá môn…',
    placeholder: 'Hỏi về môn/lớp bạn dạy…',
    starterChips: [
      'Phân công của tôi',
      'Thời khóa biểu lớp',
      'Cách nhập điểm',
      'Điểm trung bình lớp',
    ],
    errorChips: ['Phân công của tôi', 'Cách nhập điểm', 'Thử lại'],
  },
  parent: {
    title: 'Trợ lý EduSmart — PH',
    welcome: 'Hỏi về điểm, lịch, học phí, nhận xét và tình hình học tập của con.',
    placeholder: 'Hỏi về học tập của con…',
    starterChips: [
      'Tóm tắt tình hình học tập',
      'Điểm con tôi môn Toán?',
      'Lịch học tuần này',
      'Học phí đã đóng chưa?',
    ],
    errorChips: ['Xem điểm', 'Lịch học', 'Thử lại'],
  },
  student: {
    title: 'Trợ lý EduSmart — HS',
    welcome: 'Hỏi về điểm, lịch, học phí và tư vấn học tập của bạn.',
    placeholder: 'Hỏi về học tập của bạn…',
    starterChips: [
      'Tóm tắt tình hình học tập',
      'Điểm môn Toán HK1',
      'Lịch học tuần này',
      'Gợi ý ôn tập',
    ],
    errorChips: ['Xem điểm', 'Lịch học', 'Thử lại'],
  },
};

/** Suy persona phía client (đồng bộ logic backend). */
export function resolveClientPersona(user, homeroomClass) {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  if (user.role === 'parent') return 'parent';
  if (user.role === 'student') return 'student';
  if (user.role === 'homeroom') return 'gvcn';
  if (user.role === 'subject') return homeroomClass ? 'gvcn' : 'gvbm';
  return null;
}

export function getPersonaConfig(persona) {
  return CHAT_PERSONAS[persona] || CHAT_PERSONAS.parent;
}
