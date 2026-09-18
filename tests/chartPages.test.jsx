import { beforeAll, afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { installMockBackend } from "../src/lib/mockBackend";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import ModerationPage from "../src/pages/ModerationPage";
import EconomyPage from "../src/pages/EconomyPage";
import TicketsPage from "../src/pages/TicketsPage";
import AppealsPage from "../src/pages/AppealsPage";
import BugReportsPage from "../src/pages/BugReportsPage";
import BlacklistPage from "../src/pages/BlacklistPage";
import VoicePage from "../src/pages/VoicePage";
import VerificationPage from "../src/pages/VerificationPage";
import LeaderboardsPage from "../src/pages/LeaderboardsPage";
import GuildsPage from "../src/pages/GuildsPage";
import LogsPage from "../src/pages/LogsPage";
import StaffPage from "../src/pages/StaffPage";

// Pages are only mounted once auth resolves, same as App's <Protected> gate,
// because they read permissions during their first render.
function Gated({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>auth loading</div>;
  if (!user) return <div>no user</div>;
  return children;
}

class ResizeObserverStub {
  constructor(callback) { this.callback = callback; }
  observe(element) {
    element.getBoundingClientRect = () => ({ width: 900, height: 230, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} });
    this.callback([{ target: element, contentRect: { width: 900, height: 230 } }], this);
  }
  unobserve() {} disconnect() {}
}

beforeAll(() => {
  window.ResizeObserver = ResizeObserverStub;
  window.matchMedia = window.matchMedia || (() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  installMockBackend();
});

afterEach(() => {
  cleanup();
  localStorage.removeItem("rift_staff_token");
});

// Every data page should ship at least one chart, and it should actually
// mount a recharts surface once its API call resolves.
const PAGES = [
  ["Moderation", ModerationPage, "Actions by type"],
  ["Economy", EconomyPage, "Leading account balances"],
  ["Tickets & Reports", TicketsPage, "Ticket & modmail volume"],
  ["Ban Appeals", AppealsPage, "Backlog by age"],
  ["Bug Reports", BugReportsPage, "Reports by status"],
  ["Blacklist", BlacklistPage, "Entry types"],
  ["Voice", VoicePage, "Listeners per session"],
  ["Verification", VerificationPage, "Flags by reason"],
  ["Leaderboards", LeaderboardsPage, "XP leaders"],
  ["Guilds", GuildsPage, "Members by guild"],
  ["Logs & Audit", LogsPage, "Lines by severity"],
  ["Staff Management", StaffPage, "2FA coverage"],
];

describe("page charts", () => {
  it.each(PAGES)("%s renders %s", async (_name, Page, chartTitle) => {
    localStorage.setItem("rift_staff_token", "demo-token");
    const { container } = render(
      <MemoryRouter><AuthProvider><Gated><Page /></Gated></AuthProvider></MemoryRouter>
    );
    expect(await screen.findByText(chartTitle, {}, { timeout: 3000 })).toBeTruthy();
    await waitFor(() => expect(container.querySelector(".recharts-surface")).toBeTruthy(), { timeout: 3000 });
  });
});
