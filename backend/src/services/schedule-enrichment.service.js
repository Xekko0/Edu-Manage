'use strict';

const { Room } = require('../models');

const buildSlotId = (day, session, period) => `T${day}_${session}_P${period}`;

const formatRoomDisplay = (roomRow, fallbackText) => {
  if (roomRow) {
    const campus = roomRow.campus ? ` (${roomRow.campus})` : '';
    return `${roomRow.name}${campus}`;
  }
  return fallbackText || '—';
};

const toStudentSlotView = (schedule, roomRow = null) => {
  const raw = schedule.toJSON ? schedule.toJSON() : schedule;
  const roomDisplay = formatRoomDisplay(
    roomRow || raw.roomRef,
    raw.room,
  );
  return {
    slot_id: buildSlotId(raw.day_of_week, raw.session, raw.period),
    schedule_id: raw.id,
    subject: raw.subject?.name || null,
    subject_code: raw.subject?.code || null,
    teacher_name: raw.teacher?.full_name || null,
    teacher_id: raw.teacher_id,
    room: roomDisplay,
    room_type: roomRow?.room_type || raw.roomRef?.room_type || 'classroom',
    delivery_mode: raw.delivery_mode || 'offline',
    online_meeting_url: raw.online_meeting_url || null,
    lesson_topic: raw.lesson_topic || null,
    homework_reminder: raw.homework_reminder || null,
    day_of_week: raw.day_of_week,
    session: raw.session,
    period: raw.period,
    class_id: raw.class_id,
    class_name: raw.class?.name || null,
    school_year: raw.school_year,
    conflictTypes: raw.conflictTypes || [],
  };
};

const loadRoomsByIds = async (schedules) => {
  const ids = [...new Set(schedules.map((s) => {
    const r = s.toJSON ? s.toJSON() : s;
    return r.room_id;
  }).filter(Boolean))];
  if (!ids.length) return new Map();
  const rows = await Room.findAll({ where: { id: ids } });
  return new Map(rows.map((r) => [r.id, r]));
};

const enrichSchedulesForStudent = async (schedules) => {
  const roomMap = await loadRoomsByIds(schedules);
  return schedules.map((s) => {
    const raw = s.toJSON ? s.toJSON() : s;
    const roomRow = raw.room_id ? roomMap.get(raw.room_id) : raw.roomRef;
    return toStudentSlotView(s, roomRow);
  });
};

const validateLessonPatch = (patch) => {
  const mode = patch.delivery_mode;
  if (mode === 'online') {
    const url = String(patch.online_meeting_url || '').trim();
    if (!url) {
      const err = new Error('Tiết online cần link Zoom/Teams');
      err.status = 400;
      throw err;
    }
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('invalid');
    } catch {
      const err = new Error('Link học online không hợp lệ');
      err.status = 400;
      throw err;
    }
  }
  if (mode && !['offline', 'online'].includes(mode)) {
    const err = new Error('delivery_mode phải là offline hoặc online');
    err.status = 400;
    throw err;
  }
};

const DEFAULT_PERIOD_TIMES = {
  morning: { 1: '07:00', 2: '07:50', 3: '08:40', 4: '09:30', 5: '10:20' },
  afternoon: { 1: '13:00', 2: '13:50', 3: '14:40', 4: '15:30', 5: '16:20' },
};

const parsePeriodTimes = (raw) => {
  if (!raw) return { ...DEFAULT_PERIOD_TIMES };
  if (typeof raw === 'string') {
    try {
      return parsePeriodTimes(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_PERIOD_TIMES };
    }
  }
  return {
    morning: { ...DEFAULT_PERIOD_TIMES.morning, ...(raw.morning || {}) },
    afternoon: { ...DEFAULT_PERIOD_TIMES.afternoon, ...(raw.afternoon || {}) },
  };
};

module.exports = {
  buildSlotId,
  formatRoomDisplay,
  toStudentSlotView,
  enrichSchedulesForStudent,
  validateLessonPatch,
  DEFAULT_PERIOD_TIMES,
  parsePeriodTimes,
};
