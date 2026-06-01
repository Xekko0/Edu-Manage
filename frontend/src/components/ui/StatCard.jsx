export default function StatCard({ label, value, hint, color = 'slate', className = '' }) {
  const colors = {
    slate: 'bg-white border',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };

  return (
    <div className={`p-5 rounded-xl border ${colors[color]} ${className}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value ?? '—'}</div>
      {hint && <div className="text-xs opacity-70 mt-1">{hint}</div>}
    </div>
  );
}
