import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Overview", permission: "overview.view" },
  { to: "/economy", label: "Economy", permission: "economy.view" },
  { to: "/moderation", label: "Moderation", permission: "moderation.view" },
  { to: "/tickets", label: "Tickets & Reports", permission: "tickets.view" },
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

  return (
    <div className="w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="text-white font-semibold">Rift Staff</div>
        <div className="text-white/40 text-xs mt-0.5">{user?.username}</div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.filter((item) => hasPermission(item.permission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm ${
                isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
