import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getRoleHomePath } from '../../utils/navigation';

const ROLE_LABEL = {
  admin: 'Quản trị viên',
  subject: 'GVBM',
  parent: 'Phụ huynh',
  student: 'Học sinh',
};

const navBtnClass =
  'px-3 py-1.5 text-sm rounded-md border border-slate-300 hover:bg-slate-100';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = getRoleHomePath(user?.role);
  const isHome = location.pathname === homePath;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between gap-2">
      <div className="text-sm text-slate-500 min-w-0 truncate">
        Xin chào, <b>{user?.full_name || 'người dùng'}</b> • {ROLE_LABEL[user?.role]}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isHome && (
          <>
            <button type="button" onClick={() => navigate(-1)} className={`${navBtnClass} md:hidden`}>
              ← Quay lại
            </button>
            <button type="button" onClick={() => navigate(homePath)} className={`${navBtnClass} md:hidden`}>
              Trang chủ
            </button>
          </>
        )}
        <button type="button" onClick={() => navigate('/profile')} className={navBtnClass}>
          Tài khoản
        </button>
        <button type="button" onClick={handleLogout} className={navBtnClass}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
