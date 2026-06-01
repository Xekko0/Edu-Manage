/**
 * Card kết quả điểm trong bubble chat + nút Tải PDF inline + Xem đầy đủ (SRS 2.7.4).
 */
import { Link } from 'react-router-dom';

export default function ScoreResultCard({ items }) {
  if (!items?.length) {
    return <div className="mt-2 text-xs italic text-slate-500">Chưa có dữ liệu điểm.</div>;
  }

  return (
    <div className="mt-2">
      <div className="bg-slate-50 rounded-md overflow-hidden text-xs border border-slate-200">
        <div className="grid grid-cols-3 px-2 py-1 bg-slate-100 font-medium text-slate-600">
          <div>Môn</div>
          <div className="text-center">TB</div>
          <div className="text-right">Xếp loại</div>
        </div>
        {items.slice(0, 6).map((s) => {
          const isWeak = s.average < 5.0;
          return (
            <div key={s.subject_id} className="grid grid-cols-3 px-2 py-1 border-t border-slate-200">
              <div className="truncate">{s.subject_name}</div>
              <div className={`text-center font-medium ${isWeak ? 'text-red-600' : ''}`}>
                {s.average?.toFixed(2)}
              </div>
              <div className="text-right">{s.grade}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2">
        <button className="text-xs px-2 py-1 bg-brand text-white rounded">Tải PDF</button>
        <Link to="/family/gradebook" className="text-xs px-2 py-1 border border-brand text-brand rounded">
          Xem đầy đủ
        </Link>
      </div>
    </div>
  );
}
