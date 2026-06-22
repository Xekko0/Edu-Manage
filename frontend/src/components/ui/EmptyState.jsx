import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function EmptyState({
  title = 'Chưa có dữ liệu',
  message,
  description,
  children,
  className = '',
}) {
  const desc = description || message;
  const displayTitle = message && !description ? 'Chưa có dữ liệu' : title;
  const displayDesc = message && !description ? message : desc;
  return (
    <div className={cn('py-12 px-6 text-center', className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="w-6 h-6 text-slate-400" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{displayTitle}</p>
      {displayDesc && <p className="text-body mt-1 max-w-md mx-auto">{displayDesc}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
