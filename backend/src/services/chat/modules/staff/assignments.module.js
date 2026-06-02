const { STAFF_CHIPS } = require('./shared');

const my_assignments = async (ctx) => {
  if (ctx.user_role === 'admin') {
    return {
      type: 'help',
      message: 'Admin quản lý phân công tại /admin/assignments — gán giáo viên + lớp + môn.',
      payload: null,
      chips: STAFF_CHIPS,
    };
  }
  const lines = ctx.assignments.map((a) => `• ${a.class_name} — môn ${a.subject_name}`);
  return {
    type: 'assignments',
    message: lines.length ? `Phân công của bạn:\n${lines.join('\n')}` : 'Chưa có phân công môn/lớp.',
    payload: ctx.assignments,
    chips: ['Nhập điểm', 'Lớp chủ nhiệm', 'Tôi có thể làm gì?'],
  };
};

const my_subject_scores = async (ctx) => {
  if (!ctx.assignments?.length) {
    return {
      type: 'chat',
      message: 'Chưa có phân công môn/lớp. Admin gán tại /admin/assignments.',
      payload: null,
      chips: STAFF_CHIPS,
    };
  }
  const lines = ctx.assignments.map((a) => `• ${a.class_name} — ${a.subject_name}`);
  return {
    type: 'assignments',
    message: `Môn bạn đang dạy:\n${lines.join('\n')}\n\nNhập điểm tại /teacher/score-entry.`,
    payload: ctx.assignments,
    chips: ['Cách nhập điểm', 'Điểm lớp HK1', 'Danh sách lớp'],
  };
};

const handlers = { my_assignments, my_subject_scores };

module.exports = {
  toolId: 'staff.assignments',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
