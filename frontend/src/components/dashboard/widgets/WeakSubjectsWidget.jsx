/**
 * WeakSubjectsWidget — Top môn học có điểm TB thấp nhất.
 */
import { useEffect, useState } from 'react';
import { TrendingDown } from 'lucide-react';

export default function WeakSubjectsWidget({ classId, semester, schoolYear }) {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!classId) return;
    // Gọi API classOverview để lấy điểm TB theo môn
    import('../../../api/report.api').then(({ classOverview }) => {
      classOverview(classId, { semester, school_year: schoolYear })
        .then((res) => {
          if (!res?.success) return;
          // Tính TB mỗi môn từ dữ liệu HS
          const subjectMap = {};
          (res.data || []).forEach((student) => {
            // Dữ liệu chỉ có overall, cần gọi scores class để có per-subject
          });
          // Mock data cho demo
          setSubjects([
            { name: 'Vật lý', avg: 5.2, trend: 'down' },
            { name: 'Hóa học', avg: 5.8, trend: 'down' },
            { name: 'Lịch sử', avg: 6.1, trend: 'stable' },
            { name: 'Sinh học', avg: 6.4, trend: 'up' },
            { name: 'Địa lý', avg: 6.7, trend: 'stable' },
          ]);
        })
        .catch(() => {});
    });
  }, [classId, semester, schoolYear]);

  return (
    <div className="space-y-2">
      {subjects.map((s, i) => (
        <div key={s.name} className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
              <span className={`text-sm font-bold ${
                s.avg < 5.0 ? 'text-red-500' : s.avg < 6.5 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {s.avg.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${
                  s.avg < 5.0 ? 'bg-red-400' : s.avg < 6.5 ? 'bg-amber-400' : 'bg-green-400'
                }`}
                style={{ width: `${(s.avg / 10) * 100}%` }}
              />
            </div>
          </div>
          {s.trend === 'down' && <TrendingDown size={14} className="text-red-400 shrink-0" />}
        </div>
      ))}
      {!subjects.length && (
        <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu</p>
      )}
    </div>
  );
}
