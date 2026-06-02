/**
 * Giới hạn intent chat theo persona (GVBM không dùng chức năng GVCN).
 */
const { HOW_TO_GUIDES } = require('../services/ai/staff-capabilities');

const GVCN_ONLY_INTENTS = new Set([
  'view_class_attendance',
  'link_parent_guide',
  'create_student_guide',
]);

const GVCN_ONLY_HOW_TO = new Set(['attendance', 'parents', 'students']);

const denyGvbm = (message, chips = []) => ({
  type: 'chat',
  message,
  payload: null,
  chips,
});

const enforceChatScope = (persona, intent) => {
  if (persona !== 'gvbm') return null;

  if (GVCN_ONLY_INTENTS.has(intent.intent)) {
    if (intent.intent === 'view_class_attendance') {
      return denyGvbm(
        'Điểm danh lớp chỉ dành cho **Giáo viên chủ nhiệm (GVCN)**.\n\n'
          + `GVCN có thể vào ${HOW_TO_GUIDES.attendance}\n\n`
          + 'Bạn (GVBM) có thể: nhập điểm môn được phân công, xem điểm lớp, ghi sổ đầu bài.',
        ['Phân công của tôi', 'Cách nhập điểm', 'Điểm trung bình lớp'],
      );
    }
    if (intent.intent === 'link_parent_guide') {
      return denyGvbm(
        'Liên kết Phụ huynh ↔ Học sinh do **GVCN** hoặc Admin thực hiện.\n\n'
          + HOW_TO_GUIDES.parents,
        ['Tôi có thể làm gì?', 'Nhập điểm', 'Danh sách lớp'],
      );
    }
    if (intent.intent === 'create_student_guide') {
      return denyGvbm(
        'Tạo hồ sơ học sinh trong lớp do **GVCN** hoặc Admin thực hiện.\n\n'
          + HOW_TO_GUIDES.students,
        ['Tôi có thể làm gì?', 'Nhập điểm', 'Phân công của tôi'],
      );
    }
  }

  if (intent.intent === 'how_to' && GVCN_ONLY_HOW_TO.has(intent.topic)) {
    const guide = HOW_TO_GUIDES[intent.topic] || '';
    return denyGvbm(
      `Thao tác này dành cho GVCN/Admin.\n\n${guide}\n\nBạn là GVBM — tập trung nhập điểm và đánh giá môn được phân công.`,
      ['Cách nhập điểm', 'Phân công của tôi', 'Điểm lớp HK1'],
    );
  }

  return null;
};

module.exports = { enforceChatScope, GVCN_ONLY_INTENTS };
