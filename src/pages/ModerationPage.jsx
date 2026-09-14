import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import MemberSearchInput from "../components/MemberSearchInput";

const ACTIONS = [
  { key: "warn", label: "Warn" },
  { key: "timeout", label: "Timeout (1h)" },
  { key: "untimeout", label: "Remove timeout" },
  { key: "kick", label: "Kick" },
  { key: "ban", label: "Ban" },
];

function UserActions() {
  const [q, setQ] = useState("");
  const [profile, setProfile] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    if (!q.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      setProfile(await api.modUserLookup(q.trim()));
    } catch (e) {
      setError(e.message); setProfile(null);
    } finally {
      setBusy(false);
    }
  };

  const act = async (action) => {
    if (!profile) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const res = await api.modAction({
        guild_id: profile.guild_id, action, target: profile.user.id,
        reason: reason.trim() || "No reason provided",
      });
      setNotice(`${action} → ${res.status}`);
      setReason("");
      lookup();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="text-white/60 text-sm font-medium mb-3">User lookup & actions</div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <MemberSearchInput value={q} onChange={setQ} placeholder="Discord ID or username" />
        </div>
        <button
          onClick={lookup}
          disabled={busy || !q.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
        >
          Look up
        </button>
      </div>

      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      {notice && <div className="text-emerald-400 text-xs mb-2">{notice}</div>}

      {profile && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {profile.user.avatar && <img src={profile.user.avatar} className="w-8 h-8 rounded-full" alt="" />}
            <div>
              <div className="text-white text-sm">{profile.user.name} <span className="text-white/40">@{profile.user.username}</span></div>
              <div className="text-white/40 text-xs">
                {profile.guild_name} &middot; {profile.warn_count} warns
                {profile.user.is_banned && <span className="text-red-400"> &middot; banned</span>}
                {profile.user.timed_out && <span className="text-yellow-400"> &middot; timed out</span>}
              </div>
            </div>
          </div>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="w-full bg-panel border border-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
          />
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => act(a.key)}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
          </div>

          {profile.warnings.length > 0 && (
            <div>
              <div className="text-white/40 text-xs mb-1.5">Recent warnings</div>
              <div className="space-y-1.5">
                {profile.warnings.slice(0, 5).map((w) => (
                  <div key={w.id} className="bg-panel border border-border rounded-lg p-2 text-xs text-white/70">
                    {w.reason} <span className="text-white/30">by {w.moderator}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModerationPage() {
  const { hasPermission } = useAuth();
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

      {hasPermission("moderation.manage") && <UserActions />}

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
