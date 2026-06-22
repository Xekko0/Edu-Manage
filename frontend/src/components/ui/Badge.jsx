import { cn } from '../../utils/cn';

export default function Badge({ children, color = 'slate', className = '' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-rose-50 text-rose-700 ring-rose-200',
    yellow: 'bg-amber-50 text-amber-800 ring-amber-200',
    blue: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    teal: 'bg-teal-50 text-teal-800 ring-teal-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1', map[color] || map.slate, className)}>
      {children}
    </span>
  );
}
