import React from 'react';
import { BarChart, Bar, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useReducedMotion from '../hooks/useReducedMotion';
const colors = ['#8ce8c9', '#88bbdf', '#aa9de0', '#d6bd88', '#dc9caa'];
export default function DistributionChart({ title, description, data, valueLabel = 'Count' }) {
  const reducedMotion = useReducedMotion();
  return <section className="dashboard-panel mb-6"><div className="panel-heading"><div><div className="section-kicker">DATA EXPLORER</div><h2>{title}</h2><p className="text-xs text-white/40 mt-2">{description}</p></div></div>
    {!data.length ? <div className="empty-table">No measurements available yet.</div> : <>
      <div style={{ height: 230 }} role="img" aria-label={`${title}. ${data.map(d => `${d.name}: ${d.value.toLocaleString()}`).join('. ')}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={100}><BarChart data={data} margin={{ top: 8, left: 0, right: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#ffffff0b" strokeDasharray="3 5" />
          <XAxis dataKey="name" tick={{ fill: '#8995a3', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#8995a3', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={v => Intl.NumberFormat(undefined, { notation: 'compact' }).format(v)} />
          <Tooltip cursor={{ fill: '#ffffff03' }} formatter={v => [v.toLocaleString(), valueLabel]} contentStyle={{ background: '#20252b', border: '1px solid #394149', borderRadius: 10, color: '#eef2f6', fontSize: 12 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={65} isAnimationActive={!reducedMotion} animationDuration={650}>{data.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} fillOpacity={0.85} />)}</Bar>
        </BarChart></ResponsiveContainer>
      </div>
    </>}
  </section>;
}
