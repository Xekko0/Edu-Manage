import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/auth.api';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-brand mb-6">Đặt lại mật khẩu</h1>
        {!token ? (
          <p className="text-red-600 text-sm">Link thiếu token. Vui lòng dùng link từ email hoặc trang quên MK.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Mật khẩu mới"
              required
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Xác nhận mật khẩu"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Đang lưu…' : 'Lưu mật khẩu'}
            </button>
          </form>
        )}
        <p className="text-center mt-4 text-sm">
          <Link to="/login" className="text-brand hover:underline">← Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
