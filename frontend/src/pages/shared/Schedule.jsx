/** S12 — Lịch học tuần (ca sáng/chiều, trùng lịch, GV xem/sửa tiết mình). */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useStudentContext from '../../hooks/useStudentContext';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ScheduleGridTable from '../../components/schedule/ScheduleGridTable';
import {
  listSchedules,
  listSchedulesMine,
  moveSchedule,
  removeSchedule,
  createSchedule,
} from '../../api/schedule.api';
import { listClasses } from '../../api/class.api';
import {
  CURRENT_SCHOOL_YEAR,
  SESSION_LABEL,
  SESSIONS,
  DAY_OF_WEEK,
  SCHEDULE_DAYS,
  SCHEDULE_PERIODS,
  CONFLICT_LABEL,
  TEACHER_MAX_PERIODS_WEEK,
} from '../../utils/labels';

export default function Schedule() {
  const { user } = useAuth();
  const { selectedStudent, loading: ctxLoading } = useStudentContext();
  const { homeroomClass, teachingClasses, assignments, loading: tcLoading } = useTeacherClasses();
  const [session, setSession] = useState('morning');
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mineOnly, setMineOnly] = useState(user?.role === 'subject');
  const [editSlot, setEditSlot] = useState(null);
  const [roomEdit, setRoomEdit] = useState('');
  const [moveForm, setMoveForm] = useState({ day_of_week: 1, period: 1, session: 'morning' });
  const [saving, setSaving] = useState(false);

  const isTeacher = user?.role === 'subject';
  const isFamily = ['parent', 'student'].includes(user?.role);

  const canPickClass = isTeacher && !mineOnly && teachingClasses.length > 0;
  const canViewFullClass = user?.role === 'admin'
    || (canPickClass && classId && teachingClasses.some((c) => String(c.id) === String(classId)));

  useEffect(() => {
    if (user?.role === 'admin') {
      listClasses({ school_year: CURRENT_SCHOOL_YEAR })
        .then((res) => {
          const list = res?.data || [];
          setAllClasses(list);
          if (!classId && list[0]) setClassId(String(list[0].id));
        })
        .catch((err) => toast.error(err?.message || 'Không tải danh sách lớp'));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isTeacher || mineOnly || tcLoading) return;
    const defaultId = homeroomClass?.id || teachingClasses[0]?.id;
    if (defaultId) setClassId(String(defaultId));
  }, [isTeacher, mineOnly, homeroomClass?.id, teachingClasses, tcLoading]);

  useEffect(() => {
    if (isFamily && selectedStudent?.class_id) {
      setClassId(String(selectedStudent.class_id));
    }
  }, [isFamily, selectedStudent?.class_id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher && mineOnly) {
        const res = await listSchedulesMine({ school_year: CURRENT_SCHOOL_YEAR });
        if (res?.success) setItems(res.data?.items || []);
      } else if (canViewFullClass && classId) {
        const res = await listSchedules({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR });
        if (res?.success) {
          const payload = res.data;
          setItems(payload?.items || payload || []);
        }
      } else if (isFamily && classId) {
        const res = await listSchedules({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR });
        if (res?.success) {
          const payload = res.data;
          setItems(payload?.items || payload || []);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      toast.error(err?.message || 'Không tải TKB');
    } finally {
      setLoading(false);
    }
  }, [classId, mineOnly, isTeacher, canViewFullClass, isFamily]);

  useEffect(() => { load(); }, [load]);

  const isOwnSlot = (slot) => slot && Number(slot.teacher_id) === Number(user?.id);
  const canEditSlot = (slot) => isTeacher && slot && isOwnSlot(slot);

  const openEdit = (slot) => {
    setEditSlot(slot);
    setRoomEdit(slot.room || '');
    setMoveForm({
      day_of_week: slot.day_of_week,
      period: slot.period,
      session: slot.session || 'morning',
    });
  };

  const handleSave = async () => {
    if (!editSlot) return;
    setSaving(true);
    const payload = {
      day_of_week: Number(moveForm.day_of_week),
      period: Number(moveForm.period),
      session: moveForm.session,
      room: roomEdit,
    };
    try {
      const res = await moveSchedule(editSlot.id, payload);
      if (res?.success) {
        const warn = res.data?.warnings?.length;
        toast.success(warn ? 'Đã lưu (có cảnh báo trùng lịch)' : 'Đã cập nhật lịch dạy');
        setSession(moveForm.session);
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editSlot || !window.confirm('Xóa tiết này?')) return;
    setSaving(true);
    try {
      const res = await removeSchedule(editSlot.id);
      if (res?.success) {
        toast.success('Đã xóa');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    } finally {
      setSaving(false);
    }
  };

  const myAssignmentsForClass = assignments.filter(
    (a) => String(a.class_id) === String(classId),
  );

  const handleAddSlot = async (day, period, assignment) => {
    if (!classId || !assignment) return;
    setSaving(true);
    try {
      const res = await createSchedule({
        class_id: Number(classId),
        subject_id: assignment.subject_id,
        teacher_id: user.id,
        day_of_week: day,
        period,
        session,
        school_year: CURRENT_SCHOOL_YEAR,
        room: `P${teachingClasses.find((c) => String(c.id) === classId)?.name || ''}`,
      });
      if (res?.success) {
        const warn = res.data?.warnings?.length;
        toast.success(warn ? 'Đã thêm (có cảnh báo trùng lịch)' : 'Đã thêm tiết');
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Thêm tiết thất bại');
    } finally {
      setSaving(false);
    }
  };

  const conflictCount = items.filter(
    (i) => isOwnSlot(i) && i.conflictTypes?.length > 0,
  ).length;

  const classOptions = user?.role === 'admin' ? allClasses : teachingClasses;

  const renderCell = ({ day, period, slots }) => {
    const visible = mineOnly && isTeacher
      ? slots.filter((s) => isOwnSlot(s))
      : slots;

    const addButton = isTeacher && !mineOnly && canViewFullClass && myAssignmentsForClass.length === 1 && (
      <button
        type="button"
        className="text-xs text-brand hover:underline mt-1"
        disabled={saving}
        onClick={() => handleAddSlot(day, period, myAssignmentsForClass[0])}
      >
        + Thêm môn
      </button>
    );

    if (!visible.length) {
      return addButton || <span className="text-slate-300">—</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {visible.map((slot) => {
          const conflicts = slot.conflictTypes || [];
          const editable = canEditSlot(slot);
          return (
            <button
              key={slot.id}
              type="button"
              disabled={!editable}
              onClick={() => editable && openEdit(slot)}
              className={`text-xs leading-tight text-left w-full p-1 rounded ${
                editable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
              } ${conflicts.length && isOwnSlot(slot) ? 'ring-2 ring-red-500 bg-red-50' : 'bg-slate-50'}`}
            >
              <div className="font-semibold text-brand">{slot.subject?.name}</div>
              {(!isTeacher || !mineOnly) && (
                <div className="text-slate-500">{slot.teacher?.full_name}</div>
              )}
              {slot.room && <div className="text-slate-400">{slot.room}</div>}
              {conflicts.length > 0 && isOwnSlot(slot) && (
                <div className="text-red-600 font-medium mt-0.5 text-[10px]">
                  {conflicts.map((t) => CONFLICT_LABEL[t] || t).join(', ')}
                </div>
              )}
              {editable && <div className="text-slate-400 mt-0.5">Nhấn để sửa</div>}
            </button>
          );
        })}
        {addButton}
      </div>
    );
  };

  if ((ctxLoading && isFamily) || (tcLoading && isTeacher)) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title={mineOnly && isTeacher ? 'Lịch dạy của tôi' : 'Lịch học tuần'}>
        {isTeacher && (
          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            Chỉ hiện tiết của tôi
          </label>
        )}
        {canPickClass && (
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-40">
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        )}
        <div className="flex gap-1">
          {SESSIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSession(s)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                session === s ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-slate-50'
              }`}
            >
              {SESSION_LABEL[s]}
            </button>
          ))}
        </div>
      </PageHeader>

      {isTeacher && !mineOnly && (
        <p className="mb-2 text-sm text-slate-600">
          Đang xem TKB cả lớp. Nhấn vào <strong>tiết của bạn</strong> để chỉnh phòng hoặc chuyển tiết.
        </p>
      )}

      {conflictCount > 0 && isTeacher && (
        <p className="mb-3 text-sm text-red-600 font-medium">
          Có {conflictCount} tiết của bạn có cảnh báo (viền đỏ). Giới hạn {TEACHER_MAX_PERIODS_WEEK} tiết/tuần/GV.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có thời khóa biểu cho lựa chọn này." />
      ) : (
        <ScheduleGridTable
          items={items}
          session={session}
          mineOnly={false}
          userId={user?.id}
          showTeacher={!isTeacher || !mineOnly}
          renderCell={isTeacher ? renderCell : undefined}
        />
      )}

      <Modal open={!!editSlot} title="Sửa tiết của tôi" onClose={() => setEditSlot(null)}>
        {editSlot && (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {editSlot.subject?.name} — {editSlot.class?.name}
            </p>
            <Input label="Phòng" value={roomEdit} onChange={(e) => setRoomEdit(e.target.value)} />
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Chuyển sang ô khác</p>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  label="Thứ"
                  value={moveForm.day_of_week}
                  onChange={(e) => setMoveForm({ ...moveForm, day_of_week: Number(e.target.value) })}
                >
                  {SCHEDULE_DAYS.map((d) => (
                    <option key={d} value={d}>{DAY_OF_WEEK[d]}</option>
                  ))}
                </Select>
                <Select
                  label="Ca"
                  value={moveForm.session}
                  onChange={(e) => setMoveForm({ ...moveForm, session: e.target.value })}
                >
                  {SESSIONS.map((s) => (
                    <option key={s} value={s}>{SESSION_LABEL[s]}</option>
                  ))}
                </Select>
                <Select
                  label="Tiết"
                  value={moveForm.period}
                  onChange={(e) => setMoveForm({ ...moveForm, period: Number(e.target.value) })}
                >
                  {SCHEDULE_PERIODS.map((p) => (
                    <option key={p} value={p}>Tiết {p}</option>
                  ))}
                </Select>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Đổi thứ / ca / tiết rồi bấm Lưu — hệ thống sẽ chuyển sang tab ca tương ứng.
              </p>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={handleDelete} disabled={saving}>
                Xóa tiết
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditSlot(null)}>Hủy</Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
