const { Attendance } = require('../../../../models');

const view_attendance = async (ctx) => {
  const items = await Attendance.findAll({
    where: { student_id: ctx.child_id },
    order: [['attendance_date', 'DESC']],
    limit: 30,
  });
  const absent = items.filter((a) => a.status === 'absent').length;
  return {
    type: 'attendance',
    message: `30 ngày gần đây: ${absent} buổi vắng không phép.`,
    payload: items,
    chips: ['Xem điểm', 'Lịch học', 'Tóm tắt tình hình'],
  };
};

const handlers = { view_attendance };

module.exports = {
  toolId: 'family.attendance',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
