const { Student, Extracurricular } = require('../../../../models');

const view_extracurricular = async (ctx) => {
  const student = await Student.findByPk(ctx.child_id, {
    include: [{ model: Extracurricular, as: 'activities' }],
  });
  return {
    type: 'extracurricular',
    message: 'Hoạt động ngoại khóa đã đăng ký:',
    payload: student?.activities || [],
    chips: ['Xem điểm', 'Lịch học', 'Gợi ý ôn tập'],
  };
};

const handlers = { view_extracurricular };

module.exports = {
  toolId: 'family.extracurricular',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
