const {
  detectHardViolationsFromSchedules,
  summarizeViolations,
  MAX_PERIODS_PER_SESSION,
} = require('../hard-constraints');

describe('hard-constraints', () => {
  test('phát hiện trùng GV và trùng phòng', () => {
    const schedules = [
      {
        id: 1, class_id: 1, teacher_id: 7, room: 'Lab',
        day_of_week: 1, session: 'morning', period: 1,
      },
      {
        id: 2, class_id: 2, teacher_id: 7, room: 'Lab',
        day_of_week: 1, session: 'morning', period: 1,
      },
    ];
    const violations = detectHardViolationsFromSchedules(schedules);
    const types = new Set(violations.map((v) => v.type));
    expect(types.has('teacher')).toBe(true);
    expect(types.has('room')).toBe(true);
    expect(summarizeViolations(violations).hard_ok).toBe(false);
  });

  test('tiết > MAX_PERIODS_PER_SESSION — session_cap', () => {
    const violations = detectHardViolationsFromSchedules([
      {
        id: 1, class_id: 1, teacher_id: 1, room: 'A',
        day_of_week: 1, session: 'morning', period: 6,
      },
    ]);
    expect(violations.some((v) => v.type === 'session_cap')).toBe(true);
    expect(MAX_PERIODS_PER_SESSION).toBe(5);
  });
});
