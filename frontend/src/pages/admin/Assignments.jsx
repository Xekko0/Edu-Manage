/** S06 — Phân công giáo viên bộ môn. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listAssignments, createAssignment, removeAssignment } from '../../api/assignment.api';
import { listUsers } from '../../api/user.api';
import { listClasses } from '../../api/class.api';
import { listSubjects } from '../../api/subject.api';
import { lookupCurriculum } from '../../api/curriculum.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

const emptyForm = {
  teacher_id: '', class_id: '', subject_id: '', school_year: CURRENT_SCHOOL_YEAR, periods_per_week: '2',
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, uRes, cRes, sRes] = await Promise.all([
        listAssignments({ school_year: CURRENT_SCHOOL_YEAR }),
        listUsers(),
        listClasses({ school_year: CURRENT_SCHOOL_YEAR }),
        listSubjects(),
      ]);
      if (aRes?.success) setItems(aRes.data || []);
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
        const row = (res?.data || []).find((r) => String(r.subject_id) === String(form.subject_id));
        if (row) {
          setCurriculumHint(row.periods_per_week);
          setForm((f) => ({ ...f, periods_per_week: String(row.periods_per_week) }));
        } else setCurriculumHint(null);
      })
      .catch(() => setCurriculumHint(null));
  }, [form.class_id, form.subject_id, classes]);

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
        <Button onClick={() => setModalOpen(true)}>+ Phân công mới</Button>
      </PageHeader>

      <p className="text-sm text-slate-600 mb-4">
        Gán GVBM vào môn × lớp × năm học. Quyền nhập điểm được kiểm tra qua bảng phân công.
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có phân công nào." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Giáo viên</th>
                <th className="px-3 py-2 text-left">Lớp</th>
                <th className="px-3 py-2 text-left">Môn</th>
                <th className="px-3 py-2 text-left">Năm học</th>
                <th className="px-3 py-2 text-center">Tiết/tuần</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.teacher?.full_name}</td>
                  <td className="px-3 py-2 font-medium">{row.class?.name}</td>
                  <td className="px-3 py-2">{row.subject?.name}</td>
                  <td className="px-3 py-2">{row.school_year}</td>
                  <td className="px-3 py-2 text-center font-medium">{row.periods_per_week ?? 2}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>Hủy</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}
