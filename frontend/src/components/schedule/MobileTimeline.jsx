/**
 * MobileTimeline Premium — Vertical Fluid Tracker.
 * Trục dọc siêu mảnh + tiết hiện tại phình to + gradient action buttons.
 */
import { useMemo } from 'react';
import { Clock, MapPin, User, Users, Video, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getPeriodTime } from './ScheduleSlotCard';

const PERIOD_DURATION = 45;
const MORNING_START = 7;

const getCurrentPeriod = () => {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const morningStartMin = MORNING_START * 60;
  const period = Math.floor((totalMin - morningStartMin) / PERIOD_DURATION) + 1;
  return period >= 1 && period <= 10 ? period : null;
};

export default function MobileTimeline({ slots = [] }) {
  const currentPeriod = getCurrentPeriod();

  const grouped = useMemo(() => {
    const now = [];
    const upcoming = [];
    const past = [];
    slots.forEach((slot) => {
      if (currentPeriod && slot.period === currentPeriod) now.push({ ...slot, status: 'now' });
      else if (!currentPeriod || slot.period > currentPeriod) upcoming.push({ ...slot, status: 'upcoming' });
      else past.push({ ...slot, status: 'past' });
    });
    return { now, upcoming, past };
  }, [slots, currentPeriod]);

  const renderSlot = (slot, isLast) => {
    const time = getPeriodTime(slot.period);
    const isNow = slot.status === 'now';
    const isPast = slot.status === 'past';
    const isOnline = slot.delivery_mode === 'online';

    return (
      <div key={slot.id || `${slot.period}-${slot.subject_id}`} className="relative flex gap-4">
        {/* Vertical stepper */}
        <div className="flex flex-col items-center">
          <div className={`relative z-10 w-3 h-3 rounded-full mt-1.5 transition-all ${
            isNow
              ? 'bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse'
              : isPast ? 'bg-zinc-300' : 'bg-zinc-400'
          }`}>
            {isNow && <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-30" />}
          </div>
          {!isLast && <div className={`w-px flex-1 min-h-[24px] ${isPast ? 'bg-zinc-200' : 'bg-zinc-200/60'}`} />}
        </div>

        {/* Card */}
        <div className={`flex-1 pb-4 ${isPast ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={10} className="text-zinc-300" />
            <span className="text-[10px] text-zinc-400 font-medium">
              Tiết {slot.period} · {time.start} – {time.end}
            </span>
            {isPast && <CheckCircle2 size={10} className="text-zinc-300" />}
          </div>

          <div className={`rounded-xl p-3.5 transition-all ${
            isNow
              ? 'bg-white shadow-md shadow-indigo-100/50 border border-indigo-100 ring-1 ring-indigo-500/10'
              : 'bg-white/60 border border-zinc-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isNow && (
                <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                  Đang diễn ra
                </span>
              )}
              {isOnline && (
                <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-full font-medium">Online</span>
              )}
            </div>

            <div className={`font-semibold text-sm mb-1.5 ${isNow ? 'text-zinc-800' : 'text-zinc-700'}`}>
              {slot.subject?.name || 'Học'}
            </div>

            <div className="space-y-1 mb-2">
              {slot.teacher?.full_name && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <User size={11} className="text-zinc-300" /> {slot.teacher.full_name}
                </div>
              )}
              {slot.class?.name && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Users size={11} className="text-zinc-300" /> Lớp {slot.class.name}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin size={11} className="text-zinc-300" /> {slot.room || slot.roomRef?.name || '—'}
              </div>
            </div>

            {isOnline && slot.online_meeting_url && (
              <a
                href={slot.online_meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all mt-1"
              >
                <Video size={13} /> Vào lớp online
              </a>
            )}

            {slot.homework_reminder && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
                <AlertTriangle size={11} /> {slot.homework_reminder}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!slots.length) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 size={36} className="mx-auto mb-3 text-zinc-200" />
        <p className="text-sm text-zinc-400">Không có tiết học hôm nay</p>
      </div>
    );
  }

  return (
    <div className="px-1">
      {grouped.now.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={11} /> Đang diễn ra
          </div>
          {grouped.now.map((s, i) => renderSlot(s, i === grouped.now.length - 1 && !grouped.upcoming.length && !grouped.past.length))}
        </div>
      )}
      {grouped.upcoming.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={11} /> Sắp tới
          </div>
          {grouped.upcoming.map((s, i) => renderSlot(s, i === grouped.upcoming.length - 1 && !grouped.past.length))}
        </div>
      )}
      {grouped.past.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 size={11} /> Đã qua
          </div>
          {grouped.past.map((s, i) => renderSlot(s, i === grouped.past.length - 1))}
        </div>
      )}
    </div>
  );
}
