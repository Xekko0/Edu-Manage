import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/auth.api';
import AuthLayout, { AuthFooterLink } from '../components/auth/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Link không hợp lệ');
    if (password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự');
    if (password !== confirm) return toast.error('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res?.success) {
        toast.success('Đặt lại mật khẩu thành công');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.error(err?.message || 'Đặt lại thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      footer={<AuthFooterLink to="/login">← Đăng nhập</AuthFooterLink>}
    >
      {!token ? (
        <p className="text-rose-600 text-sm">Link thiếu token. Vui lòng dùng link từ email hoặc trang quên MK.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Lưu mật khẩu
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
