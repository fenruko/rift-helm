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
    <div className="login-page min-h-screen bg-panel flex items-center justify-center px-4 relative overflow-hidden">
      <section className="login-story"><div className="brand-name"><div className="brand-mark">r<span>.</span></div> rift<span className="brand-tag">STAFF</span></div><h2>Staff dashboard</h2><p>Moderation, economy, appeals, tickets and bot control for the Rift bot.</p></section>
      <form onSubmit={submit} className="login-form relative bg-surface border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/50">
        <h1 className="text-white text-xl font-bold mb-1">Sign in</h1>
        <p className="text-white/40 text-sm mb-6">Staff accounts only.</p>

        <div className="mb-3">
          <label htmlFor="username" className="text-white/60 text-xs block mb-1">Username</label>
          <input
            id="username"
            autoComplete="username"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="text-white/60 text-xs block mb-1">Password</label>
          <input
            id="password"
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        {needsTotp && (
          <div className="mb-3">
            <label htmlFor="totp" className="text-white/60 text-xs block mb-1">2FA code</label>
            <input
              id="totp"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
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
