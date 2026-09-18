const API_BASE = import.meta.env.VITE_API_BASE || "https://desktop-mo3r1pj.tailb9e0a9.ts.net";
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

  // ban appeals -- public flow is unauthenticated (ID verify -> OTP -> submit)
  lookupAppealUser: (user_id) => request("/api/appeals/lookup", { method: "POST", body: { user_id } }),
  sendAppealOtp: (user_id) => request("/api/appeals/send-otp", { method: "POST", body: { user_id } }),
  verifyAppealOtp: (user_id, code) => request("/api/appeals/verify-otp", { method: "POST", body: { user_id, code } }),
  uploadAppealImage: (verify_token, image) => request("/api/appeals/upload", { method: "POST", body: { verify_token, image } }),
  submitAppeal: (payload) => request("/api/appeals/submit", { method: "POST", body: payload }),

  getAppealThread: (token) => request(`/api/appeals/thread/${token}`),
  postAppealThreadMessage: (token, text, attachment_ids) =>
    request(`/api/appeals/thread/${token}/message`, { method: "POST", body: { text, attachment_ids } }),
  uploadThreadImage: (token, image) =>
    request(`/api/appeals/thread/${token}/upload`, { method: "POST", body: { image } }),

  resolveUsers: (ids) => request(`/api/exec/users/resolve`, { params: { ids: ids.join(",") } }),
  listAppeals: (status) => request("/api/exec/appeals", { params: { status } }),
  getAppeal: (id) => request(`/api/exec/appeals/${id}`),
  claimAppeal: (id) => request(`/api/exec/appeals/${id}/claim`, { method: "POST" }),
  unclaimAppeal: (id) => request(`/api/exec/appeals/${id}/unclaim`, { method: "POST" }),
  messageAppeal: (id, text, attachment_ids) => request(`/api/exec/appeals/${id}/message`, { method: "POST", body: { text, attachment_ids } }),
  uploadExecAppealImage: (id, image) => request(`/api/exec/appeals/${id}/upload`, { method: "POST", body: { image } }),
  resolveAppeal: (id, decision, note) =>
    request(`/api/exec/appeals/${id}/resolve`, { method: "POST", body: { decision, note } }),
  blacklistFromAppeal: (id, reason) => request(`/api/exec/appeals/${id}/blacklist`, { method: "POST", body: { reason } }),
  unblacklistFromAppeal: (id) => request(`/api/exec/appeals/${id}/unblacklist`, { method: "POST" }),

  listBlacklist: () => request("/api/exec/blacklist"),
  lookupBlacklistUser: (user_id) => request(`/api/exec/blacklist/lookup/${user_id}`),
  blacklistHistory: (user_id) => request(`/api/exec/blacklist/${user_id}/history`),
  addBlacklist: (user_id, reason, evidence, duration) =>
    request("/api/exec/blacklist", { method: "POST", body: { user_id, reason, evidence, duration } }),
  removeBlacklist: (user_id) => request(`/api/exec/blacklist/${user_id}`, { method: "DELETE" }),

  economySearch: (user_id) => request(`/api/exec/economy/search/${user_id}`),
  economyAdjust: (payload) => request("/api/exec/economy/adjust", { method: "POST", body: payload }),
  economyInbox: (status = "pending") => request("/api/exec/economy/inbox", { params: { status } }),
  economyInboxResolve: (id, decision) =>
    request(`/api/exec/economy/inbox/${id}/resolve`, { method: "POST", body: { decision } }),

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
  searchMembers: (q) => request("/api/exec/members/search", { params: { q } }),
  listBugReports: (status) => request("/api/exec/bugreports", { params: { status } }),
  resolveBugReport: (id, decision) => request(`/api/exec/bugreports/${id}/resolve`, { method: "POST", body: { decision } }),
  modUserLookup: (q, guildId) => request("/api/exec/mod/user", { params: { q, guild_id: guildId } }),
  modAction: (payload) => request("/api/exec/mod/action", { method: "POST", body: payload }),
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

// One authenticated connection per tab, shared by all dashboard subscribers.
const socketListeners = new Set();
let execSocket = null;
let reconnectTimer = null;
let retryDelay = 1000;
let socketState = "offline";
function notifySocketState(state) {
  socketState = state;
  socketListeners.forEach((listener) => listener.onStatus?.(state));
}
function openExecSocket() {
  const token = getToken();
  if (!token || !socketListeners.size || execSocket) return;
  notifySocketState("connecting");
  const url = new URL(API_BASE || window.location.origin, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/exec";
  url.search = new URLSearchParams({ token }).toString();
  const ws = new WebSocket(url);
  execSocket = ws;
  ws.onopen = () => { retryDelay = 1000; notifySocketState("connected"); };
  ws.onmessage = (evt) => {
    let message;
    try { message = JSON.parse(evt.data); } catch { return; }
    socketListeners.forEach(({ onMessage }) => {
      try { onMessage(message); } catch (error) { console.error("Socket subscriber failed", error); }
    });
  };
  ws.onclose = () => {
    if (execSocket !== ws) return;
    execSocket = null;
    notifySocketState("offline");
    if (socketListeners.size && getToken()) {
      reconnectTimer = setTimeout(openExecSocket, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  };
  ws.onerror = () => ws.close();
}
export function connectExecSocket(onMessage, onStatus) {
  const listener = { onMessage, onStatus };
  socketListeners.add(listener);
  onStatus?.(socketState);
  openExecSocket();
  return () => {
    socketListeners.delete(listener);
    if (!socketListeners.size) {
      clearTimeout(reconnectTimer);
      const ws = execSocket;
      execSocket = null;
      ws?.close();
      socketState = "offline";
      retryDelay = 1000;
    }
  };
}

// Builds a URL for an appeal attachment image. <img> tags can't send an
// Authorization header, so staff view needs the session token as a query
// param; the public thread view uses the appeal's own share token instead.
export function attachmentUrl(id, { threadToken } = {}) {
  if (threadToken) {
    return `${API_BASE}/api/appeals/attachments/${id}?token=${encodeURIComponent(threadToken)}`;
  }
  const staffToken = getToken();
  return `${API_BASE}/api/appeals/attachments/${id}${staffToken ? `?staff_token=${encodeURIComponent(staffToken)}` : ""}`;
}

export { ApiError, API_BASE };