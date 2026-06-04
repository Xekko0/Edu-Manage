'use strict';

const { MAX_PERIODS_PER_WEEK, MAX_PERIODS_PER_DAY_CLASS } = require('./constants');

const slotKey = (day, session, period) => `${day}|${session}|${period}`;
const classSlotKey = (classId, day, session, period) => `${classId}|${slotKey(day, session, period)}`;
const teacherSlotKey = (teacherId, day, session, period) => `${teacherId}|${slotKey(day, session, period)}`;
const classDayKey = (classId, day) => `${classId}|${day}`;
const roomSlotKey = (room, day, session, period) => {
  const r = String(room || '').trim();
  if (!r) return null;
  return `${r}|${slotKey(day, session, period)}`;
};

const createBusyState = () => ({
  classBusy: new Set(),
  teacherBusy: new Set(),
  roomBusy: new Set(),
  teacherWeekCount: new Map(),
  classDayCount: new Map(),
});

const loadBusyFromSchedules = (rows, busy) => {
  for (const s of rows) {
    busy.classBusy.add(classSlotKey(s.class_id, s.day_of_week, s.session, s.period));
    busy.teacherBusy.add(teacherSlotKey(s.teacher_id, s.day_of_week, s.session, s.period));
    const rk = roomSlotKey(s.room, s.day_of_week, s.session, s.period);
    if (rk) busy.roomBusy.add(rk);
    busy.teacherWeekCount.set(
      s.teacher_id,
      (busy.teacherWeekCount.get(s.teacher_id) || 0) + 1,
    );
    const dk = classDayKey(s.class_id, s.day_of_week);
    busy.classDayCount.set(dk, (busy.classDayCount.get(dk) || 0) + 1);
  }
  return busy;
};

const isSlotFree = (busy, classId, teacherId, slot, room = null) => {
  const ck = classSlotKey(classId, slot.day_of_week, slot.session, slot.period);
  const tk = teacherSlotKey(teacherId, slot.day_of_week, slot.session, slot.period);
  if (busy.classBusy.has(ck)) return false;
  if (busy.teacherBusy.has(tk)) return false;
  if ((busy.teacherWeekCount.get(teacherId) || 0) >= MAX_PERIODS_PER_WEEK) return false;
  const dk = classDayKey(classId, slot.day_of_week);
  if ((busy.classDayCount.get(dk) || 0) >= MAX_PERIODS_PER_DAY_CLASS) return false;
  const rk = roomSlotKey(room, slot.day_of_week, slot.session, slot.period);
  if (rk && busy.roomBusy.has(rk)) return false;
  return true;
};

const occupySlot = (busy, classId, teacherId, slot, room = null) => {
  busy.classBusy.add(classSlotKey(classId, slot.day_of_week, slot.session, slot.period));
  busy.teacherBusy.add(teacherSlotKey(teacherId, slot.day_of_week, slot.session, slot.period));
  const rk = roomSlotKey(room, slot.day_of_week, slot.session, slot.period);
  if (rk) busy.roomBusy.add(rk);
  busy.teacherWeekCount.set(teacherId, (busy.teacherWeekCount.get(teacherId) || 0) + 1);
  const dk = classDayKey(classId, slot.day_of_week);
  busy.classDayCount.set(dk, (busy.classDayCount.get(dk) || 0) + 1);
};

const releaseSlot = (busy, classId, teacherId, slot, room = null) => {
  busy.classBusy.delete(classSlotKey(classId, slot.day_of_week, slot.session, slot.period));
  busy.teacherBusy.delete(teacherSlotKey(teacherId, slot.day_of_week, slot.session, slot.period));
  const rk = roomSlotKey(room, slot.day_of_week, slot.session, slot.period);
  if (rk) busy.roomBusy.delete(rk);
  const next = (busy.teacherWeekCount.get(teacherId) || 1) - 1;
  if (next <= 0) busy.teacherWeekCount.delete(teacherId);
  else busy.teacherWeekCount.set(teacherId, next);
  const dk = classDayKey(classId, slot.day_of_week);
  const dayNext = (busy.classDayCount.get(dk) || 1) - 1;
  if (dayNext <= 0) busy.classDayCount.delete(dk);
  else busy.classDayCount.set(dk, dayNext);
};

const slotEquals = (a, b) =>
  a.day_of_week === b.day_of_week && a.session === b.session && a.period === b.period;

/** Ưu tiên ô thuộc ngày lớp đang ít tiết (GDPT ≤7 tiết/ngày). */
const sortSlotsByClassDayLoad = (slotOrder, busy, classId) => {
  return [...slotOrder].sort((a, b) => {
    const da = busy.classDayCount.get(classDayKey(classId, a.day_of_week)) || 0;
    const db = busy.classDayCount.get(classDayKey(classId, b.day_of_week)) || 0;
    if (da !== db) return da - db;
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    if (a.session !== b.session) return a.session.localeCompare(b.session);
    return a.period - b.period;
  });
};

module.exports = {
  slotKey,
  classSlotKey,
  teacherSlotKey,
  classDayKey,
  roomSlotKey,
  createBusyState,
  loadBusyFromSchedules,
  isSlotFree,
  occupySlot,
  releaseSlot,
  slotEquals,
  sortSlotsByClassDayLoad,
};
