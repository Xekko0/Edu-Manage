/** S16 — Báo cáo thống kê. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import GradeChart from '../../components/scores/GradeChart';
import { classOverview } from '../../api/report.api';
import { listClasses } from '../../api/class.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

export default function Reports() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [semester, setSemester] = useState('1');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClasses({ school_year: CURRENT_SCHOOL_YEAR })
      .then((res) => {
        const list = res?.data || [];
        setClasses(list);
        if (list[0]) setClassId(String(list[0].id));
      })
      .catch((err) => toast.error(err?.message || 'Không tải được danh sách lớp'))
      .finally(() => setLoading(false));
  }, []);

  const loadReport = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await classOverview(classId, { semester, school_year: CURRENT_SCHOOL_YEAR });
      if (res?.success) setData(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được báo cáo');
    } finally {
      setLoading(false);
    }
  }, [classId, semester]);

  useEffect(() => { if (classId) loadReport(); }, [loadReport, classId]);

  const top10 = data.slice(0, 10);
  const weak = data.filter((d) => d.overall < 5).length;
  const avgClass = data.length
    ? (data.reduce((s, d) => s + (d.overall || 0), 0) / data.length).toFixed(2)
    : '—';

  return (
    <div>
      <PageHeader title="Báo cáo & Thống kê">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-36">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
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
        <EmptyState message="Chưa có dữ liệu điểm cho lớp/kỳ này." />
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
