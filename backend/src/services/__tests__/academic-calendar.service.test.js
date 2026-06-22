'use strict';

const {
  buildSemesterWeeks,
  buildWeekDayMap,
  buildCalendarPayload,
  defaultCalendarDates,
  resolveWeekStartFromDate,
} = require('../academic-calendar.service');

describe('academic-calendar.service', () => {
  const config = {
    school_year: '2024-2025',
    days_of_week: [1, 2, 3, 4, 5],
    ...defaultCalendarDates('2024-2025'),
    morning_break_after_period: 2,
    morning_break_minutes: 20,
  };

  test('buildSemesterWeeks — HK1 có nhiều tuần', () => {
    const weeks = buildSemesterWeeks(config, 1);
    expect(weeks.length).toBeGreaterThan(10);
    expect(weeks[0].week_index).toBe(1);
    expect(weeks[0].week_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('buildWeekDayMap — gắn ngày tháng cho cột thứ', () => {
    const weeks = buildSemesterWeeks(config, 1);
    const map = buildWeekDayMap(config, weeks[0].week_start);
    expect(map[2]?.short_date).toMatch(/^\d{2}\/\d{2}$/);
  });

  test('resolveWeekStartFromDate — chọn ngày trả về tuần chứa ngày', () => {
    const ws = resolveWeekStartFromDate(config, 1, '2024-10-16');
    expect(ws).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const cal = buildCalendarPayload(config, 1, { selectedDate: '2024-10-16' });
    expect(cal.selected_date).toBe('2024-10-16');
    expect(cal.selected_week_start).toBe(ws);
    expect(cal.day_dates[3]?.date).toBe('2024-10-16');
  });

  test('buildCalendarPayload — nghỉ Tết trong HK2', () => {
    const cal = buildCalendarPayload(config, 2, null);
    const tetWeek = cal.weeks.find((w) => w.week_start === '2025-01-20');
    if (tetWeek) {
      const map = buildWeekDayMap(config, tetWeek.week_start);
      const hasHoliday = Object.values(map).some((d) => d.is_holiday);
      expect(hasHoliday).toBe(true);
    }
    expect(cal.break.morning.label).toBe('RA CHƠI');
  });
});
