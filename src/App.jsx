import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import RequirePermission from "./components/RequirePermission";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const EconomyPage = lazy(() => import("./pages/EconomyPage"));
const ModerationPage = lazy(() => import("./pages/ModerationPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const AppealsPage = lazy(() => import("./pages/AppealsPage"));
const BugReportsPage = lazy(() => import("./pages/BugReportsPage"));
const AppealThreadPage = lazy(() => import("./pages/AppealThreadPage"));
const BlacklistPage = lazy(() => import("./pages/BlacklistPage"));
const VoicePage = lazy(() => import("./pages/VoicePage"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const LeaderboardsPage = lazy(() => import("./pages/LeaderboardsPage"));
const GuildsPage = lazy(() => import("./pages/GuildsPage"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const BotControlPage = lazy(() => import("./pages/BotControlPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-panel flex items-center justify-center text-white/40">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-panel flex items-center justify-center text-white/50" role="status">Loading workspace…</div>}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}