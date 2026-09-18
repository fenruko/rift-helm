export function numeric(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function appendSample(samples, data, now = Date.now()) {
  const sample = { time: now, latency: numeric(data.latency), cpu: numeric(data.cpu), users: numeric(data.users), guilds: numeric(data.guild_count ?? data.servers) };
  // At most one sample every two seconds, and never more than 120 points.
  const previous = samples.at(-1);
  return (previous && now - previous.time < 2000 ? [...samples.slice(0, -1), sample] : [...samples, sample]).slice(-120);
}
export function summarize(samples, key) {
  const values = samples.map(s => s[key]).filter(v => v !== null && Number.isFinite(v));
  if (!values.length) return { average: null, peak: null, change: null };
  return { average: values.reduce((sum, v) => sum + v, 0) / values.length, peak: Math.max(...values), change: values.length > 1 ? values.at(-1) - values[0] : null };
}
