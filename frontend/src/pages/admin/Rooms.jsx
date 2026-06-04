/** Admin — Danh mục phòng học (ràng buộc trùng phòng TKB). */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
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
        <Button onClick={openCreate}>+ Thêm phòng</Button>
      </PageHeader>

      <p className="text-sm text-slate-600 mb-4">
        Phòng Lab, Tin học, Thể dục dùng khi sinh TKB môn đặc thù — không trùng khung giờ.
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-center">Sức chứa</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className={`border-t ${!row.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{ROOM_TYPE_LABEL[row.room_type] || row.room_type}</td>
                  <td className="px-3 py-2 text-center">{row.capacity}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button type="button" className="text-brand hover:underline" onClick={() => openEdit(row)}>Sửa</button>
                    {row.is_active && (
                      <button type="button" className="text-red-600 hover:underline" onClick={() => handleHide(row)}>Ẩn</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
