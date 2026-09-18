import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartPanel from './ChartPanel';
import useReducedMotion from '../hooks/useReducedMotion';
import { TOOLTIP_STYLE, colorAt, compactNumber } from './chartTheme';

// Share-of-total donut with its own legend, for splits like
// open vs closed or permanent vs timed.
export default function DonutChart({ title, description, data, valueLabel = 'Count', centerLabel = 'Total', empty = 'Nothing to chart yet.' }) {
  const reducedMotion = useReducedMotion();
  const rows = (data || []).map((row) => ({ name: String(row.name), value: Number(row.value) || 0 })).filter((row) => row.value > 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <ChartPanel title={title} note={description} empty={rows.length ? null : empty}>
      <div className="donut-layout">
        <div className="donut-canvas" role="img" aria-label={`${title}. ${rows.map((d) => `${d.name}: ${d.value.toLocaleString()}`).join('. ')}`}>
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <PieChart accessibilityLayer>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                innerRadius="56%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={!reducedMotion}
                animationDuration={650}
              >
                {rows.map((row, index) => <Cell key={`${row.name}-${index}`} fill={colorAt(index)} fillOpacity={0.9} />)}
              </Pie>
              <Tooltip formatter={(value) => [Number(value).toLocaleString(), valueLabel]} contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center"><strong title={total.toLocaleString()}>{total >= 100000 ? compactNumber(total) : total.toLocaleString()}</strong><span>{centerLabel}</span></div>
        </div>
        <ul className="donut-legend">
          {rows.map((row, index) => (
            <li key={`${row.name}-${index}`}>
              <i style={{ background: colorAt(index) }} />
              <span className="donut-name">{row.name}</span>
              <span className="donut-value">{row.value.toLocaleString()}</span>
              <span className="donut-share">{Math.round((row.value / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  );
}
