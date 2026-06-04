/** Admin — Khung chương trình theo khối (định mức tiết/tuần). */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  listCurriculumStandards,
  upsertCurriculumStandard,
  removeCurriculumStandard,
} from '../../api/curriculum.api';
import { listSubjects } from '../../api/subject.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

const GRADES = [10, 11, 12];

export default function CurriculumStandards() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('10');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    grade_level: '10',
    subject_id: '',
    periods_per_week: '4',
    is_required: true,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        listCurriculumStandards({
          school_year: CURRENT_SCHOOL_YEAR,
          grade_level: gradeFilter,
        }),
        listSubjects(),
      ]);
      if (cRes?.success) setItems(cRes.data || []);
      if (sRes?.success) setSubjects(sRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải khung CT');
    } finally {
      setLoading(false);
    }
  }, [gradeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) return toast.error('Chọn môn');
    setSaving(true);
    try {
      const res = await upsertCurriculumStandard({
        school_year: CURRENT_SCHOOL_YEAR,
        grade_level: Number(form.grade_level),
        subject_id: Number(form.subject_id),
        periods_per_week: Number(form.periods_per_week),
        is_required: form.is_required,
      });
      if (res?.success) {
        toast.success('Đã lưu');
        setModalOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Xóa dòng khung CT này?')) return;
    try {
      const res = await removeCurriculumStandard(row.id);
      if (res?.success) { toast.success('Đã xóa'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Khung chương trình theo khối">
        <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="w-28">
          {GRADES.map((g) => <option key={g} value={g}>Khối {g}</option>)}
        </Select>
        <Button onClick={() => setModalOpen(true)}>+ Thêm / sửa môn</Button>
      </PageHeader>

      <p className="text-sm text-slate-600 mb-4">
        Định mức tiết/tuần theo Bộ GD — phân công GV phải khớp trước khi sinh TKB toàn trường.
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có khung CT cho khối này." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Môn</th>
                <th className="px-3 py-2 text-center">Tiết/tuần</th>
                <th className="px-3 py-2 text-center">Bắt buộc</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.subject?.name} ({row.subject?.code})</td>
                  <td className="px-3 py-2 text-center font-medium">{row.periods_per_week}</td>
                  <td className="px-3 py-2 text-center">{row.is_required ? 'Có' : 'Không'}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title="Khung CT môn học" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Khối" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select label="Môn" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
            <option value="">— Chọn —</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Tiết/tuần" type="number" min={1} max={10} value={form.periods_per_week} onChange={(e) => setForm({ ...form, periods_per_week: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} />
            Môn bắt buộc
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
