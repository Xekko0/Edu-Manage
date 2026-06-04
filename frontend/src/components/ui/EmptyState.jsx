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
      <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-300" aria-hidden />
      <p className="text-sm font-medium text-slate-700">{displayTitle}</p>
      {displayDesc && <p className="text-caption mt-1 max-w-md mx-auto">{displayDesc}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
