import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppealModal from "../components/AppealModal";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password, needsTotp ? totpCode : undefined);
      navigate("/");
    } catch (err) {
      if (err.body?.totp_required) {
        setNeedsTotp(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center px-4">
      <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-white text-xl font-semibold mb-1">Rift Staff</h1>
        <p className="text-white/40 text-sm mb-6">Sign in to the executive dashboard.</p>

        <div className="mb-3">
          <label className="text-white/40 text-xs block mb-1">Username</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        <div className="mb-3">
          <label className="text-white/40 text-xs block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        {needsTotp && (
          <div className="mb-3">
            <label className="text-white/40 text-xs block mb-1">2FA code</label>
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        )}

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-4 py-2.5 rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setShowAppeal(true)}
          className="w-full mt-4 text-center text-white/30 hover:text-white/60 text-xs"
        >
          Want to appeal a ban?
        </button>
      </form>

      {showAppeal && <AppealModal onClose={() => setShowAppeal(false)} />}
    </div>
  );
}
