import type { ReactNode } from 'react';

export interface Column<T> {
  key: Extract<keyof T, string>;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === 'right' ? 'align-right' : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'right' ? 'align-right' : undefined}>
                  {column.render ? column.render(row) : String(row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}) {
  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="pager">
      <button type="button" className="btn-ghost" disabled={offset <= 0} onClick={() => onChange(Math.max(0, offset - limit))}>
        Prev
      </button>
      <span>
        Page {page} of {pageCount} · {total.toLocaleString()} records
      </span>
      <button
        type="button"
        className="btn-ghost"
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        Next
      </button>
    </div>
  );
}
