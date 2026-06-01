/** Báo cáo lớp chủ nhiệm — chỉ GVCN, không chọn lớp khác. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import GradeChart from '../../components/scores/GradeChart';
import { classOverview } from '../../api/report.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

export default function TeacherReports() {
  const { homeroomClass, loading: clsLoading } = useTeacherClasses();
  const [semester, setSemester] = useState('1');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    if (!homeroomClass?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await classOverview(homeroomClass.id, {
        semester,
        school_year: CURRENT_SCHOOL_YEAR,
      });
      if (res?.success) setData(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được báo cáo');
    } finally {
      setLoading(false);
    }
  }, [homeroomClass, semester]);

  useEffect(() => { loadReport(); }, [loadReport]);

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Báo cáo lớp chủ nhiệm" />
        <EmptyState message="Bạn chưa được gán GVCN." />
      </div>
    );
  }

  const top10 = data.slice(0, 10);
  const weak = data.filter((d) => d.overall < 5).length;
  const avgClass = data.length
    ? (data.reduce((s, d) => s + (d.overall || 0), 0) / data.length).toFixed(2)
    : '—';

  return (
    <div>
      <PageHeader title={`Báo cáo — ${homeroomClass.name}`}>
        <Select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-32">
          <option value="1">Học kỳ 1</option>
          <option value="2">Học kỳ 2</option>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">Sĩ số</div>
          <div className="text-2xl font-bold">{data.length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">TB cả lớp</div>
          <div className="text-2xl font-bold text-brand">{avgClass}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">HS yếu (&lt;5.0)</div>
          <div className="text-2xl font-bold text-red-600">{weak}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !data.length ? (
        <EmptyState message="Chưa có dữ liệu điểm cho học kỳ này." />
      ) : (
        <>
          <GradeChart
            labels={top10.map((d) => d.student_code)}
            series={[{ label: `TB HK${semester}`, values: top10.map((d) => d.overall), color: '#2563eb' }]}
          />
          <div className="bg-white rounded-lg border overflow-hidden mt-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Mã HS</th>
                  <th className="px-3 py-2 text-right">ĐTB</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.student_id} className="border-t">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.student_code}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${row.overall < 5 ? 'text-red-600' : ''}`}>
                      {row.overall?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
