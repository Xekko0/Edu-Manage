/** S-Teacher — Quản lý phụ huynh lớp chủ nhiệm. */
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
import { listStudents } from '../../api/student.api';
import {
  listUsers,
  createParentForStudent,
  updateUser,
  resetUserPassword,
  linkParentChild,
  unlinkParentChild,
} from '../../api/user.api';

const emptyCreate = { email: '', password: '', full_name: '', phone: '', student_id: '' };
const emptyEdit = { full_name: '', phone: '', password: '' };

const childLabel = (children = []) =>
  children.map((c) => c.user?.full_name || c.student_code).join(', ') || '—';

export default function TeacherParents() {
  const { homeroomClass, loading: clsLoading } = useTeacherClasses();
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editing, setEditing] = useState(null);
  const [linkForm, setLinkForm] = useState({ parent_id: '', student_id: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!homeroomClass?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        listUsers({ role: 'parent', class_id: homeroomClass.id }),
        listStudents({ class_id: homeroomClass.id }),
      ]);
      if (pRes?.success) setParents(pRes.data || []);
      if (sRes?.success) setStudents(sRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [homeroomClass]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.student_id) return toast.error('Chọn học sinh');
    setSaving(true);
    try {
      const res = await createParentForStudent(createForm);
      if (res?.success) {
        toast.success('Đã tạo PH và liên kết');
        setCreateOpen(false);
        setCreateForm(emptyCreate);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Tạo PH thất bại');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({ full_name: row.full_name, phone: row.phone || '', password: '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { full_name: editForm.full_name, phone: editForm.phone };
      if (editForm.password) payload.password = editForm.password;
      const res = await updateUser(editing.id, payload);
      if (res?.success) {
        toast.success('Đã cập nhật PH');
        setEditOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (row) => {
    const pwd = window.prompt(`Mật khẩu mới cho ${row.full_name}:`);
    if (!pwd || pwd.length < 6) return;
    try {
      const res = await resetUserPassword(row.id, pwd);
      if (res?.success) toast.success('Reset mật khẩu thành công');
    } catch (err) {
      toast.error(err?.message || 'Reset thất bại');
    }
  };

  const handleUnlink = async (parent, child) => {
    if (!window.confirm(`Gỡ liên kết ${parent.full_name} ↔ ${child.user?.full_name}?`)) return;
    try {
      const res = await unlinkParentChild({ parent_id: parent.id, student_id: child.id });
      if (res?.success) { toast.success('Đã gỡ liên kết'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Gỡ liên kết thất bại');
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    if (!linkForm.parent_id || !linkForm.student_id) return toast.error('Chọn PH và HS');
    setSaving(true);
    try {
      const res = await linkParentChild({
        parent_id: Number(linkForm.parent_id),
        student_id: Number(linkForm.student_id),
      });
      if (res?.success) {
        toast.success('Đã liên kết');
        setLinkOpen(false);
        setLinkForm({ parent_id: '', student_id: '' });
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Liên kết thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!homeroomClass) {
    return (
      <div>
        <PageHeader title="Phụ huynh lớp chủ nhiệm" />
        <EmptyState message="Bạn chưa được gán GVCN." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`PH lớp ${homeroomClass.name}`}>
        <Button variant="secondary" onClick={() => setLinkOpen(true)}>Liên kết PH↔HS</Button>
        <Button onClick={() => setCreateOpen(true)}>+ Tạo PH</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !parents.length ? (
        <EmptyState message="Chưa có phụ huynh liên kết." />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Họ tên PH</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">SĐT</th>
                <th className="px-3 py-2 text-left">Con (HS)</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{p.full_name}</td>
                  <td className="px-3 py-2">{p.email}</td>
                  <td className="px-3 py-2">{p.phone || '—'}</td>
                  <td className="px-3 py-2">
                    {(p.children || []).length ? (
                      <ul className="space-y-1">
                        {(p.children || []).map((c) => (
                          <li key={c.id} className="flex items-center gap-2">
                            <span>{c.user?.full_name} ({c.student_code})</span>
                            <button
                              type="button"
                              className="text-red-600 text-xs hover:underline"
                              onClick={() => handleUnlink(p, c)}
                            >
                              Gỡ
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400">{childLabel(p.children)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-xs space-x-2 whitespace-nowrap">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(p)}>Sửa</button>
                    <button type="button" className="text-amber-600 hover:underline" onClick={() => handleReset(p)}>Reset MK</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Tạo tài khoản phụ huynh" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Học sinh" value={createForm.student_id} onChange={(e) => setCreateForm({ ...createForm, student_id: e.target.value })} required>
            <option value="">— Chọn HS —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.full_name} ({s.student_code})</option>
            ))}
          </Select>
          <Input label="Họ tên PH" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} required />
          <Input label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
          <Input label="Mật khẩu" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
          <Input label="SĐT" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Tạo & liên kết'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} title="Sửa phụ huynh" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Họ tên" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required />
          <Input label="SĐT" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Mật khẩu mới (tùy chọn)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={linkOpen} title="Liên kết PH với HS" onClose={() => setLinkOpen(false)}>
        <form onSubmit={handleLink} className="space-y-4">
          <Select label="Phụ huynh" value={linkForm.parent_id} onChange={(e) => setLinkForm({ ...linkForm, parent_id: e.target.value })} required>
            <option value="">— Chọn PH —</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
          <Select label="Học sinh" value={linkForm.student_id} onChange={(e) => setLinkForm({ ...linkForm, student_id: e.target.value })} required>
            <option value="">— Chọn HS —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.user?.full_name} ({s.student_code})</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setLinkOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Liên kết'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
