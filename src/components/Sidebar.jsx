import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GuideModal from "./GuideModal";

const NAV = [
  { to: "/", label: "Overview", permission: "overview.view" },
  { to: "/economy", label: "Economy", permission: "economy.view" },
  { to: "/moderation", label: "Moderation", permission: "moderation.view" },
  { to: "/tickets", label: "Tickets & Reports", permission: "tickets.view" },
  { to: "/appeals", label: "Ban Appeals", permission: "appeals.view" },
  { to: "/blacklist", label: "Blacklist", permission: "blacklist.manage" },
  { to: "/voice", label: "Voice", permission: "voice.view" },
  { to: "/verification", label: "Verification", permission: "verification.view" },
  { to: "/leaderboards", label: "Leaderboards", permission: "levels.view" },
  { to: "/guilds", label: "Guilds", permission: "guilds.view" },
  { to: "/logs", label: "Logs & Audit", permission: "logs.view" },
  { to: "/bot-control", label: "Bot Control", permission: "overview.view" },
  { to: "/staff", label: "Staff Management", permission: "staff.manage" },
];

export default function Sidebar() {
  const { user, hasPermission, logout } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const runSearch = (e) => {
    e.preventDefault();
    const id = q.trim();
    if (!id) return;
    if (hasPermission("economy.manage")) navigate(`/economy?u=${id}`);
    else if (hasPermission("blacklist.manage")) navigate(`/blacklist?u=${id}`);
    setQ("");
  };

  return (
    <div className="w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Rift Staff
        </div>
        <div className="text-white/40 text-xs mt-0.5">{user?.username}</div>
      </div>

      <form onSubmit={runSearch} className="px-3 pt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Look up user ID..."
          className="w-full bg-panel border border-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
        />
      </form>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.filter((item) => hasPermission(item.permission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/15 text-white border border-blue-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border flex gap-1">
        <button
          onClick={() => setShowGuide(true)}
          className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5"
        >
          Guide
        </button>
        <button
          onClick={logout}
          className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-300 hover:bg-red-500/10"
        >
          Sign out
        </button>
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}