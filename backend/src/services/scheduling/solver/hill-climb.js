'use strict';

const {
  createBusyState,
  loadBusyFromSchedules,
  occupySlot,
  releaseSlot,
  slotEquals,
} = require('../busy-state');
const {
  HILL_CLIMB_MAX_STEPS,
  HILL_CLIMB_TIMEOUT_MS,
} = require('../constants');
const { isValidPlacement } = require('./hard-checker');
const { scoreSchedule } = require('./soft-scorer');

const rebuildBusyFromPlacements = (placements) => {
  const busy = createBusyState();
  for (const p of placements) {
    const slot = {
      day_of_week: p.day_of_week,
      session: p.session,
      period: p.period,
    };
    occupySlot(busy, p.class_id, p.teacher_id, slot, p.room, {
      subjectId: p.subject_id,
      roomId: p.room_id,
      roomType: p.room_type,
    });
  }
  return busy;
};

const tryMovePlacement = (placements, idx, targetSlot, problem, busy) => {
  const p = placements[idx];
  const current = {
    day_of_week: p.day_of_week,
    session: p.session,
    period: p.period,
  };
  if (slotEquals(current, targetSlot)) return false;

  const subjectCode = p.subject?.code || '';
  const preferredRoomType = p.room_type || 'classroom';

  releaseSlot(busy, p.class_id, p.teacher_id, current, p.room, {
    subjectId: p.subject_id,
    roomId: p.room_id,
    roomType: p.room_type,
  });

  const valid = isValidPlacement({
    busy,
    classId: p.class_id,
    teacherId: p.teacher_id,
    subjectId: p.subject_id,
    subjectCode,
    preferredRoomType,
    slot: targetSlot,
    roomName: p.room,
    roomId: p.room_id,
    roomType: p.room_type,
    unavailability: problem.unavailability,
    roomPool: problem.roomPool,
  });

  if (!valid) {
    occupySlot(busy, p.class_id, p.teacher_id, current, p.room, {
      subjectId: p.subject_id,
      roomId: p.room_id,
      roomType: p.room_type,
    });
    return false;
  }

  occupySlot(busy, p.class_id, p.teacher_id, targetSlot, p.room, {
    subjectId: p.subject_id,
    roomId: p.room_id,
    roomType: p.room_type,
  });
  placements[idx] = {
    ...p,
    day_of_week: targetSlot.day_of_week,
    session: targetSlot.session,
    period: targetSlot.period,
  };
  return true;
};

const trySwapPlacements = (placements, i, j, problem, busy) => {
  const a = placements[i];
  const b = placements[j];
  const slotA = { day_of_week: a.day_of_week, session: a.session, period: a.period };
  const slotB = { day_of_week: b.day_of_week, session: b.session, period: b.period };

  releaseSlot(busy, a.class_id, a.teacher_id, slotA, a.room, {
    subjectId: a.subject_id, roomId: a.room_id, roomType: a.room_type,
  });
  releaseSlot(busy, b.class_id, b.teacher_id, slotB, b.room, {
    subjectId: b.subject_id, roomId: b.room_id, roomType: b.room_type,
  });

  const aAtB = isValidPlacement({
    busy,
    classId: a.class_id,
    teacherId: a.teacher_id,
    subjectId: a.subject_id,
    subjectCode: a.subject?.code,
    preferredRoomType: a.room_type,
    slot: slotB,
    roomName: a.room,
    roomId: a.room_id,
    roomType: a.room_type,
    unavailability: problem.unavailability,
    roomPool: problem.roomPool,
  });
  const bAtA = isValidPlacement({
    busy,
    classId: b.class_id,
    teacherId: b.teacher_id,
    subjectId: b.subject_id,
    subjectCode: b.subject?.code,
    preferredRoomType: b.room_type,
    slot: slotA,
    roomName: b.room,
    roomId: b.room_id,
    roomType: b.room_type,
    unavailability: problem.unavailability,
    roomPool: problem.roomPool,
  });

  if (!aAtB || !bAtA) {
    occupySlot(busy, a.class_id, a.teacher_id, slotA, a.room, {
      subjectId: a.subject_id, roomId: a.room_id, roomType: a.room_type,
    });
    occupySlot(busy, b.class_id, b.teacher_id, slotB, b.room, {
      subjectId: b.subject_id, roomId: b.room_id, roomType: b.room_type,
    });
    return false;
  }

  occupySlot(busy, a.class_id, a.teacher_id, slotB, a.room, {
    subjectId: a.subject_id, roomId: a.room_id, roomType: a.room_type,
  });
  occupySlot(busy, b.class_id, b.teacher_id, slotA, b.room, {
    subjectId: b.subject_id, roomId: b.room_id, roomType: b.room_type,
  });

  placements[i] = { ...a, day_of_week: slotB.day_of_week, session: slotB.session, period: slotB.period };
  placements[j] = { ...b, day_of_week: slotA.day_of_week, session: slotA.session, period: slotA.period };
  return true;
};

const hillClimb = (initResult, problem) => {
  const placements = initResult.placements.map((p) => ({ ...p }));
  let busy = rebuildBusyFromPlacements(placements);
  let score = scoreSchedule(placements, busy);
  const scoreBefore = score;
  let moves = 0;
  const started = Date.now();

  for (let step = 0; step < HILL_CLIMB_MAX_STEPS; step += 1) {
    if (Date.now() - started > HILL_CLIMB_TIMEOUT_MS) break;

    let improved = false;
    const order = [...placements.keys()].sort(() => Math.random() - 0.5);

    for (const idx of order) {
      if (Date.now() - started > HILL_CLIMB_TIMEOUT_MS) break;
      const ranked = problem.slotOrder;
      for (const targetSlot of ranked) {
        const trial = placements.map((p) => ({ ...p }));
        const trialBusy = rebuildBusyFromPlacements(trial);
        if (!tryMovePlacement(trial, idx, targetSlot, problem, trialBusy)) continue;
        const trialScore = scoreSchedule(trial, trialBusy);
        if (trialScore > score) {
          placements.splice(0, placements.length, ...trial);
          busy = trialBusy;
          score = trialScore;
          moves += 1;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }

    if (!improved && placements.length > 1) {
      const i = Math.floor(Math.random() * placements.length);
      let j = Math.floor(Math.random() * placements.length);
      if (i === j) j = (j + 1) % placements.length;
      const trial = placements.map((p) => ({ ...p }));
      const trialBusy = rebuildBusyFromPlacements(trial);
      if (trySwapPlacements(trial, i, j, problem, trialBusy)) {
        const trialScore = scoreSchedule(trial, trialBusy);
        if (trialScore > score) {
          placements.splice(0, placements.length, ...trial);
          busy = trialBusy;
          score = trialScore;
          moves += 1;
          improved = true;
        }
      }
    }

    if (!improved) break;
  }

  return {
    placements,
    busy,
    soft_score: score,
    soft_score_before: scoreBefore,
    moves_applied: moves,
    failures: initResult.failures,
    placed: placements.length,
    requested: initResult.requested,
  };
};

module.exports = {
  hillClimb,
  rebuildBusyFromPlacements,
};
