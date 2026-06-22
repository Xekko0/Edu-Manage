export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-5">
      <div className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 leading-tight">{title}</h1>
          {description && <p className="text-body mt-1 max-w-3xl">{description}</p>}
        </div>
        {children && (
          <div className="flex flex-wrap gap-2 shrink-0 max-w-full min-w-0 sm:justify-end">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
