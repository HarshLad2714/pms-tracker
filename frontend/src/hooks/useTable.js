import { useEffect, useMemo, useState } from 'react';
import { getPath } from '../lib/csv';

export function useTable(rows, { pageSize = 10, searchKeys = [] } = {}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(pageSize);

  const filtered = useMemo(() => {
    const list = rows || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((row) =>
      searchKeys.some((key) => {
        const value = typeof key === 'function' ? key(row) : getPath(row, key);
        return String(value ?? '').toLowerCase().includes(needle);
      })
    );
  }, [rows, query, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));

  useEffect(() => {
    setPage(1);
  }, [query, size, rows]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  }, [filtered, page, size]);

  return {
    query,
    setQuery,
    page,
    setPage,
    size,
    setSize,
    pages,
    filtered,
    pageRows,
    total: filtered.length,
  };
}
