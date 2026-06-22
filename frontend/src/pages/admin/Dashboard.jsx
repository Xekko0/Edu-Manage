/** S02 — Dashboard Admin (Widget-based v2.0). */
import { useEffect, useState } from 'react';
import {
  GraduationCap, School, Users, UserCircle,
  TrendingDown, DollarSign, AlertTriangle, Activity, BarChart3, Calendar,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import WidgetGrid from '../../components/dashboard/WidgetGrid';
import QuickStatsWidget from '../../components/dashboard/widgets/QuickStatsWidget';
import AttendanceTodayWidget from '../../components/dashboard/widgets/AttendanceTodayWidget';
import AttendanceTrendWidget from '../../components/dashboard/widgets/AttendanceTrendWidget';
import WeakSubjectsWidget from '../../components/dashboard/widgets/WeakSubjectsWidget';
import FunnelChartWidget from '../../components/dashboard/widgets/FunnelChartWidget';
import EWSTop5Widget from '../../components/ews/EWSTop5Widget';
import ActivityFeedWidget from '../../components/dashboard/widgets/ActivityFeedWidget';
import useAuth from '../../hooks/useAuth';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { listStudents } from '../../api/student.api';
import { listClasses } from '../../api/class.api';
import { listUsers } from '../../api/user.api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { schoolYear, semester } = useSchoolYear();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes, uRes] = await Promise.all([
          listStudents(),
          listClasses(),
          listUsers(),
        ]);
        const users = uRes?.data || [];
        setStats({
          students: (sRes?.data || []).length,
          classes: (cRes?.data || []).length,
          teachers: users.filter((u) => u.role === 'subject').length,
          parents: users.filter((u) => u.role === 'parent').length,
        });
      } catch (_) {
        setStats({ students: 0, classes: 0, teachers: 0, parents: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Widget definitions
  const widgets = [
    {
      id: 'quick-stats',
      title: 'Thống kê nhanh',
      icon: BarChart3,
      defaultSize: 'medium',
      component: <QuickStatsWidget stats={stats} />,
    },
    {
      id: 'attendance-today',
      title: 'Điểm danh hôm nay',
      icon: Users,
      defaultSize: 'medium',
      component: <AttendanceTodayWidget />,
    },
    {
      id: 'ews-top5',
      title: 'HS cần lưu ý (EWS)',
      icon: AlertTriangle,
      defaultSize: 'medium',
      component: <EWSTop5Widget semester={semester} schoolYear={schoolYear} />,
    },
    {
      id: 'attendance-trend',
      title: 'Xu hướng chuyên cần',
      icon: Activity,
      defaultSize: 'large',
      component: <AttendanceTrendWidget />,
    },
    {
      id: 'weak-subjects',
      title: 'Top môn TB thấp',
      icon: TrendingDown,
      defaultSize: 'medium',
      component: <WeakSubjectsWidget semester={semester} schoolYear={schoolYear} />,
    },
    {
      id: 'finance',
      title: 'Dòng tiền học phí',
      icon: DollarSign,
      defaultSize: 'medium',
      component: <FunnelChartWidget schoolYear={schoolYear} semester={semester} />,
    },
    {
      id: 'activity',
      title: 'Hoạt động gần đây',
      icon: Activity,
      defaultSize: 'medium',
      component: <ActivityFeedWidget />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tổng quan toàn trường"
        description={`Năm học ${schoolYear} · HK${semester}`}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <WidgetGrid
          userId={user?.id}
          widgets={widgets}
          defaultLayout={[
            { id: 'quick-stats', size: 'medium', order: 0 },
            { id: 'attendance-today', size: 'medium', order: 1 },
            { id: 'ews-top5', size: 'medium', order: 2 },
            { id: 'finance', size: 'medium', order: 3 },
            { id: 'attendance-trend', size: 'large', order: 4 },
            { id: 'weak-subjects', size: 'medium', order: 5 },
            { id: 'activity', size: 'medium', order: 6 },
          ]}
        />
      )}
    </div>
  );
}
