import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

// Shared cache + batched fetch so many <UserLabel> rows on one page collapse
// into a single request instead of one per row.
const cache = new Map(); // id -> {username, avatar} | null (null = not found)
let pending = new Set();
let flushTimer = null;
const listeners = new Set();

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    const ids = [...pending];
    pending = new Set();
    flushTimer = null;
    if (ids.length === 0) return;
    try {
      const result = await api.resolveUsers(ids);
      for (const id of ids) cache.set(id, result[id] || null);
    } catch {
      for (const id of ids) cache.set(id, null);
    } finally {
      listeners.forEach((fn) => fn());
    }
  }, 30);
}

function request(id) {
  if (cache.has(id)) return;
  pending.add(id);
  scheduleFlush();
}

/** Shows a username next to a raw user ID, resolved lazily and cached.
 * Usage: <UserLabel id={userId} /> or <UserLabel id={userId} idOnly /> */
export function useUsername(id) {
  const key = String(id || "");
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!key) return;
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    request(key);
    return () => listeners.delete(listener);
  }, [key]);
  return cache.get(key);
}

export default function UserLabel({ id, fallback = null, className = "" }) {
  const entry = useUsername(id);
  if (!id) return fallback;
  return (
    <span className={className}>
      {entry?.username ? (
        <>
          <span className="text-white/80">{entry.username}</span>{" "}
          <span className="text-white/30 text-xs">({id})</span>
        </>
      ) : (
        <span className="text-white/50">{id}</span>
      )}
    </span>
  );
}
