'use strict';

const { createBusyState, occupySlot } = require('../../busy-state');
const { scorePlacementDelta, scoreSchedule } = require('../soft-scorer');

describe('soft-scorer', () => {
  test('phạt dồn môn cùng buổi cao hơn phân tán', () => {
    const busy = createBusyState();
    const classId = 1;
    const subjectId = 2;
    const slot1 = { day_of_week: 2, session: 'morning', period: 1 };
    occupySlot(busy, classId, 10, slot1, 'P10A1', { subjectId, roomType: 'classroom' });

    const spread = scorePlacementDelta({
      busy,
      classId,
      subjectId,
      programComponent: 'required_core',
      slot: { day_of_week: 3, session: 'morning', period: 1 },
    });
    const cluster = scorePlacementDelta({
      busy,
      classId,
      subjectId,
      programComponent: 'required_core',
      slot: { day_of_week: 2, session: 'morning', period: 2 },
    });
    expect(spread).toBeGreaterThan(cluster);
  });

  test('scoreSchedule — phân tán ngày tốt hơn dồn một ngày', () => {
    const spread = [
      { class_id: 1, subject_id: 1, day_of_week: 2, session: 'morning', period: 1, program_component: 'required_core' },
      { class_id: 1, subject_id: 1, day_of_week: 3, session: 'morning', period: 1, program_component: 'required_core' },
      { class_id: 1, subject_id: 1, day_of_week: 4, session: 'morning', period: 1, program_component: 'required_core' },
    ];
    const cluster = [
      { class_id: 1, subject_id: 1, day_of_week: 2, session: 'morning', period: 1, program_component: 'required_core' },
      { class_id: 1, subject_id: 1, day_of_week: 2, session: 'morning', period: 2, program_component: 'required_core' },
      { class_id: 1, subject_id: 1, day_of_week: 2, session: 'morning', period: 3, program_component: 'required_core' },
    ];
    expect(scoreSchedule(spread)).toBeGreaterThan(scoreSchedule(cluster));
  });
});
