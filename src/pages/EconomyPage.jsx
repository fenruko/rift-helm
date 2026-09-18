import DistributionChart from "../components/DistributionChart";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import MemberSearchInput from "../components/MemberSearchInput";

function timeAgo(ts) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function UserSearch({ canManage }) {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(searchParams.get("u") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!userId.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await api.economySearch(userId.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("u")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjust = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await api.economyAdjust({
        user_id: userId.trim(), guild_id: "0", amount: parseInt(amount, 10), reason: reason.trim(),
      });
      setNotice(
        res.status === "pending"
          ? "Amount exceeds the auto-approve threshold -- sent to the approval inbox."
          : `Applied. New balance: ${res.balance_after.toLocaleString()}`
      );
      setAmount(""); setReason("");
      search();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="text-white/60 text-sm font-medium mb-3">Search a user</div>
      <form onSubmit={search} className="flex gap-2 mb-3">
        <div className="flex-1">
          <MemberSearchInput value={userId} onChange={setUserId} placeholder="Discord ID or username" />
        </div>
        <button
          type="submit"
          disabled={busy || !userId.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
        >
          Search
        </button>
      </form>

      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {result.avatar && <img src={result.avatar} className="w-8 h-8 rounded-full" alt="" />}
            <span className="text-white text-sm">{result.username || result.user_id}</span>
          </div>

          {result.balances.length === 0 && (
            <div className="text-white/30 text-sm">No economy account for this user.</div>
          )}
          {result.balances.length > 0 && (
            <div className="text-white text-lg font-semibold">
              {result.balances[0].balance.toLocaleString()} <span className="text-white/40 text-xs font-normal">balance</span>
            </div>
          )}

          {canManage && result.balances.length > 0 && (
            <form onSubmit={adjust} className="flex gap-2 flex-wrap items-center pt-2 border-t border-border">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="+/- amount"
                className="w-28 bg-panel border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason"
                className="flex-1 min-w-[140px] bg-panel border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                disabled={busy || !amount}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white disabled:opacity-40"
              >
                Adjust balance
              </button>
            </form>
          )}
          {notice && <div className="text-emerald-400 text-xs">{notice}</div>}

          {result.adjustments?.length > 0 && (
            <div>
              <div className="text-white/40 text-xs mb-1.5">Recent adjustments</div>
              <div className="space-y-1.5">
                {result.adjustments.map((a) => (
                  <div key={a.id} className="bg-panel border border-border rounded-lg p-2 text-xs flex justify-between">
                    <div>
                      <span className={a.amount >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {a.amount >= 0 ? "+" : ""}{a.amount.toLocaleString()}
                      </span>
                      <span className="text-white/40 ml-2">{a.reason}</span>
                    </div>
                    <div className="text-white/30">
                      {a.status} &middot; by {a.staff_username} &middot; {timeAgo(a.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalInbox() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.economyInbox("pending").then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const resolve = async (id, decision) => {
    setBusy(true);
    try {
      await api.economyInboxResolve(id, decision);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="text-white/60 text-sm font-medium mb-3">Adjustments awaiting approval</div>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      {!items && !error && <div className="text-white/40 text-sm">Loading...</div>}
      {items?.length === 0 && <div className="text-white/30 text-sm">Nothing pending.</div>}
      <div className="space-y-2">
        {items?.map((a) => (
          <div key={a.id} className="bg-panel border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="text-white">
                User {a.user_id} in guild {a.guild_id}: <span className={a.amount >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {a.amount >= 0 ? "+" : ""}{a.amount.toLocaleString()}
                </span>
              </div>
              <div className="text-white/40 text-xs mt-0.5">{a.reason} &middot; requested by {a.staff_username} &middot; {timeAgo(a.created_at)}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                disabled={busy}
                onClick={() => resolve(a.id, "approved")}
                className="px-3 py-1.5 text-xs rounded-lg bg-green-600/90 hover:bg-green-600 text-white disabled:opacity-40"
              >
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => resolve(a.id, "denied")}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-600/90 hover:bg-red-600 text-white disabled:opacity-40"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EconomyPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const canManage = hasPermission("economy.manage");
  const canApprove = hasPermission("economy.approve");

  useEffect(() => {
    api.economy(50).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="text-white/40 text-sm">Loading...</div>;

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Economy</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Accounts" value={data.totals.total_accounts} />
        <StatCard label="Total balance" value={data.totals.total_balance.toLocaleString()} />
        <StatCard label="Average balance" value={data.totals.average_balance.toLocaleString()} />
        <StatCard label="Richest balance" value={data.totals.richest_balance.toLocaleString()} />
      </div>

      <DistributionChart title="Leading account balances" description="Top 5 accounts in the returned leaderboard. This is a snapshot, not a historical trend." valueLabel="Balance" data={data.leaderboard.slice(0, 5).map((row, index) => ({ name: `#${index + 1} · …${String(row.user_id).slice(-4)}`, value: Number(row.balance) || 0 }))} />

      {canManage && <UserSearch canManage={canManage} />}
      {canApprove && <ApprovalInbox />}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-white/60 text-sm font-medium">
          Balance leaderboard
        </div>
        <DataTable
          columns={[
            { key: "rank", label: "#" },
            { key: "user_id", label: "User ID" },
            { key: "guild_id", label: "Guild ID" },
            { key: "balance", label: "Balance", render: (r) => r.balance.toLocaleString() },
          ]}
          rows={data.leaderboard.map((r, i) => ({ ...r, rank: i + 1 }))}
        />
      </div>
    </div>
  );
}