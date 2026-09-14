import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

function timeAgo(ts) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function BlacklistPage() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.listBlacklist().then(setEntries).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.addBlacklist(userId.trim(), reason.trim());
      setUserId("");
      setReason("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.removeBlacklist(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-1">Bot Blacklist</h1>
      <p className="text-white/40 text-sm mb-6">
        Users blocked from using Rift in any server. Separate from a per-server Discord ban.
      </p>

      <form onSubmit={add} className="bg-surface border border-border rounded-xl p-4 mb-6 flex gap-2 flex-wrap">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Discord user ID"
          className="flex-1 min-w-[160px] bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="flex-[2] min-w-[200px] bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
        />
        <button
          type="submit"
          disabled={busy || !userId.trim()}
          className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
        >
          Blacklist
        </button>
      </form>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      {!entries && !error && <div className="text-white/40 text-sm">Loading...</div>}
      {entries && entries.length === 0 && <div className="text-white/30 text-sm py-6 text-center">Nobody is blacklisted.</div>}

      <div className="space-y-2">
        {entries?.map((e) => (
          <div key={e.user_id} className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-sm">{e.user_id}</div>
              <div className="text-white/50 text-sm">{e.reason}</div>
              <div className="text-white/30 text-xs mt-0.5">by {e.banned_by_username} &middot; {timeAgo(e.banned_at)}</div>
            </div>
            <button
              onClick={() => remove(e.user_id)}
              disabled={busy}
              className="px-3 py-1.5 text-xs rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
