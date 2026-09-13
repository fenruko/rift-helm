const API_BASE = import.meta.env.VITE_API_BASE || "https://api.rift.baby";
const TOKEN_KEY = "rift_staff_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  // auth
  login: (username, password, totp_code) =>
    request("/api/exec/login", { method: "POST", body: { username, password, totp_code } }),
  logout: () => request("/api/exec/logout", { method: "POST" }),
  me: () => request("/api/exec/me"),

  // ban appeals -- submitAppeal is public (no session required)
  submitAppeal: (payload) => request("/api/appeals/submit", { method: "POST", body: payload }),
  listAppeals: (status) => request("/api/exec/appeals", { params: { status } }),
  getAppeal: (id) => request(`/api/exec/appeals/${id}`),
  claimAppeal: (id) => request(`/api/exec/appeals/${id}/claim`, { method: "POST" }),
  unclaimAppeal: (id) => request(`/api/exec/appeals/${id}/unclaim`, { method: "POST" }),
  messageAppeal: (id, text) => request(`/api/exec/appeals/${id}/message`, { method: "POST", body: { text } }),
  resolveAppeal: (id, decision, note) =>
    request(`/api/exec/appeals/${id}/resolve`, { method: "POST", body: { decision, note } }),

  // analytics
  overview: () => request("/api/exec/overview"),
  economy: (limit) => request("/api/exec/economy", { params: { limit } }),
  moderation: (days) => request("/api/exec/moderation", { params: { days } }),
  tickets: () => request("/api/exec/tickets"),
  voice: (limit) => request("/api/exec/voice", { params: { limit } }),
  verification: (limit) => request("/api/exec/verification", { params: { limit } }),
  levels: (limit) => request("/api/exec/levels", { params: { limit } }),
  invites: (limit) => request("/api/exec/invites", { params: { limit } }),
  giveaways: () => request("/api/exec/giveaways"),
  confessions: () => request("/api/exec/confessions"),
  errorLogs: (lines) => request("/api/exec/logs/errors", { params: { lines } }),

  // guilds
  guilds: () => request("/api/exec/guilds"),
  guildDetail: (id) => request(`/api/exec/guilds/${id}`),
  leaveGuild: (id) => request(`/api/exec/guilds/${id}/leave`, { method: "POST" }),

  // staff management
  listStaff: () => request("/api/exec/staff"),
  createStaff: (payload) => request("/api/exec/staff", { method: "POST", body: payload }),
  updateStaff: (id, payload) => request(`/api/exec/staff/${id}`, { method: "PATCH", body: payload }),
  deleteStaff: (id) => request(`/api/exec/staff/${id}`, { method: "DELETE" }),
  auditLog: (limit) => request("/api/exec/audit-log", { params: { limit } }),
  permissionCatalog: () => request("/api/exec/permissions"),

  // bot control
  botCogs: () => request("/api/exec/bot/cogs"),
  reloadCog: (name) => request(`/api/exec/bot/cogs/${name}/reload`, { method: "POST" }),
  unloadCog: (name) => request(`/api/exec/bot/cogs/${name}/unload`, { method: "POST" }),
  loadCog: (name) => request(`/api/exec/bot/cogs/${name}/load`, { method: "POST" }),
  getMaintenance: () => request("/api/exec/bot/maintenance"),
  setMaintenance: (maintenance, message) =>
    request("/api/exec/bot/maintenance", { method: "POST", body: { maintenance, message } }),
  restartBot: () => request("/api/exec/bot/restart", { method: "POST" }),
  shutdownBot: () => request("/api/exec/bot/shutdown", { method: "POST" }),
  broadcast: (message, target = "all") =>
    request("/api/exec/broadcast", { method: "POST", body: { message, target } }),
};

export function connectExecSocket(onMessage) {
  const token = getToken();
  if (!token) return () => {};
  const wsBase = API_BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/ws/exec?token=${encodeURIComponent(token)}`);
  ws.onmessage = (evt) => {
    try {
      onMessage(JSON.parse(evt.data));
    } catch {
      // ignore malformed frames
    }
  };
  return () => ws.close();
}

export { ApiError, API_BASE };
