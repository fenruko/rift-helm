import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import DataTable from "../components/DataTable";
import DistributionChart from "../components/DistributionChart";
import RankingChart from "../components/RankingChart";
import { shortId } from "../components/chartTheme";

export default function VerificationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.verification(100).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Verification</h1>
      <p className="text-white/40 text-sm mb-6">Ban-evasion / fingerprint match flags across all guilds.</p>

      <div className="chart-grid">
        <DistributionChart
          title="Flags by reason"
          description="What triggered each flag."
          valueLabel="Flags"
          height={210}
          data={Object.entries(data.flags.reduce((totals, flag) => {
            const key = flag.reason || "unknown";
            totals[key] = (totals[key] || 0) + 1;
            return totals;
          }, {})).map(([name, value]) => ({ name, value }))}
        />
        <RankingChart
          title="Flags by guild"
          description="Where the flagged accounts were seen."
          valueLabel="Flags"
          data={Object.entries(data.flags.reduce((totals, flag) => {
            const key = shortId(flag.guild_id);
            totals[key] = (totals[key] || 0) + 1;
            return totals;
          }, {})).map(([name, value]) => ({ name, value }))}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={[
            { key: "user_id", label: "User" },
            { key: "matched_user_id", label: "Matched account" },
            { key: "guild_id", label: "Guild" },
            { key: "reason", label: "Reason" },
            {
              key: "timestamp",
              label: "When",
              render: (r) => new Date((r.timestamp ?? r.created_at) * 1000).toLocaleString(),
            },
          ]}
          rows={data.flags}
          emptyLabel="No verification flags on record."
        />
      </div>
    </div>
  );
}
