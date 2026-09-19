import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api, connectExecSocket, attachmentUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import DistributionChart from "../components/DistributionChart";

const TABS = [
  { key: null, label: "Open", filterStatus: "open" },
  { key: "claimed", label: "Claimed", filterStatus: "claimed" },
  { key: "approved", label: "Approved", filterStatus: "approved" },
  { key: "denied", label: "Denied", filterStatus: "denied" },
];

const CANNED_RESPONSES = [
  "Thanks for the additional info -- taking a closer look now.",
  "Could you clarify what happened leading up to this?",
  "We've reviewed your appeal and need a bit more evidence before deciding.",
  "This has been approved -- you should have access again shortly.",
  "After review, we're not able to approve this appeal.",
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const AGE_BUCKETS = [
  { label: "Under 1h", max: 3600 },
  { label: "1-24h", max: 86400 },
  { label: "1-7d", max: 604800 },
  { label: "Over 7d", max: Infinity },
];

// Where the queue stands: how long the appeals in the current tab have
// been sitting there.
function ageBuckets(appeals) {
  const rows = AGE_BUCKETS.map((bucket) => ({ name: bucket.label, value: 0 }));
  const now = Date.now() / 1000;
  for (const appeal of appeals) {
    const age = Math.max(0, now - (Number(appeal.created_at) || now));
    const index = Math.max(0, AGE_BUCKETS.findIndex((bucket) => age < bucket.max));
    rows[index].value += 1;
  }
  return rows;
}

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
  const [images, setImages] = useState([]); // {id, previewUrl}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const canManage = hasPermission("appeals.manage");
  const canManageBlacklist = hasPermission("blacklist.manage");

  const addImage = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const { id } = await api.uploadExecAppealImage(appeal.id, dataUrl);
      setImages((prev) => [...prev, { id, previewUrl: dataUrl }]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      addImage(item.getAsFile());
    }
  };

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
  const bl = appeal.blacklist_status;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {appeal.avatar_snapshot && (
              <img src={appeal.avatar_snapshot} className="w-10 h-10 rounded-full" alt="" />
            )}
            <div>
              <h3 className="text-white font-semibold text-lg">
                {appeal.username_snapshot || `Appeal #${appeal.id}`}
              </h3>
              <div className="text-white/40 text-xs mt-0.5">
                User {appeal.user_id} &middot; {timeAgo(appeal.created_at)} &middot;{" "}
                <span className="uppercase">{appeal.status}</span>
                {appeal.claimed_by_username && ` (claimed by ${appeal.claimed_by_username})`}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
        </div>

        {bl && (
          <div
            className={`text-xs rounded-lg p-2 mb-2 border ${
              bl.blacklisted
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/20 text-amber-300"
            }`}
          >
            {bl.blacklisted ? (
              <>Confirmed blacklisted by <strong>{bl.banned_by_username}</strong>: {bl.reason}</>
            ) : (
              <>⚠ This user is <strong>not currently blacklisted</strong> -- this may be a mistaken or trolling submission.</>
            )}
          </div>
        )}

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

        {appeal.evidence_attachment_ids?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {appeal.evidence_attachment_ids.map((id) => (
              <a key={id} href={attachmentUrl(id)} target="_blank" rel="noreferrer">
                <img
                  src={attachmentUrl(id)}
                  alt="evidence"
                  className="w-20 h-20 object-cover rounded-lg border border-border hover:border-white/30"
                />
              </a>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto my-2 space-y-2">
          {appeal.messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg p-2 ${m.is_staff ? "bg-blue-600/10 border border-blue-600/20" : "bg-panel border border-border"}`}
            >
              <div className="text-white/40 text-xs mb-0.5">{m.author} &middot; {timeAgo(m.ts)}</div>
              {m.text && <div className="text-white/80">{m.text}</div>}
              {m.attachment_ids?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {m.attachment_ids.map((id) => (
                    <a key={id} href={attachmentUrl(id)} target="_blank" rel="noreferrer">
                      <img
                        src={attachmentUrl(id)}
                        alt="attachment"
                        className="w-20 h-20 object-cover rounded-lg border border-border hover:border-white/30"
                      />
                    </a>
                  ))}
                </div>
              )}
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
                  <select
                    onChange={(e) => { if (e.target.value) setNote(e.target.value); e.target.value = ""; }}
                    defaultValue=""
                    className="bg-panel border border-border rounded-lg px-2 py-2 text-xs text-white/60 outline-none"
                  >
                    <option value="">Quick reply...</option>
                    {CANNED_RESPONSES.map((c) => <option key={c} value={c}>{c.slice(0, 40)}...</option>)}
                  </select>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Reply to the user... (paste or attach a screenshot)"
                    className="flex-1 bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                  />
                  <label className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                    📎
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ""; }}
                    />
                  </label>
                  <button
                    disabled={busy || (!note.trim() && images.length === 0)}
                    onClick={() => run(async () => {
                      await api.messageAppeal(appeal.id, note, images.map((i) => i.id));
                      setNote("");
                      setImages([]);
                    })}
                    className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
                {images.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {images.map((img) => (
                      <img key={img.id} src={img.previewUrl} className="w-12 h-12 object-cover rounded-lg border border-border" alt="" />
                    ))}
                  </div>
                )}
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
          <div className="text-green-400/80 text-xs bg-green-600/10 border border-green-600/20 rounded-lg p-2 mb-2">
            Approved. Remember: this doesn't lift the ban automatically -- do that from the Moderation page.
          </div>
        )}

        {canManageBlacklist && (
          <div className="flex gap-2 pt-2 mt-2 border-t border-border">
            {bl?.blacklisted ? (
              <button
                disabled={busy}
                onClick={() => run(() => api.unblacklistFromAppeal(appeal.id))}
                className="flex-1 px-4 py-2 text-xs rounded-lg text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-40"
              >
                Remove from blacklist
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <input
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Blacklist reason..."
                  className="flex-1 bg-panel border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30"
                />
                <button
                  disabled={busy || !blacklistReason.trim()}
                  onClick={() => run(() => api.blacklistFromAppeal(appeal.id, blacklistReason))}
                  className="px-3 py-1.5 text-xs rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 disabled:opacity-40"
                >
                  Blacklist instead
                </button>
              </div>
            )}
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

  const backlog = useMemo(() => ageBuckets(appeals || []), [appeals]);

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

      {appeals?.length > 0 && (
        <DistributionChart
          title="Backlog by age"
          description={`How long the ${appeals.length} appeals in this view have been waiting.`}
          valueLabel="Appeals"
          height={190}
          data={backlog}
        />
      )}

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
            className="w-full text-left bg-surface border border-border rounded-lg p-3 hover:border-white/20 flex gap-3 items-start"
          >
            {a.avatar_snapshot && <img src={a.avatar_snapshot} className="w-9 h-9 rounded-full mt-0.5" alt="" />}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm">
                <span className="text-white">{a.username_snapshot || `Appeal #${a.id}`}</span>
                <span className="text-white/40 shrink-0">{timeAgo(a.created_at)}</span>
              </div>
              <div className="text-white/50 text-sm mt-1 line-clamp-2">{a.reason}</div>
              <div className="flex items-center gap-2 mt-1">
                {a.claimed_by_username && (
                  <span className="text-white/30 text-xs">Claimed by {a.claimed_by_username}</span>
                )}
                {a.likely_troll && (
                  <span className="text-amber-400/70 text-xs">⚠ not blacklisted</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <AppealDetail appeal={selected} onChange={refreshSelected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}