import React, { useState } from "react";
import { api } from "../lib/api";

export default function AppealModal({ onClose }) {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.submitAppeal({
        user_id: userId.trim(),
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full">
        {submitted ? (
          <>
            <h3 className="text-white font-semibold text-lg mb-2">Appeal submitted</h3>
            <p className="text-white/50 text-sm mb-4">
              Staff will review it and get back to you. There's no need to submit another one
              in the meantime.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h3 className="text-white font-semibold text-lg mb-1">Appeal a ban</h3>
            <p className="text-white/50 text-sm mb-4">
              Tell us your Discord user ID and why you think the ban should be lifted.
            </p>

            <div className="mb-3">
              <label className="text-white/40 text-xs block mb-1">Discord user ID</label>
              <input
                autoFocus
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 1512032332163448880"
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
            </div>

            <div className="mb-3">
              <label className="text-white/40 text-xs block mb-1">Why should this ban be lifted?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="text-white/40 text-xs block mb-1">Evidence / context (optional)</label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={3}
                placeholder="Links, screenshots described, anything else relevant"
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 resize-none"
              />
            </div>

            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !userId.trim() || reason.trim().length < 10}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
              >
                {loading ? "Submitting..." : "Submit appeal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
