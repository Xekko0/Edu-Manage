'use strict';

const { hillClimb } = require('../hill-climb');
const { scoreSchedule } = require('../soft-scorer');

const slotOrder = [
  { day_of_week: 2, session: 'morning', period: 1 },
  { day_of_week: 2, session: 'morning', period: 2 },
  { day_of_week: 2, session: 'morning', period: 3 },
  { day_of_week: 3, session: 'morning', period: 1 },
  { day_of_week: 4, session: 'morning', period: 1 },
];

describe('hill-climb', () => {
  test('cải thiện score khi init dồn môn cùng buổi', () => {
    const placements = [
      {
        class_id: 1, subject_id: 1, teacher_id: 10, school_year: '2024-2025', semester: 1,
        day_of_week: 2, session: 'morning', period: 1, room: 'P1', room_id: 1, room_type: 'classroom',
        subject: { code: 'TOAN' }, program_component: 'required_core',
      },
      {
        class_id: 1, subject_id: 1, teacher_id: 10, school_year: '2024-2025', semester: 1,
        day_of_week: 2, session: 'morning', period: 2, room: 'P1', room_id: 1, room_type: 'classroom',
        subject: { code: 'TOAN' }, program_component: 'required_core',
      },
      {
        class_id: 1, subject_id: 1, teacher_id: 10, school_year: '2024-2025', semester: 1,
        day_of_week: 2, session: 'morning', period: 3, room: 'P1', room_id: 1, room_type: 'classroom',
        subject: { code: 'TOAN' }, program_component: 'required_core',
      },
    ];
    const initResult = {
      placements,
      placed: 3,
      requested: 3,
      soft_score: scoreSchedule(placements),
    };
    const problem = {
      slotOrder,
      unavailability: [],
      roomPool: { classroom: 5, lab: 1 },
    };
    const result = hillClimb(initResult, problem);
    expect(result.soft_score).toBeGreaterThanOrEqual(initResult.soft_score);
    const days = new Set(result.placements.map((p) => p.day_of_week));
    expect(days.size).toBeGreaterThan(1);
  });
});
