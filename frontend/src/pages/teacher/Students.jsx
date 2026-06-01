/**
 * S-Teacher — Danh sách HS lớp chủ nhiệm.
 * GVCN: thêm/sửa HS, reset mật khẩu.
 */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listStudents, createStudent, updateStudent, resetStudentPassword } from '../../api/student.api';

const CURRENT_YEAR = new Date().getFullYear();
const minAgeForGrade = (gradeLevel) => Number(gradeLevel) + 5;

const emptyForm = {
  email: '', password: '', full_name: '', student_code: '',
  date_of_birth: '', gender: 'male', address: '',
};

export default function TeacherStudents() {
  const { homeroomClass, loading: clsLoading } = useTeacherClasses();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!homeroomClass?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await listStudents({ class_id: homeroomClass.id });
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được HS');
    } finally {
      setLoading(false);
    }
  }, [homeroomClass]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      email: row.user?.email || '',
      password: '',
      full_name: row.user?.full_name || '',
      student_code: row.student_code,
      date_of_birth: row.date_of_birth?.slice(0, 10) || '',
      gender: row.gender || 'male',
      address: row.address || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.date_of_birth) throw { message: 'Ngày sinh bắt buộc' };
      const birthYear = Number(String(form.date_of_birth).slice(0, 4));
      const age = CURRENT_YEAR - birthYear;
      const minAge = minAgeForGrade(homeroomClass.grade_level);
      if (age < minAge) throw { message: `Tuổi vào lớp ${homeroomClass.grade_level} tối thiểu ${minAge} (hiện tại: ${age})` };

      if (editing) {
        const res = await updateStudent(editing.id, {
          full_name: form.full_name,
          student_code: form.student_code,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender,
          address: form.address,
          ...(form.password ? { password: form.password } : {}),
          enrollment_year: CURRENT_YEAR,
        });
        if (res?.success) toast.success('Đã cập nhật');
      } else {
        const res = await createStudent({
          ...form,
          class_id: homeroomClass.id,
          enrollment_year: CURRENT_YEAR,
        });
        if (res?.success) toast.success('Đã thêm HS');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (row) => {
    const pwd = window.prompt('Mật khẩu mới:');
    if (!pwd || pwd.length < 6) return;
    try {
      const res = await resetStudentPassword(row.id, pwd);
      if (res?.success) toast.success('Reset thành công');
    } catch (err) {
      toast.error(err?.message || 'Reset thất bại');
    }
  };

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Học sinh lớp chủ nhiệm" />
        <EmptyState message="Bạn chưa được gán GVCN." />
      </div>
    );
  }

  const filtered = items.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.student_code?.toLowerCase().includes(q)
      || row.user?.full_name?.toLowerCase().includes(q)
      || row.user?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title={`HS lớp ${homeroomClass.name}`}>
        <Input
          placeholder="Tìm mã, tên, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-44"
        />
        <Button onClick={openCreate}>+ Thêm HS</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !filtered.length ? (
        <EmptyState message={items.length ? 'Không tìm thấy HS phù hợp.' : 'Lớp chưa có học sinh.'} />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Mã HS</th>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{row.student_code}</td>
                  <td className="px-3 py-2">{row.user?.full_name}</td>
                  <td className="px-3 py-2 text-slate-600">{row.user?.email}</td>
                  <td className="px-3 py-2 text-right text-xs space-x-2">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(row)}>Sửa</button>
                    <button type="button" className="text-amber-600 hover:underline" onClick={() => handleReset(row)}>Reset MK</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Sửa HS' : 'Thêm HS'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Họ tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label="Mã HS" value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} required />
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Mật khẩu" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          )}
          {editing && (
            <Input label="Mật khẩu mới (tùy chọn)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <div className="grid grid-cols-3 gap-3">
            <Input label="Ngày sinh" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
            <Select label="Giới tính" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </Select>
            <Input label="Năm nhập học (tự động)" value={String(CURRENT_YEAR)} readOnly />
          </div>
          <Input label="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
