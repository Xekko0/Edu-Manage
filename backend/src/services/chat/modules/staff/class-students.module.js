const { Student, User, Class } = require('../../../../models');
const { requireClass } = require('./shared');

const list_students = async (ctx, options) => run(ctx, options, 'list_students');
const search_student = async (ctx, options) => run(ctx, options, 'search_student');

const run = async (ctx, options, intent) => {
  const classId = requireClass(ctx);
  if (!classId) {
    return {
      type: 'chat',
      message: 'Chọn hoặc nêu tên lớp (vd: 10A1) trong câu hỏi. Admin: vào /admin/students.',
      payload: null,
      chips: ['Lớp tôi dạy', 'Tôi có thể làm gì?'],
    };
  }
  let students = await Student.findAll({
    where: { class_id: classId, is_active: true },
    include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }],
    limit: 50,
  });
  const { userMessage } = options || {};
  if (intent === 'search_student' && userMessage) {
    const q = userMessage.replace(/tìm|tim|học sinh|hoc sinh|hs/gi, '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.length >= 2) {
      students = students.filter((s) => {
        const name = (s.user?.full_name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return name.includes(q) || (s.student_code || '').toLowerCase().includes(q);
      });
    }
  }
  students = students.slice(0, 25);
  const cls = await Class.findByPk(classId);
  const list = students.map((s, i) => `${i + 1}. ${s.user?.full_name || '—'} (${s.student_code})`);
  return {
    type: 'students',
    message: `Học sinh lớp ${cls?.name || classId} (${students.length} em):\n${list.join('\n') || 'Không tìm thấy.'}`,
    payload: students,
    chips: ['Điểm lớp HK1', 'Điểm danh lớp', 'Cách nhập điểm'],
  };
};

const handlers = { list_students, search_student };

module.exports = {
  toolId: 'staff.class_students',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
