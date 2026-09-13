import React from "react";

export default function DataTable({ columns, rows, emptyLabel = "No data yet." }) {
  if (!rows || rows.length === 0) {
    return <div className="text-white/30 text-sm py-6 text-center">{emptyLabel}</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-white/40 text-xs uppercase text-left border-b border-border">
          {columns.map((c) => (
            <th key={c.key} className="px-4 py-3">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id ?? i} className="border-b border-border/50 last:border-0">
            {columns.map((c) => (
              <td key={c.key} className="px-4 py-3 text-white/70">
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
