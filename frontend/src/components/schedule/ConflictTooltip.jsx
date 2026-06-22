/**
 * ConflictTooltip Premium — Soft-error Overlay + micro-shake.
 * Glassmorphism tooltip + pastel red + gentle animation.
 */
import { AlertCircle, X } from 'lucide-react';

const CONFLICT_MESSAGES = {
  class: 'Ô lớp đã có tiết học',
  teacher: 'Giáo viên đã có tiết ở lớp khác',
  room: 'Phòng đã được sử dụng',
  daily_limit: 'Vượt 7 tiết/ngày (GDPT)',
  session_cap: 'Vượt 5 tiết/buổi',
  curriculum: 'Lệch khung chương trình khối',
  teacher_unavailable: 'Giáo viên bận đột xuất',
};

export default function ConflictTooltip({ conflicts = [], position, onClose }) {
  if (!conflicts.length) return null;

  return (
    <div
      className="absolute z-50"
      style={{
        top: position?.top || 0,
        left: position?.left || 0,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <div className="relative bg-zinc-900/90 backdrop-blur-md text-white rounded-xl shadow-xl p-3.5 min-w-[220px] max-w-[300px] border border-zinc-800 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Xung đột lịch học</p>
            <ul className="mt-1.5 space-y-1">
              {conflicts.map((c, i) => (
                <li key={i} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                  <span className="text-zinc-500 mt-0.5">•</span>
                  <span>{CONFLICT_MESSAGES[c] || c}</span>
                </li>
              ))}
            </ul>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-0.5 hover:bg-zinc-700 rounded transition-colors">
              <X size={12} className="text-zinc-400" />
            </button>
          )}
        </div>
        {/* Arrow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-zinc-900/90" />
        </div>
      </div>
    </div>
  );
}
