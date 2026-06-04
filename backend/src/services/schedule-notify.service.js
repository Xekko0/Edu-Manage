'use strict';

const { Op } = require('sequelize');
const {
  Student, User, Notification,
} = require('../models');
const { toStudentSlotView } = require('./schedule-enrichment.service');
const pushNotificationService = require('./push-notification.service');

const getClassRecipientUserIds = async (classId) => {
  const students = await Student.findAll({
    where: { class_id: classId, is_active: true },
    attributes: ['user_id'],
    include: [{ model: User, as: 'parents', attributes: ['id'] }],
  });
  const ids = new Set();
  for (const stu of students) {
    if (stu.user_id) ids.add(stu.user_id);
    for (const p of stu.parents || []) {
      if (p.id) ids.add(p.id);
    }
  }
  return [...ids];
};

const createInAppNotification = async (userId, title, body, metadata = {}) => {
  return Notification.create({
    user_id: userId,
    title,
    body,
    type: 'schedule',
    metadata,
  });
};

const notifyUsers = async (userIds, { title, body, metadata, url = '/schedule' }) => {
  const payload = { title, body, url, metadata };
  for (const uid of userIds) {
    await createInAppNotification(uid, title, body, metadata);
    await pushNotificationService.sendToUser(uid, payload).catch(() => {});
  }
};

const notifyClassScheduleChange = async (classId, summary, metadata = {}) => {
  const userIds = await getClassRecipientUserIds(classId);
  if (!userIds.length) return { sent: 0 };

  const title = 'Thời khóa biểu có thay đổi';
  const body = summary || 'Lịch học của lớp bạn đã được cập nhật. Vui lòng kiểm tra TKB mới.';
  await notifyUsers(userIds, {
    title,
    body,
    metadata: { ...metadata, class_id: classId, kind: 'schedule_change' },
  });
  return { sent: userIds.length };
};

const notifyScheduleSlotChange = async (scheduleRow, changeSummary) => {
  if (!scheduleRow?.class_id) return;
  const slot = toStudentSlotView(scheduleRow, scheduleRow.roomRef);
  const summary = changeSummary
    || `${slot.subject} — ${slot.teacher_name} — ${slot.room}`;
  return notifyClassScheduleChange(scheduleRow.class_id, summary, {
    schedule_id: scheduleRow.id,
    slot_id: slot.slot_id,
  });
};

const wasReminderSentRecently = async (scheduleId, reminderKind, minutesWindow = 60) => {
  const since = new Date(Date.now() - minutesWindow * 60 * 1000);
  const rows = await Notification.findAll({
    where: {
      type: 'schedule',
      created_at: { [Op.gte]: since },
    },
    attributes: ['metadata'],
    limit: 200,
  });
  return rows.some((r) => {
    const m = typeof r.metadata === 'string'
      ? (() => { try { return JSON.parse(r.metadata); } catch { return {}; } })()
      : (r.metadata || {});
    return m.schedule_id === scheduleId && m.reminder_kind === reminderKind;
  });
};

const sendLessonReminder = async (userIds, scheduleRow, roomRow, minutesBefore) => {
  const slot = toStudentSlotView(scheduleRow, roomRow);
  const kind = `reminder_${minutesBefore}m`;
  const already = await wasReminderSentRecently(scheduleRow.id, kind, 90);
  if (already) return { skipped: true };

  const title = `Sắp đến giờ học (${minutesBefore} phút)`;
  const body = `${slot.subject} — ${slot.teacher_name} — ${slot.room}`;
  await notifyUsers(userIds, {
    title,
    body,
    metadata: {
      schedule_id: scheduleRow.id,
      slot_id: slot.slot_id,
      reminder_kind: kind,
      minutes_before: minutesBefore,
    },
  });
  return { sent: userIds.length };
};

module.exports = {
  getClassRecipientUserIds,
  notifyClassScheduleChange,
  notifyScheduleSlotChange,
  sendLessonReminder,
  wasReminderSentRecently,
};
