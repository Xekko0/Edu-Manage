const scoreService = require('../../../score.service');
const { schoolYear } = require('./shared');

const view_scores = async (ctx) => {
  const sem = ctx.semester || 1;
  const data = await scoreService.getStudentSubjectAverages(ctx.child_id, sem, schoolYear());
  return {
    type: 'scores',
    message: `Bảng điểm học kỳ ${sem}:`,
    payload: data,
    chips: ['So sánh các môn', 'Gợi ý ôn tập', 'Lịch học tuần này'],
  };
};

const view_scores_subject = async (ctx) => {
  const sem = ctx.semester || 1;
  const all = await scoreService.getStudentSubjectAverages(ctx.child_id, sem, schoolYear());
  const filtered = ctx.subject
    ? all.filter((s) => s.subject_name.toLowerCase().includes(ctx.subject.toLowerCase()))
    : all;
  return {
    type: 'scores',
    message: `Điểm môn ${ctx.subject || 'tất cả môn'} (HK${sem}):`,
    payload: filtered,
    chips: [`Gợi ý ôn ${ctx.subject || 'tổng quát'}`, 'Tóm tắt tình hình học tập', 'Học phí'],
  };
};

const compare_subjects = async (ctx) => {
  const sem = ctx.semester || 1;
  const all = await scoreService.getStudentSubjectAverages(ctx.child_id, sem, schoolYear());
  const sorted = [...all].sort((a, b) => b.average - a.average);
  const lines = sorted.map((s) => `• ${s.subject_name}: ${s.average.toFixed(2)} (${s.grade})`);
  const best = sorted[0];
  const weak = sorted[sorted.length - 1];
  return {
    type: 'scores',
    message: `So sánh môn HK${sem}:\n${lines.join('\n')}\n\nCao nhất: ${best?.subject_name}. Cần chú ý: ${weak?.subject_name}.`,
    payload: sorted,
    chips: ['Gợi ý ôn tập', 'Tóm tắt tình hình', 'Lịch học'],
  };
};

const view_gradebook = async (ctx) => {
  const sem = ctx.semester || 1;
  const data = await scoreService.getStudentSubjectAverages(ctx.child_id, sem, schoolYear());
  return {
    type: 'scores',
    message: `Học bạ rút gọn HK${sem} — xem đầy đủ tại /family/gradebook:`,
    payload: data,
    chips: ['Xuất PDF học bạ', 'So sánh các môn', 'Gợi ý ôn tập'],
  };
};

const handlers = {
  view_scores,
  view_scores_subject,
  compare_subjects,
  view_gradebook,
};

module.exports = {
  toolId: 'family.scores',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
