/** S03 — Dashboard GVCN (Widget-based v2.0). */
import { useEffect, useState } from 'react';
import { Users, BarChart3, UserRound, AlertTriangle, Activity, Calendar } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import ShortcutGrid from '../../components/admin/ShortcutGrid';
import WidgetGrid from '../../components/dashboard/WidgetGrid';
import AttendanceTodayWidget from '../../components/dashboard/widgets/AttendanceTodayWidget';
import AtRiskWidget from '../../components/ews/AtRiskWidget';
import useAuth from '../../hooks/useAuth';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { listStudents } from '../../api/student.api';
import { classOverview } from '../../api/report.api';

export default function DashboardHR() {
  const { user } = useAuth();
  const { schoolYear, semester } = useSchoolYear();
  const { loading: clsLoading, homeroomClass } = useTeacherClasses();
  const [stats, setStats] = useState({ size: 0, weak: 0, avg: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeroomClass?.id) { setLoading(false); return; }
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          listStudents({ class_id: homeroomClass.id }),
          classOverview(homeroomClass.id, { semester, school_year: schoolYear }),
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
  }, [homeroomClass, schoolYear, semester]);

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

  // Widget definitions cho GVCN
  const widgets = [
    {
      id: 'class-info',
      title: 'Thông tin lớp',
      icon: Users,
      defaultSize: 'medium',
      component: (
        <div className="text-center">
          <div className="text-3xl font-bold text-teal-700">{homeroomClass.name}</div>
          <div className="text-sm text-slate-500">Khối {homeroomClass.grade_level}</div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <div className="text-xl font-bold text-teal-600">{stats.size}</div>
              <div className="text-[10px] text-slate-400">Sĩ số</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{stats.avg}</div>
              <div className="text-[10px] text-slate-400">TB lớp</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{stats.weak}</div>
              <div className="text-[10px] text-slate-400">HS yếu</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'attendance-today',
      title: 'Điểm danh hôm nay',
      icon: Calendar,
      defaultSize: 'medium',
      component: <AttendanceTodayWidget classId={homeroomClass.id} />,
    },
    {
      id: 'ews-alerts',
      title: 'Cảnh báo sớm',
      icon: AlertTriangle,
      defaultSize: 'medium',
      component: <AtRiskWidget classId={homeroomClass.id} semester={semester} schoolYear={schoolYear} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Lớp chủ nhiệm — ${homeroomClass.name}`}
        description={`Năm học ${schoolYear} · HK${semester}`}
      />

      <WidgetGrid
        userId={user?.id}
        widgets={widgets}
        defaultLayout={[
          { id: 'class-info', size: 'medium', order: 0 },
          { id: 'attendance-today', size: 'medium', order: 1 },
          { id: 'ews-alerts', size: 'medium', order: 2 },
        ]}
      />

      <h2 className="text-h2 mt-8 mb-4">Công việc GVCN</h2>
      <ShortcutGrid items={shortcuts} />
    </div>
  );
}
