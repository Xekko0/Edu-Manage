/** S-Family — PH/HS xem học phí và trạng thái đóng. */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import StudentSelector from '../../components/family/StudentSelector';
import useStudentContext from '../../hooks/useStudentContext';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { getStudentTuitions } from '../../api/tuition.api';
import { formatCurrency, formatDate, semesterLabel } from '../../utils/format';
import { TUITION_STATUS } from '../../utils/labels';

export default function FamilyTuition() {
  const {
    loading: ctxLoading, error: ctxError, selectedId, selectedStudent,
    students, setSelectedId, isParent,
  } = useStudentContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await getStudentTuitions(selectedId);
        if (!cancelled && res?.success) setItems(res.data || []);
      } catch (err) {
        if (!cancelled) toast.error(err?.message || 'Không tải được học phí');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedId]);

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
      <PageHeader title="Học phí" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StudentSelector
          className="md:col-span-1"
          students={students}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          isParent={isParent}
        />
        {selectedStudent && (
          <div className="md:col-span-2 bg-white rounded-lg border p-4 text-sm grid grid-cols-2 gap-2">
            <div><span className="text-slate-500">Học sinh:</span> {selectedStudent.user?.full_name}</div>
            <div><span className="text-slate-500">Lớp:</span> {selectedStudent.class?.name}</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có đợt thu học phí nào." />
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Năm học</th>
                <th className="px-3 py-2 text-left">Kỳ</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-right">Mức thu</th>
                <th className="px-3 py-2 text-right">Đã đóng</th>
                <th className="px-3 py-2 text-left">Hạn nộp</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const st = TUITION_STATUS[row.status] || TUITION_STATUS.unpaid;
                return (
                  <tr key={row.tuition_id} className="border-t">
                    <td className="px-3 py-2">{row.school_year}</td>
                    <td className="px-3 py-2">{semesterLabel(row.semester)}</td>
                    <td className="px-3 py-2">{row.description || '—'}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.amount_paid)}</td>
                    <td className="px-3 py-2">{formatDate(row.due_date)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
