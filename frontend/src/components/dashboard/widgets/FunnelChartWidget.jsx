/**
 * FunnelChartWidget — Dòng tiền học phí (Funnel Chart).
 * Hóa đơn → Đã thu → Nợ tồn đọng.
 */
import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { getFinanceSummary } from '../../../api/finance.api';

export default function FunnelChartWidget({ schoolYear, semester }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getFinanceSummary({ school_year: schoolYear, semester })
      .then((res) => { if (res?.success) setData(res.data); })
      .catch(() => {});
  }, [schoolYear, semester]);

  if (!data) {
    return <div className="text-center py-6 text-slate-400 text-sm">Đang tải...</div>;
  }

  const formatVND = (n) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
    return n.toLocaleString('vi');
  };

  const maxVal = Math.max(data.total_amount, 1);
  const paidPct = (data.total_paid / maxVal) * 100;
  const outstandingPct = (data.total_outstanding / maxVal) * 100;

  return (
    <div className="space-y-3">
      {/* Funnel visualization */}
      <div className="space-y-2">
        {/* Total invoices */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Tổng hóa đơn</span>
            <span className="font-bold text-slate-700">{formatVND(data.total_amount)}đ</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-4">
            <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Paid */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Đã thu</span>
            <span className="font-bold text-green-600">{formatVND(data.total_paid)}đ</span>
          </div>
          <div className="w-full bg-green-50 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </div>

        {/* Outstanding */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Nợ tồn đọng</span>
            <span className="font-bold text-red-500">{formatVND(data.total_outstanding)}đ</span>
          </div>
          <div className="w-full bg-red-50 rounded-full h-4">
            <div className="bg-red-400 h-4 rounded-full transition-all" style={{ width: `${outstandingPct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{data.paid_count}</div>
          <div className="text-[10px] text-slate-400">Đã đóng</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-500">{data.partial_count}</div>
          <div className="text-[10px] text-slate-400">Một phần</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-500">{data.unpaid_count}</div>
          <div className="text-[10px] text-slate-400">Chưa đóng</div>
        </div>
      </div>
    </div>
  );
}
