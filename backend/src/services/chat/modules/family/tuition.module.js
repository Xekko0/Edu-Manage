const { TuitionPayment, Tuition } = require('../../../../models');

const view_tuition = async (ctx) => {
  const payments = await TuitionPayment.findAll({
    where: { student_id: ctx.child_id },
    include: [{ model: Tuition, as: 'tuition' }],
  });
  const lines = payments.map((p) => {
    const t = p.tuition;
    const amt = Number(t?.amount || 0);
    const paid = Number(p.amount_paid || 0);
    const statusLabel = p.status === 'paid' ? 'Đã đóng' : p.status === 'partial' ? 'Một phần' : 'Chưa đóng';
    return `HK${t?.semester}: ${statusLabel} — ${paid.toLocaleString('vi-VN')} / ${amt.toLocaleString('vi-VN')} đ`;
  });
  return {
    type: 'tuition',
    message: lines.length ? `Học phí:\n${lines.join('\n')}` : 'Chưa có thông tin học phí.',
    payload: payments,
    chips: ['Tóm tắt tình hình', 'Xem điểm', 'Thông báo trường'],
  };
};

const handlers = { view_tuition };

module.exports = {
  toolId: 'family.tuition',
  audience: 'family',
  intents: Object.keys(handlers),
  handlers,
};
