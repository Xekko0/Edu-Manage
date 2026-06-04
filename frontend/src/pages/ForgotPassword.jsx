import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../api/auth.api';
import AuthLayout, { AuthFooterLink } from '../components/auth/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Nhập email');
    setLoading(true);
    setResetUrl('');
    try {
      const res = await forgotPassword(email);
      if (res?.success) {
        toast.success(res.message || 'Đã gửi yêu cầu');
        if (res.data?.resetUrl) setResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      toast.error(err?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email đăng ký. Ở môi trường demo, link đặt lại sẽ hiện ngay bên dưới."
      footer={<AuthFooterLink to="/login">← Đăng nhập</AuthFooterLink>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@truong.edu.vn"
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Gửi link đặt lại
        </Button>
      </form>
      {resetUrl && (
        <Card className="mt-4 border-amber-200 bg-amber-50/50">
          <CardBody className="!py-3 text-sm">
            <p className="font-medium text-amber-900 mb-1">Link demo (30 phút):</p>
            <Link to={resetUrl.replace(/^https?:\/\/[^/]+/, '')} className="text-primary font-medium break-all">
              Đặt lại mật khẩu
            </Link>
          </CardBody>
        </Card>
      )}
    </AuthLayout>
  );
}
