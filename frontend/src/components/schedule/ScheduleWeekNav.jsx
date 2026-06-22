/**
 * ScheduleWeekNav — Điều hướng tuần Flat-Premium.
 * Calendar mini + week navigation + semester info.
 */
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DAY_OF_WEEK } from '../../utils/labels';

export default function ScheduleWeekNav({
  weekStart,
  selectedDate,
  onDateSelect,
  onPrev,
  onNext,
  teachingDays = [1, 2, 3, 4, 5],
  semesterStart,
  semesterEnd,
}) {
  // Tính ngày cho mỗi ngày trong tuần
  const getWeekDates = () => {
    if (!weekStart) return [];
    return teachingDays.map((day) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + day - 1);
      return { day, date };
    });
  };

  const weekDates = getWeekDates();
  const formatDate = (d) => d ? `${d.getDate()}/${d.getMonth() + 1}` : '';

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm shadow-zinc-100/40">
      {/* Prev */}
      <button
        onClick={onPrev}
        className="p-2 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-400 hover:text-zinc-600"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Day buttons */}
      <div className="flex-1 flex items-center gap-1.5 justify-center">
        {weekDates.map(({ day, date }) => {
          const isSelected = selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button
              key={day}
              onClick={() => onDateSelect?.(date.toISOString().slice(0, 10))}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                  : isToday
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'hover:bg-zinc-50 text-zinc-500'
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{DAY_OF_WEEK[day]?.slice(0, 3)}</span>
              <span className="text-xs font-bold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        className="p-2 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-400 hover:text-zinc-600"
      >
        <ChevronRight size={16} />
      </button>

      {/* Today button */}
      <button
        onClick={() => onDateSelect?.(new Date().toISOString().slice(0, 10))}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
      >
        <Calendar size={12} />
        Hôm nay
      </button>
    </div>
  );
}
