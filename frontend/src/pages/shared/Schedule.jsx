/**
 * Schedule — Trang Thời khóa biểu mới (Flat-Premium).
 * Tự động chuyển view theo role: Student / Teacher / Parent / Admin.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useStudentContext from '../../hooks/useStudentContext';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Toggle from '../../components/ui/Toggle';
import { SkeletonTable } from '../../components/ui/Skeleton';
import ScheduleGrid from '../../components/schedule/ScheduleGrid';
import ScheduleWeekNav from '../../components/schedule/ScheduleWeekNav';
import MobileTimeline from '../../components/schedule/MobileTimeline';
import ScheduleSlotCard, { getPeriodTime } from '../../components/schedule/ScheduleSlotCard';
import PerspectiveSelector from '../../components/schedule/PerspectiveSelector';
import {
  listSchedules, listSchedulesMine, listSchedulesMyClass,
} from '../../api/schedule.api';
import { getTimetableConfig } from '../../api/timetable-config.api';
import { listClasses } from '../../api/class.api';
import { getMyICalLink } from '../../api/ical.api';
import { CalendarPlus, Copy, CheckCircle, Clock, MapPin, User, Users, Video, AlertTriangle, BookOpen, Coffee, DoorOpen } from 'lucide-react';
import { DAY_OF_WEEK } from '../../utils/labels';
import { gridFromTimetableConfig, defaultTimetableConfig } from '../../utils/timetableGrid';

// Helper: lấy period hiện tại
const getCurrentPeriod = () => {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const period = Math.floor((totalMin - 420) / 45) + 1; // 420 = 7:00 AM
  return period >= 1 && period <= 10 ? period : null;
};

export default function Schedule() {
  const { user } = useAuth();
  const { schoolYear, semester } = useSchoolYear();
  const { selectedStudent, loading: ctxLoading } = useStudentContext();
  const { homeroomClass, teachingClasses, loading: tcLoading } = useTeacherClasses();

  const [slots, setSlots] = useState([]);
  const [timetableConfig, setTimetableConfig] = useState(defaultTimetableConfig());
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState('morning');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [weekStart, setWeekStart] = useState(null);
  const [perspective, setPerspective] = useState('class');
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminClassId, setAdminClassId] = useState('');
  const [icalModal, setIcalModal] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');
  const [icalCopied, setIcalCopied] = useState(false);
  const [detailSlot, setDetailSlot] = useState(null);

  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isTeacher = user?.role === 'subject';
  const isAdmin = user?.role === 'admin';
  const isFamily = isStudent || isParent;

  // Load timetable config
  useEffect(() => {
    getTimetableConfig({ school_year: schoolYear })
      .then((res) => {
        const cfg = res?.data || defaultTimetableConfig();
        setTimetableConfig(cfg);
        if (!cfg.sessions?.includes(session)) setSession(cfg.sessions?.[0] || 'morning');
      })
      .catch(() => {});
  }, [schoolYear]);

  // Load admin classes
  useEffect(() => {
    if (isAdmin) {
      listClasses({ school_year: schoolYear })
        .then((res) => {
          const list = res?.data || [];
          setAdminClasses(list);
          if (!adminClassId && list[0]) setAdminClassId(String(list[0].id));
        })
        .catch(() => {});
    }
  }, [isAdmin, schoolYear]);

  // Set default class for teacher
  useEffect(() => {
    if (isTeacher && !tcLoading) {
      const defaultId = homeroomClass?.id || teachingClasses[0]?.id;
      if (defaultId && !adminClassId) setAdminClassId(String(defaultId));
    }
  }, [isTeacher, tcLoading, homeroomClass, teachingClasses]);

  // Set class for family
  useEffect(() => {
    if (isFamily && selectedStudent?.class_id) {
      setAdminClassId(String(selectedStudent.class_id));
    }
  }, [isFamily, selectedStudent]);

  // Calculate week start
  useEffect(() => {
    const d = new Date(selectedDate);
    const day = d.getDay() || 7;
    const start = new Date(d);
    start.setDate(d.getDate() - day + 1);
    setWeekStart(start.toISOString().slice(0, 10));
  }, [selectedDate]);

  // Load schedules
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { school_year: schoolYear, semester };
      let res;

      if (isAdmin && adminClassId) {
        res = await listSchedules({ ...params, class_id: adminClassId });
      } else if (isTeacher) {
        res = await listSchedulesMyClass({ ...params, class_id: adminClassId || homeroomClass?.id });
      } else {
        res = await listSchedulesMyClass({ ...params, class_id: selectedStudent?.class_id || adminClassId });
      }

      if (res?.success) {
        const data = res.data;
        setSlots(data?.items || data || []);
      }
    } catch (err) {
      console.error('Schedule load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isTeacher, adminClassId, homeroomClass, selectedStudent, schoolYear, semester]);

  useEffect(() => { load(); }, [load]);

  // Filter slots for selected day (mobile timeline)
  const currentPeriod = getCurrentPeriod();
  const selectedDay = new Date(selectedDate).getDay() || 7;
  const todaySlots = slots
    .filter((s) => s.day_of_week === selectedDay)
    .sort((a, b) => a.period - b.period);

  // iCal handler
  const handleICal = async () => {
    try {
      const res = await getMyICalLink();
      if (res?.success) { setIcalUrl(res.data.url); setIcalModal(true); }
    } catch { toast.error('Lỗi lấy link calendar'); }
  };

  const handleCopyICal = () => {
    navigator.clipboard.writeText(icalUrl);
    setIcalCopied(true);
    toast.success('Đã sao chép');
    setTimeout(() => setIcalCopied(false), 2000);
  };

  if (ctxLoading || tcLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={isStudent ? 'Lịch học của tôi' : isParent ? `Lịch học — ${selectedStudent?.user?.full_name || 'con'}` : isTeacher ? 'Lịch dạy' : 'Thời khóa biểu'}
        description={`${schoolYear} · HK${semester}`}
      >
        {isAdmin && <PerspectiveSelector value={perspective} onChange={setPerspective} />}
        {isAdmin && (
          <Select value={adminClassId} onChange={(e) => setAdminClassId(e.target.value)} className="w-32">
            {adminClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <Select value={session} onChange={(e) => setSession(e.target.value)} className="w-28">
          {timetableConfig.sessions?.map((s) => (
            <option key={s} value={s}>{s === 'morning' ? '☀️ Sáng' : '🌙 Chiều'}</option>
          ))}
        </Select>
        <Button variant="outline" size="sm" onClick={handleICal}>
          <CalendarPlus size={14} /> <span className="hidden sm:inline">Thêm vào Calendar</span>
        </Button>
      </PageHeader>

      {/* Week Navigation */}
      <ScheduleWeekNav
        weekStart={weekStart}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onPrev={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 7);
          setSelectedDate(d.toISOString().slice(0, 10));
        }}
        onNext={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 7);
          setSelectedDate(d.toISOString().slice(0, 10));
        }}
        teachingDays={timetableConfig.teaching_days || [1, 2, 3, 4, 5]}
      />

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : isFamily ? (
        /* === FAMILY VIEW: Mobile Timeline + Desktop Grid === */
        <>
          <div className="md:hidden">
            <MobileTimeline slots={todaySlots} />
          </div>
          <div className="hidden md:block">
            <ScheduleGrid
              slots={slots}
              timetableConfig={timetableConfig}
              session={session}
              selectedDay={selectedDay}
              onSlotClick={setDetailSlot}
              readOnly
            />
          </div>
        </>
      ) : isTeacher ? (
        /* === TEACHER VIEW: Grid + own slots highlight === */
        <ScheduleGrid
          slots={slots}
          timetableConfig={timetableConfig}
          session={session}
          selectedDay={selectedDay}
          onSlotClick={setDetailSlot}
        />
      ) : (
        /* === ADMIN VIEW: Grid + multi-perspective === */
        <ScheduleGrid
          slots={slots}
          timetableConfig={timetableConfig}
          session={session}
          selectedDay={selectedDay}
          onSlotClick={setDetailSlot}
        />
      )}

      {/* Slot Detail Modal */}
      {detailSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailSlot(null)}>
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" />
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-100 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <ScheduleSlotCard slot={detailSlot} isNow={false} isPast={false} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDetailSlot(null)} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iCal Integration Card */}
      {icalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIcalModal(false)}>
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" />
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-100 p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <CalendarPlus size={20} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-800">Đồng bộ lịch trình cá nhân</h3>
                <p className="text-xs text-zinc-400">Kết nối EduSmart với ứng dụng lịch của bạn</p>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-3 mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-zinc-500 truncate select-all">{icalUrl}</code>
                <button
                  onClick={handleCopyICal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    icalCopied
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {icalCopied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {icalCopied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {['Google Calendar', 'Apple Calendar', 'Outlook'].map((cal) => (
                <span key={cal} className="text-[10px] bg-zinc-50 text-zinc-500 px-2 py-1 rounded-lg border border-zinc-100">
                  {cal}
                </span>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setIcalModal(false)} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
