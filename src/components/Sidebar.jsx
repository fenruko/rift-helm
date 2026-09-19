import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import GuideModal from "./GuideModal";
import { api, connectExecSocket } from "../lib/api";

const NAV = [
  { icon: "overview", to: "/", label: "Overview", permission: "overview.view" },
  { icon: "economy", to: "/economy", label: "Economy", permission: "economy.view" },
  { icon: "shield", to: "/moderation", label: "Moderation", permission: "moderation.view" },
  { icon: "tickets", to: "/tickets", label: "Tickets & Reports", permission: "tickets.view" },
  { icon: "message", to: "/appeals", label: "Ban Appeals", permission: "appeals.view" },
  { icon: "bug", to: "/bugreports", label: "Bug Reports", permission: "bugreports.view" },
  { icon: "ban", to: "/blacklist", label: "Blacklist", permission: "blacklist.manage" },
  { icon: "voice", to: "/voice", label: "Voice", permission: "voice.view" },
  { icon: "shield", to: "/verification", label: "Verification", permission: "verification.view" },
  { icon: "trophy", to: "/leaderboards", label: "Leaderboards", permission: "levels.view" },
  { icon: "guilds", to: "/guilds", label: "Guilds", permission: "guilds.view" },
  { icon: "logs", to: "/logs", label: "Logs & Audit", permission: "logs.view" },
  { icon: "control", to: "/bot-control", label: "Bot Control", permission: "overview.view" },
  { icon: "users", to: "/staff", label: "Staff Management", permission: "staff.manage" },
];

export default function Sidebar({ open, onClose }) {
  const { user, hasPermission, logout } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [q, setQ] = useState("");
  const [openAppeals, setOpenAppeals] = useState(0);
  const [openBugReports, setOpenBugReports] = useState(0);
  const [pendingEconomy, setPendingEconomy] = useState(0);
  const navigate = useNavigate();

  const canSeeAppeals = hasPermission("appeals.view");
  const canSeeBugReports = hasPermission("bugreports.view");
  const canSeeEconomyInbox = hasPermission("economy.manage");

  useEffect(() => {
    if (!canSeeEconomyInbox) return;
    const refresh = () => api.economyInbox("pending").then((r) => setPendingEconomy(r.length)).catch(() => {});
    refresh();
    const disconnect = connectExecSocket((msg) => {
      if (msg.type?.startsWith("economy_adjustment")) refresh();
    });
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeEconomyInbox]);

  useEffect(() => {
    if (!canSeeAppeals) return;
    const refresh = () => api.listAppeals("open").then((a) => setOpenAppeals(a.length)).catch(() => {});
    refresh();
    const disconnect = connectExecSocket((msg) => {
      if (msg.type?.startsWith("appeal_")) refresh();
    });
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeAppeals]);

  useEffect(() => {
    if (!canSeeBugReports) return;
    const refresh = () => api.listBugReports("open").then((r) => setOpenBugReports(r.length)).catch(() => {});
    refresh();
    const disconnect = connectExecSocket((msg) => {
      if (msg.type?.startsWith("bugreport_")) refresh();
    });
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeBugReports]);

  const runSearch = (e) => {
    e.preventDefault();
    const id = q.trim();
    if (!id) return;
    onClose();
    if (hasPermission("economy.manage")) navigate(`/economy?u=${id}`);
    else if (hasPermission("blacklist.manage")) navigate(`/blacklist?u=${id}`);
    setQ("");
  };

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Main navigation" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="sidebar-brand">
        <div className="brand-mark">r<span>.</span></div>
        <div><div className="brand-name">rift<span className="brand-tag">STAFF</span></div></div>
        <button className="icon-button mobile-menu" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button>
      </div>

      <form onSubmit={runSearch} className="sidebar-search"><Icon name="search" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Look up user ID…"
          aria-label="Look up user ID"
          className="w-full bg-panel border border-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
        />
      </form>

      <nav className="sidebar-nav">
        {NAV.filter((item) => hasPermission(item.permission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            end={item.to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-3"><Icon name={item.icon} size={17} />{item.label}</span>
              {((item.to === "/appeals" && openAppeals > 0) ||
                (item.to === "/bugreports" && openBugReports > 0) ||
                (item.to === "/economy" && pendingEconomy > 0)) && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {item.to === "/appeals" ? openAppeals : item.to === "/bugreports" ? openBugReports : pendingEconomy}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-profile"><span className="avatar">{user?.username?.slice(0, 2).toUpperCase()}</span><div><div className="text-sm text-white/90">{user?.username}</div><div className="text-xs text-white/40">{user?.role || 'Staff member'}</div></div></div>
      <div className="p-3 border-t border-border flex gap-1">
        <button
          onClick={() => setShowGuide(true)}
          className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5"
        >
          <span className="flex items-center justify-center gap-2"><Icon name="book" size={15} /> Guide</span>
        </button>
        <button
          onClick={logout}
          className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-300 hover:bg-red-500/10"
        >
          <span className="flex items-center justify-center gap-2"><Icon name="logout" size={15} /> Sign out</span>
        </button>
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </aside>
  );
}