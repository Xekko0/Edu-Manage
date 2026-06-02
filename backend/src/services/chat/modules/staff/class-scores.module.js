const { Class } = require('../../../../models');
const { getClassScoreRows } = require('../../../ai/staff-data.service');
const { STAFF_CHIPS, requireClass } = require('./shared');

const view_class_scores = async (ctx) => {
  const classId = requireClass(ctx);
  if (!classId) {
    return { type: 'chat', message: 'Chưa xác định lớp. Hãy chọn lớp hoặc ghi rõ tên lớp.', payload: null, chips: STAFF_CHIPS };
  }
  const sem = ctx.semester || 1;
  const rows = await getClassScoreRows(classId, sem);
  const cls = await Class.findByPk(classId);
  const lines = rows.slice(0, 15).map((r, i) => `${i + 1}. ${r.student_code}: TB ${r.overall.toFixed(2)}`);
  return {
    type: 'class_scores',
    message: `Xếp hạng TB HK${sem} — lớp ${cls?.name}:\n${lines.join('\n')}`,
    payload: rows,
    chips: ['Danh sách học sinh', 'Học sinh điểm thấp', 'Báo cáo lớp'],
  };
};

const handlers = { view_class_scores };

module.exports = {
  toolId: 'staff.class_scores',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
