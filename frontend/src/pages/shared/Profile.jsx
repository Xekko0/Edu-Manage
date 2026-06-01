import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { changePassword } from '../../api/auth.api';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 6) return toast.error('Mật khẩu mới tối thiểu 6 ký tự');
    if (form.new_password !== form.confirm) return toast.error('Xác nhận không khớp');
    setSaving(true);
    try {
      const res = await changePassword(form.current_password, form.new_password);
      if (res?.success) {
        toast.success('Đổi mật khẩu thành công');
        setForm({ current_password: '', new_password: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="Tài khoản của tôi" />
      <div className="bg-white border rounded-lg p-6 mb-6">
        <p className="text-sm text-slate-500">Họ tên</p>
        <p className="font-medium">{user?.full_name}</p>
        <p className="text-sm text-slate-500 mt-3">Email</p>
        <p className="font-medium">{user?.email}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Đổi mật khẩu</h2>
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          required
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          required
        />
        <Input
          label="Xác nhận mật khẩu mới"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
        />
        <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu mật khẩu'}</Button>
      </form>
    </div>
  );
}
