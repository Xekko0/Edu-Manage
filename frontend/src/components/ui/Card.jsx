import { cn } from '../../utils/cn';

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={cn('app-panel', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className = '' }) {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2', className)}>
      <div>
        {title && <h2 className="text-h2">{title}</h2>}
        {description && <p className="text-body mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export default Card;
