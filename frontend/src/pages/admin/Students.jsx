/** S07 — Danh sách học sinh. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import usePagination from '../../hooks/usePagination';
import { listStudents, createStudent, updateStudent, resetStudentPassword, removeStudent } from '../../api/student.api';
import { listClasses } from '../../api/class.api';

const CURRENT_YEAR = new Date().getFullYear();

const emptyForm = {
  email: '', password: '', full_name: '', student_code: '', class_id: '',
  date_of_birth: '', gender: 'male', address: '', enrollment_year: String(CURRENT_YEAR),
};

export default function Students() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (classFilter) params.class_id = classFilter;
      if (search.trim()) params.q = search.trim();
      const [sRes, cRes] = await Promise.all([listStudents(params), listClasses()]);
      if (sRes?.success) setItems(sRes.data || []);
      if (cRes?.success) setClasses(cRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được học sinh');
    } finally {
      setLoading(false);
    }
  }, [classFilter, search]);

  useEffect(() => { load(); }, [load]);

  const { slice, page, setPage, totalPages, total, resetPage } = usePagination(items, 15);

  useEffect(() => { resetPage(); }, [classFilter, search, items.length, resetPage]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      email: row.user?.email || '',
      password: '',
      full_name: row.user?.full_name || '',
      student_code: row.student_code,
      class_id: String(row.class_id),
      date_of_birth: row.date_of_birth?.slice(0, 10) || '',
      gender: row.gender || 'male',
      address: row.address || '',
      enrollment_year: String(row.enrollment_year || CURRENT_YEAR),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Frontend guard (backend cũng sẽ check)
      const cls = classes.find((c) => String(c.id) === String(form.class_id));
      if (!cls) throw { message: 'Vui lòng chọn lớp' };
      if (!form.date_of_birth) throw { message: 'Ngày sinh bắt buộc' };
      const birthYear = Number(String(form.date_of_birth).slice(0, 4));
      const age = CURRENT_YEAR - birthYear;
      const minAge = Number(cls.grade_level) + 5;
      if (age < minAge) throw { message: `Tuổi vào lớp ${cls.grade_level} tối thiểu ${minAge} (hiện tại: ${age})` };

      const payload = {
        full_name: form.full_name,
        student_code: form.student_code,
        class_id: Number(form.class_id),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        address: form.address,
        enrollment_year: CURRENT_YEAR,
      };
      if (form.password) payload.password = form.password;
      if (!editing) {
        payload.email = form.email;
        payload.password = form.password;
      }
      const res = editing
        ? await updateStudent(editing.id, payload)
        : await createStudent({ ...payload, email: form.email, password: form.password });
      if (res?.success) {
        toast.success(editing ? 'Đã cập nhật' : 'Đã thêm học sinh');
        setModalOpen(false);
        load();
      }
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
      if (res?.success) toast.success('Reset mật khẩu thành công');
    } catch (err) {
      toast.error(err?.message || 'Reset thất bại');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa HS ${row.student_code}?`)) return;
    try {
      const res = await removeStudent(row.id);
      if (res?.success) { toast.success('Đã xóa'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Danh sách học sinh">
        <Input
          placeholder="Tìm tên, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-44"
        />
        <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-40">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button onClick={openCreate}>+ Thêm HS</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Không có học sinh." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Mã HS</th>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-left">Lớp</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{row.student_code}</td>
                  <td className="px-3 py-2 font-medium">{row.user?.full_name}</td>
                  <td className="px-3 py-2">{row.class?.name}</td>
                  <td className="px-3 py-2 text-slate-600">{row.user?.email}</td>
                  <td className="px-3 py-2 text-right text-xs space-x-2">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(row)}>Sửa</button>
                    <button type="button" className="text-amber-600 hover:underline" onClick={() => handleReset(row)}>Reset MK</button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Sửa học sinh' : 'Thêm học sinh'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Họ tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label="Mã HS" value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} required />
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email đăng nhập" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Mật khẩu" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          )}
          {editing && (
            <Input label="Mật khẩu mới (tùy chọn)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <Select label="Lớp" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} required>
            <option value="">— Chọn lớp —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
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
