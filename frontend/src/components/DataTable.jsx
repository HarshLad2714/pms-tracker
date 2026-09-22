import { downloadCsv } from '../lib/csv';
import { useTable } from '../hooks/useTable';

export default function DataTable({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search…',
  filters,
  filename = 'export',
  pageSize = 10,
  empty = 'No rows in this view.',
  actions,
}) {
  const table = useTable(rows, { pageSize, searchKeys });

  return (
    <div className="space-y-3">
      <div className="toolbar flex flex-wrap items-center gap-2">
        <input
          className="field !w-72 min-w-[16rem] flex-1"
          placeholder={searchPlaceholder}
          value={table.query}
          onChange={(e) => table.setQuery(e.target.value)}
        />
        {filters}
        <select className="field w-24" value={table.size} onChange={(e) => table.setSize(Number(e.target.value))}>
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => downloadCsv(filename, table.filtered, columns)}
          disabled={!table.filtered.length}
        >
          Export CSV
        </button>
        {actions}
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[0.16em] text-paper-200/40">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.pageRows.map((row, i) => (
              <tr key={row._id || row.id || i} className="border-t border-ink-700">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!table.pageRows.length && (
              <tr>
                <td className="px-4 py-10 text-center text-paper-200/50" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-paper-200/50">
        <p>
          {table.total} result{table.total === 1 ? '' : 's'}
          {table.query ? ` for “${table.query}”` : ''}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost" disabled={table.page <= 1} onClick={() => table.setPage((p) => p - 1)}>
            Prev
          </button>
          <span>
            {table.page} / {table.pages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            disabled={table.page >= table.pages}
            onClick={() => table.setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
