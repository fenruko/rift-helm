import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import UserLabel from "../components/UserLabel";
import DataTable from "../components/DataTable";
import DistributionChart from "../components/DistributionChart";
import RankingChart from "../components/RankingChart";
import { shortId } from "../components/chartTheme";

export default function VoicePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.voice(50).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Voice</h1>

      <div className="chart-grid">
        <DistributionChart
          title="Listeners per session"
          description="People currently connected to each voice channel."
          valueLabel="Listeners"
          height={210}
          data={data.active_sessions.map((s) => ({ name: s.channel, value: Number(s.listeners) || 0 }))}
        />
        <RankingChart
          title="Top voice minutes"
          description="Most time in voice, from the loaded leaderboard."
          valueLabel="Minutes"
          data={data.voice_xp_leaderboard.slice(0, 8).map((row) => ({ name: shortId(row.user_id), value: Number(row.minutes) || 0 }))}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">
          Active voice sessions ({data.active_sessions.length})
        </div>
        <DataTable
          columns={[
            { key: "guild_name", label: "Guild" },
            { key: "channel", label: "Channel" },
            { key: "listeners", label: "Listeners" },
          ]}
          rows={data.active_sessions}
          emptyLabel="No active voice sessions right now."
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Voice XP leaderboard</div>
        <DataTable
          columns={[
            { key: "guild_id", label: "Guild" },
            { key: "user_id", label: "User", render: (r) => <UserLabel id={r.user_id} /> },
            { key: "minutes", label: "Minutes" },
          ]}
          rows={data.voice_xp_leaderboard}
        />
      </div>
    </div>
  );
}