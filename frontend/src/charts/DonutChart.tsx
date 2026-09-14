import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { colorScale, tooltipStyle } from '../theme';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  valueFormatter?: (value: number) => string;
}

/** Categorical mix with >=2 segments always carries a legend (never
 * color-alone identity) and direct value labels on the tooltip. */
export function DonutChart({ data, height = 240, valueFormatter = (v) => v.toLocaleString() }: DonutChartProps) {
  const color = colorScale(data.map((row) => row.name));
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="var(--panel-bg)"
            strokeWidth={2}
          >
            {data.map((row) => (
              <Cell key={row.name} fill={color(row.name)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [
              `${valueFormatter(value)} (${total ? ((value / total) * 100).toFixed(0) : 0}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {data.map((row) => (
          <li key={row.name}>
            <span className="legend-swatch" style={{ background: color(row.name) }} aria-hidden="true" />
            <span className="legend-label">{row.name}</span>
            <span className="legend-value">{valueFormatter(row.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
