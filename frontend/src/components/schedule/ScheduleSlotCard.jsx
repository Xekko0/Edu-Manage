/**
 * ScheduleSlotCard — Thẻ tiết học Flat-Premium.
 * Dùng cho tất cả views: Student, Teacher, Parent, Admin.
 * Glassmorphism + gradient highlights + dynamic actions.
 */
import { Clock, MapPin, User, Users, Video, AlertTriangle, BookOpen } from 'lucide-react';

const PERIOD_DURATION = 45;
const MORNING_START = 7;

export const getPeriodTime = (period) => {
  const startMin = (period - 1) * PERIOD_DURATION;
  const endMin = period * PERIOD_DURATION;
  const sh = MORNING_START + Math.floor(startMin / 60);
  const sm = startMin % 60;
  const eh = MORNING_START + Math.floor(endMin / 60);
  const em = endMin % 60;
  return {
    start: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
    end: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
  };
};

export default function ScheduleSlotCard({ slot, isNow, isPast, compact = false, onClick }) {
  const time = getPeriodTime(slot.period);
  const isOnline = slot.delivery_mode === 'online';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
          isNow
            ? 'bg-indigo-50 border border-indigo-200 shadow-sm shadow-indigo-100/50'
            : isPast
              ? 'bg-zinc-50/50 border border-zinc-100/50 opacity-50'
              : 'bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-sm'
        }`}
      >
        <div className="text-[10px] font-semibold text-zinc-800 truncate">{slot.subject?.name || '—'}</div>
        <div className="text-[9px] text-zinc-400 truncate">{slot.teacher?.full_name || slot.teacher_name || ''}</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 cursor-pointer transition-all ${
        isNow
          ? 'bg-white shadow-md shadow-indigo-100/50 border border-indigo-100 ring-1 ring-indigo-500/10'
          : isPast
            ? 'bg-zinc-50/50 border border-zinc-100/50 opacity-50'
            : 'bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-sm'
      }`}
    >
      {/* Status badge */}
      {isNow && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Đang diễn ra</span>
        </div>
      )}

      {/* Time */}
      <div className="flex items-center gap-1.5 mb-2">
        <Clock size={11} className="text-zinc-300" />
        <span className="text-[11px] text-zinc-400 font-medium">
          Tiết {slot.period} · {time.start} – {time.end}
        </span>
      </div>

      {/* Subject */}
      <div className="font-semibold text-sm text-zinc-800 mb-2">{slot.subject?.name || 'Học'}</div>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        {slot.teacher?.full_name && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <User size={11} className="text-zinc-300" />
            <span>{slot.teacher.full_name}</span>
          </div>
        )}
        {slot.class?.name && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users size={11} className="text-zinc-300" />
            <span>Lớp {slot.class.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin size={11} className="text-zinc-300" />
          <span>{slot.room || slot.roomRef?.name || '—'}</span>
        </div>
      </div>

      {/* Dynamic actions */}
      <div className="flex flex-wrap gap-2">
        {isOnline && slot.online_meeting_url && (
          <a
            href={slot.online_meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <Video size={12} /> Vào lớp online
          </a>
        )}
        {slot.homework_reminder && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
            <AlertTriangle size={11} /> {slot.homework_reminder}
          </span>
        )}
      </div>

      {/* Lesson topic */}
      {slot.lesson_topic && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-100 text-xs text-zinc-400">
          📝 {slot.lesson_topic}
        </div>
      )}
    </div>
  );
}
