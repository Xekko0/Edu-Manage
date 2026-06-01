/** S-Teacher — Đánh giá / nhận xét học sinh (homeroom | subject | conduct). */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listByStudent, createEvaluation, removeEvaluation } from '../../api/evaluation.api';
import { listStudents } from '../../api/student.api';
import { CONDUCT_GRADE, CURRENT_SCHOOL_YEAR, EVALUATION_TYPE } from '../../utils/labels';

const emptyForm = {
  student_id: '',
  type: 'subject',
  subject_id: '',
  semester: '1',
  school_year: CURRENT_SCHOOL_YEAR,
  content: '',
  conduct_grade: 'good',
};

export default function TeacherEvaluations() {
  const { user } = useAuth();
  const { loading: clsLoading, homeroomClass, assignments, teachingClasses } = useTeacherClasses();
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isHomeroom = homeroomClass && String(homeroomClass.id) === String(classId);
  const mySubjects = assignments.filter((a) => String(a.class_id) === String(classId));

  useEffect(() => {
    if (teachingClasses.length && !classId) {
      setClassId(String(homeroomClass?.id || teachingClasses[0]?.id));
    }
  }, [teachingClasses, homeroomClass, classId]);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await listStudents({ class_id: classId });
        if (!cancelled && res?.success) {
          setStudents(res.data || []);
          setSelectedStudentId(String(res.data?.[0]?.id || ''));
        }
      } catch (_) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [classId]);

  const loadEvaluations = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const res = await listByStudent(selectedStudentId, { school_year: CURRENT_SCHOOL_YEAR });
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được đánh giá');
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => { loadEvaluations(); }, [loadEvaluations]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      student_id: selectedStudentId,
      subject_id: mySubjects[0] ? String(mySubjects[0].subject_id) : '',
      type: isHomeroom ? 'homeroom' : 'subject',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.content) {
      toast.error('Thiếu thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await createEvaluation({
        student_id: Number(form.student_id),
        type: form.type,
        subject_id: form.type === 'subject' ? Number(form.subject_id) : null,
        semester: Number(form.semester),
        school_year: form.school_year,
        content: form.content,
        conduct_grade: form.type === 'conduct' ? form.conduct_grade : null,
      });
      if (res?.success) {
        toast.success('Tạo đánh giá thành công');
        setModalOpen(false);
        loadEvaluations();
      }
    } catch (err) {
      toast.error(err?.message || 'Tạo đánh giá thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      const res = await removeEvaluation(row.id);
      if (res?.success) {
        toast.success('Đã xóa');
        loadEvaluations();
      }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  if (clsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Đánh giá học sinh">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-40">
          {teachingClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-56"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.user?.full_name || s.student_code}</option>
          ))}
        </Select>
        <Button onClick={openCreate} disabled={!selectedStudentId}>+ Thêm đánh giá</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="HS này chưa có đánh giá." />
      ) : (
        <div className="space-y-3">
          {items.map((ev) => (
            <div key={ev.id} className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {EVALUATION_TYPE[ev.type]}
                </span>
                {(user?.role === 'admin' || ev.teacher?.id === user?.id) && (
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(ev)}>
                    Xóa
                  </button>
                )}
              </div>
              {ev.subject && <p className="text-xs text-slate-500 mb-1">Môn: {ev.subject.name}</p>}
              <p className="text-sm">{ev.content}</p>
              {ev.conduct_grade && (
                <p className="text-xs text-slate-500 mt-1">Hạnh kiểm: {CONDUCT_GRADE[ev.conduct_grade]}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                {ev.school_year} — HK{ev.semester} • GV: {ev.teacher?.full_name}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Thêm đánh giá" onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Học sinh" value={form.student_id} onChange={(e) => setField('student_id', e.target.value)} required>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.full_name}</option>
            ))}
          </Select>
          <Select label="Loại đánh giá" value={form.type} onChange={(e) => setField('type', e.target.value)}>
            {isHomeroom && <option value="homeroom">Nhận xét tổng (GVCN)</option>}
            {isHomeroom && <option value="conduct">Hạnh kiểm (GVCN)</option>}
            <option value="subject">Nhận xét môn học (GVBM)</option>
          </Select>
          {form.type === 'subject' && (
            <Select label="Môn học" value={form.subject_id} onChange={(e) => setField('subject_id', e.target.value)} required>
              {mySubjects.map((a) => (
                <option key={a.id} value={a.subject_id}>{a.subject?.name}</option>
              ))}
            </Select>
          )}
          {form.type === 'conduct' && (
            <Select label="Xếp loại hạnh kiểm" value={form.conduct_grade} onChange={(e) => setField('conduct_grade', e.target.value)}>
              {Object.entries(CONDUCT_GRADE).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          )}
          <Select label="Học kỳ" value={form.semester} onChange={(e) => setField('semester', e.target.value)}>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </Select>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung nhận xét</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:outline-none min-h-[100px]"
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
