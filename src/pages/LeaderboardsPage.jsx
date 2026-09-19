import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import UserLabel from "../components/UserLabel";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import RankingChart from "../components/RankingChart";
import StackedBarChart from "../components/StackedBarChart";
import { CHART_COLORS, shortId } from "../components/chartTheme";

export default function LeaderboardsPage() {
  const { hasPermission } = useAuth();
  const [levels, setLevels] = useState(null);
  const [invites, setInvites] = useState(null);
  const [giveaways, setGiveaways] = useState(null);
  const [confessions, setConfessions] = useState(null);

  useEffect(() => {
    if (hasPermission("levels.view")) api.levels(25).then(setLevels).catch(() => {});
    if (hasPermission("invites.view")) api.invites(25).then(setInvites).catch(() => {});
    if (hasPermission("giveaways.view")) api.giveaways().then(setGiveaways).catch(() => {});
    if (hasPermission("overview.view")) api.confessions().then(setConfessions).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Leaderboards</h1>

      {(levels || invites) && (
        <div className="chart-grid">
          {levels && (
            <RankingChart
              title="XP leaders"
              description="Top accounts from the loaded level leaderboard."
              valueLabel="XP"
              data={levels.slice(0, 8).map((row) => ({ name: shortId(row.user_id), value: Number(row.xp) || 0 }))}
            />
          )}
          {invites && (
            <StackedBarChart
              title="Invite breakdown"
              description="Real, bonus, fake and left invites per member."
              valueLabel="Top 8 invitees"
              data={invites.slice(0, 8).map((row) => ({ ...row, name: shortId(row.user_id) }))}
              series={[
                { key: "real", label: "Real", color: CHART_COLORS[0] },
                { key: "bonus", label: "Bonus", color: CHART_COLORS[1] },
                { key: "fake", label: "Fake", color: CHART_COLORS[3] },
                { key: "left", label: "Left", color: CHART_COLORS[4] },
              ]}
            />
          )}
        </div>
      )}

      {giveaways && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active giveaways" value={giveaways.active_giveaways} />
          <StatCard label="Total entrants" value={giveaways.total_entrants} />
          {confessions && <StatCard label="Confessions posted" value={confessions.total} />}
        </div>
      )}

      {levels && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Level leaderboard</div>
          <DataTable
            columns={[
              { key: "guild_id", label: "Guild" },
              { key: "user_id", label: "User", render: (r) => <UserLabel id={r.user_id} /> },
              { key: "level", label: "Level" },
              { key: "xp", label: "XP" },
            ]}
            rows={levels}
          />
        </div>
      )}

      {invites && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">Invite leaderboard</div>
          <DataTable
            columns={[
              { key: "user_id", label: "User", render: (r) => <UserLabel id={r.user_id} /> },
              { key: "real", label: "Real" },
              { key: "bonus", label: "Bonus" },
              { key: "fake", label: "Fake" },
              { key: "left", label: "Left" },
            ]}
            rows={invites}
          />
        </div>
      )}
    </div>
  );
}