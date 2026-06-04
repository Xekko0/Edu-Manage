import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { getRoleHomePath } from '../../utils/navigation';
import NavMenu from './NavMenu';

export default function SidebarDesktop({ user }) {
  const homePath = getRoleHomePath(user?.role, user?.capabilities);

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 min-h-screen shrink-0">
      <div className="p-4 border-b border-slate-100">
        <NavLink to={homePath} className="flex items-center gap-2.5 group">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white">
            <GraduationCap className="w-5 h-5" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
              EduSmart
            </span>
            <span className="block text-caption">Quản lý học sinh</span>
          </span>
        </NavLink>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavMenu user={user} />
      </div>
    </aside>
  );
}
