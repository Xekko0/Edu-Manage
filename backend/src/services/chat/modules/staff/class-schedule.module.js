const { Schedule, Subject, Class } = require('../../../../models');
const { formatScheduleMessage, toSchedulePayload } = require('../../../ai/schedule-message.util');
const { isMyTeachingScheduleQuestion } = require('../../../ai/schedule-intent.util');
const { STAFF_CHIPS, schoolYear, requireClass } = require('./shared');

const view_class_schedule = async (ctx, options = {}) => {
  const classId = requireClass(ctx);
  if (!classId) {
    return { type: 'chat', message: 'Chưa xác định lớp.', payload: null, chips: STAFF_CHIPS };
  }
  let items = await Schedule.findAll({
    where: { class_id: classId, school_year: schoolYear() },
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }],
    order: [['day_of_week', 'ASC'], ['session', 'ASC'], ['period', 'ASC']],
  });
  const cls = await Class.findByPk(classId);
  const { userMessage } = options;
  const mineOnly = isMyTeachingScheduleQuestion(userMessage);
  if (mineOnly) {
    items = items.filter((s) => Number(s.teacher_id) === Number(ctx.user_id));
  }
  const payload = toSchedulePayload(items);
  const prefix = mineOnly
    ? `Lịch dạy của bạn (lớp ${cls?.name || ''})`
    : `Thời khóa biểu lớp ${cls?.name || ''}`;
  return {
    type: 'schedule',
    message: items.length
      ? formatScheduleMessage(items, { prefix, compact: true })
      : `${prefix}: Bạn chưa có tiết dạy ở lớp này. Bật «TKB cả lớp» tại /schedule để xem lịch đầy đủ.`,
    payload,
    chips: mineOnly
      ? ['TKB cả lớp', 'Phân công của tôi', 'Tôi có thể làm gì?']
      : ['Danh sách HS', 'Điểm lớp', 'Lịch dạy của tôi'],
    chip_actions: [{ label: mineOnly ? 'TKB cả lớp' : 'Mở Lịch học', path: '/schedule' }],
  };
};

const handlers = { view_class_schedule };

module.exports = {
  toolId: 'staff.class_schedule',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
