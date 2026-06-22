/**
 * RiskBadge — Hiển thị mức rủi ro EWS với màu sắc.
 */
const RISK_CONFIG = {
  low: { label: 'An toàn', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Cần theo dõi', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'Nguy cơ', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Nguy hiểm', color: 'bg-red-100 text-red-700' },
};

export default function RiskBadge({ level, showLabel = true }) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === 'critical' || level === 'high' ? 'animate-pulse' : ''} ${
        level === 'critical' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      {showLabel && config.label}
    </span>
  );
}
