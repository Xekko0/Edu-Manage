import ScheduleGridTable from './ScheduleGridTable';
import { SESSION_LABEL } from '../../utils/labels';
import { gridFromTimetableConfig } from '../../utils/timetableGrid';

const MODE_LABEL = { offline: 'Trực tiếp', online: 'Trực tuyến' };

function StudentSlotCell({ slot, onSelect }) {
  const isOnline = slot.delivery_mode === 'online';

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className="text-xs leading-tight text-left w-full p-1.5 rounded bg-slate-50 hover:bg-brand/5 border border-slate-200 hover:border-brand/40 transition-colors"
    >
      <div className="font-semibold text-brand">{slot.subject}</div>
      <div className="text-slate-600">{slot.teacher_name}</div>
      <div className="text-slate-500 truncate" title={slot.room}>{slot.room}</div>
      <div className="flex flex-wrap gap-1 mt-1">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
          isOnline ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-800'
        }`}
        >
          {MODE_LABEL[slot.delivery_mode] || slot.delivery_mode}
        </span>
        {isOnline && slot.online_meeting_url && (
          <span className="text-[10px] text-violet-600 font-medium">Có link</span>
        )}
      </div>
      {slot.lesson_topic && (
        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{slot.lesson_topic}</div>
      )}
    </button>
  );
}

export default function StudentScheduleView({
  slots,
  timetableConfig,
  session,
  onSessionChange,
  onSelectSlot,
}) {
  const findSlots = (day, period) =>
    slots.filter(
      (s) => s.day_of_week === day && s.period === period && (s.session || 'morning') === session,
    );

  const renderCell = ({ day, period }) => {
    const cellSlots = findSlots(day, period);
    if (!cellSlots.length) return <span className="text-slate-300">—</span>;
    return (
      <div className="flex flex-col gap-1">
        {cellSlots.map((slot) => (
          <StudentSlotCell
            key={slot.schedule_id || slot.slot_id}
            slot={slot}
            onSelect={onSelectSlot}
          />
        ))}
      </div>
    );
  };

  const sessionOptions = timetableConfig?.sessions || ['morning'];
  const grid = gridFromTimetableConfig(timetableConfig, session);

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {sessionOptions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSessionChange(s)}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              session === s ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-slate-50'
            }`}
          >
            {SESSION_LABEL[s]}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Nhấn vào tiết để xem phòng, giáo viên, hình thức học và bài tập.
      </p>
      <ScheduleGridTable
        items={slots}
        session={session}
        scheduleDays={grid.days}
        schedulePeriods={grid.periods}
        renderCell={renderCell}
        showTeacher={false}
      />
    </div>
  );
}
