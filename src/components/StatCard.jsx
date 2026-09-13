import React from "react";

export default function StatCard({ label, value, sub, tone = "default" }) {
  const toneClasses = {
    default: "text-white",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-red-400",
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-white/40 text-xs uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </div>
  );
}
