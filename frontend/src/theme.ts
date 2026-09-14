/**
 * Design tokens shared between styles.css (via CSS custom properties) and
 * chart code that needs raw hex values (recharts, MapLibre paint
 * expressions). Categorical order and status roles follow the validated
 * dark-surface palette — see the dataviz skill's color-formula reference.
 * Do not reorder the categorical array; the order is the CVD-safety proof.
 */

export const categorical = [
  '#3987e5', // 1 blue
  '#d95926', // 2 orange
  '#199e70', // 3 aqua
  '#c98500', // 4 yellow
  '#d55181', // 5 magenta
  '#008300', // 6 green
  '#9085e9', // 7 violet
  '#e66767', // 8 red
] as const;

export const status = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

/** NDVI-specific sequential ramp (low -> high vegetation vigor). Domain
 * convention for vegetation indices runs pale -> deep green, so this swaps
 * the skill's default sequential blue for the brand/domain hue while keeping
 * a single monotonic-lightness ramp. */
export const ndviRamp = ['#f4ede0', '#d8e3ad', '#a8d47f', '#72c26a', '#3fa563', '#1f7f52', '#0f5c3d'] as const;

export const chartSurface = '#132821';

export const ink = {
  primary: '#eaf6ee',
  secondary: '#a9d6bc',
  muted: '#749c85',
  grid: 'rgba(148, 208, 171, 0.14)',
  axis: 'rgba(148, 208, 171, 0.32)',
};

export function ndviColor(value: number): string {
  const steps = ndviRamp.length;
  const idx = Math.min(steps - 1, Math.max(0, Math.floor(value * steps)));
  return ndviRamp[idx];
}

export function statusColor(value: string): string {
  switch (value) {
    case 'active':
    case 'completed':
    case 'paid':
    case 'success':
    case 'healthy_vegetation':
      return status.good;
    case 'idle':
    case 'pending':
    case 'running':
    case 'moderate_vegetation':
      return status.warning;
    case 'maintenance':
      return status.serious;
    case 'cancelled':
    case 'void':
    case 'failed':
    case 'low_vegetation':
      return status.critical;
    default:
      return ink.muted;
  }
}

export const tooltipStyle = {
  background: '#0f231c',
  border: '1px solid rgba(148, 208, 171, 0.24)',
  borderRadius: 10,
  color: ink.primary,
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
};

export const axisTickStyle = { fill: ink.muted, fontSize: 11 };

/** Compact axis tick label (1.2K / 3.4M) — a fixed-width axis column can't
 * fit raw 7-8 digit values without either clipping or crowding the plot. */
export function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Deterministic entity -> color assignment so the same region or operation
 * keeps the same hue across every chart on the dashboard (color follows the
 * entity, never chart-local rank). */
export function colorScale(keys: Iterable<string>): (key: string) => string {
  const sorted = Array.from(new Set(keys)).sort();
  const map = new Map(sorted.map((key, index) => [key, categorical[index % categorical.length]]));
  return (key: string) => map.get(key) ?? ink.muted;
}
