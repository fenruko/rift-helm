import React, { useState, useRef } from "react";
import { api } from "../lib/api";

function readImageFromClipboard(e) {
  const items = e.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STEPS = { ID: "id", CONFIRM: "confirm", OTP: "otp", FORM: "form", DONE: "done" };

export default function AppealModal({ onClose }) {
  const [step, setStep] = useState(STEPS.ID);
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(null);
  const [otp, setOtp] = useState("");
  const [verifyToken, setVerifyToken] = useState(null);

  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [images, setImages] = useState([]); // {id, previewUrl}
  const [pasteHint, setPasteHint] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [threadUrl, setThreadUrl] = useState(null);
  const evidenceRef = useRef(null);

  const lookup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const p = await api.lookupAppealUser(userId.trim());
      setProfile(p);
      setStep(STEPS.CONFIRM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmYes = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.sendAppealOtp(profile.user_id);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { verify_token } = await api.verifyAppealOtp(profile.user_id, otp.trim());
      setVerifyToken(verify_token);
      setStep(STEPS.FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (e) => {
    const file = readImageFromClipboard(e);
    if (!file) return;
    e.preventDefault();
    setPasteHint(false);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { id } = await api.uploadAppealImage(verifyToken, dataUrl);
      setImages((prev) => [...prev, { id, previewUrl: dataUrl }]);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeImage = (id) => setImages((prev) => prev.filter((i) => i.id !== id));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.submitAppeal({
        verify_token: verifyToken,
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
        attachment_ids: images.map((i) => i.id),
      });
      setThreadUrl(res.thread_url);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/50">

        {step === STEPS.ID && (
          <form onSubmit={lookup}>
            <h3 className="text-white font-semibold text-lg mb-1">Appeal a Rift blacklist</h3>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              This form appeals being blocked from using the <strong className="text-white/70">Rift bot service</strong> itself.
              It is <strong className="text-white/70">not</strong> for appealing a ban from an individual Discord server
              &mdash; for that, please contact that server's own staff.
            </p>
            <label className="text-white/40 text-xs block mb-1">Your Discord user ID</label>
            <input
              autoFocus
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 1512032332163448880"
              className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 mb-1"
            />
            <p className="text-white/25 text-xs mb-4">
              Enable Developer Mode in Discord, right-click your profile, "Copy User ID".
            </p>
            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loading || !userId.trim()} className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40">
                {loading ? "Looking up..." : "Continue"}
              </button>
            </div>
          </form>
        )}

        {step === STEPS.CONFIRM && profile && (
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Is this you?</h3>
            <div className="flex items-center gap-3 bg-panel border border-border rounded-xl p-4 mb-4">
              <img src={profile.avatar} alt="" className="w-14 h-14 rounded-full" />
              <div>
                <div className="text-white font-medium">{profile.username}</div>
                <div className="text-white/40 text-xs">{profile.user_id}</div>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setStep(STEPS.ID); setProfile(null); }} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5">
                No, that's not me
              </button>
              <button onClick={confirmYes} disabled={loading} className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40">
                {loading ? "Sending code..." : "Yes, that's me"}
              </button>
            </div>
          </div>
        )}

        {step === STEPS.OTP && (
          <form onSubmit={verifyCode}>
            <h3 className="text-white font-semibold text-lg mb-1">Check your DMs</h3>
            <p className="text-white/50 text-sm mb-4">
              We sent a 4-digit code to {profile.username} on Discord. Enter it below.
            </p>
            <input
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
              className="w-full bg-panel border border-border rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500/50 mb-4"
            />
            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loading || otp.length !== 4} className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40">
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        )}

        {step === STEPS.FORM && (
          <form onSubmit={submit}>
            <h3 className="text-white font-semibold text-lg mb-1">Tell us your appeal</h3>
            <p className="text-white/50 text-sm mb-4">Identity verified as {profile.username}.</p>

            <div className="mb-3">
              <label className="text-white/40 text-xs block mb-1">Why should the blacklist be lifted?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="mb-2">
              <label className="text-white/40 text-xs block mb-1">Evidence / context (optional)</label>
              <textarea
                ref={evidenceRef}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                onPaste={handlePaste}
                onFocus={() => setPasteHint(true)}
                rows={3}
                placeholder="Links, extra context... you can paste (Ctrl/Cmd+V) a screenshot directly here"
                className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
              />
              {pasteHint && images.length === 0 && (
                <p className="text-white/25 text-xs mt-1">Tip: copy a screenshot, click here, then paste.</p>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {images.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.previewUrl} className="w-16 h-16 object-cover rounded-lg border border-border" />
                    <button type="button" onClick={() => removeImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs leading-none">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loading || reason.trim().length < 10} className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40">
                {loading ? "Submitting..." : "Submit appeal"}
              </button>
            </div>
          </form>
        )}

        {step === STEPS.DONE && (
          <>
            <h3 className="text-white font-semibold text-lg mb-2">Appeal submitted</h3>
            <p className="text-white/50 text-sm mb-2">
              Staff will review it. We also DMed you a private link to follow the conversation:
            </p>
            <a href={threadUrl} className="text-blue-400 text-sm break-all hover:underline block mb-4">{threadUrl}</a>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
