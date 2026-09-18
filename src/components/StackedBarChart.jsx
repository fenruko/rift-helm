import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartPanel from './ChartPanel';
import useReducedMotion from '../hooks/useReducedMotion';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_STYLE, colorAt, compactNumber } from './chartTheme';

// Stacked bars for a category broken into parts (warns vs kicks vs bans,
// real vs fake invites, ...).
export default function StackedBarChart({ title, description, data, series, valueLabel = 'Count', height = 250 }) {
  const reducedMotion = useReducedMotion();
  const rows = data || [];
  const visibleSeries = (series || []).filter(Boolean).map((item, index) => ({ ...item, color: item.color || colorAt(index) }));

  return (
    <ChartPanel title={title} note={description} empty={rows.length && visibleSeries.length ? null : 'Nothing to chart yet.'}>
      <div style={{ height }} role="img" aria-label={`${title}. ${rows.map((row) => `${row.name}: ${visibleSeries.map((s) => `${s.label} ${Number(row[s.key]) || 0}`).join(', ')}`).join('. ')}`}>
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart data={rows} margin={{ top: 4, left: 0, right: 8 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 5" />
            <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={compactNumber} width={38} />
            <Tooltip cursor={{ fill: '#ffffff03' }} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#8995a3' }} iconType="circle" iconSize={7} />
            {visibleSeries.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                stackId="stack"
                fill={item.color}
                fillOpacity={0.85}
                maxBarSize={58}
                radius={index === visibleSeries.length - 1 ? [5, 5, 0, 0] : 0}
                isAnimationActive={!reducedMotion}
                animationDuration={650}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnote">{valueLabel}</div>
    </ChartPanel>
  );
}
