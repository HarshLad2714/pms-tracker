function cell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, rows, columns) {
  const head = columns.map((c) => cell(c.header)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.exportValue === 'function' ? c.exportValue(row) : row[c.key];
          return cell(raw);
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`${head}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}
