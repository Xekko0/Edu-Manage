import StudentSelector from './StudentSelector';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import useStudentContext from '../../hooks/useStudentContext';

/** PH phải chọn con trước khi xem dữ liệu (nếu có nhiều con). */
export default function FamilyStudentGate({ children }) {
  const {
    loading, error, students, selectedId, setSelectedId, isParent,
  } = useStudentContext();

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="Không tải được hồ sơ" description={error} />;

  if (isParent && students.length > 1 && !selectedId) {
    return (
      <div className="max-w-md">
        <EmptyState
          title="Chọn học sinh"
          description="Tài khoản phụ huynh có nhiều con. Vui lòng chọn con để xem dữ liệu."
        />
        <div className="mt-4">
          <StudentSelector
            students={students}
            value={selectedId}
            onChange={setSelectedId}
          />
        </div>
      </div>
    );
  }

  if (!selectedId && students.length === 0) {
    return <EmptyState title="Chưa có hồ sơ học sinh" description="Liên hệ GVCN để được liên kết." />;
  }

  return children;
}
