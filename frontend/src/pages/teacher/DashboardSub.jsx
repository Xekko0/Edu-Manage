/** S04 — Dashboard GVBM. */
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import useTeacherClasses from '../../hooks/useTeacherClasses';

export default function DashboardSub() {
  const { loading, assignments } = useTeacherClasses();

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Lớp & môn được phân công" />

      {!assignments.length ? (
        <EmptyState message="Chưa có phân công dạy học nào." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border p-5 hover:shadow-sm">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{a.school_year}</div>
              <div className="text-lg font-bold mt-1">{a.class?.name}</div>
              <div className="text-brand font-medium">{a.subject?.name}</div>
              <div className="mt-4 flex gap-2">
                <Link to="/teacher/score-entry" className="text-xs px-3 py-1.5 bg-brand text-white rounded-md">
                  Nhập điểm
                </Link>
                <Link to="/teacher/journal" className="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-50">
                  Sổ đầu bài
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
