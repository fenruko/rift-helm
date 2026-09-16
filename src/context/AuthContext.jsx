import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser({ id: me.id, username: me.username, role: me.role, permissions: me.permissions || [] });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username, password, totp_code) => {
    const res = await api.login(username, password, totp_code);
    setToken(res.token);
    setUser({ id: res.id, username: res.username, role: res.role, permissions: res.permissions || [] });
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore -- log out locally regardless
    }
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes("*") || perms.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}