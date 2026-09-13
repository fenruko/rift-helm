import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

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
              { key: "user_id", label: "User" },
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
              { key: "user_id", label: "User" },
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
