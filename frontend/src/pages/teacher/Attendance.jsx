/** S13 — Điểm danh lớp chủ nhiệm. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listStudents } from '../../api/student.api';
import { markAttendance, listAttendanceByClass } from '../../api/attendance.api';
import { ATTENDANCE_STATUS } from '../../utils/labels';

export default function Attendance() {
  const { homeroomClass, loading: clsLoading } = useTeacherClasses();
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDay = useCallback(async () => {
    if (!homeroomClass?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const sRes = await listStudents({ class_id: homeroomClass.id });
      const list = sRes?.success ? (sRes.data || []) : [];
      setStudents(list);

      const init = {};
      list.forEach((s) => { init[s.id] = 'present'; });

      const aRes = await listAttendanceByClass(homeroomClass.id, { date });
      if (aRes?.success) {
        (aRes.data || []).forEach((row) => {
          init[row.student_id] = row.status;
        });
      }
      setStatuses(init);
    } catch (err) {
      toast.error(err?.message || 'Không tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [homeroomClass, date]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const handleSave = async () => {
    const items = students.map((s) => ({
      student_id: s.id,
      status: statuses[s.id] || 'present',
      attendance_date: date,
      schedule_id: null,
    }));
    setSaving(true);
    try {
      const res = await markAttendance({ class_id: homeroomClass.id, items });
      if (res?.success) toast.success(`Đã lưu điểm danh ${res.data?.count || items.length} HS`);
    } catch (err) {
      toast.error(err?.message || 'Điểm danh thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Điểm danh" />
        <EmptyState message="Chỉ GVCN mới được điểm danh lớp." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Điểm danh — ${homeroomClass.name}`}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu điểm danh'}</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !students.length ? (
        <EmptyState message="Lớp chưa có học sinh." />
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-left">Mã HS</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.user?.full_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.student_code}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                        <label key={key} className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`att-${s.id}`}
                            checked={statuses[s.id] === key}
                            onChange={() => setStatuses({ ...statuses, [s.id]: key })}
                          />
                          <span className={`text-xs px-2 py-0.5 rounded ${statuses[s.id] === key ? color : 'text-slate-500'}`}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
