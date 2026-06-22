/** S17 — Quản lý tài khoản. */
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
        <Button onClick={openCreate}>Tài khoản mới</Button>
      </PageHeader>

      <Card>
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            loading={loading}
            columns={[
              {
                key: 'name',
                label: 'Người dùng',
                render: (row) => (
                  <div>
                    <div className="font-semibold text-ink">{row.full_name}</div>
                    <div className="text-caption">{row.phone || 'Chưa có SĐT'}</div>
                  </div>
                ),
              },
              { key: 'email', label: 'Email', render: (row) => <span className="text-ink-muted">{row.email}</span> },
              { key: 'role', label: 'Vai trò', render: (row) => <RoleBadge role={row.role} /> },
              {
                key: 'status',
                label: 'Trạng thái',
                render: (row) => (
                  <Badge color={row.is_active ? 'green' : 'red'}>
                    {row.is_active ? 'Hoạt động' : 'Vô hiệu'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                label: 'Thao tác',
                className: 'text-right',
                render: (row) => (
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Sửa</Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggle(row)}>
                      {row.is_active ? 'Khóa' : 'Mở'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReset(row)}>Reset</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Xóa</Button>
                  </div>
                ),
              },
            ]}
            data={slice}
            emptyMessage="Không có tài khoản phù hợp."
          />
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </CardBody>
      </Card>

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
