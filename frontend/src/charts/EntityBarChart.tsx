import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { axisTickStyle, colorScale, ink, tooltipStyle } from '../theme';

interface EntityBarChartProps<T> {
  data: T[];
  categoryKey: Extract<keyof T, string>;
  valueKey: Extract<keyof T, string>;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  valueFormatter?: (value: number) => string;
}

/** One bar per entity (region, operation, dataset…) with a stable per-entity
 * color and a direct axis label — no legend needed for a single series. */
export function EntityBarChart<T>({
  data,
  categoryKey,
  valueKey,
  height = 260,
  layout = 'vertical',
  valueFormatter = (v) => v.toLocaleString(),
}: EntityBarChartProps<T>) {
  const color = colorScale(data.map((row) => String(row[categoryKey])));

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={axisTickStyle} axisLine={{ stroke: ink.axis }} tickLine={false} hide />
          <YAxis
            type="category"
            dataKey={categoryKey}
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={92}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148,208,171,0.08)' }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => valueFormatter(value)}
          />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((row) => (
              <Cell key={String(row[categoryKey])} fill={color(String(row[categoryKey]))} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <XAxis dataKey={categoryKey} tick={axisTickStyle} axisLine={{ stroke: ink.axis }} tickLine={false} />
        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={40} hide />
        <Tooltip
          cursor={{ fill: 'rgba(148,208,171,0.08)' }}
          contentStyle={tooltipStyle}
          formatter={(value: number) => valueFormatter(value)}
        />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]} barSize={28}>
          {data.map((row) => (
            <Cell key={String(row[categoryKey])} fill={color(String(row[categoryKey]))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
