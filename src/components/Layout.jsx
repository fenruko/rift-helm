import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-panel flex">
      <Sidebar />
      <main className="flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  );
}
