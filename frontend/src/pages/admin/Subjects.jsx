/** S-Admin — CRUD môn học. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listSubjects, createSubject, updateSubject, removeSubject } from '../../api/subject.api';
import { PROGRAM_COMPONENT_LABEL, PROGRAM_COMPONENT_BADGE } from '../../utils/labels';

const emptyForm = { code: '', name: '' };

export default function Subjects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSubjects();
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải được môn học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ code: row.code, name: row.name });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) return toast.error('Nhập mã và tên môn');
    setSaving(true);
    try {
      const res = editing
        ? await updateSubject(editing.id, form)
        : await createSubject(form);
      if (res?.success) {
        toast.success(editing ? 'Đã cập nhật' : 'Đã thêm môn');
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
    if (!window.confirm(`Xóa môn ${row.name}?`)) return;
    try {
      const res = await removeSubject(row.id);
      if (res?.success) { toast.success('Đã xóa'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Quản lý môn học">
        <Button onClick={openCreate}>+ Thêm môn</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !items.length ? (
        <EmptyState message="Chưa có môn học nào." />
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Mã môn</th>
                <th className="px-3 py-2 text-left">Tên môn</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2">
                    {row.program_component ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        PROGRAM_COMPONENT_BADGE[row.program_component] || 'bg-slate-100'
                      }`}
                      >
                        {PROGRAM_COMPONENT_LABEL[row.program_component] || row.program_component}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {row.is_active === false ? (
                      <span className="text-slate-400">Ngừng dùng</span>
                    ) : (
                      <span className="text-emerald-700">Đang dùng</span>
                    )}
                  </td>
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

      <Modal open={modalOpen} title={editing ? 'Sửa môn học' : 'Thêm môn học'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mã môn" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <Input label="Tên môn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
