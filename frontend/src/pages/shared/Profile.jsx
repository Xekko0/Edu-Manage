import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import RoleBadge from '../../components/ui/RoleBadge';
import { resolveNavPersona } from '../../components/layout/navConfig';
import { changePassword } from '../../api/auth.api';

export default function Profile() {
  const { user } = useAuth();
  const persona = resolveNavPersona(user);
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

      <Card className="mb-6">
        <CardHeader title="Thông tin" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <RoleBadge persona={persona} />
          </div>
          <div>
            <p className="text-caption">Họ tên</p>
            <p className="font-medium text-slate-900">{user?.full_name}</p>
          </div>
          <div>
            <p className="text-caption">Email</p>
            <p className="font-medium text-slate-900">{user?.email}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Đổi mật khẩu" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" loading={saving}>Lưu mật khẩu</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
