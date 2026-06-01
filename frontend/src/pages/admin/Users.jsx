/** S17 — Quản lý tài khoản. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import RoleBadge from '../../components/ui/RoleBadge';
import Pagination from '../../components/ui/Pagination';
import usePagination from '../../hooks/usePagination';
import {
  listUsers, createUser, updateUser, removeUser, toggleUserActive, resetUserPassword,
} from '../../api/user.api';

const ROLES = [
  { value: 'admin', label: 'Quản trị' },
  { value: 'subject', label: 'GVBM' },
  { value: 'parent', label: 'Phụ huynh' },
  { value: 'student', label: 'Học sinh' },
];

const emptyForm = { email: '', password: '', full_name: '', role: 'subject', phone: '' };

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.q = search.trim();
      const res = await listUsers(params);
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được tài khoản');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const { slice, page, setPage, totalPages, total, resetPage } = usePagination(items, 15);

  useEffect(() => { resetPage(); }, [roleFilter, search, items.length, resetPage]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ email: row.email, password: '', full_name: row.full_name, role: row.role, phone: row.phone || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name || !form.role) return toast.error('Thiếu thông tin');
    if (!editing && !form.password) return toast.error('Nhập mật khẩu');
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      const res = editing ? await updateUser(editing.id, payload) : await createUser(payload);
      if (res?.success) {
        toast.success(editing ? 'Đã cập nhật' : 'Đã tạo tài khoản');
        setModalOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row) => {
    try {
      const res = await toggleUserActive(row.id);
      if (res?.success) { toast.success('Đã cập nhật trạng thái'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Thao tác thất bại');
    }
  };

  const handleReset = async (row) => {
    const pwd = window.prompt('Mật khẩu mới (tối thiểu 6 ký tự):');
    if (!pwd || pwd.length < 6) return;
    try {
      const res = await resetUserPassword(row.id, pwd);
      if (res?.success) toast.success('Reset mật khẩu thành công');
    } catch (err) {
      toast.error(err?.message || 'Reset thất bại');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa tài khoản ${row.email}?`)) return;
    try {
      const res = await removeUser(row.id);
      if (res?.success) { toast.success('Đã xóa'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Quản lý tài khoản">
        <Input
          placeholder="Tìm email, tên…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-36">
          <option value="">Tất cả vai trò</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        <Button onClick={openCreate}>+ Tài khoản mới</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Không có tài khoản phù hợp." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Vai trò</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.full_name}</td>
                  <td className="px-3 py-2 text-slate-600">{row.email}</td>
                  <td className="px-3 py-2"><RoleBadge role={row.role} /></td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.is_active ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs space-x-2">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(row)}>Sửa</button>
                    <button type="button" className="text-slate-600 hover:underline" onClick={() => handleToggle(row)}>
                      {row.is_active ? 'Khóa' : 'Mở'}
                    </button>
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

      <Modal open={modalOpen} title={editing ? 'Sửa tài khoản' : 'Tạo tài khoản'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Họ tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
          <Input label={editing ? 'Mật khẩu mới (để trống nếu giữ)' : 'Mật khẩu'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Vai trò" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!!editing}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <Input label="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
