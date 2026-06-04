const {
  deriveWeeklyPeriods,
  upsertCurriculumFields,
  computeGdptWeeklyWarning,
} = require('../curriculum');

describe('curriculum GDPT', () => {
  test('deriveWeeklyPeriods — Sử 52 tiết / 35 tuần', () => {
    expect(deriveWeeklyPeriods(52, 35)).toBe(1);
    const fields = upsertCurriculumFields({ total_periods_per_year: 52, teaching_weeks: 35 });
    expect(fields.periods_per_week).toBe(1);
    expect(fields.weekly_approximation).toBe(true);
  });

  test('deriveWeeklyPeriods — Toán 105 / 35 = 3', () => {
    expect(deriveWeeklyPeriods(105, 35)).toBe(3);
    const fields = upsertCurriculumFields({ total_periods_per_year: 105 });
    expect(fields.periods_per_week).toBe(3);
    expect(fields.weekly_approximation).toBe(false);
  });

  test('computeGdptWeeklyWarning — khối 10 ~29 tiết/tuần', () => {
    expect(computeGdptWeeklyWarning(10, 29)).toBeNull();
    const w = computeGdptWeeklyWarning(10, 35);
    expect(w).not.toBeNull();
    expect(w.grade_level).toBe(10);
  });
});
