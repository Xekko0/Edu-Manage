/**
 * AtRiskWidget — Widget hiển thị số HS cần lưu ý (EWS).
 * Dùng trên Dashboard Admin / GVCN.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { getEWSDashboard, getClassRisks } from '../../api/ews.api';
import RiskBadge from './RiskBadge';

export default function AtRiskWidget({ classId, semester, schoolYear }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = classId
          ? await getClassRisks(classId, { semester, school_year: schoolYear })
          : await getEWSDashboard({ semester, school_year: schoolYear });
        if (res?.success) {
          if (classId) {
            // Compute summary from array
            const risks = res.data;
            const summary = { total: risks.length, critical: 0, high: 0, medium: 0, low: 0 };
            risks.forEach((r) => { summary[r.risk_level]++; });
            setData(summary);
          } else {
            setData(res.data);
          }
        }
      } catch { /* ignore */ }
    };
    fetch();
  }, [classId, semester, schoolYear]);

  if (!data) return null;

  const atRisk = (data.critical || 0) + (data.high || 0);

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className={atRisk > 0 ? 'text-red-500' : 'text-green-500'} />
        <h3 className="text-sm font-semibold text-slate-700">Cảnh báo sớm</h3>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{data.critical || 0}</div>
          <div className="text-[10px] text-slate-500">Nguy hiểm</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-500">{data.high || 0}</div>
          <div className="text-[10px] text-slate-500">Nguy cơ</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-500">{data.medium || 0}</div>
          <div className="text-[10px] text-slate-500">Theo dõi</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{data.low || 0}</div>
          <div className="text-[10px] text-slate-500">An toàn</div>
        </div>
      </div>

      {atRisk > 0 && (
        <Link
          to={classId ? `/teacher/reports` : `/admin/reports`}
          className="block text-center text-xs text-teal-600 hover:underline"
        >
          Xem chi tiết {atRisk} HS cần lưu ý →
        </Link>
      )}
    </div>
  );
}
