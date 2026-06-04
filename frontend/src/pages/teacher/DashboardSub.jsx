/** S04 — Dashboard GVBM. */
import { Link } from 'react-router-dom';
import { PenLine, NotebookPen } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useTeacherClasses from '../../hooks/useTeacherClasses';

export default function DashboardSub() {
  const { loading, assignments } = useTeacherClasses();

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Lớp & môn được phân công"
        description="Các lớp-môn Admin đã gán cho bạn trong năm học hiện tại"
      />

      {!assignments.length ? (
        <Card><EmptyState title="Chưa có phân công" description="Liên hệ Admin để được gán dạy môn × lớp." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <Card key={a.id} className="hover:border-primary/30 hover:shadow-md transition-all">
              <CardBody>
                <p className="text-caption uppercase tracking-wide">{a.school_year || a.class_name}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{a.class?.name || a.class_name}</p>
                <p className="text-primary font-medium">{a.subject?.name || a.subject_name}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/teacher/score-entry">
                    <Button size="sm"><PenLine className="w-4 h-4" /> Nhập điểm</Button>
                  </Link>
                  <Link to="/teacher/journal">
                    <Button size="sm" variant="outline"><NotebookPen className="w-4 h-4" /> Sổ đầu bài</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
