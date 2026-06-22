'use strict';

const { Room, Subject } = require('../../models');
const { isSlotFree } = require('./busy-state');
const { isRoomPoolAvailable } = require('./solver/hard-checker');
const { MANDATORY_LAB_SUBJECT_CODES } = require('./constants');

let roomsCache = null;
let roomsCacheAt = 0;
const CACHE_MS = 60_000;

const loadActiveRooms = async () => {
  const now = Date.now();
  if (roomsCache && now - roomsCacheAt < CACHE_MS) return roomsCache;
  roomsCache = await Room.findAll({ where: { is_active: true }, order: [['code', 'ASC']] });
  roomsCacheAt = now;
  return roomsCache;
};

const clearRoomsCache = () => {
  roomsCache = null;
};

const defaultClassroomCode = (className) => `P${String(className).replace(/\s/g, '')}`;

const resolveRoomRecord = (rooms, roomName, classroomCode, preferredRoomType) => {
  if (!roomName) return null;
  const byName = rooms.find((r) => r.name === roomName || r.code === roomName);
  if (byName) return byName;
  if (!preferredRoomType || preferredRoomType === 'classroom') {
    return rooms.find((r) => r.code === classroomCode)
      || rooms.find((r) => r.room_type === 'classroom')
      || null;
  }
  return rooms.find((r) => r.room_type === preferredRoomType) || null;
};

const roomPoolAllows = (busy, roomRecord, slot, roomPool) => {
  if (!roomRecord || !roomPool) return true;
  return isRoomPoolAvailable(busy, roomRecord.room_type, slot, roomPool);
};

const pickRoomForSlot = async ({
  busy,
  slot,
  classId,
  teacherId,
  className,
  subjectId,
  subjectCode = null,
  preferredRoomType = null,
  strictSpecialty = false,
  rooms: roomsInput = null,
  roomPool = null,
}) => {
  const rooms = roomsInput || await loadActiveRooms();
  const classroomCode = defaultClassroomCode(className);
  const classroom = rooms.find((r) => r.code === classroomCode)
    || rooms.find((r) => r.room_type === 'classroom');

  const tryRoom = (roomRecord) => {
    if (!roomRecord) return null;
    const label = roomRecord.name || roomRecord.code;
    if (!roomPoolAllows(busy, roomRecord, slot, roomPool)) return null;
    if (isSlotFree(busy, classId, teacherId, slot, label)) {
      return {
        roomName: label,
        roomId: roomRecord.id,
        roomType: roomRecord.room_type || 'classroom',
      };
    }
    return null;
  };

  let code = subjectCode;
  if (!code && subjectId) {
    const sub = await Subject.findByPk(subjectId, { attributes: ['code'] });
    code = sub?.code;
  }
  const needsLab = strictSpecialty && (
    preferredRoomType === 'lab' || MANDATORY_LAB_SUBJECT_CODES.has(code)
  );

  if (needsLab) {
    const specialty = rooms.filter((r) => r.room_type === 'lab' && r.is_active);
    for (const r of specialty) {
      const picked = tryRoom(r);
      if (picked) return picked;
    }
    return null;
  }

  if (!preferredRoomType || preferredRoomType === 'classroom') {
    const picked = tryRoom(classroom) || tryRoom(rooms.find((r) => r.code === classroomCode));
    if (picked) return picked;
    const fallback = classroom?.name || classroomCode;
    if (roomPoolAllows(busy, classroom, slot, roomPool)
      && isSlotFree(busy, classId, teacherId, slot, fallback)) {
      return {
        roomName: fallback,
        roomId: classroom?.id || null,
        roomType: 'classroom',
      };
    }
    return {
      roomName: fallback,
      roomId: classroom?.id || null,
      roomType: 'classroom',
    };
  }

  const specialty = rooms.filter((r) => r.room_type === preferredRoomType && r.is_active);
  for (const r of specialty) {
    const picked = tryRoom(r);
    if (picked) return picked;
  }

  if (strictSpecialty) return null;

  const fallback = classroom?.name || classroomCode;
  if (roomPoolAllows(busy, classroom, slot, roomPool)
    && isSlotFree(busy, classId, teacherId, slot, fallback)) {
    return {
      roomName: fallback,
      roomId: classroom?.id || null,
      roomType: 'classroom',
    };
  }
  return {
    roomName: fallback,
    roomId: classroom?.id || null,
    roomType: 'classroom',
  };
};

const resolvePreferredRoomType = async (subjectId) => {
  const sub = await Subject.findByPk(subjectId, { attributes: ['preferred_room_type', 'code'] });
  if (sub?.preferred_room_type) return sub.preferred_room_type;
  const map = { HOA: 'lab', VLY: 'lab', TIN: 'computer', SINH: 'lab' };
  return map[sub?.code] || 'classroom';
};

module.exports = {
  loadActiveRooms,
  clearRoomsCache,
  defaultClassroomCode,
  pickRoomForSlot,
  resolvePreferredRoomType,
  resolveRoomRecord,
};
