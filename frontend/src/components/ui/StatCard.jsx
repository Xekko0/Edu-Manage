import { cn } from '../../utils/cn';

const accents = {
  slate: 'border-slate-200 bg-white',
  teal: 'border-teal-100 bg-teal-50/50',
  blue: 'border-cyan-100 bg-cyan-50/50',
  green: 'border-emerald-100 bg-emerald-50/50',
  amber: 'border-amber-100 bg-amber-50/50',
  purple: 'border-violet-100 bg-violet-50/50',
  red: 'border-rose-100 bg-rose-50/50',
  /* legacy color names */
  blue_legacy: 'border-cyan-100 bg-cyan-50/50',
};

const valueColors = {
  teal: 'text-teal-800',
  blue: 'text-cyan-800',
  green: 'text-emerald-800',
  amber: 'text-amber-800',
  purple: 'text-violet-800',
  red: 'text-rose-800',
  slate: 'text-slate-900',
};

export default function StatCard({ label, value, hint, color = 'slate', icon: Icon, className = '' }) {
  const accentKey = color === 'blue' ? 'blue' : color;
  return (
    <div className={cn('p-5 rounded-card border shadow-card', accents[accentKey] || accents.slate, className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {Icon && <Icon className="w-5 h-5 text-primary shrink-0 opacity-80" aria-hidden />}
      </div>
      <div className={cn('text-3xl font-bold mt-1 tabular-nums', valueColors[accentKey] || valueColors.slate)}>
        {value ?? '—'}
      </div>
      {hint && <div className="text-caption mt-1">{hint}</div>}
    </div>
  );
}
