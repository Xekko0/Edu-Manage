const { Evaluation, Subject } = require('../../../../models');
const { schoolYear } = require('./shared');

const view_evaluations = async (ctx) => {
  const where = { student_id: ctx.child_id, school_year: schoolYear() };
  if (ctx.semester) where.semester = ctx.semester;
  const items = await Evaluation.findAll({
    where,
    include: [{ model: Subject, as: 'subject' }],
    order: [['id', 'DESC']],
    limit: 8,
  });
  const text = items.length
    ? items.map((e) => {
        const subj = e.subject?.name ? ` (${e.subject.name})` : '';
        return `• [${e.type}${subj}] ${(e.content || '').slice(0, 120)}`;
      }).join('\n')
    : 'Chưa có nhận xét từ giáo viên.';
  return {
    type: 'evaluations',
    message: `Nhận xét gần đây:\n${text}`,
    payload: items,
    chips: ['Xem điểm', 'Hạnh kiểm thế nào?', 'Gợi ý cải thiện'],
  };
};

const handlers = { view_evaluations };

module.exports = {
  toolId: 'family.evaluations',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
