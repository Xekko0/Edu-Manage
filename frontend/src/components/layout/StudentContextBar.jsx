import useStudentContext from '../../hooks/useStudentContext';
import StudentSelector from '../family/StudentSelector';
import Card, { CardBody } from '../ui/Card';

/** Sticky bar — PH chọn con; HS hiện tên. */
export default function StudentContextBar() {
  const {
    loading, students, selectedId, setSelectedId, selectedStudent, isParent,
  } = useStudentContext();

  if (loading || !selectedStudent) return null;

  return (
    <div className="sticky top-[var(--topbar-h,0)] z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-slate-50/95 backdrop-blur border-b border-slate-200 mb-4">
      <Card className="shadow-sm">
        <CardBody className="!py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-caption">Học sinh đang xem</p>
            <p className="font-semibold text-slate-900 truncate">
              {selectedStudent.user?.full_name || selectedStudent.student_code}
              <span className="text-caption font-normal ml-2">
                {selectedStudent.class?.name} · {selectedStudent.student_code}
              </span>
            </p>
          </div>
          {isParent && students.length > 1 && (
            <div className="w-full sm:w-56 shrink-0">
              <StudentSelector
                students={students}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                isParent={isParent}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
