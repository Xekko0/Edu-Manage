import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen, UserCheck,
  Calendar, Wallet, BarChart3, CalendarDays, Sparkles, Bell, PenLine,
  NotebookPen, MessageSquare, Home, ClipboardCheck, UsersRound,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getNavSections } from './navConfig';

const ICON_MAP = {
  LayoutDashboard, Users, GraduationCap, School, BookOpen, UserCheck,
  Calendar, Wallet, BarChart3, CalendarDays, Sparkles, Bell, PenLine,
  NotebookPen, MessageSquare, Home, ClipboardCheck, UsersRound,
};

function NavItem({ to, label, icon, end, onNavigate }) {
  const Icon = icon ? ICON_MAP[icon] : null;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />}
      <span>{label}</span>
    </NavLink>
  );
}

export default function NavMenu({ user, onNavigate, className = '' }) {
  const sections = getNavSections(user);

  return (
    <nav className={cn('space-y-6', className)} aria-label="Menu chính">
      {sections.map((section) => (
        <div key={section.title || 'default'}>
          {section.title && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((it) => (
              <NavItem key={it.to} {...it} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
