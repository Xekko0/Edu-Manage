/** S-Admin — CRUD Lớp & Khối. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card, { CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
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
        <Button onClick={openCreate}>Thêm lớp</Button>
      </PageHeader>

      <Card>
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            loading={loading}
            columns={[
              { key: 'name', label: 'Tên lớp', render: (row) => <span className="font-semibold">{row.name}</span> },
              { key: 'grade', label: 'Khối', render: (row) => <Badge color="teal">Khối {row.grade_level}</Badge> },
              { key: 'year', label: 'Năm học', render: (row) => <span className="text-ink-muted">{row.school_year}</span> },
              { key: 'teacher', label: 'GVCN', render: (row) => row.homeroomTeacher?.full_name || '—' },
              {
                key: 'actions',
                label: 'Thao tác',
                className: 'text-right',
                render: (row) => (
                  <div className="inline-flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Sửa</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Xóa</Button>
                  </div>
                ),
              },
            ]}
            data={items}
            emptyMessage="Chưa có lớp nào."
          />
        </CardBody>
      </Card>

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
