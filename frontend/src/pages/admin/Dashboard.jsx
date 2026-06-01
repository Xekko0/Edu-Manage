/** S02 — Dashboard Admin. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
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
    { to: '/admin/students', label: 'Học sinh', desc: 'Quản lý hồ sơ HS' },
    { to: '/admin/classes', label: 'Lớp học', desc: 'Lớp & khối' },
    { to: '/admin/assignments', label: 'Phân công', desc: 'GVBM × lớp × môn' },
    { to: '/admin/tuitions', label: 'Học phí', desc: 'Cấu hình thu phí' },
    { to: '/admin/reports', label: 'Báo cáo', desc: 'Thống kê điểm' },
    { to: '/schedule', label: 'Lịch học', desc: 'Thời khóa biểu' },
  ];

  return (
    <div>
      <PageHeader title="Tổng quan toàn trường" />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Tổng học sinh" value={stats.students} color="blue" />
          <StatCard label="Lớp học" value={stats.classes} color="green" />
          <StatCard label="Giáo viên" value={stats.teachers} color="purple" />
          <StatCard label="Phụ huynh" value={stats.parents} color="amber" />
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Truy cập nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="bg-white p-4 rounded-xl border hover:border-brand hover:shadow-sm transition"
          >
            <div className="font-semibold">{s.label}</div>
            <div className="text-sm text-slate-500 mt-1">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
