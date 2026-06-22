/**
 * ScheduleGrid — Lưới TKB Flat-Premium (Admin/GV View).
 * Border siêu mảnh, bo góc lớn, cell highlights, conflict overlay.
 */
import { useMemo } from 'react';
import { DAY_OF_WEEK } from '../../utils/labels';
import ScheduleSlotCard from './ScheduleSlotCard';
import { getPeriodTime } from './ScheduleSlotCard';

export default function ScheduleGrid({
  slots = [],
  timetableConfig,
  session = 'morning',
  selectedDay,
  onSlotClick,
  conflictSlots = [],
  readOnly = false,
}) {
  const grid = useMemo(() => {
    const isMorning = session === 'morning';
    const morningPeriods = timetableConfig?.morning_periods || 5;
    const afternoonPeriods = timetableConfig?.afternoon_periods || 4;
    const periods = isMorning
      ? Array.from({ length: morningPeriods }, (_, i) => i + 1)
      : Array.from({ length: afternoonPeriods }, (_, i) => morningPeriods + i + 1);
    const days = timetableConfig?.teaching_days || [1, 2, 3, 4, 5];
    return { periods, days, morningPeriods };
  }, [timetableConfig, session]);

  const slotMap = useMemo(() => {
    const map = {};
    slots.forEach((s) => {
      const key = `${s.day_of_week}-${s.period}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [slots]);

  const conflictSet = useMemo(() => {
    return new Set(conflictSlots.map((s) => `${s.day_of_week}-${s.period}`));
  }, [conflictSlots]);

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm shadow-zinc-100/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-16">
                Tiết
              </th>
              {grid.days.map((d) => (
                <th
                  key={d}
                  className={`px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider min-w-[120px] ${
                    selectedDay === d ? 'text-indigo-600 bg-indigo-50/30' : 'text-zinc-400'
                  }`}
                >
                  {DAY_OF_WEEK[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.periods.map((period, pIdx) => {
              const time = getPeriodTime(period);
              const isBreakRow = period === grid.morningPeriods && session === 'afternoon';

              return (
                <>
                  {/* Break row giữa sáng và chiều */}
                  {isBreakRow && (
                    <tr key="break" className="bg-zinc-50/50">
                      <td colSpan={grid.days.length + 1} className="px-3 py-1.5 text-center text-[10px] text-zinc-400 font-medium">
                        ☕ Nghỉ giải lao
                      </td>
                    </tr>
                  )}

                  <tr key={period} className="border-b border-zinc-100/60">
                    {/* Period number */}
                    <td className="px-3 py-2">
                      <div className="text-xs font-semibold text-zinc-500">{period}</div>
                      <div className="text-[9px] text-zinc-300">{time.start}</div>
                    </td>

                    {/* Day cells */}
                    {grid.days.map((day) => {
                      const key = `${day}-${period}`;
                      const cellSlots = slotMap[key] || [];
                      const hasConflict = conflictSet.has(key);

                      return (
                        <td
                          key={day}
                          className={`px-1.5 py-1.5 align-top ${
                            hasConflict
                              ? 'bg-rose-50/40 border border-rose-200/40 animate-pulse'
                              : ''
                          }`}
                        >
                          {cellSlots.length > 0 ? (
                            <div className="space-y-1">
                              {cellSlots.map((slot) => (
                                <ScheduleSlotCard
                                  key={slot.id}
                                  slot={slot}
                                  compact
                                  onClick={() => onSlotClick?.(slot)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="h-8 rounded-lg bg-zinc-50/50 flex items-center justify-center">
                              <span className="text-[9px] text-zinc-200">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
