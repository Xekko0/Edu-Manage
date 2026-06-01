/** S05 — Dashboard PH/HS. */
import { Link } from 'react-router-dom';
import useStudentContext from '../../hooks/useStudentContext';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StudentSelector from '../../components/family/StudentSelector';
import Spinner from '../../components/ui/Spinner';

export default function FamilyDashboard() {
  const {
    loading, selectedStudent, students, selectedId, setSelectedId, isParent,
  } = useStudentContext();

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  const cards = [
    { to: '/family/scores', label: 'Bảng điểm', desc: 'Xem điểm các môn theo kỳ', color: 'blue' },
    { to: '/family/gradebook', label: 'Học bạ điện tử', desc: 'Xếp loại, xuất PDF', color: 'green' },
    { to: '/family/evaluations', label: 'Đánh giá', desc: 'Nhận xét từ GVCN, GVBM', color: 'purple' },
    { to: '/family/tuition', label: 'Học phí', desc: 'Trạng thái đóng học phí', color: 'amber' },
    { to: '/schedule', label: 'Lịch học', desc: 'Thời khóa biểu lớp', color: 'slate' },
    { to: '/extracurricular', label: 'Ngoại khóa', desc: 'Hoạt động đã đăng ký', color: 'slate' },
  ];

  return (
    <div>
      <PageHeader title="Tổng quan" />

      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Học sinh"
            value={selectedStudent.user?.full_name?.split(' ').slice(-2).join(' ') || '—'}
            color="blue"
          />
          <StatCard label="Mã HS" value={selectedStudent.student_code} color="slate" />
          <StatCard label="Lớp" value={selectedStudent.class?.name} color="green" />
          <div className="md:col-span-1">
            <StudentSelector
              students={students}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              isParent={isParent}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-white p-5 rounded-xl border hover:border-brand hover:shadow-sm transition"
          >
            <div className="font-semibold">{c.label}</div>
            <div className="text-sm text-slate-500 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
        Trợ lý AI EduSmart ở góc phải dưới — hỏi nhanh về điểm, lịch học, điểm danh.
      </div>
    </div>
  );
}
