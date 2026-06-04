/** S-Family — PH/HS xem đánh giá của bản thân/con. */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import StudentSelector from '../../components/family/StudentSelector';
import useStudentContext from '../../hooks/useStudentContext';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listByStudent } from '../../api/evaluation.api';
import { CONDUCT_GRADE, EVALUATION_TYPE } from '../../utils/labels';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

export default function FamilyEvaluations() {
  const { schoolYear } = useSchoolYear();
  const {
    loading: ctxLoading, error: ctxError, selectedId, selectedStudent,
    students, setSelectedId, isParent,
  } = useStudentContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [semester, setSemester] = useState('1');

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await listByStudent(selectedId, {
          semester,
          school_year: schoolYear,
        });
        if (!cancelled && res?.success) setItems(res.data || []);
      } catch (err) {
        if (!cancelled) toast.error(err?.message || 'Không tải được đánh giá');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedId, semester]);

  if (ctxLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (ctxError) return <EmptyState message={ctxError} />;

  return (
    <div>
      <PageHeader title="Đánh giá & nhận xét" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StudentSelector
          students={students}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          isParent={isParent}
        />
        <Select label="Học kỳ" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="1">Học kỳ 1</option>
          <option value="2">Học kỳ 2</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có đánh giá cho kỳ này." />
      ) : (
        <div className="space-y-3">
          {items.map((ev) => (
            <div key={ev.id} className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {EVALUATION_TYPE[ev.type] || ev.type}
                </span>
                {ev.subject && (
                  <span className="text-xs text-slate-500">Môn: {ev.subject.name}</span>
                )}
                {ev.conduct_grade && (
                  <span className="text-xs text-slate-500">
                    Hạnh kiểm: {CONDUCT_GRADE[ev.conduct_grade]}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800">{ev.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                GV: {ev.teacher?.full_name} • {ev.school_year} — HK{ev.semester}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedStudent && (
        <p className="text-xs text-slate-400 mt-4">
          Học sinh: {selectedStudent.user?.full_name} — Lớp {selectedStudent.class?.name}
        </p>
      )}
    </div>
  );
}
