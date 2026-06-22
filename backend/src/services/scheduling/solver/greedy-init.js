'use strict';

const {
  createBusyState,
  occupySlot,
} = require('../busy-state');
const {
  pickRoomForSlot,
  resolvePreferredRoomType,
} = require('../room-assign');
const { scheduleSemesterForRow } = require('../semester');
const { rankSlotsForPlacement } = require('./slot-candidates');
const { isValidPlacement } = require('./hard-checker');
const { scoreSchedule } = require('./soft-scorer');

let tempIdSeq = 1;

const resetTempIds = () => { tempIdSeq = 1; };

const greedyInit = async (problem) => {
  resetTempIds();
  const busy = createBusyState();
  const placements = [];
  const failures = [];
  let placed = 0;
  let requested = 0;

  for (const asn of problem.assignments) {
    const need = Math.max(1, asn.periodsNeeded || asn.periods_per_week || 2);
    requested += need;
    const classId = asn.class_id;
    const className = asn.class?.name || problem.classMap.get(classId)?.name || '';
    const preferredRoomType = asn.subject?.preferred_room_type
      || await resolvePreferredRoomType(asn.subject_id);
    const programComponent = asn.subject?.program_component || null;
    const subjectCode = asn.subject?.code || '';

    for (let i = 0; i < need; i += 1) {
      const ranked = rankSlotsForPlacement({
        slotOrder: problem.slotOrder,
        busy,
        classId,
        subjectId: asn.subject_id,
        programComponent,
      });

      let found = null;
      let roomPick = null;

      for (const { slot } of ranked) {
        const candidateRoom = await pickRoomForSlot({
          busy,
          slot,
          classId,
          teacherId: asn.teacher_id,
          className,
          subjectId: asn.subject_id,
          subjectCode,
          preferredRoomType,
          strictSpecialty: true,
          rooms: problem.rooms,
          roomPool: problem.roomPool,
        });
        if (!candidateRoom) continue;
        const roomType = candidateRoom.roomType || preferredRoomType || 'classroom';
        if (isValidPlacement({
          busy,
          classId,
          teacherId: asn.teacher_id,
          subjectId: asn.subject_id,
          subjectCode,
          preferredRoomType,
          slot,
          roomName: candidateRoom.roomName,
          roomId: candidateRoom.roomId,
          roomType,
          unavailability: problem.unavailability,
          roomPool: problem.roomPool,
        })) {
          found = slot;
          roomPick = candidateRoom;
          break;
        }
      }

      if (!found) {
        failures.push({
          assignment_id: asn.id,
          class_id: classId,
          subject_id: asn.subject_id,
          teacher_id: asn.teacher_id,
          reason: 'Không còn ô trống hợp lệ (lớp/GV/phòng/ràng buộc)',
        });
        break;
      }

      const placement = {
        tempId: tempIdSeq++,
        assignment_id: asn.id,
        class_id: classId,
        subject_id: asn.subject_id,
        teacher_id: asn.teacher_id,
        day_of_week: found.day_of_week,
        session: found.session,
        period: found.period,
        room: roomPick.roomName,
        room_id: roomPick.roomId,
        room_type: roomPick.roomType || 'classroom',
        school_year: problem.school_year,
        semester: scheduleSemesterForRow(asn.semester, problem.arrangeSemester),
        program_component: programComponent,
      };

      occupySlot(busy, classId, asn.teacher_id, found, roomPick.roomName, {
        subjectId: asn.subject_id,
        roomId: roomPick.roomId,
        roomType: placement.room_type,
      });
      placements.push(placement);
      placed += 1;
    }
  }

  return {
    placements,
    busy,
    failures,
    placed,
    requested,
    soft_score: scoreSchedule(placements, busy),
  };
};

module.exports = {
  greedyInit,
  resetTempIds,
};
