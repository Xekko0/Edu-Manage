'use strict';

const { MAX_PERIODS_PER_SESSION } = require('./constants');
const { parsePeriodTimes } = require('../schedule-enrichment.service');

const DEFAULT_TIMETABLE = {
  days_of_week: [1, 2, 3, 4, 5],
  morning_periods: 5,
  afternoon_periods: 5,
  afternoon_enabled: true,
};

const parseDaysOfWeek = (raw) => {
  if (Array.isArray(raw)) return raw.map((d) => parseInt(d, 10)).filter((d) => d >= 1 && d <= 7);
  if (typeof raw === 'string') {
    try {
      return parseDaysOfWeek(JSON.parse(raw));
    } catch {
      return [...DEFAULT_TIMETABLE.days_of_week];
    }
  }
  return [...DEFAULT_TIMETABLE.days_of_week];
};

const capSessionPeriods = (n) => Math.min(MAX_PERIODS_PER_SESSION, Math.max(1, parseInt(n, 10) || 5));

const normalizeTimetableConfig = (row) => {
  const days = parseDaysOfWeek(row?.days_of_week);
  const morning = capSessionPeriods(row?.morning_periods);
  const afternoon = capSessionPeriods(row?.afternoon_periods);
  const afternoonEnabled = row?.afternoon_enabled !== false && row?.afternoon_enabled !== 0;
  const sessions = afternoonEnabled ? ['morning', 'afternoon'] : ['morning'];
  return {
    school_year: row?.school_year,
    days_of_week: days.length ? days : [...DEFAULT_TIMETABLE.days_of_week],
    morning_periods: morning,
    afternoon_periods: afternoon,
    afternoon_enabled: afternoonEnabled,
    period_times: parsePeriodTimes(row?.period_times),
    period_duration_minutes: parseInt(row?.period_duration_minutes, 10) || 45,
    grade_10_annual_periods: row?.grade_10_annual_periods ?? 1015,
    grade_11_annual_periods: row?.grade_11_annual_periods ?? 1032,
    grade_12_annual_periods: row?.grade_12_annual_periods ?? 1032,
    semester1_start: row?.semester1_start || null,
    semester1_end: row?.semester1_end || null,
    semester2_start: row?.semester2_start || null,
    semester2_end: row?.semester2_end || null,
    holidays: row?.holidays || null,
    morning_break_after_period: parseInt(row?.morning_break_after_period, 10) || 2,
    morning_break_minutes: parseInt(row?.morning_break_minutes, 10) || 20,
    afternoon_break_after_period: row?.afternoon_break_after_period != null
      ? parseInt(row?.afternoon_break_after_period, 10)
      : null,
    afternoon_break_minutes: parseInt(row?.afternoon_break_minutes, 10) || 20,
    sessions,
    max_periods_per_session: MAX_PERIODS_PER_SESSION,
  };
};

const buildSlotOrder = (config) => {
  const c = normalizeTimetableConfig(config);
  const order = [];
  for (const day of c.days_of_week) {
    for (const session of c.sessions) {
      const maxP = session === 'morning' ? c.morning_periods : c.afternoon_periods;
      for (let period = 1; period <= maxP; period++) {
        order.push({ day_of_week: day, session, period });
      }
    }
  }
  return order;
};

const countGridSlots = (config) => buildSlotOrder(config).length;

module.exports = {
  DEFAULT_TIMETABLE,
  parseDaysOfWeek,
  normalizeTimetableConfig,
  buildSlotOrder,
  countGridSlots,
  capSessionPeriods,
  MAX_PERIODS_PER_SESSION,
};
