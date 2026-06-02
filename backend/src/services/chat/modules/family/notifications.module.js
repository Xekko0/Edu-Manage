const { Student, Notification } = require('../../../../models');

const view_notifications = async (ctx) => {
  const student = await Student.findByPk(ctx.child_id, { attributes: ['user_id'] });
  const items = await Notification.findAll({
    where: { user_id: student?.user_id },
    order: [['id', 'DESC']],
    limit: 10,
  });
  const text = items.length
    ? items.map((n) => `• ${n.title}${n.is_read ? '' : ' (mới)'}`).join('\n')
    : 'Không có thông báo.';
  return {
    type: 'notifications',
    message: text,
    payload: items,
    chips: ['Tóm tắt tình hình', 'Lịch học', 'Học phí'],
  };
};

const handlers = { view_notifications };

module.exports = {
  toolId: 'family.notifications',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
