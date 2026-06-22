'use strict';

const { sortSlotsByClassDayLoad } = require('../busy-state');
const { scorePlacementDelta } = require('./soft-scorer');

const rankSlotsForPlacement = ({
  slotOrder,
  busy,
  classId,
  subjectId,
  programComponent,
}) => {
  const base = sortSlotsByClassDayLoad(slotOrder, busy, classId);
  return base
    .map((slot) => ({
      slot,
      score: scorePlacementDelta({
        busy,
        classId,
        subjectId,
        programComponent,
        slot,
      }),
    }))
    .sort((a, b) => b.score - a.score);
};

module.exports = {
  rankSlotsForPlacement,
};
