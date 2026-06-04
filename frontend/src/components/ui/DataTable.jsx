import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * @param {{ key: string, label: string, render?: (row) => React.ReactNode, className?: string }[]} columns
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'Chưa có dữ liệu.',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-caption">Đang tải…</div>
    );
  }

  if (!data.length) {
    return (
      <div className="py-12 text-center text-slate-500">
        <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" aria-hidden />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto -mx-5 sm:mx-0', className)}>
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 text-left font-semibold text-slate-600', col.className)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[keyField] ?? idx}
              className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-slate-800', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
