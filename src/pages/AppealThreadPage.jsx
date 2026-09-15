import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api, attachmentUrl } from "../lib/api";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function timeAgo(ts) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const STATUS_LABEL = {
  open: "Waiting for staff",
  claimed: "Being reviewed",
  approved: "Approved",
  denied: "Denied",
};

export default function AppealThreadPage() {
  const { token } = useParams();
  const [appeal, setAppeal] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);
  const pollRef = useRef(null);

  const load = () => {
    api.getAppealThread(token).then(setAppeal).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 8000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addImage = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const { id } = await api.uploadThreadImage(token, dataUrl);
      setImages((prev) => [...prev, { id, previewUrl: dataUrl }]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        addImage(item.getAsFile());
        return;
      }
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;
    setSending(true);
    setError(null);
    try {
      await api.postAppealThreadMessage(token, text.trim(), images.map((i) => i.id));
      setText("");
      setImages([]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center p-4">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-2xl shadow-black/50">
        <h1 className="text-white text-lg font-semibold mb-1">Your Rift Appeal</h1>

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        {!appeal && !error && <div className="text-white/40 text-sm">Loading...</div>}

        {appeal && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/40 text-xs">Appeal #{appeal.id} &middot; {timeAgo(appeal.created_at)}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  appeal.status === "approved"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : appeal.status === "denied"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {STATUS_LABEL[appeal.status]}
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4 pr-1">
              <div className="text-sm bg-panel border border-border rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1">Your appeal</div>
                <div className="text-white/80">{appeal.reason}</div>
                {appeal.evidence && <div className="text-white/60 mt-2 text-xs">{appeal.evidence}</div>}
                {appeal.evidence_attachment_ids?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {appeal.evidence_attachment_ids.map((id) => (
                      <a key={id} href={attachmentUrl(id, { threadToken: token })} target="_blank" rel="noreferrer">
                        <img
                          src={attachmentUrl(id, { threadToken: token })}
                          alt="evidence"
                          className="w-16 h-16 object-cover rounded-lg border border-border hover:border-white/30"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {appeal.messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg p-2 ${
                    m.is_staff ? "bg-blue-600/10 border border-blue-600/20 mr-6" : "bg-panel border border-border ml-6"
                  }`}
                >
                  <div className="text-white/40 text-xs mb-0.5">
                    {m.is_staff ? "Staff" : "You"} &middot; {timeAgo(m.ts)}
                  </div>
                  {m.text && <div className="text-white/80">{m.text}</div>}
                  {m.attachment_ids?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {m.attachment_ids.map((id) => (
                        <a key={id} href={attachmentUrl(id, { threadToken: token })} target="_blank" rel="noreferrer">
                          <img
                            src={attachmentUrl(id, { threadToken: token })}
                            alt="attachment"
                            className="w-16 h-16 object-cover rounded-lg border border-border hover:border-white/30"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {appeal.status !== "approved" && appeal.status !== "denied" ? (
              <form onSubmit={send}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPaste={handlePaste}
                  rows={2}
                  placeholder="Reply to staff... (paste a screenshot with Ctrl/Cmd+V)"
                  className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 resize-none mb-2"
                />
                {images.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {images.map((img) => (
                      <img key={img.id} src={img.previewUrl} className="w-12 h-12 object-cover rounded-lg border border-border" />
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <label className="px-3 py-2 text-sm rounded-lg bg-panel border border-border hover:border-white/30 text-white/60 cursor-pointer">
                    📎 Attach image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ""; }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={sending || (!text.trim() && images.length === 0)}
                    className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-white/40 text-xs text-center py-2">This appeal has been resolved.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}