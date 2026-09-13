import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

export default function EconomyPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.economy(50).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Economy</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Accounts" value={data.totals.total_accounts} />
        <StatCard label="Total balance" value={data.totals.total_balance.toLocaleString()} />
        <StatCard label="Average balance" value={data.totals.average_balance.toLocaleString()} />
        <StatCard label="Richest balance" value={data.totals.richest_balance.toLocaleString()} />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">
          Balance leaderboard
        </div>
        <DataTable
          columns={[
            { key: "rank", label: "#" },
            { key: "user_id", label: "User ID" },
            { key: "guild_id", label: "Guild ID" },
            { key: "balance", label: "Balance", render: (r) => r.balance.toLocaleString() },
          ]}
          rows={data.leaderboard.map((r, i) => ({ ...r, rank: i + 1 }))}
        />
      </div>
    </div>
  );
}
