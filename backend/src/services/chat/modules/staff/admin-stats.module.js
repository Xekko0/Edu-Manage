const {
  Class, Student, User, TeacherAssignment,
} = require('../../../../models');
const { STAFF_CHIPS, schoolYear } = require('./shared');

const admin_stats = async (ctx) => {
  if (ctx.user_role !== 'admin') {
    return {
      type: 'chat',
      message: 'Thống kê toàn trường chỉ dành cho Admin. Bạn có thể xem báo cáo lớp tại /teacher/reports (GVCN).',
      payload: null,
      chips: STAFF_CHIPS,
    };
  }
  const [classes, students, teachers, assignments] = await Promise.all([
    Class.count({ where: { is_active: true } }),
    Student.count({ where: { is_active: true } }),
    User.count({ where: { role: 'subject' } }),
    TeacherAssignment.count({ where: { school_year: schoolYear(), is_active: true } }),
  ]);
  return {
    type: 'stats',
    message: `📊 Toàn trường (${schoolYear()}):\n• ${classes} lớp\n• ${students} học sinh\n• ${teachers} giáo viên\n• ${assignments} phân công đang active`,
    payload: { classes, students, teachers, assignments },
    chips: ['Quản lý học sinh', 'Phân công GV', 'Báo cáo'],
  };
};

const handlers = { admin_stats };

module.exports = {
  toolId: 'staff.admin_stats',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
