/** S06 — Phân công giáo viên bộ môn. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import {
  listAssignments,
  createAssignment,
  removeAssignment,
  listTeacherUnavailability,
  createTeacherUnavailability,
  removeTeacherUnavailability,
} from '../../api/assignment.api';
import { listUsers } from '../../api/user.api';
import { listClasses } from '../../api/class.api';
import { listSubjects } from '../../api/subject.api';
import { lookupCurriculum } from '../../api/curriculum.api';
import { CURRENT_SCHOOL_YEAR, DAY_OF_WEEK } from '../../utils/labels';
import { semesterLabel } from '../../utils/format';

const emptyForm = {
  teacher_id: '',
  class_id: '',
  subject_id: '',
  school_year: CURRENT_SCHOOL_YEAR,
  periods_per_week: '2',
  semester: '0',
};

export default function Assignments() {
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [curriculumHint, setCurriculumHint] = useState(null);
  const [unavail, setUnavail] = useState([]);
  const [unavailForm, setUnavailForm] = useState({
    teacher_id: '', day_of_week: '2', session: '', period: '', reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, uRes, cRes, sRes, unRes] = await Promise.all([
        listAssignments({ school_year: CURRENT_SCHOOL_YEAR }),
        listUsers(),
        listClasses({ school_year: CURRENT_SCHOOL_YEAR }),
        listSubjects(),
        listTeacherUnavailability({ school_year: CURRENT_SCHOOL_YEAR }),
      ]);
      if (aRes?.success) setItems(aRes.data || []);
      if (unRes?.success) setUnavail(unRes.data || []);
      if (uRes?.success) {
        setTeachers((uRes.data || []).filter((u) => u.role === 'subject'));
      }
      if (cRes?.success) setClasses(cRes.data || []);
      if (sRes?.success) setSubjects(sRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được phân công');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const cls = classes.find((c) => String(c.id) === String(form.class_id));
    if (!cls?.grade_level || !form.subject_id) {
      setCurriculumHint(null);
      return;
    }
    lookupCurriculum({
      school_year: CURRENT_SCHOOL_YEAR,
      grade_level: cls.grade_level,
    })
      .then((res) => {
        const sem = Number(form.semester) || 0;
        const row = (res?.data || []).find((r) => {
          if (String(r.subject_id) !== String(form.subject_id)) return false;
          if (sem === 0) return r.semester === 0 || r.semester == null;
          return r.semester === sem || r.semester === 0;
        });
        if (row) {
          setCurriculumHint(row.periods_per_week);
          setForm((f) => ({ ...f, periods_per_week: String(row.periods_per_week) }));
        } else setCurriculumHint(null);
      })
      .catch(() => setCurriculumHint(null));
  }, [form.class_id, form.subject_id, form.semester, classes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teacher_id || !form.class_id || !form.subject_id) {
      return toast.error('Chọn đủ GV, lớp và môn');
    }
    setSaving(true);
    try {
      const res = await createAssignment({
        teacher_id: Number(form.teacher_id),
        class_id: Number(form.class_id),
        subject_id: Number(form.subject_id),
        school_year: form.school_year,
        periods_per_week: Number(form.periods_per_week),
        semester: Number(form.semester),
      });
      if (res?.success) {
        toast.success('Phân công thành công');
        setModalOpen(false);
        setForm(emptyForm);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Phân công thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Hủy phân công này?')) return;
    try {
      const res = await removeAssignment(row.id);
      if (res?.success) { toast.success('Đã hủy'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Hủy thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Phân công Giáo viên Bộ môn">
        <Button onClick={() => setModalOpen(true)}>Phân công mới</Button>
      </PageHeader>

      <Card>
        <CardHeader
          title="Danh sách phân công"
          description="Gán GVBM theo lớp, môn, học kỳ và số tiết/tuần để phục vụ xếp thời khóa biểu."
        />
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            loading={loading}
            columns={[
              { key: 'teacher', label: 'Giáo viên', render: (row) => <span className="font-semibold">{row.teacher?.full_name}</span> },
              { key: 'class', label: 'Lớp', render: (row) => <Badge color="teal">{row.class?.name}</Badge> },
              { key: 'subject', label: 'Môn', render: (row) => row.subject?.name },
              { key: 'year', label: 'Năm học', render: (row) => <span className="text-ink-muted">{row.school_year}</span> },
              {
                key: 'semester',
                label: 'Học kỳ',
                className: 'text-center',
                render: (row) => semesterLabel(row.semester ?? 0),
              },
              {
                key: 'periods',
                label: 'Tiết/tuần',
                className: 'text-center',
                render: (row) => <span className="font-semibold tabular-nums">{row.periods_per_week ?? 2}</span>,
              },
              {
                key: 'actions',
                label: 'Thao tác',
                className: 'text-right',
                render: (row) => (
                  <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Hủy</Button>
                ),
              },
            ]}
            data={items}
            emptyMessage="Chưa có phân công nào."
          />
        </CardBody>
      </Card>

      <Modal open={modalOpen} title="Phân công GVBM" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Giáo viên" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} required>
            <option value="">— Chọn GV —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Select label="Lớp" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} required>
            <option value="">— Chọn lớp —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select
            label="Học kỳ"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="0">Cả năm</option>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </Select>
          <Select label="Môn học" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
            <option value="">— Chọn môn —</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input
            label="Số tiết/tuần"
            type="number"
            min={1}
            max={10}
            value={form.periods_per_week}
            onChange={(e) => setForm({ ...form, periods_per_week: e.target.value })}
            helper={curriculumHint != null
              ? `Chuẩn khối: ${curriculumHint} tiết/tuần (bắt buộc khớp)`
              : 'Dùng khi tự động xếp TKB'}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="mt-6">
        <CardHeader
          title="Lịch bận giáo viên"
          description="Ràng buộc cứng khi hệ thống tự động xếp thời khóa biểu."
        />
        <CardBody>
        <div className="flex flex-wrap gap-2 items-end mb-4 text-sm">
          <Select
            label="GV"
            value={unavailForm.teacher_id}
            onChange={(e) => setUnavailForm({ ...unavailForm, teacher_id: e.target.value })}
            className="w-40"
          >
            <option value="">— Chọn —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          <Select
            label="Thứ"
            value={unavailForm.day_of_week}
            onChange={(e) => setUnavailForm({ ...unavailForm, day_of_week: e.target.value })}
            className="w-28"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>{DAY_OF_WEEK[d]}</option>
            ))}
          </Select>
          <Select
            label="Buổi (trống = cả ngày)"
            value={unavailForm.session}
            onChange={(e) => setUnavailForm({ ...unavailForm, session: e.target.value })}
            className="w-32"
          >
            <option value="">Cả ngày</option>
            <option value="morning">Sáng</option>
            <option value="afternoon">Chiều</option>
          </Select>
          <Input
            label="Tiết (trống = cả buổi)"
            type="number"
            min={1}
            max={5}
            className="w-24"
            value={unavailForm.period}
            onChange={(e) => setUnavailForm({ ...unavailForm, period: e.target.value })}
          />
          <Button
            type="button"
            onClick={async () => {
              if (!unavailForm.teacher_id) return toast.error('Chọn GV');
              try {
                const res = await createTeacherUnavailability({
                  school_year: CURRENT_SCHOOL_YEAR,
                  teacher_id: Number(unavailForm.teacher_id),
                  day_of_week: Number(unavailForm.day_of_week),
                  session: unavailForm.session || null,
                  period: unavailForm.period ? Number(unavailForm.period) : null,
                  reason: unavailForm.reason || null,
                });
                if (res?.success) { toast.success('Đã lưu'); load(); }
              } catch (err) {
                toast.error(err?.message || 'Lưu thất bại');
              }
            }}
          >
            Thêm
          </Button>
        </div>
        {unavail.length === 0 ? (
          <p className="text-caption">Chưa có lịch bận.</p>
        ) : (
          <ul className="text-sm divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
            {unavail.map((u) => (
              <li key={u.id} className="flex justify-between items-center gap-3 px-3 py-2">
                <span>
                  {u.teacher?.full_name || `GV #${u.teacher_id}`}
                  {' — '}
                  {DAY_OF_WEEK[u.day_of_week]}
                  {u.session ? ` / ${u.session}` : ' / cả ngày'}
                  {u.period ? ` tiết ${u.period}` : ''}
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-rose-600 hover:underline"
                  onClick={async () => {
                    const res = await removeTeacherUnavailability(u.id);
                    if (res?.success) { toast.success('Đã xóa'); load(); }
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
        </CardBody>
      </Card>
    </div>
  );
}
