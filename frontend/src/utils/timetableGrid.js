/** Lưới TKB từ cấu hình khung giờ API. */
import { SCHEDULE_DAYS, SCHEDULE_PERIODS, SESSIONS } from './labels';

export const defaultTimetableConfig = () => ({
  days_of_week: [1, 2, 3, 4, 5],
  morning_periods: 5,
  afternoon_periods: 5,
  afternoon_enabled: true,
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
