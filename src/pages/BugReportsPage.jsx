import React, { useEffect, useState } from "react";
import { api, API_BASE } from "../lib/api";
import UserLabel from "../components/UserLabel";
import { useAuth } from "../context/AuthContext";
import DonutChart from "../components/DonutChart";
import RankingChart from "../components/RankingChart";
import { shortId } from "../components/chartTheme";

export default function BugReportsPage() {
  const { hasPermission } = useAuth();
  const [reports, setReports] = useState(null);
  const [allReports, setAllReports] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("open");
  const canManage = hasPermission("bugreports.manage");

  const load = () => api.listBugReports(filter === "all" ? undefined : filter)
    .then(setReports).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // The list is filtered per status; the charts count everything.
  useEffect(() => { api.listBugReports().then(setAllReports).catch(() => {}); }, []);

  const act = async (id, decision) => {
    try {
      await api.resolveBugReport(id, decision);
      load();
      api.listBugReports().then(setAllReports).catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!reports) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">Bug Reports</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none"
        >
          <option value="open">Open</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {allReports?.length > 0 && (
        <div className="chart-grid">
          <DonutChart
            title="Reports by status"
            description="Every bug report on file, not just this filter."
            valueLabel="Reports"
            centerLabel="Reports"
            data={["open", "accepted", "rejected"].map((status) => ({
              name: status.charAt(0).toUpperCase() + status.slice(1),
              value: allReports.filter((r) => r.status === status).length,
            }))}
          />
          <RankingChart
            title="Top reporters"
            description="Who has submitted the most reports."
            valueLabel="Reports"
            data={Object.entries(allReports.reduce((totals, r) => {
              const key = shortId(r.reporter_user_id);
              totals[key] = (totals[key] || 0) + 1;
              return totals;
            }, {})).map(([name, value]) => ({ name, value }))}
          />
        </div>
      )}

      {reports.length === 0 && <div className="text-white/30 text-sm">No reports here.</div>}

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm">
                Reporter <UserLabel id={r.reporter_user_id} />
              </div>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                r.status === "open" ? "bg-amber-500/10 text-amber-300" :
                r.status === "accepted" ? "bg-emerald-500/10 text-emerald-300" :
                "bg-red-500/10 text-red-300"
              }`}>
                {r.status}
              </span>
            </div>

            <div className="text-white/70 text-sm mb-3 whitespace-pre-wrap">{r.description}</div>

            {r.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {r.attachments.map((a) => (
                  <img
                    key={a.id}
                    src={`${API_BASE}/api/bugreports/attachments/${a.id}?staff_token=${encodeURIComponent(localStorage.getItem("rift_staff_token") || "")}`}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer"
                    onClick={() => window.open(`${API_BASE}/api/bugreports/attachments/${a.id}?staff_token=${encodeURIComponent(localStorage.getItem("rift_staff_token") || "")}`, "_blank")}
                  />
                ))}
              </div>
            )}

            <div className="text-white/30 text-xs mb-2">
              {new Date(r.created_at * 1000).toLocaleString()}
              {r.reviewed_by_username && ` \u00b7 reviewed by ${r.reviewed_by_username}`}
              {r.reward_granted && " \u00b7 2,500 balance granted"}
            </div>

            {canManage && r.status === "open" && (
              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, "accepted")}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white"
                >
                  Accept (+2,500 balance)
                </button>
                <button
                  onClick={() => act(r.id, "rejected")}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}