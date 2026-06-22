/**
 * AttendanceTodayWidget — Tỷ lệ đi học hôm nay.
 */
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export default function AttendanceTodayWidget({ classId }) {
  const [data, setData] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });

  useEffect(() => {
    // Mock data — sẽ gọi API thực khi có endpoint
    const today = new Date().toISOString().slice(0, 10);
    // TODO: GET /attendance/summary?date=today&class_id=X
    setData({ present: 85, absent: 3, late: 2, total: 90, rate: 94 });
  }, [classId]);

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke="#14b8a6" strokeWidth="8"
            strokeDasharray={`${data.rate * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-teal-600">{data.rate}%</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-bold text-green-600">{data.present}</div>
          <div className="text-slate-400">Có mặt</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-blue-500">{data.late}</div>
          <div className="text-slate-400">Đi muộn</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-red-500">{data.absent}</div>
          <div className="text-slate-400">Vắng</div>
        </div>
      </div>
    </div>
  );
}
