import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import RequirePermission from "./components/RequirePermission";

import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import EconomyPage from "./pages/EconomyPage";
import ModerationPage from "./pages/ModerationPage";
import TicketsPage from "./pages/TicketsPage";
import AppealsPage from "./pages/AppealsPage";
import BugReportsPage from "./pages/BugReportsPage";
import AppealThreadPage from "./pages/AppealThreadPage";
import BlacklistPage from "./pages/BlacklistPage";
import VoicePage from "./pages/VoicePage";
import VerificationPage from "./pages/VerificationPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import GuildsPage from "./pages/GuildsPage";
import LogsPage from "./pages/LogsPage";
import BotControlPage from "./pages/BotControlPage";
import StaffPage from "./pages/StaffPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-panel flex items-center justify-center text-white/40">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/staff">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/appeal/:token" element={<AppealThreadPage />} />

          <Route path="/" element={<Protected><RequirePermission permission="overview.view"><OverviewPage /></RequirePermission></Protected>} />
          <Route path="/economy" element={<Protected><RequirePermission permission="economy.view"><EconomyPage /></RequirePermission></Protected>} />
          <Route path="/moderation" element={<Protected><RequirePermission permission="moderation.view"><ModerationPage /></RequirePermission></Protected>} />
          <Route path="/tickets" element={<Protected><RequirePermission permission="tickets.view"><TicketsPage /></RequirePermission></Protected>} />
          <Route path="/appeals" element={<Protected><RequirePermission permission="appeals.view"><AppealsPage /></RequirePermission></Protected>} />
          <Route path="/bugreports" element={<Protected><RequirePermission permission="bugreports.view"><BugReportsPage /></RequirePermission></Protected>} />
          <Route path="/blacklist" element={<Protected><RequirePermission permission="blacklist.manage"><BlacklistPage /></RequirePermission></Protected>} />
          <Route path="/voice" element={<Protected><RequirePermission permission="voice.view"><VoicePage /></RequirePermission></Protected>} />
          <Route path="/verification" element={<Protected><RequirePermission permission="verification.view"><VerificationPage /></RequirePermission></Protected>} />
          <Route path="/leaderboards" element={<Protected><LeaderboardsPage /></Protected>} />
          <Route path="/guilds" element={<Protected><RequirePermission permission="guilds.view"><GuildsPage /></RequirePermission></Protected>} />
          <Route path="/logs" element={<Protected><LogsPage /></Protected>} />
          <Route path="/bot-control" element={<Protected><BotControlPage /></Protected>} />
          <Route path="/staff" element={<Protected><StaffPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}