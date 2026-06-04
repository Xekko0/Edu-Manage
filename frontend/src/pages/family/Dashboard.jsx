/** S05 — Dashboard PH/HS. */
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import ShortcutGrid from '../../components/admin/ShortcutGrid';
import useStudentContext from '../../hooks/useStudentContext';
import Card, { CardBody } from '../../components/ui/Card';
import { Sparkles } from 'lucide-react';

export default function FamilyDashboard() {
  const { loading, selectedStudent } = useStudentContext();

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  const shortcuts = [
    { to: '/family/scores', label: 'Bảng điểm', desc: 'Điểm các môn theo kỳ', icon: 'GraduationCap' },
    { to: '/family/gradebook', label: 'Học bạ điện tử', desc: 'Xếp loại, xuất PDF', icon: 'School' },
    { to: '/family/evaluations', label: 'Đánh giá', desc: 'Nhận xét GVCN, GVBM', icon: 'MessageSquare' },
    { to: '/family/tuition', label: 'Học phí', desc: 'Trạng thái đóng phí', icon: 'Wallet' },
    { to: '/schedule', label: 'Lịch học', desc: 'Thời khóa biểu lớp', icon: 'CalendarDays' },
    { to: '/extracurricular', label: 'Ngoại khóa', desc: 'Hoạt động đã đăng ký', icon: 'Sparkles' },
  ];

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description={selectedStudent
          ? `Xin chào — ${selectedStudent.user?.full_name || selectedStudent.student_code}`
          : 'Chọn học sinh để xem dữ liệu'}
      />

      {selectedStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Mã HS" value={selectedStudent.student_code} color="teal" />
          <StatCard label="Lớp" value={selectedStudent.class?.name} color="green" />
          <StatCard
            label="Học sinh"
            value={selectedStudent.user?.full_name?.split(' ').slice(-2).join(' ') || '—'}
            color="blue"
          />
        </div>
      )}

      <h2 className="text-h2 mb-4">Chức năng</h2>
      <ShortcutGrid items={shortcuts} />

      <Card className="mt-8 border-teal-100 bg-teal-50/40">
        <CardBody className="flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-teal-900">
            Trợ lý AI EduSmart ở góc phải dưới — hỏi nhanh về điểm, lịch học và học phí.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
