import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axisTickStyle, compactNumber, ink, tooltipStyle } from '../theme';

interface TrendLineChartProps<T> {
  data: T[];
  xKey: Extract<keyof T, string>;
  yKey: Extract<keyof T, string>;
  color: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

/** Single-series trend with a hover crosshair + tooltip (line/area charts
 * are interactive by default — see the dataviz skill's interaction rules). */
export function TrendLineChart<T>({
  data,
  xKey,
  yKey,
  color,
  height = 220,
  valueFormatter = (v) => v.toLocaleString(),
}: TrendLineChartProps<T>) {
  const gradientId = `trend-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={ink.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTickStyle} axisLine={{ stroke: ink.axis }} tickLine={false} />
        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={44} tickFormatter={compactNumber} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: ink.axis, strokeWidth: 1 }}
          formatter={(value: number) => valueFormatter(value)}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
