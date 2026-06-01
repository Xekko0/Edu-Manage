/** S-Admin — Cấu hình học phí theo lớp × năm học × kỳ. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listTuitions, createTuition, updateTuition, removeTuition } from '../../api/tuition.api';
import { listClasses } from '../../api/class.api';
import { formatCurrency, formatDate, semesterLabel } from '../../utils/format';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

const emptyForm = {
  class_id: '',
  school_year: CURRENT_SCHOOL_YEAR,
  semester: '1',
  amount: '',
  due_date: '',
  description: '',
  is_active: true,
};

export default function Tuitions() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterYear, setFilterYear] = useState(CURRENT_SCHOOL_YEAR);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        listTuitions({ school_year: filterYear }),
        listClasses({ school_year: filterYear }),
      ]);
      if (tRes?.success) setItems(tRes.data || []);
      if (cRes?.success) setClasses(cRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      class_id: String(row.class_id),
      school_year: row.school_year,
      semester: String(row.semester),
      amount: String(row.amount),
      due_date: row.due_date || '',
      description: row.description || '',
      is_active: row.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.amount) {
      toast.error('Vui lòng chọn lớp và nhập mức thu');
      return;
    }
    setSaving(true);
    const payload = {
      class_id: Number(form.class_id),
      school_year: form.school_year,
      semester: Number(form.semester),
      amount: Number(form.amount),
      due_date: form.due_date || null,
      description: form.description || null,
      is_active: form.is_active,
    };
    try {
      const res = editing
        ? await updateTuition(editing.id, payload)
        : await createTuition(payload);
      if (res?.success) {
        toast.success(editing ? 'Cập nhật thành công' : 'Tạo đợt thu thành công');
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
    if (!window.confirm(`Xóa học phí HK${row.semester} — lớp ${row.class?.name}?`)) return;
    try {
      const res = await removeTuition(row.id);
      if (res?.success) {
        toast.success('Đã xóa');
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader title="Cấu hình học phí">
        <Select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="w-40"
        >
          <option value={CURRENT_SCHOOL_YEAR}>{CURRENT_SCHOOL_YEAR}</option>
          <option value="2023-2024">2023-2024</option>
        </Select>
        <Button onClick={openCreate}>+ Đợt thu mới</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có cấu hình học phí cho năm học này.">
          <Button className="mt-4" onClick={openCreate}>Tạo đợt thu đầu tiên</Button>
        </EmptyState>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Lớp</th>
                <th className="px-3 py-2 text-left">Năm học</th>
                <th className="px-3 py-2 text-left">Kỳ</th>
                <th className="px-3 py-2 text-right">Mức thu</th>
                <th className="px-3 py-2 text-left">Hạn nộp</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.class?.name}</td>
                  <td className="px-3 py-2">{row.school_year}</td>
                  <td className="px-3 py-2">{semesterLabel(row.semester)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
                  <td className="px-3 py-2">{formatDate(row.due_date)}</td>
                  <td className="px-3 py-2 max-w-xs truncate">{row.description || '—'}</td>
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

      <Modal
        open={modalOpen}
        title={editing ? 'Sửa đợt thu' : 'Thêm đợt thu mới'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Lớp học"
            value={form.class_id}
            onChange={(e) => setField('class_id', e.target.value)}
            required
          >
            <option value="">— Chọn lớp —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (Khối {c.grade_level})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Năm học"
              value={form.school_year}
              onChange={(e) => setField('school_year', e.target.value)}
            />
            <Select
              label="Học kỳ"
              value={form.semester}
              onChange={(e) => setField('semester', e.target.value)}
            >
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="0">Cả năm</option>
            </Select>
          </div>
          <Input
            label="Mức thu (VND)"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
            required
          />
          <Input
            label="Hạn nộp"
            type="date"
            value={form.due_date}
            onChange={(e) => setField('due_date', e.target.value)}
          />
          <Input
            label="Mô tả"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
