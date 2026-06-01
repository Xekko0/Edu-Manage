import { useCallback, useMemo, useState } from 'react';

/** Phân trang client-side cho bảng dữ liệu. */
export default function usePagination(items, pageSize = 15) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));

  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    slice,
    total: items?.length || 0,
    resetPage,
  };
}
