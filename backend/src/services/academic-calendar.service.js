'use strict';

const parseIso = (s) => {
  if (!s) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Thứ 2 của tuần chứa ngày `d`. */
const mondayOfWeek = (d) => {
  const x = new Date(d);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
};

const parseSchoolYearStartYear = (schoolYear) => {
  const m = String(schoolYear || '').match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : new Date().getFullYear();
};

const defaultHolidaysForYear = (startYear) => {
  const tetYear = startYear + 1;
  return [
    {
      name: 'Tết Nguyên Đán',
      start: `${tetYear}-01-25`,
      end: `${tetYear}-02-09`,
    },
  ];
};

const defaultCalendarDates = (schoolYear) => {
  const y = parseSchoolYearStartYear(schoolYear);
  const y2 = y + 1;
  return {
    semester1_start: `${y}-09-05`,
    semester1_end: `${y2}-01-18`,
    semester2_start: `${y2}-02-10`,
    semester2_end: `${y2}-05-31`,
    holidays: defaultHolidaysForYear(y),
  };
};

const parseHolidays = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return parseHolidays(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
};

const resolveSemesterBounds = (config, semester) => {
  const defaults = defaultCalendarDates(config.school_year);
  const sem = Number(semester) === 2 ? 2 : 1;
  if (sem === 2) {
    return {
      semester: 2,
      start: parseIso(config.semester2_start || defaults.semester2_start),
      end: parseIso(config.semester2_end || defaults.semester2_end),
    };
  }
  return {
    semester: 1,
    start: parseIso(config.semester1_start || defaults.semester1_start),
    end: parseIso(config.semester1_end || defaults.semester1_end),
  };
};

const isDateInRange = (date, start, end) => {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
};

const isHolidayDate = (date, holidays) => {
  for (const h of holidays) {
    const s = parseIso(h.start);
    const e = parseIso(h.end);
    if (s && e && isDateInRange(date, s, e)) {
      return { isHoliday: true, name: h.name || 'Nghỉ' };
    }
  }
  return { isHoliday: false, name: null };
};

const formatShortDate = (d) => {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${m}`;
};

const buildSemesterWeeks = (config, semester) => {
  const { start, end } = resolveSemesterBounds(config, semester);
  if (!start || !end) return [];

  const weeks = [];
  let cursor = mondayOfWeek(start);
  let index = 1;
  const lastMonday = mondayOfWeek(end);

  while (cursor.getTime() <= lastMonday.getTime()) {
    const weekStart = new Date(cursor);
    const weekEnd = addDays(weekStart, 6);
    const teachingStart = weekStart.getTime() < start.getTime() ? start : weekStart;
    const teachingEnd = weekEnd.getTime() > end.getTime() ? end : weekEnd;
    weeks.push({
      week_index: index,
      week_start: toIsoDate(weekStart),
      week_end: toIsoDate(weekEnd),
      teaching_start: toIsoDate(teachingStart),
      teaching_end: toIsoDate(teachingEnd),
      label: `Tuần ${index} (${formatShortDate(teachingStart)} – ${formatShortDate(teachingEnd)})`,
    });
    cursor = addDays(cursor, 7);
    index += 1;
  }
  return weeks;
};

const resolveWeekStartFromDate = (config, semester, dateIso) => {
  const weeks = buildSemesterWeeks(config, semester);
  const d = parseIso(dateIso);
  if (!d || !weeks.length) return resolveWeekStart(config, semester, null);

  const mondayIso = toIsoDate(mondayOfWeek(d));
  let found = weeks.find((w) => w.week_start === mondayIso);
  if (found) return found.week_start;

  found = weeks.find((w) => {
    const ws = parseIso(w.week_start);
    const we = parseIso(w.week_end);
    return d.getTime() >= ws.getTime() && d.getTime() <= we.getTime();
  });
  return found?.week_start || resolveWeekStart(config, semester, null);
};

const resolveWeekStart = (config, semester, weekStartInput) => {
  const weeks = buildSemesterWeeks(config, semester);
  if (!weeks.length) return null;

  if (weekStartInput) {
    const found = weeks.find((w) => w.week_start === weekStartInput);
    if (found) return found.week_start;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayMonday = toIsoDate(mondayOfWeek(today));
  const inSemester = weeks.find((w) => w.week_start === todayMonday);
  if (inSemester) return inSemester.week_start;

  const { start, end } = resolveSemesterBounds(config, semester);
  if (today.getTime() < start.getTime()) return weeks[0].week_start;
  if (today.getTime() > end.getTime()) return weeks[weeks.length - 1].week_start;
  return weeks[0].week_start;
};

const jsDayToSchoolDay = (jsDay) => (jsDay === 0 ? 7 : jsDay);

const buildWeekDayMap = (config, weekStartIso) => {
  const weekStart = parseIso(weekStartIso);
  if (!weekStart) return {};
  const holidays = parseHolidays(config.holidays);
  const days = config.days_of_week || [1, 2, 3, 4, 5];
  const map = {};

  for (let offset = 0; offset < 7; offset += 1) {
    const d = addDays(weekStart, offset);
    const dow = jsDayToSchoolDay(d.getDay());
    if (!days.includes(dow)) continue;
    const holiday = isHolidayDate(d, holidays);
    map[dow] = {
      date: toIsoDate(d),
      short_date: formatShortDate(d),
      is_holiday: holiday.isHoliday,
      holiday_name: holiday.name,
    };
  }
  return map;
};

const getBreakSettings = (config, session = 'morning') => {
  const morningAfter = parseInt(config.morning_break_after_period, 10) || 2;
  const morningMin = parseInt(config.morning_break_minutes, 10) || 20;
  const afternoonAfter = config.afternoon_break_after_period != null
    ? parseInt(config.afternoon_break_after_period, 10)
    : morningAfter;
  const afternoonMin = parseInt(config.afternoon_break_minutes, 10) || morningMin;

  if (session === 'afternoon') {
    return {
      after_period: afternoonAfter,
      minutes: afternoonMin,
      label: 'RA CHƠI',
    };
  }
  return {
    after_period: morningAfter,
    minutes: morningMin,
    label: 'RA CHƠI',
  };
};

const buildCalendarPayload = (config, semester, options = {}) => {
  const opts = options == null
    ? {}
    : (typeof options === 'string' ? { weekStart: options } : options);
  const defaults = defaultCalendarDates(config.school_year);
  const bounds = resolveSemesterBounds(config, semester);
  const weeks = buildSemesterWeeks(config, semester);

  let selectedDate = opts.selectedDate || null;
  let selectedWeekStart;
  if (selectedDate) {
    selectedWeekStart = resolveWeekStartFromDate(config, semester, selectedDate);
  } else {
    selectedWeekStart = resolveWeekStart(config, semester, opts.weekStart || null);
    if (opts.weekStart && !selectedDate) {
      const monday = parseIso(opts.weekStart);
      if (monday) selectedDate = toIsoDate(monday);
    }
  }

  const dayDates = buildWeekDayMap(config, selectedWeekStart);

  return {
    school_year: config.school_year,
    semester: bounds.semester,
    semester_start: bounds.start ? toIsoDate(bounds.start) : null,
    semester_end: bounds.end ? toIsoDate(bounds.end) : null,
    semester1_start: config.semester1_start || defaults.semester1_start,
    semester1_end: config.semester1_end || defaults.semester1_end,
    semester2_start: config.semester2_start || defaults.semester2_start,
    semester2_end: config.semester2_end || defaults.semester2_end,
    holidays: parseHolidays(config.holidays).length
      ? parseHolidays(config.holidays)
      : defaults.holidays,
    weeks,
    selected_date: selectedDate,
    selected_week_start: selectedWeekStart,
    selected_week: weeks.find((w) => w.week_start === selectedWeekStart) || null,
    day_dates: dayDates,
    break: {
      morning: getBreakSettings(config, 'morning'),
      afternoon: getBreakSettings(config, 'afternoon'),
    },
  };
};

module.exports = {
  parseIso,
  toIsoDate,
  mondayOfWeek,
  defaultCalendarDates,
  defaultHolidaysForYear,
  parseHolidays,
  resolveSemesterBounds,
  buildSemesterWeeks,
  resolveWeekStart,
  resolveWeekStartFromDate,
  buildWeekDayMap,
  getBreakSettings,
  buildCalendarPayload,
};
