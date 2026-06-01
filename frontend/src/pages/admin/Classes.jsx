/** S-Admin — CRUD Lớp & Khối. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listClasses, createClass, updateClass, removeClass } from '../../api/class.api';
import { listUsers } from '../../api/user.api';
import { CURRENT_SCHOOL_YEAR } from '../../utils/labels';

const emptyForm = {
  name: '', grade_level: '10', school_year: CURRENT_SCHOOL_YEAR, homeroom_teacher_id: '',
};

export default function Classes() {
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterYear, setFilterYear] = useState(CURRENT_SCHOOL_YEAR);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        listClasses({ school_year: filterYear }),
        // Tất cả giáo viên đều là role=subject; giáo viên nào được chọn sẽ trở thành GVCN qua homeroom_teacher_id
        listUsers({ role: 'subject' }),
      ]);
      if (cRes?.success) setItems(cRes.data || []);
      if (uRes?.success) setTeachers(uRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      grade_level: String(row.grade_level),
      school_year: row.school_year,
      homeroom_teacher_id: row.homeroomTeacher?.id ? String(row.homeroomTeacher.id) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Nhập tên lớp');
    setSaving(true);
    const payload = {
      name: form.name,
      grade_level: Number(form.grade_level),
      school_year: form.school_year,
      homeroom_teacher_id: form.homeroom_teacher_id ? Number(form.homeroom_teacher_id) : null,
    };
    try {
      const res = editing ? await updateClass(editing.id, payload) : await createClass(payload);
      if (res?.success) {
        toast.success(editing ? 'Đã cập nhật' : 'Đã tạo lớp');
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
    if (!window.confirm(`Xóa lớp ${row.name}?`)) return;
    try {
      const res = await removeClass(row.id);
      if (res?.success) { toast.success('Đã xóa'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Quản lý lớp & khối">
        <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-36">
          <option value={CURRENT_SCHOOL_YEAR}>{CURRENT_SCHOOL_YEAR}</option>
          <option value="2023-2024">2023-2024</option>
        </Select>
        <Button onClick={openCreate}>+ Thêm lớp</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có lớp nào." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Tên lớp</th>
                <th className="px-3 py-2 text-left">Khối</th>
                <th className="px-3 py-2 text-left">Năm học</th>
                <th className="px-3 py-2 text-left">GVCN</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">Khối {row.grade_level}</td>
                  <td className="px-3 py-2">{row.school_year}</td>
                  <td className="px-3 py-2">{row.homeroomTeacher?.full_name || '—'}</td>
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

      <Modal open={modalOpen} title={editing ? 'Sửa lớp' : 'Thêm lớp mới'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Tên lớp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="10A1" required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Khối" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })}>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </Select>
            <Input label="Năm học" value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} />
          </div>
          <Select label="GVCN" value={form.homeroom_teacher_id} onChange={(e) => setForm({ ...form, homeroom_teacher_id: e.target.value })}>
            <option value="">— Chưa gán —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
