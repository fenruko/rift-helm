import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import MemberSearchInput from "../components/MemberSearchInput";
import DonutChart from "../components/DonutChart";

function PermissionEditor({ catalog, selected, onChange, disabled }) {
  const isFullAccess = selected.includes("*");
  const byCategory = useMemo(() => {
    const map = {};
    for (const p of catalog) {
      map[p.category] = map[p.category] || [];
      map[p.category].push(p);
    }
    return map;
  }, [catalog]);

  const toggle = (key) => {
    if (isFullAccess) return; // must turn off full access first
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 bg-panel border border-border rounded-lg px-3 py-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isFullAccess}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? ["*"] : [])}
        />
        <span className="text-white text-sm font-medium">Full access (everything, always)</span>
      </label>

      <div className={isFullAccess ? "opacity-40 pointer-events-none" : ""}>
        {Object.entries(byCategory).map(([category, perms]) => (
          <div key={category} className="mb-3">
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1.5">{category}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {perms.map((p) => (
                <label
                  key={p.key}
                  className="flex items-start gap-2 bg-panel border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={selected.includes(p.key)}
                    disabled={disabled}
                    onChange={() => toggle(p.key)}
                  />
                  <span className="text-white/70 text-xs">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffFormModal({ catalog, existing, currentUser, onClose, onSaved }) {
  const [username, setUsername] = useState(existing?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(existing?.role || "Staff");
  const [permissions, setPermissions] = useState(existing?.permissions || []);
  const [discordId, setDiscordId] = useState(existing?.discord_id ? String(existing.discord_id) : "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!existing;
  const isSelf = isEdit && currentUser && existing.id === currentUser.id;
  const isSuperuser = (currentUser?.permissions || []).includes("*");
  // Can only grant permissions you hold yourself -- mirrors the server-side
  // check, so the UI doesn't even offer options that would just get 403'd.
  const grantableCatalog = isSuperuser
    ? catalog
    : catalog.filter((p) => (currentUser?.permissions || []).includes(p.key));

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { role, discord_id: discordId };
        if (!isSelf) payload.permissions = permissions; // self edits never send permissions
        if (password) payload.password = password;
        await api.updateStaff(existing.id, payload);
      } else {
        if (!username || !password) {
          setError("Username and password are required.");
          setSaving(false);
          return;
        }
        await api.createStaff({ username, password, role, permissions, discord_id: discordId });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <h3 className="text-white font-semibold text-lg mb-4">
          {isEdit ? `Edit ${existing.username}` : "New staff account"}
        </h3>

        {!isEdit && (
          <div className="mb-3">
            <label className="text-white/40 text-xs block mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        )}

        <div className="mb-3">
          <label className="text-white/40 text-xs block mb-1">
            {isEdit ? "New password (leave blank to keep current)" : "Password"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        <div className="mb-3">
          <label className="text-white/40 text-xs block mb-1">
            Discord account (links dashboard permissions to bot-wide commands)
          </label>
          <MemberSearchInput value={discordId} onChange={setDiscordId} placeholder="Discord ID or username" />
        </div>

        <div className="mb-4">
          <label className="text-white/40 text-xs block mb-1">Display role / title</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Founder, Support Lead, Night Mod"
            className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        <div className="mb-4">
          <label className="text-white/40 text-xs block mb-2">Permissions</label>
          <PermissionEditor catalog={grantableCatalog} selected={permissions} onChange={setPermissions} disabled={isSelf} />
          {isSelf && (
            <p className="text-xs text-amber-400/80 mt-1">
              You can't edit your own permissions — ask another staff.manage holder.
            </p>
          )}
        </div>

        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { user, hasPermission } = useAuth();
  const [staff, setStaff] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [deleting, setDeleting] = useState(null);

  const canManage = hasPermission("staff.manage");

  const load = async () => {
    setLoading(true);
    try {
      const [staffList, perms] = await Promise.all([api.listStaff(), api.permissionCatalog()]);
      setStaff(staffList);
      setCatalog(perms);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!canManage) {
    return (
      <div className="text-white/40 text-sm">
        You don't have the <span className="font-mono text-white/60">staff.manage</span> permission,
        so you can't view or edit staff accounts.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">Staff Management</h1>
        <button
          onClick={() => setEditing({})}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium"
        >
          + New staff account
        </button>
      </div>

      {!loading && staff.length > 0 && (
        <DonutChart
          title="2FA coverage"
          description="Staff accounts with a TOTP secret enabled."
          valueLabel="Accounts"
          centerLabel="Accounts"
          data={[
            { name: "2FA enabled", value: staff.filter((s) => s.totp_enabled).length },
            { name: "No 2FA", value: staff.filter((s) => !s.totp_enabled).length },
          ]}
        />
      )}

      {loading && <div className="text-white/40 text-sm">Loading...</div>}
      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

      {!loading && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase text-left border-b border-border">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">2FA</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-white">
                    {s.username}
                    {s.username === user?.username && (
                      <span className="ml-2 text-white/30 text-xs">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">{s.role}</td>
                  <td className="px-4 py-3">
                    {s.permissions.includes("*") ? (
                      <span className="text-amber-400 text-xs font-medium">Full access</span>
                    ) : (
                      <span className="text-white/40 text-xs">
                        {s.permissions.length} permission{s.permissions.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {s.totp_enabled ? "Enabled" : "Off"}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {s.last_login ? new Date(s.last_login * 1000).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => setEditing(s)} className="text-white/50 hover:text-white text-xs">
                      Edit
                    </button>
                    {s.username !== user?.username && (
                      <button onClick={() => setDeleting(s)} className="text-red-400/70 hover:text-red-400 text-xs">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <StaffFormModal
          catalog={catalog}
          existing={editing.id ? editing : null}
          currentUser={user}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title={`Delete ${deleting.username}?`}
          description="This immediately revokes their access. This can't be undone."
          confirmWord={deleting.username}
          confirmLabel="Delete account"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api.deleteStaff(deleting.id);
              setDeleting(null);
              load();
            } catch (e) {
              setError(e.message);
              setDeleting(null);
            }
          }}
        />
      )}
    </div>
  );
}