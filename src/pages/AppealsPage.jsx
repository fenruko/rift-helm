import React, { useEffect, useState, useCallback, useRef } from "react";
import { api, connectExecSocket } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: null, label: "Open", filterStatus: "open" },
  { key: "claimed", label: "Claimed", filterStatus: "claimed" },
  { key: "approved", label: "Approved", filterStatus: "approved" },
  { key: "denied", label: "Denied", filterStatus: "denied" },
];

function timeAgo(ts) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function AppealDetail({ appeal, onChange, onClose }) {
  const { user, hasPermission } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const canManage = hasPermission("appeals.manage");

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const isMine = appeal.claimed_by_username === user?.username;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-lg">Appeal #{appeal.id}</h3>
            <div className="text-white/40 text-xs mt-0.5">
              User {appeal.user_id} &middot; {timeAgo(appeal.created_at)} &middot;{" "}
              <span className="uppercase">{appeal.status}</span>
              {appeal.claimed_by_username && ` (claimed by ${appeal.claimed_by_username})`}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
        </div>

        <div className="text-white/70 text-sm bg-panel border border-border rounded-lg p-3 mb-2">
          <div className="text-white/40 text-xs mb-1">Reason</div>
          {appeal.reason}
        </div>

        {appeal.evidence && (
          <div className="text-white/70 text-sm bg-panel border border-border rounded-lg p-3 mb-2">
            <div className="text-white/40 text-xs mb-1">Evidence / context</div>
            {appeal.evidence}
          </div>
        )}

        <div className="flex-1 overflow-y-auto my-2 space-y-2">
          {appeal.messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg p-2 ${m.is_staff ? "bg-blue-600/10 border border-blue-600/20" : "bg-panel border border-border"}`}
            >
              <div className="text-white/40 text-xs mb-0.5">{m.author} &middot; {timeAgo(m.ts)}</div>
              <div className="text-white/80">{m.text}</div>
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

        {canManage && appeal.status !== "approved" && appeal.status !== "denied" && (
          <>
            {appeal.status === "open" && (
              <button
                disabled={busy}
                onClick={() => run(() => api.claimAppeal(appeal.id))}
                className="w-full mb-2 px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium disabled:opacity-40"
              >
                Claim this appeal
              </button>
            )}

            {appeal.status === "claimed" && isMine && (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reply to the user..."
                    className="flex-1 bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                  <button
                    disabled={busy || !note.trim()}
                    onClick={() => run(async () => { await api.messageAppeal(appeal.id, note); setNote(""); })}
                    className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => run(() => api.resolveAppeal(appeal.id, "approved", note))}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-green-600/90 hover:bg-green-600 text-white font-medium disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => run(() => api.resolveAppeal(appeal.id, "denied", note))}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-medium disabled:opacity-40"
                  >
                    Deny
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => run(() => api.unclaimAppeal(appeal.id))}
                    className="px-4 py-2 text-sm rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                  >
                    Unclaim
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {appeal.status === "approved" && (
          <div className="text-green-400/80 text-xs bg-green-600/10 border border-green-600/20 rounded-lg p-2">
            Approved. Remember: this doesn't lift the ban automatically -- do that from the Moderation page.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppealsPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [appeals, setAppeals] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [live, setLive] = useState(false);
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const load = useCallback(() => {
    api.listAppeals(tab.filterStatus).then(setAppeals).catch((e) => setError(e.message));
  }, [tab]);

  useEffect(() => { setAppeals(null); load(); }, [load]);

  // Live updates: the same /ws/exec socket the Overview page uses also
  // carries appeal_submitted / appeal_claimed / appeal_updated /
  // appeal_resolved events. We don't trust the partial payload on the
  // message itself -- just treat it as "something changed" and refetch.
  useEffect(() => {
    const disconnect = connectExecSocket((msg) => {
      if (!msg.type || !msg.type.startsWith("appeal_")) return;
      setLive(true);
      load();
      if (selectedRef.current && msg.id === selectedRef.current.id) {
        api.getAppeal(msg.id).then(setSelected).catch(() => {});
      }
    });
    return disconnect;
  }, [load]);

  const openDetail = async (id) => {
    const full = await api.getAppeal(id);
    setSelected(full);
  };

  const refreshSelected = async () => {
    load();
    if (selected) setSelected(await api.getAppeal(selected.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">Ban Appeals</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${live ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/30"}`}>
          {live ? "● Live" : "Connecting..."}
        </span>
      </div>

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab.label === t.label ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      {!appeals && !error && <div className="text-white/40 text-sm">Loading...</div>}
      {appeals && appeals.length === 0 && (
        <div className="text-white/30 text-sm py-6 text-center">No appeals here.</div>
      )}

      <div className="space-y-2">
        {appeals?.map((a) => (
          <button
            key={a.id}
            onClick={() => openDetail(a.id)}
            className="w-full text-left bg-surface border border-border rounded-lg p-3 hover:border-white/20"
          >
            <div className="flex justify-between text-sm">
              <span className="text-white">Appeal #{a.id} &middot; user {a.user_id}</span>
              <span className="text-white/40">{timeAgo(a.created_at)}</span>
            </div>
            <div className="text-white/50 text-sm mt-1 line-clamp-2">{a.reason}</div>
            {a.claimed_by_username && (
              <div className="text-white/30 text-xs mt-1">Claimed by {a.claimed_by_username}</div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <AppealDetail appeal={selected} onChange={refreshSelected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
