import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import DistributionChart from "../components/DistributionChart";

export default function LogsPage() {
  const { hasPermission } = useAuth();
  const [errorLines, setErrorLines] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [tab, setTab] = useState(hasPermission("logs.view") ? "errors" : "audit");

  useEffect(() => {
    if (hasPermission("logs.view")) api.errorLogs(200).then((d) => setErrorLines(d.lines)).catch(() => {});
    if (hasPermission("audit.view")) api.auditLog(200).then(setAuditLog).catch(() => {});
  }, []);

  const severityCounts = useMemo(() => {
    const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
    for (const line of errorLines || []) {
      const match = line.match(/\b(ERROR|WARNING|INFO)\b/);
      if (match) counts[match[1]] += 1;
    }
    return Object.entries(counts).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value }));
  }, [errorLines]);

  const auditByAction = useMemo(() => {
    const totals = {};
    for (const entry of auditLog || []) totals[entry.action] = (totals[entry.action] || 0) + 1;
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [auditLog]);

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Logs & Audit</h1>

      <div className="flex gap-2 mb-4">
        {hasPermission("logs.view") && (
          <button
            onClick={() => setTab("errors")}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === "errors" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
          >
            Error log
          </button>
        )}
        {hasPermission("audit.view") && (
          <button
            onClick={() => setTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === "audit" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
          >
            Staff audit log
          </button>
        )}
      </div>

      {tab === "errors" && (
        <DistributionChart
          title="Lines by severity"
          description="Severity levels found in the loaded log tail."
          valueLabel="Lines"
          height={190}
          data={severityCounts}
        />
      )}

      {tab === "errors" && (
        <div className="bg-surface border border-border rounded-xl p-4 font-mono text-xs text-white/60 max-h-[70vh] overflow-y-auto whitespace-pre-wrap">
          {errorLines === null ? "Loading..." : errorLines.length === 0 ? "No error log found." : errorLines.join("\n")}
        </div>
      )}

      {tab === "audit" && (
        <DistributionChart
          title="Entries by action"
          description="What staff did, from the loaded audit page."
          valueLabel="Entries"
          height={210}
          data={auditByAction}
        />
      )}

      {tab === "audit" && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <DataTable
            columns={[
              { key: "username", label: "Staff" },
              { key: "action", label: "Action" },
              { key: "target", label: "Target" },
              { key: "ip", label: "IP" },
              {
                key: "timestamp",
                label: "When",
                render: (r) => new Date(r.timestamp * 1000).toLocaleString(),
              },
            ]}
            rows={auditLog}
            emptyLabel="No audit entries yet."
          />
        </div>
      )}
    </div>
  );
}
