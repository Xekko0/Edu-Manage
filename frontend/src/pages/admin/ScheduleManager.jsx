/** Admin — Phân bổ TKB kéo-thả theo lớp. */
import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { listClasses } from '../../api/class.api';
import { listAssignments } from '../../api/assignment.api';
import {
  listSchedules,
  createSchedule,
  moveSchedule,
  updateSchedule,
  removeSchedule,
  autoArrangeSchedules,
} from '../../api/schedule.api';
import {
  CURRENT_SCHOOL_YEAR,
  DAY_OF_WEEK,
  SCHEDULE_DAYS,
  SCHEDULE_PERIODS,
  SESSION_LABEL,
  SESSIONS,
  TEACHER_MAX_PERIODS_WEEK,
} from '../../utils/labels';

function DroppableCell({ day, period, session, slots, children }) {
  const id = `cell-${session}-${day}-${period}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { day, period, session } });
  const hasConflict = slots.some((s) => s?.conflictTypes?.length > 0);
  return (
    <td
      ref={setNodeRef}
      className={`px-1 py-1 align-top border-l min-w-[110px] min-h-[76px] ${
        isOver ? 'ring-2 ring-brand bg-blue-50' : ''
      } ${hasConflict ? 'bg-red-100 border-2 border-red-500' : ''}`}
    >
      {children}
    </td>
  );
}

function DraggableSlot({ slot, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `slot-${slot.id}`,
    data: { type: 'slot', scheduleId: slot.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`text-xs p-1 rounded cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'bg-brand/10 border border-brand/30'
      }`}
      onClick={(e) => { e.stopPropagation(); onEdit(slot); }}
    >
      <div className="font-semibold text-brand">{slot.subject?.name}</div>
      <div className="text-slate-600">{slot.teacher?.full_name}</div>
      <div className="text-slate-400">{slot.room || '—'}</div>
    </div>
  );
}

function DraggablePaletteItem({ item }) {
  const id = `palette-${item.teacher_id}-${item.subject_id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      type: 'palette',
      teacher_id: item.teacher_id,
      subject_id: item.subject_id,
      subjectName: item.subject?.name,
      teacherName: item.teacher?.full_name,
    },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 mb-2 rounded border text-xs cursor-grab bg-white hover:border-brand ${
        isDragging ? 'opacity-50' : 'border-slate-200'
      }`}
    >
      <div className="font-medium">{item.subject?.name || `Môn #${item.subject_id}`}</div>
      <div className="text-slate-500">{item.teacher?.full_name}</div>
    </div>
  );
}

export default function ScheduleManager() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [session, setSession] = useState('morning');
  const [items, setItems] = useState([]);
  const [palette, setPalette] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDrag, setActiveDrag] = useState(null);
  const [editSlot, setEditSlot] = useState(null);
  const [roomEdit, setRoomEdit] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    listClasses({ school_year: CURRENT_SCHOOL_YEAR })
      .then((res) => {
        const list = res?.data || [];
        setClasses(list);
        if (list[0]) setClassId(String(list[0].id));
      })
      .catch((err) => toast.error(err?.message || 'Không tải lớp'));
  }, []);

  const load = useCallback(async () => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        listSchedules({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR }),
        listAssignments({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR }),
      ]);
      const payload = sRes?.data;
      setItems(payload?.items || payload || []);
      setPalette(aRes?.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải TKB');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const findSlots = (day, period) =>
    items.filter(
      (s) => s.day_of_week === day && s.period === period && (s.session || 'morning') === session,
    );

  const handleAutoArrange = async (clearExisting = false) => {
    if (!classId) return;
    if (clearExisting && !window.confirm('Xóa toàn bộ TKB lớp và xếp lại tự động?')) return;
    setAutoLoading(true);
    try {
      const res = await autoArrangeSchedules({
        class_id: Number(classId),
        school_year: CURRENT_SCHOOL_YEAR,
        clear_existing: clearExisting,
      });
      if (res?.success) {
        const { created, skipped } = res.data || {};
        toast.success(`Đã xếp ${created} tiết${skipped ? `, bỏ qua ${skipped} môn` : ''}`);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Tự động xếp lịch thất bại');
    } finally {
      setAutoLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over || !classId) return;

    const overData = over.data?.current;
    if (!overData?.day) return;

    const { day, period, session: targetSession } = overData;

    try {
      if (active.data.current?.type === 'slot') {
        const res = await moveSchedule(active.data.current.scheduleId, {
          day_of_week: day,
          period,
          session: targetSession,
          class_id: Number(classId),
        });
        if (res?.success) {
          toast.success('Đã di chuyển tiết');
          load();
        }
      } else if (active.data.current?.type === 'palette') {
        const res = await createSchedule({
          class_id: Number(classId),
          subject_id: active.data.current.subject_id,
          teacher_id: active.data.current.teacher_id,
          day_of_week: day,
          period,
          session: targetSession,
          school_year: CURRENT_SCHOOL_YEAR,
          room: `P${classes.find((c) => String(c.id) === classId)?.name || ''}`,
        });
        if (res?.success) {
          const warn = res.data?.warnings?.length;
          toast.success(warn ? 'Đã thêm (có cảnh báo trùng)' : 'Đã thêm tiết');
          load();
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Thao tác thất bại');
    }
  };

  const saveRoom = async () => {
    if (!editSlot) return;
    try {
      const res = await updateSchedule(editSlot.id, { room: roomEdit });
      if (res?.success) {
        toast.success('Đã lưu');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    }
  };

  const handleDelete = async () => {
    if (!editSlot || !window.confirm('Xóa tiết này?')) return;
    try {
      const res = await removeSchedule(editSlot.id);
      if (res?.success) {
        toast.success('Đã xóa');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const conflictCount = items.filter((i) => i.conflictTypes?.length > 0).length;

  return (
    <div>
      <PageHeader title="Phân bổ thời khóa biểu">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-40">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
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
        <Button
          type="button"
          variant="secondary"
          disabled={!classId || autoLoading}
          onClick={() => handleAutoArrange(false)}
        >
          {autoLoading ? 'Đang xếp…' : 'Tự động xếp lịch'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!classId || autoLoading}
          onClick={() => handleAutoArrange(true)}
        >
          Xếp lại từ đầu
        </Button>
      </PageHeader>

      <p className="mb-2 text-xs text-slate-500">
        Có thể kéo thêm môn vào ô đã có tiết (2 môn/ô). Ô đỏ = trùng lịch hoặc GV vượt {TEACHER_MAX_PERIODS_WEEK} tiết/tuần.
      </p>

      {conflictCount > 0 && (
        <p className="mb-3 text-sm text-red-600 font-medium">
          Có {conflictCount} tiết có cảnh báo (ô đỏ).
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveDrag(e.active.data.current)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <aside className="lg:w-52 shrink-0 bg-slate-50 border rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">Kéo môn + GV vào ô</h3>
              {!palette.length ? (
                <p className="text-xs text-slate-500">Chưa có phân công GV cho lớp.</p>
              ) : (
                palette.map((a) => <DraggablePaletteItem key={`${a.teacher_id}-${a.subject_id}`} item={a} />)
              )}
            </aside>

            <div className="flex-1 overflow-x-auto">
              {!items.length && !palette.length ? (
                <EmptyState message="Chọn lớp có phân công GV để xếp TKB." />
              ) : (
                <table className="w-full text-sm min-w-[900px] bg-white border rounded-lg">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 w-14">Tiết</th>
                      {SCHEDULE_DAYS.map((d) => (
                        <th key={d} className="px-2 py-2 text-center">{DAY_OF_WEEK[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEDULE_PERIODS.map((p) => (
                      <tr key={p} className="border-t">
                        <td className="px-2 py-2 font-medium">T{p}</td>
                        {SCHEDULE_DAYS.map((d) => {
                          const cellSlots = findSlots(d, p);
                          return (
                            <DroppableCell key={d} day={d} period={p} session={session} slots={cellSlots}>
                              <div className="flex flex-col gap-1 min-h-[40px]">
                                {cellSlots.map((slot) => (
                                  <DraggableSlot
                                    key={slot.id}
                                    slot={slot}
                                    onEdit={(s) => { setEditSlot(s); setRoomEdit(s.room || ''); }}
                                  />
                                ))}
                                <span className="text-slate-300 text-xs py-1">+</span>
                              </div>
                            </DroppableCell>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeDrag?.type === 'palette' && (
              <div className="p-2 bg-white border-2 border-brand rounded shadow-lg text-xs">
                {activeDrag.subjectName} — {activeDrag.teacherName}
              </div>
            )}
            {activeDrag?.type === 'slot' && (
              <div className="p-2 bg-brand/20 border rounded text-xs">Di chuyển tiết…</div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={!!editSlot} title="Sửa tiết" onClose={() => setEditSlot(null)}>
        {editSlot && (
          <div className="space-y-4">
            <p className="text-sm">
              {editSlot.subject?.name} — {editSlot.teacher?.full_name}
              <br />
              {SESSION_LABEL[editSlot.session || 'morning']}, {DAY_OF_WEEK[editSlot.day_of_week]}, tiết {editSlot.period}
            </p>
            <Input label="Phòng" value={roomEdit} onChange={(e) => setRoomEdit(e.target.value)} />
            <div className="flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={handleDelete}>Xóa tiết</Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditSlot(null)}>Hủy</Button>
                <Button type="button" onClick={saveRoom}>Lưu</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
