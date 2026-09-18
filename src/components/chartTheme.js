// Shared chart styling so every page's graphs look like siblings.
export const CHART_COLORS = ['#8ce8c9', '#88bbdf', '#aa9de0', '#d6bd88', '#dc9caa', '#8fd4b6'];
export const GRID_STROKE = '#ffffff0b';
export const AXIS_TICK = { fill: '#8995a3', fontSize: 10 };
export const TOOLTIP_STYLE = { background: '#20252b', border: '1px solid #394149', borderRadius: 10, color: '#eef2f6', fontSize: 12 };
export const colorAt = (index) => CHART_COLORS[index % CHART_COLORS.length];
export const compactNumber = (value) => Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
export const shortId = (id, length = 4) => `…${String(id ?? '').slice(-length)}`;
