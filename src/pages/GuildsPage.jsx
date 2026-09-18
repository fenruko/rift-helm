import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import RankingChart from "../components/RankingChart";

export default function GuildsPage() {
  const { hasPermission } = useAuth();
  const [guilds, setGuilds] = useState([]);
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [search, setSearch] = useState("");

  const canLeave = hasPermission("guilds.leave");

  const load = () => api.guilds().then(setGuilds).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = guilds.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search)
  );

  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">Guilds ({guilds.length})</h1>
        <input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-white/30 w-64"
        />
      </div>

      <RankingChart
        title="Members by guild"
        description="Member counts across the servers the bot is in."
        valueLabel="Members"
        maxItems={10}
        data={guilds.map((g) => ({ name: g.name, value: Number(g.member_count) || 0 }))}
      />

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase text-left border-b border-border">
              <th className="px-4 py-3">Guild</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Boosts</th>
              <th className="px-4 py-3">Owner ID</th>
              <th className="px-4 py-3">Created</th>
              {canLeave && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 text-white flex items-center gap-2">
                  {g.icon && <img src={g.icon} className="w-6 h-6 rounded-full" alt="" />}
                  <div>
                    <div>{g.name}</div>
                    <div className="text-white/30 text-xs">{g.id}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/60">{g.member_count?.toLocaleString()}</td>
                <td className="px-4 py-3 text-white/60">
                  Lvl {g.boost_level} ({g.boost_count})
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">{g.owner_id}</td>
                <td className="px-4 py-3 text-white/40 text-xs">
                  {g.created_at ? new Date(g.created_at).toLocaleDateString() : "--"}
                </td>
                {canLeave && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setLeaving(g)} className="text-red-400/70 hover:text-red-400 text-xs">
                      Leave
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaving && (
        <ConfirmModal
          title={`Leave ${leaving.name}?`}
          description="The bot will immediately leave this server. It can be re-invited later, but all live state (voice sessions, active tickets) in it will be lost."
          confirmWord={leaving.name}
          confirmLabel="Leave server"
          danger
          onCancel={() => setLeaving(null)}
          onConfirm={async () => {
            try {
              await api.leaveGuild(leaving.id);
              setLeaving(null);
              load();
            } catch (e) {
              setError(e.message);
              setLeaving(null);
            }
          }}
        />
      )}
    </div>
  );
}
