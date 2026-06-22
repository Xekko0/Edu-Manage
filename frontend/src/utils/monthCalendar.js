/** Lưới lịch tháng — chọn ngày → hiện TKB tuần tương ứng. */

const parseIso = (s) => {
  if (!s) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toIso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isInRange = (d, startIso, endIso) => {
  const s = parseIso(startIso);
  const e = parseIso(endIso);
  if (!s || !e) return true;
  const t = d.getTime();
  return t >= s.getTime() && t <= e.getTime();
};

const isHoliday = (iso, holidays = []) => {
  const d = parseIso(iso);
  if (!d) return null;
  for (const h of holidays) {
    const s = parseIso(h.start);
    const e = parseIso(h.end);
    if (s && e && d.getTime() >= s.getTime() && d.getTime() <= e.getTime()) {
      return h.name || 'Nghỉ';
    }
  }
  return null;
};

/** Thứ 2 đầu lưới (có thể thuộc tháng trước). */
export const mondayOnOrBefore = (year, month, day = 1) => {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
};

export const buildMonthGrid = ({
  year,
  month,
  semesterStart,
  semesterEnd,
  holidays = [],
  selectedDate,
  weekStart,
  todayIso = toIso(new Date()),
}) => {
  const cells = [];
  const cursor = mondayOnOrBefore(year, month, 1);
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const iso = toIso(d);
    const inMonth = d.getMonth() + 1 === month;
    const inSemester = isInRange(d, semesterStart, semesterEnd);
    const holidayName = isHoliday(iso, holidays);
    const weekMonday = mondayOnOrBefore(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const weekMondayIso = toIso(weekMonday);

    cells.push({
      date: iso,
      day: d.getDate(),
      inMonth,
      inSemester,
      isHoliday: !!holidayName,
      holidayName,
      isToday: iso === todayIso,
      isSelected: iso === selectedDate,
      isInSelectedWeek: weekStart && weekMondayIso === weekStart,
      selectable: inMonth && inSemester,
    });
  }
  return cells;
};

export const monthFromDate = (iso) => {
  const d = parseIso(iso);
  if (!d) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const clampViewMonth = (year, month, semesterStart, semesterEnd) => {
  const start = parseIso(semesterStart);
  const end = parseIso(semesterEnd);
  if (!start || !end) return { year, month };
  let y = year;
  let m = month;
  const view = new Date(y, m - 1, 1);
  if (view.getTime() < new Date(start.getFullYear(), start.getMonth(), 1).getTime()) {
    return { year: start.getFullYear(), month: start.getMonth() + 1 };
  }
  if (view.getTime() > new Date(end.getFullYear(), end.getMonth(), 1).getTime()) {
    return { year: end.getFullYear(), month: end.getMonth() + 1 };
  }
  return { year: y, month: m };
};

export const shiftMonth = (year, month, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

export const formatMonthLabel = (year, month) => `Tháng ${month}/${year}`;
