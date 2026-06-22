import { cn } from '../../utils/cn';

const accents = {
  slate: 'border-slate-200 bg-white',
  teal: 'border-teal-200 bg-white',
  blue: 'border-cyan-200 bg-white',
  green: 'border-emerald-200 bg-white',
  amber: 'border-amber-200 bg-white',
  purple: 'border-violet-200 bg-white',
  red: 'border-rose-200 bg-white',
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
        <div className="text-sm font-medium text-ink-muted">{label}</div>
        {Icon && <Icon className="w-5 h-5 text-primary shrink-0 opacity-80" aria-hidden />}
      </div>
      <div className={cn('text-3xl font-semibold mt-1 tabular-nums', valueColors[accentKey] || valueColors.slate)}>
        {value ?? '—'}
      </div>
      {hint && <div className="text-caption mt-1">{hint}</div>}
    </div>
  );
}
