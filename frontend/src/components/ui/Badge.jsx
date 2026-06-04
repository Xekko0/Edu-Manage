import { cn } from '../../utils/cn';

export default function Badge({ children, color = 'slate', className = '' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    yellow: 'bg-amber-100 text-amber-700',
    blue: 'bg-cyan-100 text-cyan-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium', map[color] || map.slate, className)}>
      {children}
    </span>
  );
}
