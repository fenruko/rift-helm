import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

export default function BotControlPage() {
  const { hasPermission } = useAuth();
  const [cogs, setCogs] = useState([]);
  const [maintenance, setMaintenance] = useState(null);
  const [maintMessage, setMaintMessage] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [status, setStatus] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // "restart" | "shutdown" | null

  const canControl = hasPermission("bot.control");
  const canRestart = hasPermission("bot.restart");
  const canShutdown = hasPermission("bot.shutdown");
  const canBroadcast = hasPermission("broadcast.send");

  const load = async () => {
    if (canControl) {
      const [c, m] = await Promise.all([api.botCogs(), api.getMaintenance()]);
      setCogs(c);
      setMaintenance(m.maintenance);
      setMaintMessage(m.message || "");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runCogAction = async (fn, name) => {
    try {
      await fn(name);
      setStatus({ ok: true, text: `${name}: done` });
      load();
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    }
  };

  const saveMaintenance = async () => {
    try {
      await api.setMaintenance(maintenance, maintMessage);
      setStatus({ ok: true, text: "Maintenance settings saved" });
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    }
  };

  const sendBroadcast = async () => {
    try {
      const res = await api.broadcast(broadcastMsg, broadcastTarget);
      setStatus({ ok: true, text: `Sent to ${res.sent} channel(s), ${res.failed} failed` });
      setBroadcastMsg("");
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    }
  };

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Bot Control</h1>

      {status && (
        <div className={`text-sm mb-4 ${status.ok ? "text-emerald-400" : "text-red-400"}`}>{status.text}</div>
      )}

      {canControl && (
        <>
          <div className="bg-surface border border-border rounded-xl p-5 mb-6">
            <div className="text-white/60 text-sm font-medium mb-3">Maintenance mode</div>
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={!!maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
              <span className="text-white/70 text-sm">Enable maintenance mode</span>
            </label>
            <input
              value={maintMessage}
              onChange={(e) => setMaintMessage(e.target.value)}
              placeholder="Message shown to users while in maintenance"
              className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 mb-3"
            />
            <button
              onClick={saveMaintenance}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium"
            >
              Save
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">
              Cogs ({cogs.length} loaded)
            </div>
            <table className="w-full text-sm">
              <tbody>
                {cogs.map((name) => (
                  <tr key={name} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/70">{name}</td>
                    <td className="px-4 py-2.5 text-right space-x-3">
                      <button onClick={() => runCogAction(api.reloadCog, name)} className="text-white/50 hover:text-white text-xs">
                        Reload
                      </button>
                      <button onClick={() => runCogAction(api.unloadCog, name)} className="text-amber-400/70 hover:text-amber-400 text-xs">
                        Unload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {canBroadcast && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="text-white/60 text-sm font-medium mb-3">Broadcast a message</div>
          <textarea
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            rows={3}
            placeholder="Message to send..."
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 mb-3"
          />
          <div className="flex items-center gap-3">
            <input
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value)}
              placeholder="all, or a specific guild ID"
              className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 w-56"
            />
            <button
              onClick={sendBroadcast}
              disabled={!broadcastMsg.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium disabled:opacity-40"
            >
              Send broadcast
            </button>
          </div>
        </div>
      )}

      {(canRestart || canShutdown) && (
        <div className="bg-surface border border-red-500/20 rounded-xl p-5">
          <div className="text-red-400 text-sm font-medium mb-3">Danger zone</div>
          <div className="flex gap-3">
            {canRestart && (
              <button
                onClick={() => setConfirmAction("restart")}
                className="px-4 py-2 text-sm rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 font-medium"
              >
                Restart bot
              </button>
            )}
            {canShutdown && (
              <button
                onClick={() => setConfirmAction("shutdown")}
                className="px-4 py-2 text-sm rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium"
              >
                Shut down bot
              </button>
            )}
          </div>
        </div>
      )}

      {confirmAction === "restart" && (
        <ConfirmModal
          title="Restart the bot?"
          description="The whole process will restart. It should come back up within a few seconds if it's running under a process manager."
          confirmWord="RESTART"
          confirmLabel="Restart now"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            await api.restartBot().catch(() => {});
            setConfirmAction(null);
            setStatus({ ok: true, text: "Restart triggered." });
          }}
        />
      )}

      {confirmAction === "shutdown" && (
        <ConfirmModal
          title="Shut down the bot?"
          description="The bot will go fully offline and will NOT restart on its own. Only do this if you intend to bring it back up manually."
          confirmWord="SHUTDOWN"
          confirmLabel="Shut down now"
          danger
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            await api.shutdownBot().catch(() => {});
            setConfirmAction(null);
            setStatus({ ok: true, text: "Shutdown triggered." });
          }}
        />
      )}
    </div>
  );
}
