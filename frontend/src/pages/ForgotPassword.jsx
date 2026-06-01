import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../api/auth.api';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-brand mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-slate-500 mb-6">
          Nhập email đăng ký. Ở môi trường demo, link đặt lại sẽ hiện ngay bên dưới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="email@truong.edu.vn"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Đang gửi…' : 'Gửi link đặt lại'}
          </button>
        </form>
        {resetUrl && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm break-all">
            <p className="font-medium text-amber-800 mb-1">Link demo (30 phút):</p>
            <Link to={resetUrl.replace(/^https?:\/\/[^/]+/, '')} className="text-brand underline">
              Đặt lại mật khẩu
            </Link>
          </div>
        )}
        <p className="text-center mt-4 text-sm">
          <Link to="/login" className="text-brand hover:underline">← Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
