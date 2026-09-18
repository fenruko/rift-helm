import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const page = pathname === '/' ? 'Overview' : pathname.slice(1).replaceAll('-', ' ');
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="workspace">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}><Icon name="menu" /></button>
            <span className="text-white/40">Workspace</span><span className="text-white/20">/</span><span className="capitalize">{page}</span>
          </div>
          <div className="flex items-center gap-4"><span className="text-white/40 text-xs">{user?.role || "Staff"}</span><span className="avatar" title={user?.username}>{user?.username?.slice(0, 2).toUpperCase() || 'ST'}</span></div>
        </header>
        <main id="main-content" className="page-content" key={pathname}>{children}</main>
      </div>
    </div>
  );
}
