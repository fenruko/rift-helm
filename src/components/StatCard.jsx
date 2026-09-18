import React from "react";
import Icon from "./Icon";

export default function StatCard({ label, value, sub, tone = "default", icon = "activity" }) {
  const toneClasses = { default: "text-white", good: "text-emerald-300", warn: "text-amber-300", bad: "text-red-400" };
  return (
    <div className="stat-card">
      <div className="stat-label"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={17} /></span></div>
      <div className={`stat-value ${toneClasses[tone]}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
