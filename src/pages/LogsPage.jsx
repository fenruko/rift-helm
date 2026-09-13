import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";

export default function LogsPage() {
  const { hasPermission } = useAuth();
  const [errorLines, setErrorLines] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [tab, setTab] = useState(hasPermission("logs.view") ? "errors" : "audit");

  useEffect(() => {
    if (hasPermission("logs.view")) api.errorLogs(200).then((d) => setErrorLines(d.lines)).catch(() => {});
    if (hasPermission("audit.view")) api.auditLog(200).then(setAuditLog).catch(() => {});
  }, []);

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
        <div className="bg-surface border border-border rounded-xl p-4 font-mono text-xs text-white/60 max-h-[70vh] overflow-y-auto whitespace-pre-wrap">
          {errorLines === null ? "Loading..." : errorLines.length === 0 ? "No error log found." : errorLines.join("\n")}
        </div>
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
