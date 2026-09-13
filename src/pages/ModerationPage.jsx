import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

export default function ModerationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.moderation(7).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Moderation</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total warnings" value={data.warnings.total} />
        {Object.entries(data.action_counts).slice(0, 3).map(([type, count]) => (
          <StatCard key={type} label={type} value={count} sub="last 7 days" />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Top moderators</div>
          <DataTable
            columns={[
              { key: "moderator_id", label: "Moderator" },
              { key: "bans", label: "Bans" },
              { key: "kicks", label: "Kicks" },
              { key: "mutes", label: "Mutes" },
              { key: "warns", label: "Warns" },
              { key: "total", label: "Total" },
            ]}
            rows={data.top_moderators}
          />
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Warnings by guild</div>
          <DataTable
            columns={[
              { key: "guild_id", label: "Guild ID" },
              { key: "count", label: "Warnings" },
            ]}
            rows={data.warnings.top_guilds}
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Recent actions</div>
        <DataTable
          columns={[
            { key: "action_type", label: "Action" },
            { key: "moderator_id", label: "Moderator" },
            { key: "target_id", label: "Target" },
            { key: "reason", label: "Reason" },
            { key: "guild_id", label: "Guild" },
          ]}
          rows={data.recent_actions}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Antinuke / antiraid triggers</div>
        <DataTable
          columns={[
            { key: "guild_id", label: "Guild" },
            { key: "actor_id", label: "Actor" },
            { key: "event_type", label: "Event" },
            { key: "count", label: "Count" },
            { key: "punishment", label: "Punishment" },
          ]}
          rows={data.antinuke_logs}
        />
      </div>
    </div>
  );
}
