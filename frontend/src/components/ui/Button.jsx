import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-white border border-slate-200 text-ink hover:bg-slate-50 shadow-sm',
  outline: 'border border-slate-300 text-ink hover:border-primary hover:bg-teal-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-ink-muted hover:text-ink hover:bg-slate-100',
  soft: 'bg-teal-50 text-teal-800 hover:bg-teal-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[40px]',
  lg: 'px-5 py-2.5 text-base min-h-[44px]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors whitespace-nowrap',
        'disabled:opacity-50 disabled:pointer-events-none focus-ring',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
