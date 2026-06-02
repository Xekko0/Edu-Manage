const { Schedule, Subject } = require('../../../../models');
const { formatScheduleMessage, toSchedulePayload } = require('../../../ai/schedule-message.util');
const { FALLBACK_CHIPS, SCHEDULE_CHIP_ACTIONS, schoolYear } = require('./shared');

const view_schedule = async (ctx) => {
  if (!ctx.class_id) {
    return {
      type: 'chat',
      message: 'Không xác định được lớp để xem thời khóa biểu.',
      payload: null,
      chips: FALLBACK_CHIPS,
    };
  }
  const items = await Schedule.findAll({
    where: { class_id: ctx.class_id, school_year: schoolYear() },
    include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }],
    order: [['day_of_week', 'ASC'], ['session', 'ASC'], ['period', 'ASC']],
  });
  const payload = toSchedulePayload(items);
  return {
    type: 'schedule',
    message: formatScheduleMessage(items, { prefix: 'Lịch học tuần này', compact: true }),
    payload,
    chips: ['Điểm các môn', 'Con có vắng không?', 'Hoạt động ngoại khóa'],
    chip_actions: SCHEDULE_CHIP_ACTIONS,
  };
};

const handlers = { view_schedule };

module.exports = {
  toolId: 'family.schedule',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
