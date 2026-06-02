/**
 * Định dạng thời khóa biểu cho AI chat (text + payload UI).
 */
const SESSION_LABEL = { morning: 'Sáng', afternoon: 'Chiều' };

const subjectName = (row) =>
  row?.subject?.name || row?.subject_name || row?.subject || '—';

const formatScheduleLines = (items, limit = 14) =>
  (items || []).slice(0, limit).map((s) => {
    const ses = SESSION_LABEL[s.session] || s.session || '';
    const sesPart = ses ? ` (${ses})` : '';
    const room = s.room ? ` — ${s.room}` : '';
    return `Thứ ${s.day_of_week}${sesPart} tiết ${s.period}: ${subjectName(s)}${room}`;
  });

const formatScheduleMessage = (items, { className, prefix = 'Thời khóa biểu', compact = false } = {}) => {
  const lines = formatScheduleLines(items);
  const title = className ? `${prefix} lớp ${className}` : prefix;
  if (!lines.length) {
    return `${title}:\nChưa có lịch trong hệ thống. Admin/GVCN có thể cập nhật tại **Lịch học** (/schedule).`;
  }
  if (compact) {
    return `${title}: ${items.length} tiết — xem bảng bên dưới (không trùng dòng chữ).`;
  }
  const more = (items?.length || 0) > lines.length
    ? `\n… và ${items.length - lines.length} tiết khác.`
    : '';
  return `${title}:\n${lines.join('\n')}${more}`;
};

/** Chuẩn hóa payload cho ChatMessage.jsx */
const toSchedulePayload = (items) =>
  (items || []).slice(0, 20).map((s, idx) => ({
    id: s.id ?? idx + 1,
    day_of_week: s.day_of_week ?? s.day,
    period: s.period,
    session: s.session,
    room: s.room,
    subject: typeof s.subject === 'object'
      ? s.subject
      : { name: s.subject || s.subject_name || '—' },
  }));

module.exports = {
  formatScheduleLines,
  formatScheduleMessage,
  toSchedulePayload,
};
