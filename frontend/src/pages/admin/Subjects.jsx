/** S-Admin — CRUD môn học. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
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
        <Button onClick={openCreate}>Thêm môn</Button>
      </PageHeader>

      <Card>
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            loading={loading}
            columns={[
              { key: 'code', label: 'Mã môn', render: (row) => <span className="font-mono text-xs">{row.code}</span> },
              { key: 'name', label: 'Tên môn', render: (row) => <span className="font-semibold">{row.name}</span> },
              {
                key: 'type',
                label: 'Loại',
                render: (row) => (row.program_component ? (
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    PROGRAM_COMPONENT_BADGE[row.program_component] || 'bg-slate-100 text-slate-700'
                  }`}
                  >
                    {PROGRAM_COMPONENT_LABEL[row.program_component] || row.program_component}
                  </span>
                ) : '—'),
              },
              {
                key: 'status',
                label: 'Trạng thái',
                className: 'text-center',
                render: (row) => (
                  <Badge color={row.is_active === false ? 'slate' : 'green'}>
                    {row.is_active === false ? 'Ngừng dùng' : 'Đang dùng'}
                  </Badge>
                ),
              },
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
            emptyMessage="Chưa có môn học nào."
          />
        </CardBody>
      </Card>

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
