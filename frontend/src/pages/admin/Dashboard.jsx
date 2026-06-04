/** S02 — Dashboard Admin. */
import { useEffect, useState } from 'react';
import { Users, GraduationCap, School, UserCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import ShortcutGrid from '../../components/admin/ShortcutGrid';
import { listStudents } from '../../api/student.api';
import { listClasses } from '../../api/class.api';
import { listUsers } from '../../api/user.api';

export default function AdminDashboard() {
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

  const shortcuts = [
    { to: '/admin/students', label: 'Học sinh', desc: 'Quản lý hồ sơ HS', icon: 'GraduationCap' },
    { to: '/admin/classes', label: 'Lớp học', desc: 'Lớp & khối', icon: 'School' },
    { to: '/admin/assignments', label: 'Phân công', desc: 'GVBM × lớp × môn', icon: 'UserCheck' },
    { to: '/admin/tuitions', label: 'Học phí', desc: 'Cấu hình thu phí', icon: 'Wallet' },
    { to: '/admin/reports', label: 'Báo cáo', desc: 'Thống kê điểm', icon: 'BarChart3' },
    { to: '/schedule', label: 'Lịch học', desc: 'Thời khóa biểu', icon: 'CalendarDays' },
  ];

  return (
    <div>
      <PageHeader
        title="Tổng quan toàn trường"
        description="Thống kê nhanh và lối tắt quản trị"
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Tổng học sinh" value={stats.students} color="teal" icon={GraduationCap} />
          <StatCard label="Lớp học" value={stats.classes} color="green" icon={School} />
          <StatCard label="Giáo viên" value={stats.teachers} color="blue" icon={Users} />
          <StatCard label="Phụ huynh" value={stats.parents} color="amber" icon={UserCircle} />
        </div>
      )}

      <h2 className="text-h2 mb-4">Lối tắt</h2>
      <ShortcutGrid items={shortcuts} />
    </div>
  );
}
