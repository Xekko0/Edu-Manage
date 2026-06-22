/** Admin — Khung chương trình theo khối (GDPT 2018: tiết/năm, 35 tuần). */
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
import { CURRENT_SCHOOL_YEAR, PROGRAM_COMPONENT_LABEL } from '../../utils/labels';
import { semesterLabel } from '../../utils/format';

const GRADES = [10, 11, 12];
const TEACHING_WEEKS = 35;

const deriveWeekly = (total, weeks = TEACHING_WEEKS) =>
  Math.round(Number(total) / Math.max(1, weeks));

export default function CurriculumStandards() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('10');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    grade_level: '10',
    subject_id: '',
    total_periods_per_year: '105',
    teaching_weeks: String(TEACHING_WEEKS),
    is_required: true,
    semester: '0',
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

  const openEdit = (row) => {
    setForm({
      grade_level: String(row.grade_level),
      subject_id: String(row.subject_id),
      total_periods_per_year: String(row.total_periods_per_year ?? row.periods_per_week * TEACHING_WEEKS),
      teaching_weeks: String(row.teaching_weeks || TEACHING_WEEKS),
      is_required: row.is_required !== false,
      semester: String(row.semester ?? 0),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) return toast.error('Chọn môn');
    setSaving(true);
    try {
      const res = await upsertCurriculumStandard({
        school_year: CURRENT_SCHOOL_YEAR,
        grade_level: Number(form.grade_level),
        subject_id: Number(form.subject_id),
        total_periods_per_year: Number(form.total_periods_per_year),
        teaching_weeks: Number(form.teaching_weeks) || TEACHING_WEEKS,
        is_required: form.is_required,
        semester: Number(form.semester),
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

  const weeklyPreview = deriveWeekly(form.total_periods_per_year, form.teaching_weeks);

  return (
    <div>
      <PageHeader title="Khung chương trình theo khối (GDPT 2018)">
        <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="w-28">
          {GRADES.map((g) => <option key={g} value={g}>Khối {g}</option>)}
        </Select>
        <Button onClick={() => {
          setForm({
            grade_level: gradeFilter,
            subject_id: '',
            total_periods_per_year: '105',
            teaching_weeks: String(TEACHING_WEEKS),
            is_required: true,
            semester: '0',
          });
          setModalOpen(true);
        }}
        >
          + Thêm / sửa môn
        </Button>
      </PageHeader>

      <p className="text-sm text-slate-600 mb-4">
        Nhập <strong>tiết/năm</strong> theo học kỳ. Môn cả năm chọn HK «Cả năm»; môn gộp theo kỳ (vd. Sử HK1: 2 tiết/tuần, HK2: 1) tạo <strong>hai dòng</strong> khung CT.
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có khung CT cho khối này." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Môn</th>
                <th className="px-3 py-2 text-center">Học kỳ</th>
                <th className="px-3 py-2 text-center">Loại</th>
                <th className="px-3 py-2 text-center">Tiết/năm</th>
                <th className="px-3 py-2 text-center">Tuần</th>
                <th className="px-3 py-2 text-center">Tiết/tuần</th>
                <th className="px-3 py-2 text-center">Bắt buộc</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.subject?.name} ({row.subject?.code})</td>
                  <td className="px-3 py-2 text-center text-xs">{semesterLabel(row.semester ?? 0)}</td>
                  <td className="px-3 py-2 text-center text-xs">
                    {PROGRAM_COMPONENT_LABEL[row.subject?.program_component] || row.subject?.program_component || '—'}
                  </td>
                  <td className="px-3 py-2 text-center">{row.total_periods_per_year}</td>
                  <td className="px-3 py-2 text-center">{row.teaching_weeks || TEACHING_WEEKS}</td>
                  <td className="px-3 py-2 text-center font-medium">
                    {row.periods_per_week}
                    {row.weekly_approximation && (
                      <span className="block text-[10px] text-amber-700" title={`Chính xác ~${row.exact_weekly_periods?.toFixed?.(1) ?? row.exact_weekly_periods}`}>
                        ≈ xấp xỉ
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{row.is_required ? 'Có' : 'Không'}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(row)}>Sửa</button>
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
          <Select
            label="Học kỳ"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="0">Cả năm (môn xuyên suốt)</option>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </Select>
          <Select label="Môn" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
            <option value="">— Chọn —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {' '}
                ({PROGRAM_COMPONENT_LABEL[s.program_component] || s.program_component})
              </option>
            ))}
          </Select>
          <Input
            label="Tổng tiết/năm học"
            type="number"
            min={1}
            max={200}
            value={form.total_periods_per_year}
            onChange={(e) => setForm({ ...form, total_periods_per_year: e.target.value })}
            required
          />
          <Input
            label="Số tuần thực học"
            type="number"
            min={1}
            max={40}
            value={form.teaching_weeks}
            onChange={(e) => setForm({ ...form, teaching_weeks: e.target.value })}
          />
          <p className="text-sm text-slate-600">
            Tiết/tuần (tự tính, làm tròn): <strong>{weeklyPreview}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} />
            Môn bắt buộc theo khung CT
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
