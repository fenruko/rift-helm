import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";

export default function TicketsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.tickets().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Tickets & Reports</h1>

      <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Tickets</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Open" value={data.tickets.open} tone="warn" />
        <StatCard label="Closed" value={data.tickets.closed} tone="good" />
        <StatCard
          label="Avg resolution"
          value={data.tickets.avg_resolution_seconds ? `${Math.round(data.tickets.avg_resolution_seconds / 60)}m` : "--"}
        />
      </div>

      <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Modmail</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Open threads" value={data.modmail.open} tone="warn" />
        <StatCard label="Total threads" value={data.modmail.total} />
      </div>

      <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Reports</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total reports" value={data.reports.total} />
        {Object.entries(data.reports.by_status).map(([status, count]) => (
          <StatCard key={status} label={status} value={count} />
        ))}
      </div>
    </div>
  );
}
