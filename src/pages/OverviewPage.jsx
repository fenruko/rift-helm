import React, { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { api, connectExecSocket } from "../lib/api";
import { appendSample, numeric, summarize } from '../lib/telemetry';
import { useAuth } from '../context/AuthContext';
import useReducedMotion from '../hooks/useReducedMotion';
import StatCard from "../components/StatCard";
import Icon from '../components/Icon';

function fmtUptime(seconds) {
  if (numeric(seconds) === null) return "—";
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
const metrics = { latency: { label: 'Latency', unit: 'ms', color: '#7ce8c4' }, cpu: { label: 'CPU usage', unit: '%', color: '#afa0ff' }, users: { label: 'Users', unit: '', color: '#81b7ff' }, guilds: { label: 'Guilds', unit: '', color: '#f2c882' } };
const timeLabel = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const display = (value, unit = '') => value === null || value === undefined ? '—' : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;

export default function OverviewPage() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [samples, setSamples] = useState([]);
  const [metric, setMetric] = useState('latency');
  const [refreshing, setRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [updated, setUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [cogQuery, setCogQuery] = useState('');
  const reducedMotion = useReducedMotion();
  const refreshRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let revision = 0;
    const accept = (value) => {
      if (!mounted || !value || typeof value !== 'object') return;
      setData(value); setError(null); setUpdated(Date.now());
      setSamples(previous => appendSample(previous, value));
    };
    const refresh = async () => {
      const atStart = revision;
      setRefreshing(true);
      try { const value = await api.overview(); if (revision === atStart) accept(value); }
      catch (e) { if (mounted && revision === atStart) setError(e.message); }
      finally { if (mounted) setRefreshing(false); }
    };
    refreshRef.current = refresh;
    refresh();
    const disconnect = connectExecSocket((message) => {
      if (message.type === 'overview') { revision++; accept(message.data); }
    }, state => mounted && setConnection(state));
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => { mounted = false; refreshRef.current = null; disconnect(); clearInterval(clock); };
  }, [attempt]);

  const selected = metrics[metric];
  const stats = useMemo(() => summarize(samples, metric), [samples, metric]);
  const fresh = updated && now - updated < 45000;
  const status = connection === 'connected' && fresh ? 'Live updates' : data ? 'Snapshot mode' : 'Connecting';
  const cogs = Array.isArray(data?.cogs_loaded) ? data.cogs_loaded : [];
  const exportData = () => {
    const csv = ['timestamp,latency_ms,cpu_percent,users,guilds', ...samples.map(s => [new Date(s.time).toISOString(), s.latency, s.cpu, s.users, s.guilds].join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'rift-session-telemetry.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="overview-page">
    <div className="page-heading">
      <div><h1>Overview<span className="heading-dot">.</span></h1></div>
      <div className="heading-actions"><button className="secondary-button" disabled={refreshing} onClick={() => refreshRef.current?.()}><Icon name="refresh" size={15} className={refreshing ? 'spin' : ''} />{refreshing ? 'Refreshing' : 'Refresh'}</button><button className="primary-button" onClick={exportData} disabled={!samples.length}><Icon name="download" size={15} />Export data</button></div>
    </div>
    {error && <div className="error-banner" role="alert"><div><strong>Couldn’t refresh your overview.</strong><p>{error}</p>{data && <p>The last received snapshot is still shown.</p>}</div><button className="secondary-button" onClick={() => setAttempt(a => a + 1)}>Try again</button></div>}
    {!data ? (!error && <div className="loading-grid" role="status" aria-label="Loading overview">{[0,1,2,3].map(i => <div className="skeleton" key={i} />)}<div className="skeleton skeleton-chart" /><span className="sr-only">Loading overview…</span></div>) : <>
      <div className="overview-status"><span className={`status-pill ${status === 'Live updates' ? 'live' : ''}`}><span className="status-dot" />{status}</span><span>Last received {updated ? timeLabel(updated) : '—'}</span></div>
      <div className="metric-grid">
        <StatCard label="Total guilds" value={data.guild_count ?? data.servers ?? '—'} icon="guilds" />
        <StatCard label="Total users" value={data.users ?? '—'} icon="users" />
        <StatCard label="API latency" value={display(numeric(data.latency), ' ms')} icon="activity" tone={numeric(data.latency) === null ? 'default' : data.latency > 300 ? 'warn' : 'good'} sub={numeric(data.latency) === null ? 'Not reported' : data.latency > 300 ? 'Above 300 ms threshold' : 'Within 300 ms threshold'} />
        <StatCard label="Bot uptime" value={fmtUptime(data.uptime)} icon="clock" sub="Since the last restart" />
      </div>
      <div className="analytics-grid">
        <section className="dashboard-panel telemetry-panel">
          <div className="panel-heading"><div><h2>Network telemetry</h2></div><span className="small-badge">{samples.length} sample{samples.length === 1 ? "" : "s"}</span></div>
          <div className="chart-toolbar"><div className="segmented-control" role="group" aria-label="Chart metric">{Object.entries(metrics).map(([key, item]) => <button key={key} aria-pressed={metric === key} onClick={() => setMetric(key)} className={metric === key ? 'selected' : ''}>{item.label}</button>)}</div><span className="chart-legend"><i style={{ background: selected.color }} />{selected.label}</span></div>
          <div className="chart-summary"><strong>{display(numeric(data[metric === 'guilds' ? 'guild_count' : metric] ?? (metric === 'guilds' ? data.servers : null)), selected.unit)}</strong><span>latest measurement</span></div>
          <div className="telemetry-chart" role="img" aria-label={`${selected.label} during this session. Average ${display(stats.average, selected.unit)}, peak ${display(stats.peak, selected.unit)}. ${samples.length} samples.`}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={samples} margin={{ top: 12, right: 10, left: -18, bottom: 4 }} accessibilityLayer>
                <defs><linearGradient id="telemetry-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selected.color} stopOpacity={0.25} /><stop offset="100%" stopColor={selected.color} stopOpacity={0.005} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#ffffff0d" strokeDasharray="3 5" />
                <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={timeLabel} tick={{ fill: '#777f8d', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={65} />
                <YAxis tick={{ fill: '#777f8d', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip labelFormatter={timeLabel} formatter={value => [display(value, selected.unit), selected.label]} contentStyle={{ background: '#20252b', border: '1px solid #394149', borderRadius: 12, color: '#eef2f6', fontSize: 12 }} />
                <Area key={metric} type="monotone" dataKey={metric} stroke={selected.color} strokeWidth={2.5} fill="url(#telemetry-fill)" dot={samples.length < 2 ? { r: 4, fill: selected.color } : false} activeDot={{ r: 5, strokeWidth: 4, stroke: '#20252b' }} isAnimationActive={!reducedMotion} animationDuration={550} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footnote">{samples.length < 2 ? 'Waiting for the next reading.' : 'Collected in this tab · up to 120 live readings · the API has no history endpoint'}</div>
          <div className="chart-stats"><div><span>Session average</span><strong>{display(stats.average, selected.unit)}</strong></div><div><span>Session peak</span><strong>{display(stats.peak, selected.unit)}</strong></div><div><span>Net change</span><strong>{stats.change === null ? '—' : `${stats.change > 0 ? '+' : ''}${display(stats.change, selected.unit)}`}</strong></div></div>
        </section>
        <section className="dashboard-panel resources-panel"><div className="panel-heading"><div><h2>System resources</h2></div><Icon name="control" /></div>
          <div className="resource-gauge" style={{ '--usage': `${Math.max(0, Math.min(100, numeric(data.cpu) ?? 0))}%` }}><div><Icon name="activity" size={20} /><strong>{display(numeric(data.cpu), '%')}</strong><span>CPU utilization</span></div></div>
          <div className="resource-rows"><div><span><i className="legend-dot purple" />Memory usage</span><strong>{data.ram ?? data.memory ?? '—'}</strong></div><div><span><Icon name="overview" size={15} />Active shards</span><strong>{data.shards ?? '—'}</strong></div><div><span><Icon name="voice" size={15} />Voice connections</span><strong>{data.voice_connections ?? '—'}</strong></div></div>
          <div className="resource-note"><Icon name="activity" size={16} /><span>Values from the latest received snapshot.</span></div>
        </section>
      </div>
      <div className="bottom-grid"><section className="dashboard-panel"><div className="panel-heading"><div><h2>Loaded cogs <span className="count-badge">{data.cog_count ?? cogs.length}</span></h2></div><label className="cog-search"><Icon name="search" size={15} /><input aria-label="Filter loaded cogs" placeholder="Filter modules…" value={cogQuery} onChange={e => setCogQuery(e.target.value)} /></label></div><div className="cog-list">{cogs.filter(c => String(c).toLowerCase().includes(cogQuery.toLowerCase())).map(c => <span className="cog-chip" key={c}><i />{c}</span>)}{!cogs.length && <p className="text-sm text-white/40">No loaded modules reported.</p>}{cogs.length > 0 && !cogs.some(c => String(c).toLowerCase().includes(cogQuery.toLowerCase())) && <p className="text-sm text-white/40">No modules match your search.</p>}</div></section>
      <section className="dashboard-panel shortcuts-panel"><div className="panel-heading"><div><h2>Quick access</h2></div></div>{[{ to: '/moderation', permission: 'moderation.view', icon: 'shield', label: 'Moderation', sub: 'User lookup, warnings and actions' }, { to: '/economy', permission: 'economy.view', icon: 'economy', label: 'Economy', sub: 'Balances and pending adjustments' }, { to: '/bot-control', permission: 'overview.view', icon: 'control', label: 'Bot control', sub: 'Cogs, maintenance and restarts' }].filter(item => hasPermission(item.permission)).map(item => <Link key={item.to} to={item.to} className="shortcut"><span className="shortcut-icon"><Icon name={item.icon} /></span><span><strong>{item.label}</strong><small>{item.sub}</small></span><Icon name="arrow" size={16} /></Link>)}</section></div>
    </>}
  </div>;
}
