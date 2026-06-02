const { Op } = require('sequelize');
const { Student, Class, Attendance } = require('../../../../models');
const { STAFF_CHIPS, requireClass } = require('./shared');

const view_class_attendance = async (ctx) => {
  const classId = requireClass(ctx);
  if (!classId) {
    return { type: 'chat', message: 'Chưa xác định lớp.', payload: null, chips: STAFF_CHIPS };
  }
  const students = await Student.findAll({ where: { class_id: classId }, attributes: ['id', 'student_code'] });
  const ids = students.map((s) => s.id);
  const items = await Attendance.findAll({
    where: { student_id: { [Op.in]: ids } },
    order: [['attendance_date', 'DESC']],
    limit: 40,
  });
  const absent = items.filter((a) => a.status === 'absent').length;
  const cls = await Class.findByPk(classId);
  return {
    type: 'attendance',
    message: `Lớp ${cls?.name}: ${absent} buổi vắng (trong ${items.length} bản ghi gần nhất). GVCN điểm danh tại /teacher/attendance.`,
    payload: items,
    chips: ['Danh sách HS', 'Điểm lớp', 'Cách điểm danh'],
  };
};

const handlers = { view_class_attendance };

module.exports = {
  toolId: 'staff.class_attendance',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
