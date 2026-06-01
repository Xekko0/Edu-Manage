/**
 * S01 — Đăng nhập (SRS mục 7).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand">EduSmart</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống Quản lý Học sinh v1.1</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:outline-none"
              placeholder="email@truong.edu.vn"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2 rounded-md font-medium hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-brand hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
