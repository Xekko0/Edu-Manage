export default function ScoreTable({ items = [] }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Môn học</th>
            <th className="px-3 py-2 text-center">Miệng</th>
            <th className="px-3 py-2 text-center">15 phút</th>
            <th className="px-3 py-2 text-center">1 tiết</th>
            <th className="px-3 py-2 text-center">Học kỳ</th>
            <th className="px-3 py-2 text-center">TB</th>
            <th className="px-3 py-2 text-right">Xếp loại</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const get = (type) =>
              row.details?.filter((d) => d.score_type === type).map((d) => d.score_value).join(', ') || '—';
            const isWeak = row.average < 5.0;
            return (
              <tr key={row.subject_id} className="border-t">
                <td className="px-3 py-2">{row.subject_name}</td>
                <td className="px-3 py-2 text-center">{get('oral')}</td>
                <td className="px-3 py-2 text-center">{get('15min')}</td>
                <td className="px-3 py-2 text-center">{get('1period')}</td>
                <td className="px-3 py-2 text-center">{get('semester')}</td>
                <td className={`px-3 py-2 text-center font-semibold ${isWeak ? 'text-red-600' : ''}`}>
                  {row.average?.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">{row.grade}</td>
              </tr>
            );
          })}
          {!items.length && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                Chưa có dữ liệu điểm.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
