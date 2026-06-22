/**
 * EWSTop5Widget — Top 5 HS có At-Risk Index cao nhất.
 * Hiển thị trên Admin Dashboard.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function EWSTop5Widget({ semester, schoolYear }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Mock data — sẽ gọi API khi có endpoint tổng hợp
    setStudents([
      { id: 1, code: 'HS10A105', name: 'Nguyễn Văn E', risk_level: 'critical', composite: 22 },
      { id: 2, code: 'HS10A215', name: 'Trần Thị F', risk_level: 'critical', composite: 28 },
      { id: 3, code: 'HS11A108', name: 'Lê Văn G', risk_level: 'high', composite: 35 },
      { id: 4, code: 'HS10A120', name: 'Phạm Thị H', risk_level: 'high', composite: 41 },
      { id: 5, code: 'HS11A122', name: 'Hoàng Văn I', risk_level: 'medium', composite: 48 },
    ]);
  }, [semester, schoolYear]);

  if (!students.length) {
    return (
      <div className="text-center py-6 text-green-600">
        <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Không có HS cần lưu ý</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2.5 py-1.5">
          <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
              <RiskBadge level={s.risk_level} showLabel={false} />
            </div>
            <div className="text-[10px] text-slate-400">
              {s.code} · Index: {s.composite}
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
        </div>
      ))}
      <Link
        to="/admin/reports"
        className="block text-center text-xs text-teal-600 hover:underline pt-2 border-t"
      >
        Xem tất cả →
      </Link>
    </div>
  );
}
