import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import MemberSearchInput from "../components/MemberSearchInput";
import UserLabel from "../components/UserLabel";

function timeAgo(ts) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const DURATIONS = [
  { key: "permanent", label: "Permanent" },
  { key: "1h", label: "1 hour" },
  { key: "1d", label: "1 day" },
  { key: "3d", label: "3 days" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

function HistoryPanel({ userId, onClose }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.blacklistHistory(userId).then(setHistory).catch((e) => setError(e.message));
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-5 max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">History for {userId}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {!history && !error && <div className="text-white/40 text-sm">Loading...</div>}
        {history?.length === 0 && <div className="text-white/30 text-sm text-center py-4">No history.</div>}
        <div className="flex-1 overflow-y-auto space-y-2">
          {history?.map((h) => (
            <div key={h.id} className="bg-panel border border-border rounded-lg p-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span className="uppercase font-medium">{h.action}</span>
                <span className="text-white/30">{timeAgo(h.created_at)}</span>
              </div>
              {h.reason && <div className="text-white/50 mt-1">{h.reason}</div>}
              {h.evidence && <div className="text-white/40 mt-0.5">Evidence: {h.evidence}</div>}
              {h.duration_label && <div className="text-white/30 mt-0.5">Duration: {h.duration_label}</div>}
              {h.staff_username && <div className="text-white/30 mt-0.5">by {h.staff_username}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlacklistPage() {
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(searchParams.get("u") || "");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [duration, setDuration] = useState("permanent");
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);

  const load = () => api.listBlacklist().then(setEntries).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  // Reset the confirmed lookup whenever the ID field changes so a stale
  // avatar/username can't get submitted for a different ID.
  useEffect(() => { setLookup(null); setLookupError(null); }, [userId]);

  const runLookup = async () => {
    if (!userId.trim()) return;
    setBusy(true);
    setLookupError(null);
    try {
      const data = await api.lookupBlacklistUser(userId.trim());
      setLookup(data);
    } catch (e) {
      setLookupError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.addBlacklist(userId.trim(), reason.trim(), evidence.trim() || undefined, duration);
      setUserId(""); setReason(""); setEvidence(""); setDuration("permanent"); setLookup(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (busy) return;
    setBusy(true);
    // Optimistically drop it from the list right away so a second click
    // (or the list reloading mid-request) can't re-trigger a "not
    // blacklisted" 404 that looks like the removal failed.
    setEntries((prev) => prev?.filter((e) => e.user_id !== id) ?? prev);
    try {
      await api.removeBlacklist(id);
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message);
      }
      // 404 here just means it was already removed (e.g. a duplicate
      // click) -- not a real error, so stay quiet and let load() below
      // resync with the server as the source of truth.
    } finally {
      load();
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-1">Bot Blacklist</h1>
      <p className="text-white/40 text-sm mb-6">
        Users blocked from using Rift in any server. Separate from a per-server Discord ban.
      </p>

      <form onSubmit={add} className="bg-surface border border-border rounded-xl p-4 mb-6 space-y-3">
        <div className="flex gap-2 flex-wrap items-start">
          <div className="flex-1 min-w-[160px]">
            <div className="flex gap-2">
              <div className="flex-1">
                <MemberSearchInput value={userId} onChange={setUserId} placeholder="Discord ID or username" />
              </div>
              <button
                type="button"
                onClick={runLookup}
                disabled={busy || !userId.trim()}
                className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 whitespace-nowrap"
              >
                Look up
              </button>
            </div>
            {lookupError && <div className="text-red-400 text-xs mt-1.5">{lookupError}</div>}
            {lookup && (
              <div className="flex items-center gap-2 mt-2 bg-panel border border-border rounded-lg p-2">
                <img src={lookup.avatar} className="w-8 h-8 rounded-full" alt="" />
                <div className="text-sm">
                  <div className="text-white">{lookup.username}</div>
                  {lookup.already_blacklisted && (
                    <div className="text-amber-400 text-xs">⚠ Already blacklisted</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
          >
            {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
        />
        <input
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Evidence / context (optional)"
          className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
        />

        <button
          type="submit"
          disabled={busy || !userId.trim() || (lookup && lookup.already_blacklisted)}
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
              <div className="text-white text-sm"><UserLabel id={e.user_id} /></div>
              <div className="text-white/50 text-sm">{e.reason}</div>
              {e.evidence && <div className="text-white/40 text-xs mt-0.5">Evidence: {e.evidence}</div>}
              <div className="text-white/30 text-xs mt-0.5">
                by {e.banned_by_username} &middot; {timeAgo(e.banned_at)}
                {e.duration_label && <> &middot; expires in {e.duration_label} from ban time</>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setHistoryFor(e.user_id)}
                className="px-3 py-1.5 text-xs rounded-lg text-white/50 hover:text-white hover:bg-white/5"
              >
                History
              </button>
              <button
                onClick={() => remove(e.user_id)}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {historyFor && <HistoryPanel userId={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}