import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartPanel from './ChartPanel';
import useReducedMotion from '../hooks/useReducedMotion';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE, colorAt, compactNumber } from './chartTheme';

// Vertical bars for a handful of categories on one axis (action types,
// statuses, buckets).
export default function DistributionChart({ title, description, data, valueLabel = 'Count', height = 230 }) {
  const reducedMotion = useReducedMotion();
  const rows = (data || []).filter((row) => Number.isFinite(Number(row.value)));
  const total = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);

  return (
    <ChartPanel
      title={title}
      note={description}
      empty={rows.length ? null : 'No measurements available yet.'}
    >
      <div style={{ height }} role="img" aria-label={`${title}. ${rows.map((d) => `${d.name}: ${Number(d.value).toLocaleString()}`).join('. ')}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart data={rows} margin={{ top: 8, left: 0, right: 8 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 5" />
            <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={compactNumber} width={38} />
            <Tooltip cursor={{ fill: '#ffffff03' }} formatter={(value) => [Number(value).toLocaleString(), valueLabel]} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={65} isAnimationActive={!reducedMotion} animationDuration={650}>
              {rows.map((row, index) => <Cell key={`${row.name}-${index}`} fill={colorAt(index)} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {total > 0 && <div className="chart-footnote">{valueLabel} total: <strong>{total.toLocaleString()}</strong></div>}
    </ChartPanel>
  );
}
