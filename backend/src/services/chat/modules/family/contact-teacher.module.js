const { Student, User, Class } = require('../../../../models');

const contact_teacher = async (ctx) => {
  const student = await Student.findByPk(ctx.child_id, {
    include: [{
      model: Class,
      as: 'class',
      include: [{ model: User, as: 'homeroomTeacher', attributes: ['full_name', 'email'] }],
    }],
  });
  const gvcn = student?.class?.homeroomTeacher;
  return {
    type: 'chat',
    message: gvcn
      ? `GVCN lớp ${student?.class?.name || ''}: ${gvcn.full_name} (${gvcn.email}). Liên hệ qua thông báo /email trường.`
      : 'Chưa có thông tin GVCN. Xem thông báo tại /notifications hoặc hỏi nhà trường.',
    payload: gvcn,
    chips: ['Thông báo trường', 'Lịch học', 'Xem điểm'],
  };
};

const handlers = { contact_teacher };

module.exports = {
  toolId: 'family.contact_teacher',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
