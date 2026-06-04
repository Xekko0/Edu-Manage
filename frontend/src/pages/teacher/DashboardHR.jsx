/** S03 — Dashboard GVCN. */
import { useEffect, useState } from 'react';
import { Users, BarChart3, UserRound } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import ShortcutGrid from '../../components/admin/ShortcutGrid';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { listStudents } from '../../api/student.api';
import { classOverview } from '../../api/report.api';

export default function DashboardHR() {
  const { schoolYear } = useSchoolYear();
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
          classOverview(homeroomClass.id, { semester: 1, school_year: schoolYear }),
        ]);
        const report = rRes?.data || [];
        const weak = report.filter((d) => d.overall < 5).length;
        const avg = report.length
          ? (report.reduce((s, d) => s + d.overall, 0) / report.length).toFixed(2)
          : '—';
        setStats({ size: (sRes?.data || []).length, weak, avg });
      } catch (_) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [homeroomClass, schoolYear]);

  if (clsLoading || loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Lớp chủ nhiệm" />
        <Card><EmptyState title="Chưa có lớp CN" description="Bạn chưa được gán làm GVCN lớp nào." /></Card>
      </div>
    );
  }

  const shortcuts = [
    { to: '/teacher/students', label: 'Học sinh lớp', desc: 'Danh sách HS', icon: 'GraduationCap' },
    { to: '/teacher/parents', label: 'Phụ huynh', desc: 'Liên kết PH', icon: 'Users' },
    { to: '/teacher/attendance', label: 'Điểm danh', desc: 'Điểm danh hôm nay', icon: 'ClipboardCheck' },
    { to: '/teacher/reports', label: 'Báo cáo lớp', desc: 'Thống kê điểm', icon: 'BarChart3' },
    { to: '/teacher/journal', label: 'Sổ đầu bài', desc: 'Ghi chép tiết học', icon: 'NotebookPen' },
    { to: '/teacher/evaluations', label: 'Đánh giá HS', desc: 'Nhận xét', icon: 'MessageSquare' },
  ];

  return (
    <div>
      <PageHeader
        title={`Lớp chủ nhiệm — ${homeroomClass.name}`}
        description={`Năm học ${schoolYear}`}
      />

      <Card className="mb-6 bg-gradient-to-r from-teal-50 to-slate-50 border-teal-100">
        <CardBody>
          <p className="text-caption">Lớp</p>
          <p className="text-2xl font-bold text-teal-900">{homeroomClass.name}</p>
          <p className="text-caption mt-1">Khối {homeroomClass.grade_level}</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Sĩ số lớp" value={stats.size} color="teal" icon={Users} />
        <StatCard label="TB HK1" value={stats.avg} color="green" icon={BarChart3} />
        <StatCard label="HS học lực yếu" value={stats.weak} color="red" hint="ĐTB < 5.0" icon={UserRound} />
      </div>

      <h2 className="text-h2 mb-4">Công việc GVCN</h2>
      <ShortcutGrid items={shortcuts} />
    </div>
  );
}
