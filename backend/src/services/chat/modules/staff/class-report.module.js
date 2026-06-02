const { Class } = require('../../../../models');
const { getClassScoreRows } = require('../../../ai/staff-data.service');
const { STAFF_CHIPS, requireClass } = require('./shared');

const class_report_summary = async (ctx) => run(ctx, 'class_report_summary');
const weak_students_in_class = async (ctx) => run(ctx, 'weak_students_in_class');

const run = async (ctx, intent) => {
  const classId = requireClass(ctx);
  if (!classId) {
    return { type: 'chat', message: 'Chưa xác định lớp.', payload: null, chips: STAFF_CHIPS };
  }
  const sem = ctx.semester || 1;
  const rows = await getClassScoreRows(classId, sem);
  const cls = await Class.findByPk(classId);
  if (intent === 'weak_students_in_class') {
    const weak = rows.filter((r) => r.overall < 5).slice(0, 8);
    const lines = weak.map((r, i) => `${i + 1}. ${r.name || r.student_code}: TB ${r.overall.toFixed(2)}`);
    return {
      type: 'class_scores',
      message: `HS cần chú ý (TB < 5) — lớp ${cls?.name} HK${sem}:\n${lines.join('\n') || 'Không có em dưới 5.0.'}`,
      payload: weak,
      chips: ['Điểm lớp HK1', 'Danh sách học sinh', 'Cách nhập điểm'],
    };
  }
  const avg = rows.length ? rows.reduce((s, r) => s + r.overall, 0) / rows.length : 0;
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  return {
    type: 'stats',
    message: `📋 Báo cáo lớp ${cls?.name} (HK${sem}):\n`
      + `• ${rows.length} học sinh\n`
      + `• TB lớp: ${avg.toFixed(2)}\n`
      + `• Cao nhất: ${top?.name || top?.student_code} (${top?.overall.toFixed(2)})\n`
      + `• Thấp nhất: ${bottom?.name || bottom?.student_code} (${bottom?.overall.toFixed(2)})\n`
      + 'Chi tiết: /teacher/reports hoặc /admin/reports',
    payload: { rows, avg },
    chips: ['Học sinh yếu', 'Danh sách HS', 'Điểm lớp'],
  };
};

const handlers = { class_report_summary, weak_students_in_class };

module.exports = {
  toolId: 'staff.class_report',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
