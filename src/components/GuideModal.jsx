import React, { useState } from "react";
import { createPortal } from "react-dom";

const SECTIONS = [
  {
    title: "Getting oriented",
    icon: "🧭",
    steps: [
      "Use the sidebar to jump between Overview, Moderation, Economy, Tickets, and more -- you'll only see pages your permissions allow.",
      "The green ● Live badge on some pages means you're getting real-time updates without needing to refresh.",
    ],
  },
  {
    title: "Handling a ban appeal",
    icon: "📨",
    steps: [
      "Go to Ban Appeals. New ones land in the 'Open' tab.",
      "Click an appeal to see the full reason, evidence, and whether the user is actually blacklisted -- a yellow warning means they might just be trolling.",
      "Click 'Claim this appeal' so other staff know you're handling it.",
      "Use the quick-reply dropdown or type your own message, then Approve or Deny.",
      "The user gets DMed automatically and can reply via their own private thread link -- you'll see their replies live.",
    ],
  },
  {
    title: "Managing the blacklist",
    icon: "🚫",
    steps: [
      "The Blacklist page shows everyone currently blocked from using Rift bot-wide (not the same as a single server's own ban).",
      "Add someone directly with their Discord ID and a reason, or blacklist straight from an appeal you're reviewing.",
      "Remove someone to instantly restore their access.",
    ],
  },
  {
    title: "Day-to-day moderation",
    icon: "🛡️",
    steps: [
      "The Moderation page lets you look up a user in a specific guild -- warnings, mod history, ban status, roles.",
      "Tickets & Reports shows anything users have flagged inside servers.",
      "Bot Control is for cog reloads, maintenance mode, and restarts -- only touch this if you know what you're doing.",
    ],
  },
];

export default function GuideModal({ onClose }) {
  const [active, setActive] = useState(0);
  const section = SECTIONS[active];

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl shadow-black/60">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(99,102,241,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.25) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 0%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 0%, transparent 100%)",
          }}
        />

        <div className="relative p-6 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-blue-400/70 mb-1">Staff Dashboard Guide</div>
            <h2 className="text-white text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              How to use everything
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
        </div>

        <div className="relative flex" style={{ minHeight: 340 }}>
          <div className="w-44 shrink-0 border-r border-border p-3 space-y-1">
            {SECTIONS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  active === i ? "bg-blue-600/15 text-white border border-blue-500/20" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>{section.icon}</span> {section.title}
            </h3>
            <div className="space-y-3">
              {section.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-300 text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}