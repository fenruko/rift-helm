import React, { useEffect, useState } from "react";
import { api, connectExecSocket } from "../lib/api";
import StatCard from "../components/StatCard";

function fmtUptime(seconds) {
  if (!seconds && seconds !== 0) return "--";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.overview().then((d) => mounted && setData(d)).catch((e) => mounted && setError(e.message));

    const disconnect = connectExecSocket((msg) => {
      if (msg.type === "overview") {
        setLive(true);
        setData(msg.data);
      }
    });
    return () => {
      mounted = false;
      disconnect();
    };
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">Overview</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${live ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/30"}`}>
          {live ? "● Live" : "Connecting..."}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Guilds" value={data.guild_count ?? data.servers ?? "--"} />
        <StatCard label="Users" value={data.users ?? "--"} />
        <StatCard label="Latency" value={data.latency ? `${data.latency}ms` : "--"} tone={data.latency > 300 ? "warn" : "good"} />
        <StatCard label="Uptime" value={fmtUptime(data.uptime)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Shards" value={data.shards ?? "--"} />
        <StatCard label="CPU" value={data.cpu ? `${data.cpu}%` : "--"} />
        <StatCard label="RAM" value={data.ram ?? data.memory ?? "--"} />
        <StatCard label="Voice connections" value={data.voice_connections ?? 0} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-white/40 text-xs uppercase tracking-wide mb-3">
          Loaded cogs ({data.cog_count ?? (data.cogs_loaded || []).length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.cogs_loaded || []).map((c) => (
            <span key={c} className="text-xs px-2 py-1 rounded-md bg-panel border border-border text-white/50">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
