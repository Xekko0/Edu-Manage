/** S12 — Lịch học tuần (ca sáng/chiều, trùng lịch, GV xem/sửa tiết mình). */
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useStudentContext from '../../hooks/useStudentContext';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ScheduleGridTable from '../../components/schedule/ScheduleGridTable';
import StudentScheduleView from '../../components/schedule/StudentScheduleView';
import ScheduleSlotDetail from '../../components/schedule/ScheduleSlotDetail';
import {
  listSchedules,
  listSchedulesMine,
  listSchedulesMyClass,
  moveSchedule,
  removeSchedule,
  createSchedule,
  patchScheduleLesson,
} from '../../api/schedule.api';
import useWebPush, { getReminderMinutesPref, setReminderMinutesPref } from '../../hooks/useWebPush';
import { listClasses } from '../../api/class.api';
import { getTimetableConfig } from '../../api/timetable-config.api';
import {
  SESSION_LABEL,
  DAY_OF_WEEK,
  CONFLICT_LABEL,
  TEACHER_MAX_PERIODS_WEEK,
} from '../../utils/labels';
import { gridFromTimetableConfig, defaultTimetableConfig } from '../../utils/timetableGrid';

export default function Schedule() {
  const { user } = useAuth();
  const { schoolYear } = useSchoolYear();
  const { selectedStudent, loading: ctxLoading } = useStudentContext();
  const { homeroomClass, teachingClasses, assignments, loading: tcLoading } = useTeacherClasses();
  const [session, setSession] = useState('morning');
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  /** Mặc định xem TKB cả lớp; bật lọc chỉ tiết mình dạy khi cần. */
  const [mineOnly, setMineOnly] = useState(false);
  const [mineClassFilter, setMineClassFilter] = useState('');
  const [editSlot, setEditSlot] = useState(null);
  const [roomEdit, setRoomEdit] = useState('');
  const [moveForm, setMoveForm] = useState({ day_of_week: 1, period: 1, session: 'morning' });
  const [saving, setSaving] = useState(false);
  const [timetableConfig, setTimetableConfig] = useState(defaultTimetableConfig());
  const [studentSlots, setStudentSlots] = useState([]);
  const [detailSlot, setDetailSlot] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    lesson_topic: '',
    homework_reminder: '',
    delivery_mode: 'offline',
    online_meeting_url: '',
  });
  const [reminderMin, setReminderMin] = useState(getReminderMinutesPref());

  const isStudent = user?.role === 'student';
  const push = useWebPush({ enabled: isStudent });

  const isTeacher = user?.role === 'subject';
  const grid = gridFromTimetableConfig(timetableConfig, session);
  const sessionOptions = timetableConfig.sessions || ['morning'];
  const isFamily = ['parent', 'student'].includes(user?.role);

  const canPickClass = isTeacher && !mineOnly && teachingClasses.length > 0;
  const canViewFullClass = user?.role === 'admin'
    || (canPickClass && classId && teachingClasses.some((c) => String(c.id) === String(classId)));

  useEffect(() => {
    getTimetableConfig({ school_year: schoolYear })
      .then((res) => {
        const cfg = res?.data || defaultTimetableConfig();
        setTimetableConfig(cfg);
        if (!cfg.sessions?.includes(session)) setSession(cfg.sessions?.[0] || 'morning');
      })
      .catch(() => {});
  }, [schoolYear]);

  useEffect(() => {
    if (user?.role === 'admin') {
      listClasses({ school_year: schoolYear })
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
        const res = await listSchedulesMine({ school_year: schoolYear });
        if (res?.success) setItems(res.data?.items || []);
      } else if (canViewFullClass && classId) {
        const res = await listSchedules({ class_id: classId, school_year: schoolYear });
        if (res?.success) {
          const payload = res.data;
          setItems(payload?.items || payload || []);
        }
      } else if (isFamily) {
        const res = await listSchedulesMyClass({
          school_year: schoolYear,
          ...(user?.role === 'parent' && selectedStudent?.id
            ? { student_id: selectedStudent.id }
            : {}),
        });
        if (res?.success) {
          const slots = res.data?.slots || res.data?.items || [];
          setStudentSlots(slots);
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      toast.error(err?.message || 'Không tải TKB');
    } finally {
      setLoading(false);
    }
  }, [classId, mineOnly, isTeacher, canViewFullClass, isFamily, schoolYear, selectedStudent?.id, user?.role]);

  useEffect(() => { load(); }, [load]);

  const mineClassOptions = useMemo(() => {
    if (!isTeacher || !mineOnly) return [];
    const map = new Map();
    items.forEach((s) => {
      const id = s.class_id ?? s.class?.id;
      const name = s.class?.name || teachingClasses.find((c) => c.id === id)?.name || `Lớp #${id}`;
      if (id) map.set(id, name);
    });
    return [...map.entries()].map(([id, name]) => ({ id: String(id), name }));
  }, [items, isTeacher, mineOnly, teachingClasses]);

  useEffect(() => {
    if (!mineOnly || mineClassOptions.length === 0) return;
    setMineClassFilter((prev) => {
      if (prev && mineClassOptions.some((c) => c.id === prev)) return prev;
      return mineClassOptions[0].id;
    });
  }, [mineOnly, mineClassOptions]);

  const displayedItems = useMemo(() => {
    if (!isTeacher || !mineOnly) return items;
    if (!mineClassFilter || mineClassFilter === 'all') return items;
    return items.filter(
      (s) => String(s.class_id ?? s.class?.id) === String(mineClassFilter),
    );
  }, [items, isTeacher, mineOnly, mineClassFilter]);

  const isOwnSlot = (slot) => slot && Number(slot.teacher_id) === Number(user?.id);
  const canEditSlot = (slot) => isTeacher && slot && isOwnSlot(slot);

  const openEdit = (slot) => {
    setEditSlot(slot);
    setRoomEdit(slot.room || '');
    setLessonForm({
      lesson_topic: slot.lesson_topic || '',
      homework_reminder: slot.homework_reminder || '',
      delivery_mode: slot.delivery_mode || 'offline',
      online_meeting_url: slot.online_meeting_url || '',
    });
    setMoveForm({
      day_of_week: slot.day_of_week,
      period: slot.period,
      session: slot.session || 'morning',
    });
  };

  const handleSaveLesson = async () => {
    if (!editSlot?.id) return;
    setSaving(true);
    try {
      const res = await patchScheduleLesson(editSlot.id, lessonForm);
      if (res?.success) {
        toast.success('Đã lưu nội dung tiết');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu nội dung tiết thất bại');
    } finally {
      setSaving(false);
    }
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
        school_year: schoolYear,
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

  const conflictCount = displayedItems.filter(
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
              {mineOnly && slot.class?.name && (
                <div className="text-slate-600 font-medium">{slot.class.name}</div>
              )}
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
          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap" title="Bật: chỉ các tiết bạn dạy (có thể nhiều lớp). Tắt: TKB đầy đủ của một lớp.">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => {
                setMineOnly(e.target.checked);
                if (!e.target.checked && (homeroomClass?.id || teachingClasses[0]?.id)) {
                  setClassId(String(homeroomClass?.id || teachingClasses[0]?.id));
                }
              }}
            />
            Chỉ tiết tôi dạy
          </label>
        )}
        {isTeacher && mineOnly && mineClassOptions.length > 1 && (
          <Select
            value={mineClassFilter}
            onChange={(e) => setMineClassFilter(e.target.value)}
            className="w-36"
          >
            {mineClassOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        )}
        {canPickClass && (
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-40">
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        )}
        <div className="flex gap-1">
          {sessionOptions.map((s) => (
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

      {isTeacher && mineOnly && (
        <p className="mb-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <strong>Lịch dạy của tôi</strong> — chỉ các tiết bạn được phân công (có thể khác lớp).
          Tắt «Chỉ tiết tôi dạy» để xem <strong>TKB đầy đủ của cả lớp</strong> (mọi giáo viên, mọi môn).
        </p>
      )}
      {isTeacher && !mineOnly && (
        <p className="mb-2 text-sm text-slate-600">
          Đang xem <strong>TKB cả lớp</strong>. Nhấn tiết của bạn để sửa phòng / chuyển tiết.
        </p>
      )}

      {conflictCount > 0 && isTeacher && (
        <p className="mb-3 text-sm text-red-600 font-medium">
          Có {conflictCount} tiết của bạn có cảnh báo (viền đỏ). Giới hạn {TEACHER_MAX_PERIODS_WEEK} tiết/tuần/GV.
        </p>
      )}

      {isFamily && (
        <section className="mb-4 p-3 border rounded-lg bg-slate-50 text-sm space-y-2">
          {isStudent && push.supported && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Nhắc trước giờ học:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={reminderMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setReminderMin(v);
                  setReminderMinutesPref(v);
                }}
              >
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
              </select>
              {!push.subscribed ? (
                <Button type="button" disabled={push.loading} onClick={push.subscribe}>
                  Bật thông báo đẩy
                </Button>
              ) : (
                <Button type="button" variant="secondary" disabled={push.loading} onClick={push.unsubscribe}>
                  Tắt thông báo
                </Button>
              )}
            </div>
          )}
          <p className="text-xs text-slate-600">
            Mỗi tiết hiển thị giáo viên, phòng học và hình thức (trực tiếp / online). Nhấn tiết để xem bài tập và link lớp.
          </p>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : isFamily ? (
        !studentSlots.length ? (
          <EmptyState message="Chưa có thời khóa biểu cho lớp này." />
        ) : (
          <StudentScheduleView
            slots={studentSlots}
            timetableConfig={timetableConfig}
            session={session}
            onSessionChange={setSession}
            onSelectSlot={setDetailSlot}
          />
        )
      ) : !displayedItems.length ? (
        <EmptyState message={mineOnly ? 'Bạn chưa có tiết dạy trong lựa chọn này.' : 'Chưa có thời khóa biểu cho lựa chọn này.'} />
      ) : (
        <ScheduleGridTable
          items={displayedItems}
          session={session}
          mineOnly={mineOnly && isTeacher}
          userId={user?.id}
          showTeacher={!isTeacher || !mineOnly}
          renderCell={isTeacher && !mineOnly ? renderCell : undefined}
        />
      )}

      <ScheduleSlotDetail
        slot={detailSlot}
        open={!!detailSlot}
        onClose={() => setDetailSlot(null)}
      />

      <Modal open={!!editSlot} title="Sửa tiết của tôi" onClose={() => setEditSlot(null)}>
        {editSlot && (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {editSlot.subject?.name} — {editSlot.class?.name}
            </p>
            <Input label="Phòng" value={roomEdit} onChange={(e) => setRoomEdit(e.target.value)} />
            <Input
              label="Chủ đề bài học"
              value={lessonForm.lesson_topic}
              onChange={(e) => setLessonForm({ ...lessonForm, lesson_topic: e.target.value })}
            />
            <Input
              label="Nhắc bài tập / chuẩn bị"
              value={lessonForm.homework_reminder}
              onChange={(e) => setLessonForm({ ...lessonForm, homework_reminder: e.target.value })}
            />
            <Select
              label="Hình thức học"
              value={lessonForm.delivery_mode}
              onChange={(e) => setLessonForm({ ...lessonForm, delivery_mode: e.target.value })}
            >
              <option value="offline">Trực tiếp</option>
              <option value="online">Trực tuyến</option>
            </Select>
            {lessonForm.delivery_mode === 'online' && (
              <Input
                label="Link Zoom / Teams"
                value={lessonForm.online_meeting_url}
                onChange={(e) => setLessonForm({ ...lessonForm, online_meeting_url: e.target.value })}
              />
            )}
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Chuyển sang ô khác</p>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  label="Thứ"
                  value={moveForm.day_of_week}
                  onChange={(e) => setMoveForm({ ...moveForm, day_of_week: Number(e.target.value) })}
                >
                  {grid.days.map((d) => (
                    <option key={d} value={d}>{DAY_OF_WEEK[d]}</option>
                  ))}
                </Select>
                <Select
                  label="Ca"
                  value={moveForm.session}
                  onChange={(e) => setMoveForm({ ...moveForm, session: e.target.value })}
                >
                  {sessionOptions.map((s) => (
                    <option key={s} value={s}>{SESSION_LABEL[s]}</option>
                  ))}
                </Select>
                <Select
                  label="Tiết"
                  value={moveForm.period}
                  onChange={(e) => setMoveForm({ ...moveForm, period: Number(e.target.value) })}
                >
                  {gridFromTimetableConfig(timetableConfig, moveForm.session).periods.map((p) => (
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
                <Button type="button" variant="secondary" onClick={handleSaveLesson} disabled={saving}>
                  Lưu nội dung
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Đang lưu…' : 'Lưu vị trí'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
