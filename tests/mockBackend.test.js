import { beforeAll, describe, expect, it } from "vitest";
import { installMockBackend } from "../src/lib/mockBackend";

beforeAll(() => installMockBackend());
const get = (path) => fetch(path).then((r) => r.json());

describe("mock backend", () => {
  it("logs in and identifies the demo admin", async () => {
    const login = await fetch("/api/exec/login", { method: "POST", body: JSON.stringify({ username: "demo", password: "x" }) }).then((r) => r.json());
    expect(login.token).toBe("demo-token");
    expect(login.permissions).toContain("*");
    const me = await get("/api/exec/me");
    expect(me.username).toBe("demo_admin");
  });

  it("serves an overview payload with all fields the UI reads", async () => {
    const data = await get("/api/exec/overview");
    expect(data.guild_count).toBeGreaterThan(0);
    expect(data.cogs_loaded.length).toBeGreaterThan(0);
    expect(typeof data.uptime).toBe("number");
  });

  it("prefers the appeal detail route over the list route", async () => {
    const detail = await get("/api/exec/appeals/1");
    expect(Array.isArray(detail)).toBe(false);
    expect(detail.username_snapshot).toBeTruthy();
    expect(detail.messages).toBeDefined();
  });

  it("resolves user labels in one batched call", async () => {
    const resolved = await get("/api/exec/users/resolve?ids=111,222");
    expect(resolved["111"].username).toBeTruthy();
    expect(resolved["222"].username).toBeTruthy();
  });
});
