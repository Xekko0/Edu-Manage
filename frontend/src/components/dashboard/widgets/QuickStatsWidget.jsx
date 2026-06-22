/**
 * QuickStatsWidget — Thống kê nhanh (sĩ số, lớp, GV, PH).
 */
import { Users, School, GraduationCap, UserRound } from 'lucide-react';

export default function QuickStatsWidget({ stats = {} }) {
  const items = [
    { label: 'Học sinh', value: stats.students || 0, icon: GraduationCap, color: 'teal' },
    { label: 'Lớp học', value: stats.classes || 0, icon: School, color: 'blue' },
    { label: 'Giáo viên', value: stats.teachers || 0, icon: Users, color: 'amber' },
    { label: 'Phụ huynh', value: stats.parents || 0, icon: UserRound, color: 'green' },
  ];

  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className={`w-10 h-10 rounded-full ${colorMap[item.color]} flex items-center justify-center mx-auto mb-1.5`}>
            <item.icon size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{item.value}</div>
          <div className="text-[10px] text-slate-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
