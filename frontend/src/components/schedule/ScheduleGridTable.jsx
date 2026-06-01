/** Lưới TKB dùng chung (xem / admin). Hỗ trợ nhiều môn trong một ô. */
import { DAY_OF_WEEK, SCHEDULE_DAYS, SCHEDULE_PERIODS, CONFLICT_LABEL } from '../../utils/labels';

const cellConflictClass = (slots) =>
  slots.some((s) => s?.conflictTypes?.length > 0)
    ? 'bg-red-100 border-2 border-red-500'
    : 'bg-white border border-slate-200';

const conflictLabels = (types) =>
  (types || []).map((t) => CONFLICT_LABEL[t] || t).join(', ');

export default function ScheduleGridTable({
  items = [],
  session = 'morning',
  renderCell,
  showTeacher = true,
  mineOnly = false,
  userId,
}) {
  const findSlots = (day, period) =>
    items.filter(
      (s) => s.day_of_week === day && s.period === period && (s.session || 'morning') === session,
    );

  const defaultCell = (slots) => {
    if (!slots.length) return <span className="text-slate-300">—</span>;
    return (
      <div className="flex flex-col gap-1">
        {slots.map((slot) => {
          if (mineOnly && userId && slot.teacher_id !== userId) return null;
          const conflicts = slot.conflictTypes || [];
          return (
            <div
              key={slot.id}
              className={`text-xs leading-tight text-left p-1 rounded ${
                conflicts.length ? 'ring-1 ring-red-500 bg-red-50' : 'bg-slate-50'
              }`}
            >
              <div className="font-semibold text-brand">{slot.subject?.name}</div>
              {showTeacher && <div className="text-slate-500">{slot.teacher?.full_name}</div>}
              {slot.room && <div className="text-slate-400">{slot.room}</div>}
              {conflicts.length > 0 && (
                <div className="text-red-600 font-medium mt-0.5 text-[10px]">
                  {conflictLabels(conflicts)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left w-16">Tiết</th>
            {SCHEDULE_DAYS.map((d) => (
              <th key={d} className="px-3 py-2 text-center">{DAY_OF_WEEK[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHEDULE_PERIODS.map((p) => (
            <tr key={p} className="border-t">
              <td className="px-3 py-3 font-medium align-top">Tiết {p}</td>
              {SCHEDULE_DAYS.map((d) => {
                const slots = findSlots(d, p);
                const cellContent = renderCell
                  ? renderCell({ day: d, period: p, session, slots })
                  : defaultCell(slots);
                return (
                  <td
                    key={d}
                    className={`px-2 py-2 align-top border-l text-center min-w-[100px] min-h-[72px] ${
                      slots.length ? cellConflictClass(slots) : ''
                    }`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
