import { useCallback, useEffect, useState } from 'react';
import { getTimetableCalendar } from '../api/timetable-config.api';
import { monthFromDate } from '../utils/monthCalendar';

/**
 * Lịch tháng + tuần trong học kỳ — chọn ngày → TKB tuần tương ứng.
 */
export default function useWeekCalendar(schoolYear, semester) {
  const [calendar, setCalendar] = useState(null);
  const [weekStart, setWeekStart] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncViewMonth = useCallback((iso) => {
    const m = monthFromDate(iso);
    if (m) setViewMonth(m);
  }, []);

  const loadCalendar = useCallback(async (opts = {}) => {
    if (!schoolYear) return;
    setLoading(true);
    try {
      const params = {
        school_year: schoolYear,
        semester,
      };
      if (opts.selectedDate) params.selected_date = opts.selectedDate;
      else if (opts.weekStart) params.week_start = opts.weekStart;

      const res = await getTimetableCalendar(params);
      if (res?.success) {
        const data = res.data;
        setCalendar(data);
        setWeekStart(data?.selected_week_start || null);
        const sd = data?.selected_date || opts.selectedDate || null;
        setSelectedDate(sd);
        if (sd) syncViewMonth(sd);
        else if (data?.selected_week_start) syncViewMonth(data.selected_week_start);
      }
    } catch {
      setCalendar(null);
    } finally {
      setLoading(false);
    }
  }, [schoolYear, semester, syncViewMonth]);

  useEffect(() => {
    setWeekStart(null);
    setSelectedDate(null);
    setViewMonth(null);
    loadCalendar({});
  }, [schoolYear, semester, loadCalendar]);

  const goDate = useCallback((isoDate) => {
    syncViewMonth(isoDate);
    loadCalendar({ selectedDate: isoDate });
  }, [loadCalendar, syncViewMonth]);

  const goWeek = useCallback((ws) => {
    loadCalendar({ weekStart: ws });
  }, [loadCalendar]);

  const goPrev = useCallback(() => {
    if (!calendar?.weeks?.length || !weekStart) return;
    const idx = calendar.weeks.findIndex((w) => w.week_start === weekStart);
    if (idx > 0) goWeek(calendar.weeks[idx - 1].week_start);
  }, [calendar, weekStart, goWeek]);

  const goNext = useCallback(() => {
    if (!calendar?.weeks?.length || !weekStart) return;
    const idx = calendar.weeks.findIndex((w) => w.week_start === weekStart);
    if (idx >= 0 && idx < calendar.weeks.length - 1) {
      goWeek(calendar.weeks[idx + 1].week_start);
    }
  }, [calendar, weekStart, goWeek]);

  return {
    calendar,
    weekStart,
    selectedDate,
    viewMonth,
    setViewMonth,
    dayDates: calendar?.day_dates || {},
    loading,
    goDate,
    goWeek,
    goPrev,
    goNext,
    reload: loadCalendar,
  };
}
