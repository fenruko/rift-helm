import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-panel flex relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%)",
        }}
      />
      <Sidebar />
      <main className="flex-1 p-8 max-w-6xl relative">{children}</main>
    </div>
  );
}
