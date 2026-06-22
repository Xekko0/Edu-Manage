/**
 * Skeleton — Placeholder loading mờ nhấp nháy (thay Spinner).
 * Dùng khi đang gọi API, mô phỏng hình dáng dữ liệu sắp hiển thị.
 */
export function SkeletonLine({ width = '100%', height = '12px', className = '' }) {
  return (
    <div
      className={`bg-zinc-200/60 rounded-md animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = 32, className = '' }) {
  return (
    <div
      className={`bg-zinc-200/60 rounded-full animate-pulse ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 p-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="10px"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine
              key={c}
              width={`${100 / cols}%`}
              height="10px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
