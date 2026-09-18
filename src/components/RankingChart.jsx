import React from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartPanel from './ChartPanel';
import useReducedMotion from '../hooks/useReducedMotion';
import { AXIS_TICK, TOOLTIP_STYLE, colorAt, compactNumber } from './chartTheme';

// Horizontal bars for ranked lists where the labels are long (guilds,
// users, channels). Sorted high to low and capped.
export default function RankingChart({ title, description, data, valueLabel = 'Count', maxItems = 8, empty = 'Nothing to chart yet.', height }) {
  const reducedMotion = useReducedMotion();
  const rows = (data || [])
    .map((row) => ({ name: String(row.name), value: Number(row.value) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);
  const canvasHeight = height || Math.max(150, rows.length * 34 + 26);

  return (
    <ChartPanel title={title} note={description} empty={rows.length ? null : empty}>
      <div style={{ height: canvasHeight }} role="img" aria-label={`${title}. ${rows.map((d) => `${d.name}: ${d.value.toLocaleString()}`).join('. ')}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 46, left: 0, bottom: 0 }} accessibilityLayer>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={104} tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#ffffff03' }} formatter={(value) => [Number(value).toLocaleString(), valueLabel]} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18} isAnimationActive={!reducedMotion} animationDuration={650}>
              {rows.map((row, index) => <Cell key={`${row.name}-${index}`} fill={colorAt(index)} fillOpacity={0.85} />)}
              <LabelList dataKey="value" position="right" formatter={compactNumber} style={{ fill: '#c6ced6', fontSize: 10 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}
