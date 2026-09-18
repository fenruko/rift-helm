// DEMO-ONLY in-browser stand-in for the bot's Quart API. lets you explore and
// demo the dashboard (and run its tests) without a running bot. Never ships in
// a production build: main.jsx only imports it when VITE_MOCK=1, and every
// production build excludes the branch entirely.
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (list) => list[rand(0, list.length - 1)];
const now = () => Math.floor(Date.now() / 1000);

const NAMES = ["nova", "kirito", "mira", "ashes", "véga", "drift", "june", "solstice", "echo", "miyo", "atlas", "ren", "kestrel", "lumen", "pax", "sable", "rio", "wren", "onyx", "cyra"];
const GUILDS = [
  { id: "902137184576231", name: "Rift HQ", member_count: 48213, boost_level: 3, boost_count: 22 },
  { id: "774920358162449", name: "Midnight Lounge", member_count: 9104, boost_level: 2, boost_count: 8 },
  { id: "680231754902341", name: "Dev Playground", member_count: 642, boost_level: 1, boost_count: 2 },
  { id: "559028374615522", name: "Trade Post", member_count: 23450, boost_level: 0, boost_count: 0 },
];
const COGS = ["admin", "antinuke", "appeals", "economy", "events", "gambling", "giveaways", "levels", "moderation", "music", "tickets", "verification", "voice", "web_server"];

const db = {
  session: { username: "demo_admin", role: "Founder", permissions: ["*"], totp: true },
  staff: [
    { id: 1, username: "demo_admin", role: "Founder", permissions: ["*"], totp_enabled: true, last_login: now() - 600 },
    { id: 2, username: "mira", role: "Support Lead", permissions: ["overview.view", "moderation.view", "moderation.warn", "moderation.timeout", "tickets.view", "appeals.view", "bugreports.view", "economy.view"], totp_enabled: true, last_login: now() - 86400 },
    { id: 3, username: "atlas", role: "Moderator", permissions: ["overview.view", "moderation.view", "moderation.warn", "tickets.view"], totp_enabled: false, last_login: null },
  ],
  inbox: [
    { id: 1, user_id: "445190237866231", guild_id: GUILDS[0].id, amount: 250000, reason: "Event prize payout", staff_username: "mira", status: "pending", created_at: now() - 3600 },
    { id: 2, user_id: "771230948821134", guild_id: GUILDS[1].id, amount: -5000, reason: "Rollback after dupe", staff_username: "atlas", status: "pending", created_at: now() - 7200 },
  ],
  appeals: [
    { id: 1, user_id: "411998023311441", username_snapshot: "ashes", avatar_snapshot: null, status: "open", ban_reason: "Cheating in events", created_at: now() - 5400, evidence_attachment_ids: [], messages: [{ id: 1, author: "user", text: "I was falsely flagged, the anticheat misread my macros.", attachment_ids: [], created_at: now() - 5000 }], claimed_by: null, claim_username: null },
    { id: 2, user_id: "900331244551002", username_snapshot: "drift", avatar_snapshot: null, status: "open", ban_reason: "Scamming via trade chat", created_at: now() - 96000, evidence_attachment_ids: [], messages: [], claimed_by: null, claim_username: null },
    { id: 3, user_id: "122094568833127", username_snapshot: "june", avatar_snapshot: null, status: "resolved", decision: "approved", ban_reason: "Ban evasion", created_at: now() - 200000, evidence_attachment_ids: [], messages: [], claimed_by: 2, claim_username: "mira" },
  ],
  bugreports: [
    { id: 1, reporter_user_id: "411998023311441", status: "open", description: "/daily streak resets if you claim at exactly midnight UTC.", attachments: [], created_at: now() - 43200 },
    { id: 2, reporter_user_id: "900331244551002", status: "accepted", description: "Leaderboard page 2 shows page 1 again when sorted by XP.", attachments: [], created_at: now() - 172800 },
  ],
  blacklist: [
    { user_id: "666120334551001", reason: "Raid botnet operator", evidence: "google doc with alt list", banned_by_username: "demo_admin", banned_at: now() - 86400 * 6, duration_label: null },
    { user_id: "777550119022334", reason: "Repeated scam links", evidence: null, banned_by_username: "mira", banned_at: now() - 86400 * 20, duration_label: "30d" },
  ],
  reports: [
    { id: 1, reporter_user_id: "411998023311441", target_id: "666120334551001", reason: "Harassment in DMs", status: "open", created_at: now() - 1800 },
  ],
  guilds: GUILDS.map((g, i) => ({ ...g, owner_id: ["445190237866231", "900331244551002", "122094568833127", "666120334551001"][i], created_at: new Date(Date.now() - (i + 2) * 86400000 * 200).toISOString(), icon: null })),
  maintenance: { maintenance: false, message: "" },
  broadcastLog: [],
};

const fakeUser = (id) => ({ id: String(id), username: String(id).slice(-1) + pick(NAMES) + rand(10, 99), name: pick(NAMES), avatar: null });
const idNames = new Map();
const nameFor = (id) => {
  if (!idNames.has(String(id))) idNames.set(String(id), `${pick(NAMES)}${rand(10, 99)}`);
  return idNames.get(String(id));
};
const users = (ids) => Object.fromEntries(String(ids).split(",").map((id) => [id, { username: nameFor(id), avatar: null }]));

// Slow drift so the live chart has believable movement.
const live = { latency: 96, cpu: 23.5 };
function overviewPayload() {
  live.latency = Math.max(45, Math.min(340, live.latency + rand(-14, 14)));
  live.cpu = Math.max(4, Math.min(93, live.cpu + (Math.random() - 0.48) * 6));
  return {
    guild_count: 4, users: 81843 + rand(-6, 6), latency: Math.round(live.latency), cpu: Number(live.cpu.toFixed(1)),
    ram: `${rand(700, 1400)} MB / 4096 MB`, uptime: 86400 * 12 + 3600 * rand(2, 20) + rand(0, 3599),
    shards: 2, voice_connections: rand(0, 4), cog_count: COGS.length, cogs_loaded: COGS,
  };
}

const routes = {
  "POST /api/exec/login": ({ body }) => {
    if (body?.username !== "demo" && body?.username !== "demo_admin") throw new Error("Invalid credentials. Try username “demo”, any password.");
    return { token: "demo-token", id: 1, username: db.session.username, role: db.session.role, permissions: db.session.permissions };
  },
  "POST /api/exec/logout": () => ({ ok: true }),
  "GET /api/exec/me": () => ({ id: 1, username: db.session.username, role: db.session.role, permissions: db.session.permissions }),
  "GET /api/exec/overview": overviewPayload,
  "GET /api/exec/economy": ({ params }) => {
    const limit = Number(params.get("limit")) || 25;
    const rows = Array.from({ length: limit }, (_, i) => ({ user_id: String(445190237866231 + i * 7919), guild_id: GUILDS[i % 4].id, balance: Math.round(9_400_000 / (i + 1.35)) }));
    const balances = rows.map((r) => r.balance);
    return { totals: { total_accounts: 24118, total_balance: balances.reduce((a, b) => a + b, 0) * 61, average_balance: 8432, richest_balance: balances[0] }, leaderboard: rows };
  },
  "GET /api/exec/economy/search/": ({ path }) => {
    const user_id = path.split("/").pop();
    return { user_id, username: nameFor(user_id), avatar: null, balances: [{ balance: rand(1200, 480000) }], adjustments: Array.from({ length: 4 }, (_, i) => ({ id: i, amount: rand(-40000, 40000), reason: pick(["Event payout", "Refund", "Dupe rollback", "Contest reward"]), status: pick(["approved", "pending"]), staff_username: pick(["mira", "atlas", "demo_admin"]), created_at: now() - rand(600, 260000) })) };
  },
  "POST /api/exec/economy/adjust": ({ body }) => ({ status: Math.abs(body.amount) > 100000 ? "pending" : "applied", balance_after: rand(10000, 900000) }),
  "GET /api/exec/economy/inbox": ({ params }) => (params.get("status") === "pending" ? db.inbox.filter((i) => i.status === "pending") : db.inbox),
  "POST /api/exec/economy/inbox/": ({ path, body }) => {
    const item = db.inbox.find((i) => i.id === Number(path.split("/")[5]));
    if (item) item.status = body.decision;
    return { ok: true };
  },
  "GET /api/exec/moderation": () => ({
    warnings: { total: 1287, top_guilds: GUILDS.map((g) => ({ guild_id: g.id, count: rand(20, 400) })) },
    action_counts: { warn: 342, timeout: 118, kick: 27, ban: 41 },
    top_moderators: ["demo_admin", "mira", "atlas"].map((m, i) => ({ moderator_id: m, bans: [41, 0, 0][i], kicks: [12, 9, 6][i], mutes: [30, 22, 11][i], warns: [201, 88, 53][i], total: [284, 119, 70][i] })),
    recent_actions: Array.from({ length: 8 }, (_, i) => ({ id: i, action_type: pick(["warn", "timeout", "kick", "ban"]), moderator_id: pick(["demo_admin", "mira", "atlas"]), target_id: String(rand(10 ** 17, 10 ** 18)), reason: pick(["Spamming invites", "Toxicity", "Scam links", "NSFW avatar"]), guild_id: pick(GUILDS).id })),
    antinuke_logs: [{ guild_id: GUILDS[0].id, actor_id: "666120334551001", event_type: "mass_ban", count: 14, punishment: "blacklisted + roles reverted" }],
  }),
  "POST /api/exec/mod/user": ({ params }) => ({ user: { id: params.get("q"), name: nameFor(params.get("q")), username: nameFor(params.get("q")), avatar: null, is_banned: false, timed_out: false }, guild_id: GUILDS[0].id, guild_name: GUILDS[0].name, warn_count: rand(0, 5), warnings: Array.from({ length: 3 }, (_, i) => ({ id: i, reason: pick(["Spam", "Slurs", "Mini-modding"]), moderator: pick(["mira", "atlas"]) })) }),
  "POST /api/exec/mod/action": ({ body }) => ({ status: `${body.action} dispatched to ${GUILDS[0].name}` }),
  "GET /api/exec/tickets": () => ({ tickets: { open: 14, closed: 892, avg_resolution_seconds: 3720 }, modmail: { open: 5, total: 318 }, reports: { total: 128, by_status: { open: 9, resolved: 101, rejected: 18 } } }),
  "GET /api/exec/appeals": ({ params }) => db.appeals.filter((a) => !params.get("status") || a.status === params.get("status")).map(({ messages, ...rest }) => rest),
  "GET /api/exec/appeals/": ({ path }) => db.appeals.find((a) => a.id === Number(path.split("/")[4])),
  "POST /api/exec/appeals/": ({ path, body }) => {
    const appeal = db.appeals.find((a) => a.id === Number(path.split("/")[4]));
    if (path.endsWith("/claim")) appeal.claimed_by = 1, (appeal.claim_username = "demo_admin");
    if (path.endsWith("/unclaim")) appeal.claimed_by = null, (appeal.claim_username = null);
    if (path.endsWith("/message")) appeal.messages.push({ id: appeal.messages.length + 1, author: "staff", text: body.text, attachment_ids: [], created_at: now() });
    if (path.endsWith("/resolve")) appeal.status = "resolved", (appeal.decision = body.decision);
    return { ok: true };
  },
  "DELETE /api/exec/appeals/": () => ({ ok: true }),
  "GET /api/exec/bugreports": ({ params }) => db.bugreports.filter((r) => !params.get("status") || params.get("status") === "all" || r.status === params.get("status")),
  "POST /api/exec/bugreports/": ({ path, body }) => { const r = db.bugreports.find((x) => x.id === Number(path.split("/")[4])); if (r) r.status = body.decision; return { ok: true }; },
  "GET /api/exec/blacklist": () => db.blacklist,
  "GET /api/exec/blacklist/lookup/": ({ path }) => { const id = path.split("/").pop(); const entry = db.blacklist.find((b) => b.user_id === id); return { user_id: id, username: nameFor(id), already_blacklisted: Boolean(entry), entry }; },
  "GET /api/exec/blacklist/history/": ({ path }) => Array.from({ length: 2 }, (_, i) => ({ user_id: path.split("/").pop(), reason: pick(["Scam links", "Raiding"]), banned_by_username: pick(["mira", "demo_admin"]), banned_at: now() - 86400 * (i + 1) * 30, duration_label: i ? null : "30d" })),
  "POST /api/exec/blacklist": ({ body }) => { db.blacklist.unshift({ user_id: body.user_id, reason: body.reason, evidence: body.evidence, banned_by_username: "demo_admin", banned_at: now(), duration_label: body.duration === "permanent" ? null : body.duration }); return { ok: true }; },
  "DELETE /api/exec/blacklist/": ({ path }) => { db.blacklist = db.blacklist.filter((b) => b.user_id !== path.split("/").pop()); return { ok: true }; },
  "GET /api/exec/voice": ({ params }) => ({ active_sessions: [{ guild_name: GUILDS[0].name, channel: "Lounge 🎧", listeners: rand(3, 18) }, { guild_name: GUILDS[1].name, channel: "Study Room", listeners: rand(1, 9) }], voice_xp_leaderboard: Array.from({ length: Math.min(10, Number(params.get("limit")) || 10) }, (_, i) => ({ guild_id: GUILDS[i % 4].id, user_id: String(411998023311441 + i * 613), minutes: 2400 - i * 173 })) }),
  "GET /api/exec/verification": () => ({ flags: Array.from({ length: 6 }, () => ({ user_id: String(rand(10 ** 17, 10 ** 18)), matched_user_id: String(rand(10 ** 17, 10 ** 18)), guild_id: pick(GUILDS).id, reason: pick(["fingerprint match", "ban evasion heuristic"]), created_at: now() - rand(3600, 2600000) })) }),
  "GET /api/exec/levels": ({ params }) => Array.from({ length: Math.min(15, Number(params.get("limit")) || 15) }, (_, i) => ({ guild_id: GUILDS[i % 4].id, user_id: String(445190237866231 + i * 449), level: 84 - i * 4, xp: 210000 - i * 11200 })),
  "GET /api/exec/invites": () => Array.from({ length: 10 }, (_, i) => ({ user_id: String(411998023311441 + i * 337), real: 340 - i * 29, bonus: rand(0, 40), fake: rand(0, 12), left: rand(0, 30) })),
  "GET /api/exec/giveaways": () => ({ active_giveaways: 2, total_entrants: 1487 }),
  "GET /api/exec/confessions": () => ({ total: 392 }),
  "GET /api/exec/logs/errors": () => ({ lines: Array.from({ length: 12 }, (_, i) => `[2026-09-${17 - (i % 5)} 0${rand(0, 9)}:${rand(10, 59)}:12] ${pick(["ERROR cog economy: task exception was never retrieved", "WARNING gateway: shard 1 resumed after disconnect", "ERROR antinuke: rate limited while jailing raider"])} (line ${i + 1})`) }),
  "GET /api/exec/audit-log": () => Array.from({ length: 10 }, (_, i) => ({ id: i, username: pick(["demo_admin", "mira", "atlas"]), action: pick(["login", "economy.adjust", "appeal.resolve", "blacklist.add", "bot.reload_cog", "broadcast"]), target: pick(["user 445190…", "appeal #2", "cog economy", "user 666120…"]), ip: `10.0.${rand(0, 4)}.${rand(2, 250)}`, timestamp: now() - i * 1900 })),
  "GET /api/exec/guilds": () => db.guilds,
  "GET /api/exec/guilds/": ({ path }) => ({ ...db.guilds.find((g) => g.id === path.split("/")[4]), channels: 42, roles: 28 }),
  "POST /api/exec/guilds/": () => ({ ok: true }),
  "GET /api/exec/staff": () => db.staff,
  "GET /api/exec/permissions": () => ({ "overview.view": "View the overview page", "economy.view": "View economy stats", "economy.manage": "Adjust balances", "economy.approve": "Approve balance adjustments", "moderation.view": "View moderation stats", "moderation.lookup": "Look up users", "moderation.warn": "Warn members", "moderation.timeout": "Timeout members", "moderation.kick": "Kick members", "moderation.ban": "Ban members", "tickets.view": "View tickets & reports", "appeals.view": "View ban appeals", "bugreports.view": "View bug reports", "blacklist.manage": "Manage blacklist", "voice.view": "View voice stats", "verification.view": "View verification flags", "levels.view": "View leaderboards", "invites.view": "View invite leaderboard", "giveaways.view": "View giveaway stats", "guilds.view": "View guilds", "logs.view": "View error logs", "audit.view": "View audit log", "staff.manage": "Manage staff accounts" }),
  "POST /api/exec/staff": ({ body }) => { db.staff.push({ id: db.staff.length + 1, ...body, totp_enabled: false, last_login: null }); return { ok: true }; },
  "PATCH /api/exec/staff/": ({ path, body }) => { const s = db.staff.find((x) => x.id === Number(path.split("/")[4])); Object.assign(s, body); return { ok: true }; },
  "DELETE /api/exec/staff/": ({ path }) => { db.staff = db.staff.filter((s) => s.id !== Number(path.split("/")[4])); return { ok: true }; },
  "GET /api/exec/bot/cogs": () => COGS,
  "POST /api/exec/bot/cogs/": ({ path }) => ({ status: `${path.split("/")[5]} ok on 2 shards` }),
  "GET /api/exec/bot/maintenance": () => db.maintenance,
  "POST /api/exec/bot/maintenance": ({ body }) => Object.assign(db.maintenance, { maintenance: Boolean(body.maintenance), message: body.message || "" }),
  "POST /api/exec/bot/restart": () => ({ status: "restart signal sent" }),
  "POST /api/exec/bot/shutdown": () => ({ status: "shutdown signal sent" }),
  "POST /api/exec/broadcast": ({ body }) => { db.broadcastLog.push(body.message); return { status: `queued to ${body.target}` }; },
  "GET /api/exec/users/resolve": ({ params }) => users(params.get("ids")),
  "GET /api/exec/members/search": ({ params }) => ({ members: NAMES.slice(0, 4).map((n) => ({ id: String(rand(10 ** 17, 10 ** 18)), name: n, username: n, avatar: null })).filter((m) => m.name.includes(params.get("q")?.toLowerCase() || "")) }),
};

function matchRoute(method, path) {
  const exact = routes[`${method} ${path}`];
  if (exact) return exact;
  const candidates = Object.keys(routes).filter((key) => {
    const space = key.indexOf(" ");
    const routeMethod = key.slice(0, space);
    const routePath = key.slice(space + 1).replace(/\/+$/, "");
    return routeMethod === method && routePath !== "" && `${path}/`.startsWith(`${routePath}/`);
  });
  // Longest prefix wins so /appeals/:id beats /appeals.
  return candidates.sort((a, b) => b.length - a.length).map((key) => routes[key])[0];
}

function handle(method, fullUrl, body) {
  const url = new URL(fullUrl, window.location.origin);
  const entry = matchRoute(method, url.pathname);
  if (!entry) throw new Error(`Mock backend: no handler for ${method} ${url.pathname}`);
  return entry({ path: url.pathname, params: url.searchParams, body });
}

class MockWebSocket {
  constructor(url) {
    this.url = url; this.readyState = 0; this.onopen = this.onmessage = this.onclose = this.onerror = null;
    setTimeout(() => { this.readyState = 1; this.onopen?.(); this.start(); }, 150);
  }
  start() {
    this.timer = setInterval(() => {
      this.onmessage?.({ data: JSON.stringify({ type: "overview", data: overviewPayload() }) });
      if (Math.random() < 0.15) this.onmessage?.({ data: JSON.stringify({ type: "appeal_submitted", id: pick(db.appeals).id }) });
    }, 3000);
  }
  send() {}
  close() { clearInterval(this.timer); this.readyState = 3; this.onclose?.(); }
}

export function installMockBackend() {
  if (window.__riftMockInstalled) return;
  window.__riftMockInstalled = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (!url.includes("/api/")) return realFetch(input, init);
    await new Promise((r) => setTimeout(r, rand(90, 260)));
    try {
      const body = init.body ? JSON.parse(init.body) : undefined;
      const data = handle(init.method || "GET", url, body);
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  };
  window.WebSocket = MockWebSocket;
  console.info("[rift-demo] mock backend active — sign in with username “demo” and any password. No real bot API is contacted.");
}
