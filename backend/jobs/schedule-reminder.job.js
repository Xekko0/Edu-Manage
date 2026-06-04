'use strict';

/**
 * Cron nhắc tiết học 15–30 phút trước (chạy mỗi phút khi bật ENABLE_SCHEDULE_CRON=1).
 */
const cron = require('node-cron');
const { Op } = require('sequelize');
const {
  Schedule, Class, TimetableConfig, Room, Student, User,
} = require('../src/models');
const { parsePeriodTimes, DEFAULT_PERIOD_TIMES } = require('../src/services/schedule-enrichment.service');
const scheduleNotify = require('../src/services/schedule-notify.service');

const REMINDER_MINUTES = [15, 30];

const parseTimeToToday = (timeStr, refDate = new Date()) => {
  const [h, m] = String(timeStr).split(':').map((x) => parseInt(x, 10));
  const d = new Date(refDate);
  d.setHours(h, m || 0, 0, 0);
  return d;
};

const getNextOccurrence = (scheduleRow, periodTimes) => {
  const now = new Date();
  const jsDay = now.getDay();
  const currentDow = jsDay === 0 ? 7 : jsDay;
  const targetDow = scheduleRow.day_of_week;
  let daysAhead = targetDow - currentDow;
  if (daysAhead < 0) daysAhead += 7;

  const sessionTimes = periodTimes[scheduleRow.session] || DEFAULT_PERIOD_TIMES.morning;
  const timeStr = sessionTimes[String(scheduleRow.period)] || sessionTimes['1'];
  if (!timeStr) return null;

  const start = parseTimeToToday(timeStr, now);
  start.setDate(start.getDate() + daysAhead);
  return start;
};

const runReminderTick = async () => {
  const schoolYear = process.env.CURRENT_SCHOOL_YEAR || '2024-2025';
  const config = await TimetableConfig.findOne({ where: { school_year: schoolYear } });
  const periodTimes = parsePeriodTimes(config?.period_times);

  const schedules = await Schedule.findAll({
    where: { school_year: schoolYear },
    include: [
      { model: Room, as: 'roomRef' },
      { model: Class, as: 'class', attributes: ['id', 'name'] },
    ],
  });

  const now = Date.now();

  for (const s of schedules) {
    const start = getNextOccurrence(s, periodTimes);
    if (!start) continue;

    const diffMin = (start.getTime() - now) / 60000;
    for (const targetMin of REMINDER_MINUTES) {
      if (diffMin >= targetMin - 0.5 && diffMin <= targetMin + 0.5) {
        const userIds = await scheduleNotify.getClassRecipientUserIds(s.class_id);
        await scheduleNotify.sendLessonReminder(
          userIds,
          s,
          s.roomRef,
          targetMin,
        );
      }
    }
  }
};

const startScheduleReminderCron = () => {
  if (process.env.ENABLE_SCHEDULE_CRON !== '1') {
    console.log('[CRON] Schedule reminder tắt (ENABLE_SCHEDULE_CRON≠1)');
    return;
  }
  cron.schedule('* * * * *', () => {
    runReminderTick().catch((err) => {
      console.error('[CRON] schedule reminder error:', err.message);
    });
  });
  console.log('[CRON] Schedule reminder — mỗi phút (15 & 30 phút trước tiết)');
};

module.exports = { startScheduleReminderCron, runReminderTick };
