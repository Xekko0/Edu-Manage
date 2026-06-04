/**
 * S01 — Đăng nhập (SRS mục 7).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import AuthLayout, { AuthFooterLink } from '../components/auth/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.success) {
        toast.success('Đăng nhập thành công');
        navigate('/', { replace: true });
      } else {
        toast.error(res?.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      const msg =
        err?.message === 'Network Error'
          ? 'Không kết nối được API. Kiểm tra backend (cổng 3001) và CORS.'
          : err?.message || 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản do nhà trường cấp"
      footer={<AuthFooterLink to="/forgot-password">Quên mật khẩu?</AuthFooterLink>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@truong.edu.vn"
          autoFocus
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Đăng nhập
        </Button>
      </form>
    </AuthLayout>
  );
}
