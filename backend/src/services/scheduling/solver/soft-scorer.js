'use strict';

const {
  classDayKey,
  subjectClassDayKey,
  subjectClassSessionKey,
} = require('../busy-state');
const { SOFT_WEIGHTS } = require('../constants');

const scorePlacementDelta = ({
  busy,
  classId,
  subjectId,
  programComponent,
  slot,
}) => {
  let score = 0;
  const day = slot.day_of_week;
  const dk = classDayKey(classId, day);
  const dayLoad = busy.classDayCount.get(dk) || 0;
  score += -dayLoad * Math.abs(SOFT_WEIGHTS.day_load_imbalance);

  const sdk = subjectClassDayKey(classId, subjectId, day);
  const daySubject = busy.subjectClassDayCount.get(sdk) || 0;
  if (daySubject >= 2) score += SOFT_WEIGHTS.subject_same_day_over2;
  else if (daySubject >= 1) score += SOFT_WEIGHTS.subject_same_day_over2 * 0.4;

  const ssk = subjectClassSessionKey(classId, subjectId, day, slot.session);
  const sessionSubject = busy.subjectClassSessionCount.get(ssk) || 0;
  if (sessionSubject >= 1) score += SOFT_WEIGHTS.subject_same_session_over1;

  if (programComponent === 'required_core' && daySubject >= 2) {
    score += SOFT_WEIGHTS.heavy_subject_day_over2;
  }

  if (slot.session === 'afternoon') {
    score += SOFT_WEIGHTS.afternoon_period;
  }

  return score;
};

const scoreClassDayGaps = (placements, classId) => {
  let penalty = 0;
  const byDay = new Map();
  for (const p of placements) {
    if (Number(p.class_id) !== Number(classId)) continue;
    const key = `${p.day_of_week}|${p.session}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(p.period);
  }
  for (const periods of byDay.values()) {
    const sorted = [...new Set(periods)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = sorted[i] - sorted[i - 1] - 1;
      if (gap > 0) penalty += gap * SOFT_WEIGHTS.gap_per_slot;
    }
  }
  return penalty;
};

const scoreSubjectSpread = (placements) => {
  let total = 0;
  const dayCount = new Map();
  const sessionCount = new Map();
  for (const p of placements) {
    const sdk = subjectClassDayKey(p.class_id, p.subject_id, p.day_of_week);
    const prevDay = dayCount.get(sdk) || 0;
    dayCount.set(sdk, prevDay + 1);
    if (prevDay >= 2) total += SOFT_WEIGHTS.subject_same_day_over2;
    else if (prevDay >= 1) total += SOFT_WEIGHTS.subject_same_day_over2 * 0.4;

    const ssk = subjectClassSessionKey(p.class_id, p.subject_id, p.day_of_week, p.session);
    const prevSession = sessionCount.get(ssk) || 0;
    sessionCount.set(ssk, prevSession + 1);
    if (prevSession >= 1) total += SOFT_WEIGHTS.subject_same_session_over1;

    const component = p.program_component || p.subject?.program_component;
    if (component === 'required_core' && prevDay >= 2) {
      total += SOFT_WEIGHTS.heavy_subject_day_over2;
    }
    if (p.session === 'afternoon') {
      total += SOFT_WEIGHTS.afternoon_period;
    }
  }
  return total;
};

const scoreSchedule = (placements, busy = null) => {
  let total = scoreSubjectSpread(placements);
  const classIds = [...new Set(placements.map((p) => p.class_id))];
  for (const cid of classIds) {
    total += scoreClassDayGaps(placements, cid);
  }

  if (busy) {
    const days = new Map();
    for (const p of placements) {
      const dk = classDayKey(p.class_id, p.day_of_week);
      days.set(dk, (days.get(dk) || 0) + 1);
    }
    const loads = [...days.values()];
    if (loads.length > 1) {
      const max = Math.max(...loads);
      const min = Math.min(...loads);
      total += (max - min) * SOFT_WEIGHTS.day_load_imbalance;
    }
  }

  return total;
};

module.exports = {
  scorePlacementDelta,
  scoreClassDayGaps,
  scoreSchedule,
};
