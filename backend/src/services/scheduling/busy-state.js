'use strict';

const { MAX_PERIODS_PER_WEEK } = require('./constants');

const slotKey = (day, session, period) => `${day}|${session}|${period}`;
const classSlotKey = (classId, day, session, period) => `${classId}|${slotKey(day, session, period)}`;
const teacherSlotKey = (teacherId, day, session, period) => `${teacherId}|${slotKey(day, session, period)}`;
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
  }
  return busy;
};

const isSlotFree = (busy, classId, teacherId, slot, room = null) => {
  const ck = classSlotKey(classId, slot.day_of_week, slot.session, slot.period);
  const tk = teacherSlotKey(teacherId, slot.day_of_week, slot.session, slot.period);
  if (busy.classBusy.has(ck)) return false;
  if (busy.teacherBusy.has(tk)) return false;
  if ((busy.teacherWeekCount.get(teacherId) || 0) >= MAX_PERIODS_PER_WEEK) return false;
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
};

const releaseSlot = (busy, classId, teacherId, slot, room = null) => {
  busy.classBusy.delete(classSlotKey(classId, slot.day_of_week, slot.session, slot.period));
  busy.teacherBusy.delete(teacherSlotKey(teacherId, slot.day_of_week, slot.session, slot.period));
  const rk = roomSlotKey(room, slot.day_of_week, slot.session, slot.period);
  if (rk) busy.roomBusy.delete(rk);
  const next = (busy.teacherWeekCount.get(teacherId) || 1) - 1;
  if (next <= 0) busy.teacherWeekCount.delete(teacherId);
  else busy.teacherWeekCount.set(teacherId, next);
};

const slotEquals = (a, b) =>
  a.day_of_week === b.day_of_week && a.session === b.session && a.period === b.period;

module.exports = {
  slotKey,
  classSlotKey,
  teacherSlotKey,
  roomSlotKey,
  createBusyState,
  loadBusyFromSchedules,
  isSlotFree,
  occupySlot,
  releaseSlot,
  slotEquals,
};
