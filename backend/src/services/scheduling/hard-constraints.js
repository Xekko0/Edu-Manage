'use strict';

const { slotKey, roomSlotKey } = require('./busy-state');
const {
  MAX_PERIODS_PER_WEEK, MAX_PERIODS_PER_SESSION, MAX_PERIODS_PER_DAY_CLASS,
} = require('./constants');

const HARD_TYPES = [
  'teacher', 'class', 'room', 'curriculum', 'session_cap', 'weekly_limit', 'daily_limit',
];

const detectHardViolationsFromSchedules = (schedules, options = {}) => {
  const violations = [];
  const byClassSlot = new Map();
  const byTeacherSlot = new Map();
  const byRoomSlot = new Map();
  const teacherWeekCount = new Map();
  const classDayCount = new Map();

  for (const s of schedules) {
    const raw = s.toJSON ? s.toJSON() : s;
    const key = slotKey(raw.day_of_week, raw.session, raw.period);
    const ck = `${raw.class_id}|${key}`;
    const tk = `${raw.teacher_id}|${key}`;
    if (!byClassSlot.has(ck)) byClassSlot.set(ck, []);
    byClassSlot.get(ck).push(raw);
    if (!byTeacherSlot.has(tk)) byTeacherSlot.set(tk, []);
    byTeacherSlot.get(tk).push(raw);
    teacherWeekCount.set(raw.teacher_id, (teacherWeekCount.get(raw.teacher_id) || 0) + 1);
    const dayKey = `${raw.class_id}|${raw.day_of_week}`;
    classDayCount.set(dayKey, (classDayCount.get(dayKey) || 0) + 1);
    const rk = roomSlotKey(raw.room, raw.day_of_week, raw.session, raw.period);
    if (rk) {
      if (!byRoomSlot.has(rk)) byRoomSlot.set(rk, []);
      byRoomSlot.get(rk).push(raw);
    }
    if (raw.period > MAX_PERIODS_PER_SESSION) {
      violations.push({
        type: 'session_cap',
        schedule_id: raw.id,
        class_id: raw.class_id,
        message: `Tiết ${raw.period} vượt tối đa ${MAX_PERIODS_PER_SESSION}/buổi`,
      });
    }
  }

  for (const [, rows] of byClassSlot) {
    if (rows.length > 1) {
      for (const r of rows) {
        violations.push({
          type: 'class',
          schedule_id: r.id,
          class_id: r.class_id,
          day_of_week: r.day_of_week,
          session: r.session,
          period: r.period,
          message: 'Lớp có hai môn cùng một tiết',
        });
      }
    }
  }

  for (const [, rows] of byTeacherSlot) {
    if (rows.length > 1) {
      for (const r of rows) {
        violations.push({
          type: 'teacher',
          schedule_id: r.id,
          teacher_id: r.teacher_id,
          day_of_week: r.day_of_week,
          session: r.session,
          period: r.period,
          message: 'Giáo viên dạy trùng khung giờ',
        });
      }
    }
  }

  for (const [, rows] of byRoomSlot) {
    if (rows.length > 1) {
      for (const r of rows) {
        violations.push({
          type: 'room',
          schedule_id: r.id,
          room: r.room,
          day_of_week: r.day_of_week,
          session: r.session,
          period: r.period,
          message: 'Phòng học trùng khung giờ',
        });
      }
    }
  }

  for (const [teacherId, count] of teacherWeekCount) {
    if (count > MAX_PERIODS_PER_WEEK) {
      violations.push({
        type: 'weekly_limit',
        teacher_id: teacherId,
        count,
        message: `Giáo viên vượt ${MAX_PERIODS_PER_WEEK} tiết/tuần`,
      });
    }
  }

  for (const [dayKey, count] of classDayCount) {
    if (count > MAX_PERIODS_PER_DAY_CLASS) {
      const [classId, day] = dayKey.split('|');
      violations.push({
        type: 'daily_limit',
        class_id: parseInt(classId, 10),
        day_of_week: parseInt(day, 10),
        count,
        message: `Lớp vượt ${MAX_PERIODS_PER_DAY_CLASS} tiết/ngày (Thứ ${day}: ${count} tiết)`,
      });
    }
  }

  if (options.curriculumMismatches?.length) {
    for (const m of options.curriculumMismatches) {
      violations.push({ type: 'curriculum', ...m });
    }
  }

  return violations;
};

const summarizeViolations = (violations) => {
  const byType = {};
  for (const t of HARD_TYPES) byType[t] = 0;
  for (const v of violations) {
    byType[v.type] = (byType[v.type] || 0) + 1;
  }
  const hard_ok = violations.length === 0;
  return { byType, hard_ok, total: violations.length };
};

module.exports = {
  HARD_TYPES,
  detectHardViolationsFromSchedules,
  summarizeViolations,
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_WEEK,
  MAX_PERIODS_PER_DAY_CLASS,
};
