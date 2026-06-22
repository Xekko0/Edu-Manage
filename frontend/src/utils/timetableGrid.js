/** Lưới TKB từ cấu hình khung giờ API. */
import { SCHEDULE_DAYS, SCHEDULE_PERIODS, SESSIONS } from './labels';

export const defaultTimetableConfig = () => ({
  days_of_week: [1, 2, 3, 4, 5],
  morning_periods: 5,
  afternoon_periods: 5,
  afternoon_enabled: true,
  period_duration_minutes: 45,
  morning_break_after_period: 2,
  morning_break_minutes: 20,
  afternoon_break_minutes: 20,
  sessions: ['morning', 'afternoon'],
});

export const gridFromTimetableConfig = (config, session = 'morning') => {
  const c = config || defaultTimetableConfig();
  const days = c.days_of_week?.length ? c.days_of_week : [1, 2, 3, 4, 5];
  const sessions = c.sessions?.length
    ? c.sessions
    : (c.afternoon_enabled !== false ? ['morning', 'afternoon'] : ['morning']);
  const max = session === 'morning'
    ? (c.morning_periods || 5)
    : (c.afternoon_periods || 5);
  const periods = Array.from({ length: Math.max(1, max) }, (_, i) => i + 1);
  return { days, periods, sessions };
};

export const fallbackGrid = () => ({
  days: SCHEDULE_DAYS.filter((d) => d <= 5),
  periods: SCHEDULE_PERIODS,
  sessions: SESSIONS,
});

/** Dòng lưới gồm tiết học + hàng RA CHƠI (sau tiết 2 hoặc 3). */
export const buildPeriodRows = (config, session = 'morning') => {
  const grid = gridFromTimetableConfig(config, session);
  const c = config || defaultTimetableConfig();
  const breakAfter = session === 'afternoon'
    ? (c.afternoon_break_after_period ?? c.morning_break_after_period ?? 2)
    : (c.morning_break_after_period ?? 2);
  const breakMin = session === 'afternoon'
    ? (c.afternoon_break_minutes ?? 20)
    : (c.morning_break_minutes ?? 20);
  const periodRows = [];
  for (const p of grid.periods) {
    periodRows.push({ type: 'period', period: p });
    if (p === breakAfter) {
      periodRows.push({
        type: 'break',
        afterPeriod: p,
        minutes: breakMin,
        label: 'RA CHƠI',
      });
    }
  }
  return { ...grid, periodRows, breakAfter, breakMin };
};
