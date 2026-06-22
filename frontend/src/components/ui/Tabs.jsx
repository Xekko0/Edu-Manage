/** Tab bar đơn giản — không phụ thuộc thư viện ngoài. */
export default function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`border-b border-slate-200 mb-4 ${className}`}>
      <nav className="flex flex-wrap gap-0.5 -mb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-1.5 text-amber-600" title="Cần chú ý">⚠</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
