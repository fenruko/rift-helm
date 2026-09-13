import React from "react";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div className="text-white/40 text-sm">
        You don't have the <span className="font-mono text-white/60">{permission}</span> permission
        needed to view this page. Ask someone with <span className="font-mono text-white/60">staff.manage</span> to grant it.
      </div>
    );
  }
  return children;
}
