'use strict';

const {
  isSlotFree,
  roomTypeSlotKey,
  slotKey,
} = require('../busy-state');
const {
  MANDATORY_LAB_SUBJECT_CODES,
} = require('../constants');

const isTeacherUnavailable = (unavailability, teacherId, slot) => {
  if (!unavailability?.length) return false;
  for (const u of unavailability) {
    if (Number(u.teacher_id) !== Number(teacherId)) continue;
    if (u.day_of_week !== slot.day_of_week) continue;
    if (u.session && u.session !== slot.session) continue;
    if (u.period != null && u.period !== slot.period) continue;
    return true;
  }
  return false;
};

const isRoomPoolAvailable = (busy, roomType, slot, roomPool) => {
  if (!roomType || !roomPool) return true;
  const cap = roomPool[roomType] || 0;
  if (cap <= 0) return roomType === 'classroom';
  const key = roomTypeSlotKey(roomType, slot.day_of_week, slot.session, slot.period);
  const used = busy.roomTypeSlotCount.get(key) || 0;
  return used < cap;
};

const isRoomIdFree = (busy, roomId, slot) => {
  if (!roomId) return true;
  return !busy.roomIdBusy.has(`${roomId}|${slotKey(slot.day_of_week, slot.session, slot.period)}`);
};

const requiresMandatoryLab = (subjectCode, preferredRoomType) =>
  MANDATORY_LAB_SUBJECT_CODES.has(subjectCode)
  || preferredRoomType === 'lab';

const isValidPlacement = ({
  busy,
  classId,
  teacherId,
  subjectId,
  subjectCode,
  preferredRoomType,
  slot,
  roomName,
  roomId,
  roomType,
  unavailability,
  roomPool,
  strictLab = true,
}) => {
  if (!isSlotFree(busy, classId, teacherId, slot, roomName)) return false;
  if (isTeacherUnavailable(unavailability, teacherId, slot)) return false;
  if (!isRoomIdFree(busy, roomId, slot)) return false;
  if (!isRoomPoolAvailable(busy, roomType, slot, roomPool)) return false;

  if (strictLab && requiresMandatoryLab(subjectCode, preferredRoomType)) {
    if (roomType !== 'lab') return false;
  }

  return true;
};

module.exports = {
  isTeacherUnavailable,
  isRoomPoolAvailable,
  isRoomIdFree,
  requiresMandatoryLab,
  isValidPlacement,
};
