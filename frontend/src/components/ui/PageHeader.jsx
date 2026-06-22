export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">{title}</h1>
          {description && <p className="text-body mt-1 max-w-3xl">{description}</p>}
        </div>
        {children && (
          <div className="flex flex-wrap gap-2 shrink-0 max-w-full min-w-0 justify-end">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
