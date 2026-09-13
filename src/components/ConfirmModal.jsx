import React, { useState } from "react";

export default function ConfirmModal({ title, description, confirmWord, confirmLabel = "Confirm", danger, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  const ready = !confirmWord || typed === confirmWord;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        {description && <p className="text-white/50 text-sm mb-4">{description}</p>}
        {confirmWord && (
          <div className="mb-4">
            <label className="text-white/40 text-xs block mb-1">
              Type <span className="font-mono text-white/70">{confirmWord}</span> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!ready}
            className={`px-4 py-2 text-sm rounded-lg font-medium ${
              danger
                ? "bg-red-600/90 hover:bg-red-600 text-white disabled:opacity-40"
                : "bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
