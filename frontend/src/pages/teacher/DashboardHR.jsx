/** S03 — Dashboard GVCN. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { listStudents } from '../../api/student.api';
import { classOverview } from '../../api/report.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

export default function DashboardHR() {
  const { loading: clsLoading, homeroomClass } = useTeacherClasses();
  const [stats, setStats] = useState({ size: 0, weak: 0, avg: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeroomClass?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          listStudents({ class_id: homeroomClass.id }),
          classOverview(homeroomClass.id, { semester: 1, school_year: CURRENT_SCHOOL_YEAR }),
        ]);
        const report = rRes?.data || [];
        const weak = report.filter((d) => d.overall < 5).length;
        const avg = report.length
          ? (report.reduce((s, d) => s + d.overall, 0) / report.length).toFixed(2)
          : '—';
        setStats({
          size: (sRes?.data || []).length,
          weak,
          avg,
        });
      } catch (_) { /* ignore */ }
      finally {
        setLoading(false);
      }
    })();
  }, [homeroomClass]);

  if (clsLoading || loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Lớp chủ nhiệm" />
        <p className="text-slate-500">Bạn chưa được gán làm GVCN lớp nào.</p>
      </div>
    );
  }

  const links = [
    { to: '/teacher/students', label: 'Học sinh lớp' },
    { to: '/teacher/parents', label: 'Phụ huynh' },
    { to: '/teacher/attendance', label: 'Điểm danh' },
    { to: '/teacher/journal', label: 'Sổ đầu bài' },
    { to: '/teacher/evaluations', label: 'Đánh giá HS' },
    { to: '/teacher/reports', label: 'Báo cáo lớp' },
  ];

  return (
    <div>
      <PageHeader title={`Lớp chủ nhiệm — ${homeroomClass.name}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Sĩ số lớp" value={stats.size} color="blue" />
        <StatCard label="TB HK1" value={stats.avg} color="green" />
        <StatCard label="HS học lực yếu" value={stats.weak} color="red" hint="ĐTB &lt; 5.0" />
      </div>

      <h2 className="text-lg font-semibold mb-3">Công việc GVCN</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="bg-white p-4 rounded-xl border hover:border-brand text-sm font-medium">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
