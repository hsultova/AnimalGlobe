import { useMemo, useState } from 'react';

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // If the list shrinks (e.g. after filtering), don't stay on a page that no longer exists
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (next: number) =>
    setPage(Math.min(Math.max(1, next), totalPages));

  return { page: currentPage, totalPages, pageItems, goToPage };
}
