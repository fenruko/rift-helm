import { describe, expect, it } from "vitest";
import { appendSample, numeric, summarize } from "../src/lib/telemetry";

describe("numeric", () => {
  it("keeps finite numbers and rejects everything else", () => {
    expect(numeric(12)).toBe(12);
    expect(numeric("9")).toBe(9);
    expect(numeric("40%")).toBe(null);
    expect(numeric(null)).toBe(null);
    expect(numeric(undefined)).toBe(null);
    expect(numeric("")).toBe(null);
    expect(numeric(false)).toBe(null);
  });
});

describe("appendSample", () => {
  it("caps history at 120 samples", () => {
    let samples = [];
    for (let i = 0; i < 130; i++) samples = appendSample(samples, { latency: i }, 1000 + i * 5000);
    expect(samples).toHaveLength(120);
    expect(samples[0].latency).toBe(10);
  });

  it("coalesces samples that arrive faster than 2s apart", () => {
    let samples = [];
    samples = appendSample(samples, { latency: 1 }, 1000);
    samples = appendSample(samples, { latency: 2 }, 2000);
    expect(samples).toHaveLength(1);
    expect(samples[0].latency).toBe(2);
  });
});

describe("summarize", () => {
  const samples = [{ latency: 10 }, { latency: 30 }, { latency: 20, cpu: 5 }];
  it("averages, peaks and diffs the metric", () => {
    expect(summarize(samples, "latency")).toEqual({ average: 20, peak: 30, change: 10 });
  });
  it("returns nulls for metrics with no data", () => {
    expect(summarize(samples, "users")).toEqual({ average: null, peak: null, change: null });
  });
});
