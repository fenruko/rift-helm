import React, { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";

// Text input that also accepts a raw Discord ID, but shows a live
// username/display-name autocomplete dropdown so staff don't need to
// already know someone's numeric ID.
export default function MemberSearchInput({ value, onChange, placeholder = "Discord ID or username" }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  const onType = (v) => {
    setQuery(v);
    onChange(v);
    clearTimeout(timer.current);
    if (!v.trim() || /^\d+$/.test(v.trim())) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const { members } = await api.searchMembers(v.trim());
        setResults(members || []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
  };

  const pick = (m) => {
    setQuery(m.id);
    onChange(m.id);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={() => pick(m)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-panel text-sm text-white"
            >
              <img src={m.avatar} alt="" className="w-5 h-5 rounded-full" />
              <span>{m.name}</span>
              <span className="text-white/40 text-xs">@{m.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
