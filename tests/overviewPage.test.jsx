import { beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { installMockBackend } from "../src/lib/mockBackend";
import { AuthProvider } from "../src/context/AuthContext";
import OverviewPage from "../src/pages/OverviewPage";
import DistributionChart from "../src/components/DistributionChart";

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

const renderOverview = () =>
  render(<MemoryRouter><AuthProvider><OverviewPage /></AuthProvider></MemoryRouter>);

describe("OverviewPage", () => {
  it("loads stat cards and the telemetry panel from the API", async () => {
    renderOverview();
    expect(await screen.findByText("Network telemetry")).toBeTruthy();
    expect(screen.getByText("Total guilds")).toBeTruthy();
    expect((await screen.findByText(/^\d+ samples?$/)).textContent).toMatch(/sample/);
    expect(screen.getByText("Session average")).toBeTruthy();
    expect(screen.getByText("Bot uptime")).toBeTruthy();
  });

  it("offers the four telemetry metrics", async () => {
    renderOverview();
    await screen.findByText("Network telemetry");
    const control = screen.getByRole("group", { name: "Chart metric" });
    for (const label of ["Latency", "CPU usage", "Users", "Guilds"]) {
      expect(within(control).getByText(label)).toBeTruthy();
    }
  });
});

describe("DistributionChart", () => {
  it("renders one bar per value", async () => {
    const { container } = render(
      <DistributionChart title="Test chart" description="" data={[{ name: "a", value: 5 }, { name: "b", value: 9 }]} />
    );
    // Recharts debounces its resize observer by 100ms, so poll instead of
    // sleeping exactly that long.
    await waitFor(() => expect(container.querySelectorAll(".recharts-bar-rectangle").length).toBe(2));
  });
  it("shows the empty state without data", () => {
    const { container } = render(<DistributionChart title="Empty" description="" data={[]} />);
    expect(container.textContent).toContain("No measurements available yet.");
  });
});
