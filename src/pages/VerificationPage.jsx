import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import DataTable from "../components/DataTable";

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
              render: (r) => new Date(r.timestamp * 1000).toLocaleString(),
            },
          ]}
          rows={data.flags}
          emptyLabel="No verification flags on record."
        />
      </div>
    </div>
  );
}
