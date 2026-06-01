export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50 text-sm">
      <span className="text-slate-500">{total} bản ghi • Trang {page}/{totalPages}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-white"
        >
          ← Trước
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-white"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
