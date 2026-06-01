/** S14 — Hoạt động ngoại khóa. */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useStudentContext from '../../hooks/useStudentContext';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listExtracurriculars, listByStudent } from '../../api/extracurricular.api';
import { formatDateTime } from '../../utils/format';

export default function Extracurricular() {
  const { user } = useAuth();
  const { selectedId, selectedStudent, loading: ctxLoading } = useStudentContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let res;
        if (['parent', 'student'].includes(user?.role) && selectedId) {
          res = await listByStudent(selectedId);
        } else {
          res = await listExtracurriculars();
        }
        if (!cancelled && res?.success) setItems(res.data || []);
      } catch (err) {
        if (!cancelled) toast.error(err?.message || 'Không tải hoạt động');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, selectedId]);

  if (ctxLoading && ['parent', 'student'].includes(user?.role)) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Hoạt động ngoại khóa">
        {selectedStudent && (
          <span className="text-sm text-slate-500">
            {user?.role === 'parent' ? 'Con: ' : ''}{selectedStudent.user?.full_name}
          </span>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có hoạt động ngoại khóa." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((act) => (
            <div key={act.id} className="bg-white rounded-xl border p-5 hover:shadow-sm">
              <h3 className="font-semibold text-lg">{act.name}</h3>
              {act.description && (
                <p className="text-sm text-slate-600 mt-2">{act.description}</p>
              )}
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Thời gian</dt>
                  <dd>{formatDateTime(act.start_date)} — {formatDateTime(act.end_date)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Địa điểm</dt>
                  <dd>{act.location || '—'}</dd>
                </div>
                {act.organizer && (
                  <div className="flex gap-2">
                    <dt className="text-slate-500 w-20 shrink-0">Tổ chức</dt>
                    <dd>{act.organizer}</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
