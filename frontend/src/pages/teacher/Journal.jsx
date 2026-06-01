/** S-Teacher — Sổ đầu bài. */
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
import { listByClass, createJournal, removeJournal } from '../../api/journal.api';
import { listStudents } from '../../api/student.api';
import { formatDate } from '../../utils/format';
import { JOURNAL_RATING } from '../../utils/labels';

const emptyForm = {
  lesson_date: new Date().toISOString().slice(0, 10),
  period: '',
  subject_id: '',
  content: '',
  discipline_note: '',
  rating: 'good',
  absent_count: '0',
};

export default function Journal() {
  const { user } = useAuth();
  const { loading: clsLoading, homeroomClass, assignments, teachingClasses } = useTeacherClasses();
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teachingClasses.length && !classId) {
      setClassId(String(homeroomClass?.id || teachingClasses[0]?.id));
    }
  }, [teachingClasses, homeroomClass, classId]);

  const mySubjects = assignments.filter(
    (a) => String(a.class_id) === String(classId),
  );

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await listByClass(classId);
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được sổ đầu bài');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ ...emptyForm, subject_id: mySubjects[0] ? String(mySubjects[0].subject_id) : '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || !form.lesson_date) {
      toast.error('Thiếu thông tin bắt buộc');
      return;
    }
    setSaving(true);
    const isHomeroomNote = !form.subject_id;
    try {
      const res = await createJournal({
        class_id: Number(classId),
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        lesson_date: form.lesson_date,
        period: form.period ? Number(form.period) : null,
        content: form.content,
        discipline_note: form.discipline_note || null,
        rating: form.rating || null,
        absent_count: Number(form.absent_count) || 0,
      });
      if (res?.success) {
        toast.success(isHomeroomNote ? 'Ghi nhận xét tổng thành công' : 'Ghi tiết thành công');
        setModalOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Ghi sổ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Xóa bản ghi sổ đầu bài này?')) return;
    try {
      const res = await removeJournal(row.id);
      if (res?.success) {
        toast.success('Đã xóa');
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const isHomeroom = homeroomClass && String(homeroomClass.id) === String(classId);

  if (clsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sổ đầu bài">
        <Select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="w-48"
        >
          {teachingClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button onClick={openCreate} disabled={!classId}>+ Ghi tiết</Button>
      </PageHeader>

      <p className="text-xs text-slate-500 mb-4">
        GVBM ghi tiết môn được phân công; GVCN ghi nhận xét tổng buổi (để trống môn).
        {isHomeroom && ' Bạn đang là GVCN lớp này.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có bản ghi sổ đầu bài cho lớp này." />
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <div key={row.id} className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <div className="text-sm font-medium">
                  {formatDate(row.lesson_date)}
                  {row.period ? ` — Tiết ${row.period}` : ' — Nhận xét tổng'}
                  {row.subject && ` — ${row.subject.name}`}
                </div>
                {row.rating && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100">
                    {JOURNAL_RATING[row.rating]}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800">{row.content || '—'}</p>
              {row.discipline_note && (
                <p className="text-xs text-slate-500 mt-1">Nề nếp: {row.discipline_note}</p>
              )}
              <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                <span>GV: {row.teacher?.full_name} • Vắng: {row.absent_count ?? 0}</span>
                {(user?.role === 'admin' || row.teacher?.id === user?.id) && (
                  <button type="button" className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Ghi sổ đầu bài" onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày học"
              type="date"
              value={form.lesson_date}
              onChange={(e) => setField('lesson_date', e.target.value)}
              required
            />
            <Input
              label="Tiết (để trống nếu ghi tổng)"
              type="number"
              min="1"
              max="10"
              value={form.period}
              onChange={(e) => setField('period', e.target.value)}
            />
          </div>
          <Select
            label="Môn học (GVCN để trống = nhận xét tổng)"
            value={form.subject_id}
            onChange={(e) => setField('subject_id', e.target.value)}
          >
            <option value="">— Nhận xét tổng buổi (GVCN) —</option>
            {mySubjects.map((a) => (
              <option key={a.id} value={a.subject_id}>{a.subject?.name}</option>
            ))}
          </Select>
          <Input
            label="Nội dung dạy / nhận xét"
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            required
          />
          <Input
            label="Nhận xét nề nếp"
            value={form.discipline_note}
            onChange={(e) => setField('discipline_note', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Đánh giá" value={form.rating} onChange={(e) => setField('rating', e.target.value)}>
              {Object.entries(JOURNAL_RATING).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Input
              label="Số HS vắng"
              type="number"
              min="0"
              value={form.absent_count}
              onChange={(e) => setField('absent_count', e.target.value)}
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
