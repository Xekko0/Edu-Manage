/**
 * GradingPeriods — Quản lý kỳ chốt điểm (Admin).
 */
import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Lock, Trash2, Pencil } from 'lucide-react';
import { listGradingPeriods, createGradingPeriod, updateGradingPeriod, removeGradingPeriod, lockGradingPeriod } from '../../api/grading-period.api';
import toast from 'react-hot-toast';

const EMPTY = { school_year: '2024-2025', semester: 1, name: '', lock_date: '' };

export default function GradingPeriods() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    const res = await listGradingPeriods();
    if (res?.success) setItems(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (modal === 'create') {
        await createGradingPeriod(form);
        toast.success('Tạo kỳ chốt điểm thành công');
      } else {
        await updateGradingPeriod(editId, form);
        toast.success('Cập nhật thành công');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi');
    }
  };

  const handleLock = async (id) => {
    if (!confirm('Khóa kỳ này? Điểm draft sẽ chuyển sang published.')) return;
    await lockGradingPeriod(id);
    toast.success('Đã khóa kỳ chốt điểm');
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa kỳ chốt điểm này?')) return;
    await removeGradingPeriod(id);
    toast.success('Đã xóa');
    load();
  };

  return (
    <div>
      <PageHeader
        title="Kỳ chốt điểm"
        description="Quản lý hạn chốt sổ và tự động công bố điểm"
        actions={<Button onClick={() => { setForm(EMPTY); setModal('create'); }}><Plus size={16} /> Thêm kỳ</Button>}
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Tên kỳ</th>
              <th className="px-3 py-2 text-center">Năm học</th>
              <th className="px-3 py-2 text-center">HK</th>
              <th className="px-3 py-2 text-center">Hạn chốt</th>
              <th className="px-3 py-2 text-center">Trạng thái</th>
              <th className="px-3 py-2 text-right">HĐ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 text-center">{item.school_year}</td>
                <td className="px-3 py-2 text-center">HK{item.semester}</td>
                <td className="px-3 py-2 text-center">{item.lock_date ? new Date(item.lock_date).toLocaleDateString('vi') : '—'}</td>
                <td className="px-3 py-2 text-center">
                  {item.is_locked
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã khóa</span>
                    : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Đang mở</span>
                  }
                </td>
                <td className="px-3 py-2 text-right flex items-center justify-end gap-1">
                  {!item.is_locked && (
                    <>
                      <button onClick={() => { setForm(item); setEditId(item.id); setModal('edit'); }} className="p-1 hover:bg-slate-100 rounded"><Pencil size={14} /></button>
                      <button onClick={() => handleLock(item.id)} className="p-1 hover:bg-slate-100 rounded text-green-600"><Lock size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-slate-100 rounded text-red-500"><Trash2 size={14} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Chưa có kỳ chốt điểm nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal tạo/sửa */}
      {modal && (
        <Modal open onClose={() => setModal(null)} title={modal === 'create' ? 'Tạo kỳ chốt điểm' : 'Sửa kỳ chốt điểm'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tên kỳ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="VD: HK1 - Kiểm tra miệng" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Năm học</label>
                <input value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Học kỳ</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value={1}>HK1</option>
                  <option value={2}>HK2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hạn chốt sổ</label>
              <input type="datetime-local" value={form.lock_date?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, lock_date: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModal(null)}>Hủy</Button>
              <Button onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
