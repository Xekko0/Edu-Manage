/**
 * PerspectiveSelector — Sliding Segmented Control (Stripe-style).
 * Thanh viên nhộng bo tròn, khối nền trắng trượt mượt khi chuyển tab.
 */
import { useRef, useState, useEffect } from 'react';
import { School, Users, DoorOpen } from 'lucide-react';

const TABS = [
  { id: 'class', label: 'Theo Lớp', icon: School },
  { id: 'teacher', label: 'Giáo viên', icon: Users },
  { id: 'room', label: 'Phòng học', icon: DoorOpen },
];

export default function PerspectiveSelector({ value, onChange }) {
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeIdx = TABS.findIndex((t) => t.id === value);
    const container = containerRef.current;
    if (!container || activeIdx < 0) return;

    const buttons = container.querySelectorAll('button');
    const btn = buttons[activeIdx];
    if (btn) {
      setIndicator({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="inline-flex p-1 bg-zinc-100/80 rounded-xl relative backdrop-blur-sm"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm shadow-zinc-200/50 transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />

      {TABS.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
              isActive ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <tab.icon size={13} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
