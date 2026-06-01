import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getRoleHomePath } from '../../utils/navigation';

const navBtnClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-colors';

export default function PageHeader({ title, children, showNav = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const homePath = getRoleHomePath(user?.role);
  const isHome = location.pathname === homePath;

  return (
    <div className="mb-4">
      {showNav && !isHome && (
        <nav className="flex flex-wrap gap-2 mb-3" aria-label="Điều hướng trang">
          <button type="button" onClick={() => navigate(-1)} className={navBtnClass}>
            <span aria-hidden="true">←</span>
            Quay lại
          </button>
          <button type="button" onClick={() => navigate(homePath)} className={navBtnClass}>
            <span aria-hidden="true">⌂</span>
            Trang chủ
          </button>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}
