/** Admin — Danh mục phòng học (ràng buộc trùng phòng TKB). */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { listRooms, createRoom, updateRoom, removeRoom } from '../../api/room.api';
import { ROOM_TYPE_LABEL } from '../../utils/labels';

const emptyForm = {
  code: '', name: '', room_type: 'classroom', capacity: '40',
};

export default function Rooms() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRooms();
      if (res?.success) setItems(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Không tải phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      room_type: row.room_type,
      capacity: String(row.capacity),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name) return toast.error('Nhập mã và tên phòng');
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        room_type: form.room_type,
        capacity: Number(form.capacity),
      };
      const res = editId
        ? await updateRoom(editId, payload)
        : await createRoom(payload);
      if (res?.success) {
        toast.success(editId ? 'Đã cập nhật' : 'Đã thêm phòng');
        setModalOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async (row) => {
    if (!window.confirm(`Ẩn phòng ${row.name}?`)) return;
    try {
      const res = await removeRoom(row.id);
      if (res?.success) { toast.success('Đã ẩn'); load(); }
    } catch (err) {
      toast.error(err?.message || 'Thất bại');
    }
  };

  return (
    <div>
      <PageHeader title="Danh mục phòng học">
        <Button onClick={openCreate}>Thêm phòng</Button>
      </PageHeader>

      <Card>
        <CardHeader
          title="Phòng học và tài nguyên"
          description="Phòng Lab, Tin học, Thể dục dùng khi sinh TKB môn đặc thù và kiểm tra trùng phòng."
        />
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            loading={loading}
            columns={[
              { key: 'code', label: 'Mã', render: (row) => <span className="font-mono text-xs">{row.code}</span> },
              { key: 'name', label: 'Tên phòng', render: (row) => <span className="font-semibold">{row.name}</span> },
              { key: 'type', label: 'Loại', render: (row) => <Badge color="blue">{ROOM_TYPE_LABEL[row.room_type] || row.room_type}</Badge> },
              { key: 'capacity', label: 'Sức chứa', className: 'text-center', render: (row) => <span className="font-semibold tabular-nums">{row.capacity}</span> },
              {
                key: 'actions',
                label: 'Thao tác',
                className: 'text-right',
                render: (row) => (
                  <div className="inline-flex justify-end gap-2 opacity-100">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Sửa</Button>
                    {row.is_active && (
                      <Button size="sm" variant="danger" onClick={() => handleHide(row)}>Ẩn</Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={items}
            emptyMessage="Chưa có phòng học."
          />
        </CardBody>
      </Card>

      <Modal open={modalOpen} title={editId ? 'Sửa phòng' : 'Thêm phòng'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mã phòng" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required disabled={!!editId} />
          <Input label="Tên hiển thị" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Loại" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
            {Object.entries(ROOM_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input label="Sức chứa" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
