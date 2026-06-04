/** Admin — Phân bổ TKB kéo-thả theo lớp. */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  patchScheduleLesson,
  removeSchedule,
  autoArrangeClassSchedule,
  resolveScheduleConflicts,
  getScheduleValidation,
  getSchoolScheduleValidation,
} from '../../api/schedule.api';
import { getTimetableConfig, updateTimetableConfig } from '../../api/timetable-config.api';
import {
  CURRENT_SCHOOL_YEAR,
  DAY_OF_WEEK,
  SESSION_LABEL,
  TEACHER_MAX_PERIODS_WEEK,
  MAX_PERIODS_PER_SESSION,
  CONFLICT_LABEL,
} from '../../utils/labels';
import { gridFromTimetableConfig, defaultTimetableConfig } from '../../utils/timetableGrid';

const ALL_WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7];

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

function RemoveSlotDropZone({ isDraggingSlot }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'drop-remove', data: { type: 'remove' } });
  return (
    <div
      ref={setNodeRef}
      className={`mt-3 p-3 rounded-lg border-2 border-dashed text-center text-xs transition-colors ${
        isOver || isDraggingSlot
          ? 'border-red-500 bg-red-50 text-red-800'
          : 'border-slate-300 text-slate-500 bg-white'
      }`}
    >
      <span className="font-medium block">Xóa tiết</span>
      Kéo tiết vào đây hoặc thả ra ngoài lưới
    </div>
  );
}

function DraggableSlot({ slot, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `slot-${slot.id}`,
    data: { type: 'slot', scheduleId: slot.id },
  });
  return (
    <div
      ref={setNodeRef}
      className={`text-xs p-1 rounded relative group ${
        isDragging ? 'opacity-40' : 'bg-brand/10 border border-brand/30'
      }`}
    >
      <button
        type="button"
        title="Xóa tiết"
        className="absolute top-0 right-0 w-5 h-5 leading-none text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(slot);
        }}
      >
        ×
      </button>
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing pr-4"
        onClick={(e) => { e.stopPropagation(); onEdit(slot); }}
      >
        <div className="font-semibold text-brand">{slot.subject?.name}</div>
        <div className="text-slate-600">{slot.teacher?.full_name}</div>
        <div className="text-slate-400">{slot.room || '—'}</div>
        {slot.conflictTypes?.map((t) => (
          <div key={t} className="text-red-600 font-medium mt-0.5">{CONFLICT_LABEL[t] || t}</div>
        ))}
      </div>
    </div>
  );
}

function DraggablePaletteItem({ item }) {
  const id = `palette-${item.teacher_id}-${item.subject_id}`;
  const placed = item.placed ?? 0;
  const required = item.required ?? item.periods_per_week ?? 2;
  const missing = item.missing ?? Math.max(0, required - placed);
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
      <div className="text-slate-400">
        {placed}/{required} tiết đã xếp
        {missing > 0 && <span className="text-amber-700"> · thiếu {missing}</span>}
      </div>
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
  const [lessonForm, setLessonForm] = useState({
    lesson_topic: '',
    homework_reminder: '',
    delivery_mode: 'offline',
    online_meeting_url: '',
  });
  const [autoLoading, setAutoLoading] = useState(false);
  const [arrangeResult, setArrangeResult] = useState(null);
  const [timetableConfig, setTimetableConfig] = useState(defaultTimetableConfig());
  const [configForm, setConfigForm] = useState(defaultTimetableConfig());
  const [configSaving, setConfigSaving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [schoolValidation, setSchoolValidation] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selectedClass = classes.find((c) => String(c.id) === classId);
  const grid = gridFromTimetableConfig(timetableConfig, session);
  const sessionOptions = timetableConfig.sessions || ['morning'];

  const loadConfig = useCallback(async () => {
    try {
      const res = await getTimetableConfig({ school_year: CURRENT_SCHOOL_YEAR });
      const cfg = res?.data || defaultTimetableConfig();
      setTimetableConfig(cfg);
      setConfigForm(cfg);
      if (!cfg.sessions?.includes(session)) {
        setSession(cfg.sessions?.[0] || 'morning');
      }
    } catch (err) {
      toast.error(err?.message || 'Không tải khung giờ');
    }
  }, [session]);

  const loadSchoolValidation = useCallback(async () => {
    try {
      const res = await getSchoolScheduleValidation({ school_year: CURRENT_SCHOOL_YEAR });
      setSchoolValidation(res?.data || null);
    } catch {
      setSchoolValidation(null);
    }
  }, []);

  const loadValidation = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await getScheduleValidation({
        school_year: CURRENT_SCHOOL_YEAR,
        class_id: classId,
      });
      setValidation(res?.data || null);
    } catch {
      setValidation(null);
    }
  }, [classId]);

  useEffect(() => {
    listClasses({ school_year: CURRENT_SCHOOL_YEAR })
      .then((res) => {
        const list = res?.data || [];
        setClasses(list);
        setClassId((prev) => {
          if (prev && list.some((c) => String(c.id) === prev)) return prev;
          return list[0] ? String(list[0].id) : '';
        });
      })
      .catch((err) => toast.error(err?.message || 'Không tải lớp'));
    loadSchoolValidation();
  }, [loadSchoolValidation]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const load = useCallback(async () => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        listSchedules({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR }),
        listAssignments({ class_id: classId, school_year: CURRENT_SCHOOL_YEAR }),
      ]);
      const payload = sRes?.data;
      const nextItems = Array.isArray(payload)
        ? payload
        : (payload?.items ?? payload?.slots ?? []);
      const assignPayload = aRes?.data;
      const nextPalette = Array.isArray(assignPayload) ? assignPayload : (assignPayload?.items ?? []);
      setItems(nextItems);
      setPalette(nextPalette);
    } catch (err) {
      toast.error(err?.message || 'Không tải TKB');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); loadValidation(); }, [load, loadValidation]);

  const findSlots = (day, period) =>
    items.filter(
      (s) => s.day_of_week === day && s.period === period && (s.session || 'morning') === session,
    );

  const saveTimetableConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await updateTimetableConfig({
        school_year: CURRENT_SCHOOL_YEAR,
        days_of_week: configForm.days_of_week,
        morning_periods: Number(configForm.morning_periods),
        afternoon_periods: Number(configForm.afternoon_periods),
        afternoon_enabled: configForm.afternoon_enabled,
        period_duration_minutes: Number(configForm.period_duration_minutes) || 45,
      });
      if (res?.success) {
        setTimetableConfig(res.data);
        setConfigForm(res.data);
        toast.success('Đã lưu khung giờ');
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu khung giờ thất bại');
    } finally {
      setConfigSaving(false);
    }
  };

  const toggleConfigDay = (day) => {
    const set = new Set(configForm.days_of_week || []);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    const next = [...set].sort((a, b) => a - b);
    setConfigForm({ ...configForm, days_of_week: next.length ? next : [day] });
  };

  const handleResolveConflicts = async () => {
    setAutoLoading(true);
    try {
      const res = await resolveScheduleConflicts({
        school_year: CURRENT_SCHOOL_YEAR,
        class_id: classId ? Number(classId) : undefined,
      });
      if (res?.success) {
        toast.success(`Đã dời ${res.data?.moved ?? 0} tiết trùng`);
        load();
        loadValidation();
        loadSchoolValidation();
      }
    } catch (err) {
      toast.error(err?.message || 'Giải trùng thất bại');
    } finally {
      setAutoLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!classId) return;

    if (active.data.current?.type === 'slot') {
      if (!over || over.id === 'drop-remove') {
        await deleteSlot(active.data.current.scheduleId, true);
        return;
      }
    }

    if (!over) return;

    const overData = over.data?.current;
    if (over.id === 'drop-remove') {
      if (active.data.current?.type === 'slot') {
        await deleteSlot(active.data.current.scheduleId, true);
      }
      return;
    }
    if (!overData?.day) return;

    const { day, period, session: targetSession } = overData;

    try {
      if (active.data.current?.type === 'slot') {
        const scheduleId = active.data.current.scheduleId;
        const targetOccupied = items.some(
          (s) => s.id !== scheduleId
            && s.day_of_week === day
            && s.period === period
            && (s.session || 'morning') === targetSession,
        );
        if (targetOccupied) {
          toast.error('Ô đích đã có tiết khác');
          return;
        }
        const res = await moveSchedule(scheduleId, {
          day_of_week: day,
          period,
          session: targetSession,
          class_id: Number(classId),
        });
        if (res?.success) {
          toast.success('Đã di chuyển tiết');
          setItems((prev) => prev.map((s) => (
            s.id === scheduleId
              ? { ...s, day_of_week: day, period, session: targetSession }
              : s
          )));
          loadValidation();
          loadSchoolValidation();
        }
      } else if (active.data.current?.type === 'palette') {
        if (findSlots(day, period).length > 0) {
          toast.error('Ô này đã có tiết — mỗi ô chỉ một môn');
          return;
        }
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

  const openEditSlot = (s) => {
    setEditSlot(s);
    setRoomEdit(s.room || '');
    setLessonForm({
      lesson_topic: s.lesson_topic || '',
      homework_reminder: s.homework_reminder || '',
      delivery_mode: s.delivery_mode || 'offline',
      online_meeting_url: s.online_meeting_url || '',
    });
  };

  const saveRoom = async () => {
    if (!editSlot) return;
    try {
      const res = await updateSchedule(editSlot.id, { room: roomEdit });
      if (res?.success) {
        toast.success('Đã lưu phòng');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    }
  };

  const saveLesson = async () => {
    if (!editSlot) return;
    try {
      const res = await patchScheduleLesson(editSlot.id, lessonForm);
      if (res?.success) {
        toast.success('Đã lưu nội dung tiết');
        setEditSlot(null);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu nội dung thất bại');
    }
  };

  const handleDelete = async () => {
    if (!editSlot) return;
    await deleteSlot(editSlot.id, true);
  };

  const conflictCount = items.filter((i) => i.conflictTypes?.length > 0).length;

  const paletteEnriched = useMemo(() => {
    const rows = validation?.assignments || [];
    return palette.map((a) => {
      const row = rows.find(
        (r) => r.subject_id === a.subject_id && r.teacher_id === a.teacher_id,
      );
      const required = row?.required ?? a.periods_per_week ?? 2;
      const placed = row?.placed ?? 0;
      return {
        ...a,
        required,
        placed,
        missing: row?.missing ?? Math.max(0, required - placed),
      };
    });
  }, [palette, validation?.assignments]);

  const deleteSlot = async (scheduleId, askConfirm = true) => {
    if (askConfirm && !window.confirm('Xóa tiết này khỏi TKB?')) return;
    const prevItems = items;
    setItems((prev) => prev.filter((s) => s.id !== scheduleId));
    if (editSlot?.id === scheduleId) setEditSlot(null);
    try {
      const res = await removeSchedule(scheduleId);
      if (res?.success) {
        toast.success('Đã xóa tiết');
        loadValidation();
        loadSchoolValidation();
      } else {
        setItems(prevItems);
      }
    } catch (err) {
      setItems(prevItems);
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const handleAutoArrange = async () => {
    if (!classId) return;

    const msg = [
      `Tự động phân bổ TKB lớp ${selectedClass?.name || ''}:`,
      '• Đồng bộ số tiết/tuần trên phân công GV theo khung CT khối',
      '• Xóa toàn bộ tiết hiện tại của lớp',
      '• Sinh lại đủ tiết — chỉ hoàn tất khi đạt ràng buộc cứng (không trùng GV/lớp/phòng)',
    ].join('\n');
    if (!window.confirm(msg)) return;

    setAutoLoading(true);
    try {
      const res = await autoArrangeClassSchedule({
        class_id: Number(classId),
        school_year: CURRENT_SCHOOL_YEAR,
      });
      if (res?.success) {
        const data = res.data || {};
        toast.success(data.hard_ok ? 'Đã xếp lịch — đạt ràng buộc cứng' : 'Đã xếp lịch');
        setArrangeResult({ title: `Tự động xếp — ${selectedClass?.name}`, ...data });
        setItems(data.items || []);
      }
      load();
      loadValidation();
      loadSchoolValidation();
    } catch (err) {
      toast.error(err?.message || 'Tự động xếp thất bại');
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Phân bổ thời khóa biểu">
        <Select
          value={classId}
          onChange={(e) => {
            const next = String(e.target.value);
            setEditSlot(null);
            setItems([]);
            setValidation(null);
            setClassId(next);
          }}
          className="w-40"
          aria-label="Chọn lớp"
        >
          {classes.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-1">
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
        <Button
          type="button"
          disabled={!classId || autoLoading}
          onClick={handleAutoArrange}
          title="Đồng bộ phân công theo khung CT, xóa và sinh lại TKB lớp (ràng buộc cứng)"
        >
          {autoLoading ? 'Đang xử lý…' : 'Tự động xếp lịch'}
        </Button>
      </PageHeader>

      <section className="mb-4 p-4 bg-slate-50 border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Khung giờ — {CURRENT_SCHOOL_YEAR}</h3>
        <div className="flex flex-wrap gap-3 items-end text-sm">
          <div>
            <span className="block text-xs text-slate-500 mb-1">Ngày dạy</span>
            <div className="flex flex-wrap gap-2">
              {ALL_WEEK_DAYS.map((d) => (
                <label key={d} className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={(configForm.days_of_week || []).includes(d)}
                    onChange={() => toggleConfigDay(d)}
                  />
                  {DAY_OF_WEEK[d]}
                </label>
              ))}
            </div>
          </div>
          <Input
            label="Tiết ca sáng"
            type="number"
            min={1}
            max={MAX_PERIODS_PER_SESSION}
            className="w-24"
            value={configForm.morning_periods ?? 5}
            onChange={(e) => setConfigForm({ ...configForm, morning_periods: e.target.value })}
          />
          <Input
            label="Tiết ca chiều"
            type="number"
            min={1}
            max={MAX_PERIODS_PER_SESSION}
            className="w-24"
            value={configForm.afternoon_periods ?? 5}
            onChange={(e) => setConfigForm({ ...configForm, afternoon_periods: e.target.value })}
            disabled={!configForm.afternoon_enabled}
          />
          <label className="inline-flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={configForm.afternoon_enabled !== false}
              onChange={(e) => setConfigForm({ ...configForm, afternoon_enabled: e.target.checked })}
            />
            Có ca chiều
          </label>
          <Input
            label="Thời lượng 1 tiết (phút)"
            type="number"
            min={30}
            max={60}
            className="w-28"
            value={configForm.period_duration_minutes ?? 45}
            onChange={(e) => setConfigForm({ ...configForm, period_duration_minutes: e.target.value })}
            title="GDPT 2018: mỗi tiết 45 phút"
          />
          <Button type="button" variant="secondary" disabled={configSaving} onClick={saveTimetableConfig}>
            {configSaving ? 'Đang lưu…' : 'Lưu khung giờ'}
          </Button>
        </div>
      </section>

      {selectedClass && (
        <p className="mb-1 text-sm font-medium text-slate-700">
          TKB lớp {selectedClass.name} — năm học {CURRENT_SCHOOL_YEAR}
        </p>
      )}

      <p className="mb-2 text-xs text-slate-500">
        **Tự động xếp lịch** tự đồng bộ phân công theo khung CT, xóa và sinh lại TKB lớp.
        Ràng buộc GDPT: tối đa <strong>7 tiết/ngày/lớp</strong>, tiết học <strong>45 phút</strong>.
      </p>

      {schoolValidation && (
        <div className={`mb-3 p-3 border rounded-lg text-sm space-y-2 ${
          schoolValidation.hard_ok ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-300'
        }`}
        >
          <div className="font-semibold">
            Kiểm tra toàn trường:
            {schoolValidation.hard_ok
              ? <span className="text-green-800"> Đạt (TKB + khung CT)</span>
              : <span className="text-amber-900"> Chưa đạt</span>}
          </div>
          {schoolValidation.schedule_hard_ok === false && (
            <div>
              <p className="font-medium text-red-800 mb-1">Trùng lịch TKB (GV / lớp / phòng)</p>
              <ul className="list-disc pl-5 text-red-800 max-h-24 overflow-y-auto">
                {(schoolValidation.schedule_violations || []).slice(0, 8).map((v, i) => (
                  <li key={`s-${i}`}>{v.message || CONFLICT_LABEL[v.type]}</li>
                ))}
              </ul>
            </div>
          )}
          {schoolValidation.curriculum_ok === false && (
            <div>
              <p className="font-medium text-amber-900 mb-1">
                Lệch khung CT khối / phân công GV
                {' '}
                ({schoolValidation.curriculum_issues?.length || 0}
                {' '}
                môn) — bấm <strong>Tự động xếp lịch</strong> để đồng bộ và xếp lại, hoặc sửa Phân công GV / Khung CT khối.
              </p>
              <ul className="list-disc pl-5 text-amber-950 max-h-24 overflow-y-auto">
                {(schoolValidation.curriculum_issues || []).slice(0, 8).map((v, i) => (
                  <li key={`c-${i}`}>{v.message}</li>
                ))}
                {(schoolValidation.curriculum_issues?.length || 0) > 8 && (
                  <li>… và {(schoolValidation.curriculum_issues.length - 8)} môn khác</li>
                )}
              </ul>
            </div>
          )}
          {schoolValidation.total_missing > 0 && (
            <p className="text-xs text-slate-700">
              Theo khung CT: còn thiếu <strong>{schoolValidation.total_missing}</strong> tiết chưa xếp trên toàn trường.
            </p>
          )}
          <button type="button" className="text-xs text-brand underline" onClick={loadSchoolValidation}>
            Làm mới kiểm tra
          </button>
        </div>
      )}

      {validation && (
        <div className="mb-3 p-3 border rounded-lg bg-white text-sm flex flex-wrap gap-4 items-center">
          <span>
            Tiết cần (khung CT): <strong>{validation.total_required}</strong>
            {' · '}
            Đã xếp trên lưới: <strong>{validation.total_placed}</strong>
            {validation.total_missing > 0 && (
              <span className="text-amber-700"> · Thiếu: {validation.total_missing}</span>
            )}
            {validation.curriculum_issue_count > 0 && (
              <span className="text-amber-800">
                {' · '}
                {validation.curriculum_issue_count}
                {' '}
                phân công lệch khung CT
              </span>
            )}
          </span>
          <span className={validation.conflict_count > 0 ? 'text-red-600 font-medium' : 'text-green-700'}>
            {validation.conflict_count > 0
              ? `${validation.conflict_count} tiết trùng/cảnh báo`
              : 'Không trùng lịch'}
          </span>
          {validation.conflict_count > 0 && (
            <Button type="button" variant="secondary" disabled={autoLoading} onClick={handleResolveConflicts}>
              Giải trùng
            </Button>
          )}
          {!validation.can_generate && (
            <span className="text-red-600 text-xs">Tổng tiết vượt quá {validation.grid_slots} ô lưới</span>
          )}
          {validation.gdpt_weekly_warning && (
            <span className="text-amber-800 text-xs block max-w-md">
              {validation.gdpt_weekly_warning.message
                || (Array.isArray(validation.gdpt_weekly_warning)
                  ? validation.gdpt_weekly_warning.map((w) => w.message).join('; ')
                  : null)}
            </span>
          )}
          {validation.weekly_approximation_subjects?.length > 0 && (
            <span className="text-amber-700 text-xs">
              {validation.weekly_approximation_subjects.length}
              {' '}
              môn xếp tuần làm tròn (vd. Sử ~1,5 tiết/tuần) — Phase 2: tuần chẵn/lẻ.
            </span>
          )}
        </div>
      )}

      {conflictCount > 0 && !validation && (
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
              <h3 className="text-sm font-semibold mb-1">Kéo môn + GV vào ô</h3>
              <p className="text-[10px] text-slate-500 mb-2">
                Kéo tiết ra vùng đỏ hoặc nhấn × trên tiết để gỡ khỏi TKB.
              </p>
              {!paletteEnriched.length ? (
                <p className="text-xs text-slate-500">Chưa có phân công GV cho lớp.</p>
              ) : (
                paletteEnriched.map((a) => (
                  <DraggablePaletteItem key={`${a.teacher_id}-${a.subject_id}`} item={a} />
                ))
              )}
              <RemoveSlotDropZone isDraggingSlot={activeDrag?.type === 'slot'} />
            </aside>

            <div className="flex-1 overflow-x-auto">
              {!items.length && !palette.length ? (
                <EmptyState message="Chọn lớp có phân công GV để xếp TKB." />
              ) : (
                <table className="w-full text-sm min-w-[900px] bg-white border rounded-lg">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-2 w-14">Tiết</th>
                      {grid.days.map((d) => (
                        <th key={d} className="px-2 py-2 text-center">{DAY_OF_WEEK[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.periods.map((p) => (
                      <tr key={p} className="border-t">
                        <td className="px-2 py-2 font-medium">T{p}</td>
                        {grid.days.map((d) => {
                          const cellSlots = findSlots(d, p);
                          return (
                            <DroppableCell key={d} day={d} period={p} session={session} slots={cellSlots}>
                              <div className="flex flex-col gap-1 min-h-[40px]">
                                {cellSlots.map((slot) => (
                                  <DraggableSlot
                                    key={slot.id}
                                    slot={slot}
                                    onEdit={openEditSlot}
                                    onRemove={(s) => deleteSlot(s.id, true)}
                                  />
                                ))}
                                {!cellSlots.length && (
                                  <span className="text-slate-300 text-xs py-1">Kéo môn vào đây</span>
                                )}
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

      <Modal open={!!arrangeResult} title={arrangeResult?.title || 'Kết quả xếp lịch'} onClose={() => setArrangeResult(null)}>
        {arrangeResult && (
          <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            {arrangeResult.by_class ? (
              <>
                <p>
                  {arrangeResult.mode === 'generate' ? 'Đã sinh' : 'Đã xử lý'}{' '}
                  <strong>{arrangeResult.total_created ?? arrangeResult.total_moved ?? 0}</strong> tiết (theo lớp).
                </p>
                <table className="w-full text-xs border">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Lớp</th>
                      <th className="px-2 py-1 text-right">Tiết</th>
                      <th className="px-2 py-1 text-right">Thiếu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(arrangeResult.by_class || []).map((row) => (
                      <tr key={row.class_id || row.class_name} className="border-t">
                        <td className="px-2 py-1">{row.class_name}</td>
                        <td className="px-2 py-1 text-right">{row.created ?? row.moved ?? 0}</td>
                        <td className="px-2 py-1 text-right text-amber-700">
                          {row.missing_periods ?? row.skipped ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p>
                {arrangeResult.mode === 'generate' ? (
                  <>Đã sinh <strong>{arrangeResult.created ?? 0}</strong> tiết</>
                ) : (
                  <>Đã xếp lại / dời <strong>{arrangeResult.moved ?? 0}</strong> tiết</>
                )}
                {arrangeResult.missing_periods || arrangeResult.skipped ? (
                  <>, chưa đủ <strong>{arrangeResult.missing_periods ?? arrangeResult.skipped}</strong> tiết</>
                ) : null}
                .
              </p>
            )}
            {(arrangeResult.failures?.length > 0
              || arrangeResult.by_class?.some((c) => c.failures?.length)) && (
              <div className="text-amber-800 text-xs">
                Một số phân công không đủ ô trống — giảm số tiết/tuần hoặc xếp lại toàn trường.
              </div>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => setArrangeResult(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editSlot} title="Sửa tiết" onClose={() => setEditSlot(null)}>
        {editSlot && (
          <div className="space-y-4">
            <p className="text-sm">
              {editSlot.subject?.name} — {editSlot.teacher?.full_name}
              <br />
              {SESSION_LABEL[editSlot.session || 'morning']}, {DAY_OF_WEEK[editSlot.day_of_week]}, tiết {editSlot.period}
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
            <div className="flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={handleDelete}>Xóa tiết</Button>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setEditSlot(null)}>Hủy</Button>
                <Button type="button" variant="secondary" onClick={saveLesson}>Lưu nội dung</Button>
                <Button type="button" onClick={saveRoom}>Lưu phòng</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
