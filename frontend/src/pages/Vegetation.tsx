import { useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import type { Farm } from '../api/types';
import { EntityBarChart } from '../charts/EntityBarChart';
import { DataTable } from '../components/DataTable';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { axisTickStyle, ink, ndviColor, tooltipStyle } from '../theme';

const NDVI_BANDS = [
  { label: '0.0–0.15', min: 0, max: 0.15 },
  { label: '0.15–0.3', min: 0.15, max: 0.3 },
  { label: '0.3–0.45', min: 0.3, max: 0.45 },
  { label: '0.45–0.6', min: 0.45, max: 0.6 },
  { label: '0.6–0.75', min: 0.6, max: 0.75 },
  { label: '0.75–0.9', min: 0.75, max: 0.9 },
  { label: '0.9–1.0', min: 0.9, max: 1.01 },
];

async function loadVegetation() {
  const [byRegion, watchlist, farmsA, farmsB, summary] = await Promise.all([
    api.vegetation(),
    api.vegetationWatchlist(0.35, 20),
    api.farms({ limit: 500, offset: 0 }),
    api.farms({ limit: 500, offset: 500 }),
    api.summary(),
  ]);
  return { byRegion, watchlist, allFarms: [...farmsA.items, ...farmsB.items], summary };
}

export default function Vegetation() {
  const { data, loading, error, refetch } = useApi(loadVegetation, []);

  const histogram = useMemo(() => {
    if (!data) return [];
    return NDVI_BANDS.map((band) => ({
      label: band.label,
      mid: (band.min + band.max) / 2,
      count: data.allFarms.filter((f) => f.ndvi >= band.min && f.ndvi < band.max).length,
    }));
  }, [data]);

  if (loading && !data) return <LoadingState label="Loading vegetation analytics…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { byRegion, watchlist, summary } = data;
  const healthy = byRegion.items.filter((r) => r.status === 'healthy_vegetation').length;

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard label="Avg NDVI (platform)" value={summary.avg_ndvi.toFixed(2)} highlight />
        <KpiCard label="Regions healthy" value={`${healthy}/${byRegion.items.length}`} tone="good" />
        <KpiCard label="Farms on watchlist" value={watchlist.total.toString()} tone={watchlist.total > 0 ? 'warning' : 'good'} />
        <KpiCard label="Farms monitored" value={data.allFarms.length.toLocaleString()} />
      </div>

      <div className="grid-2">
        <Panel title="Mean NDVI by region">
          <EntityBarChart
            data={byRegion.items.map((r) => ({ region: r.region, value: Number(r.mean_ndvi.toFixed(3)) }))}
            categoryKey="region"
            valueKey="value"
            valueFormatter={(v) => v.toFixed(2)}
          />
        </Panel>
        <Panel title="NDVI distribution" note="All monitored farms">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histogram} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <XAxis dataKey="label" tick={{ ...axisTickStyle, fontSize: 10 }} axisLine={{ stroke: ink.axis }} tickLine={false} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} farms`, 'Count']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {histogram.map((band) => (
                  <Cell key={band.label} fill={ndviColor(band.mid)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Vegetation stress watchlist" note="Farms at or below NDVI 0.35">
        {watchlist.items.length === 0 && <EmptyState label="No farms currently below the stress threshold." />}
        {watchlist.items.length > 0 && (
          <DataTable<Farm>
            rowKey={(row) => row.farm_id}
            columns={[
              { key: 'farm_id', header: 'Farm' },
              { key: 'region', header: 'Region' },
              {
                key: 'ndvi',
                header: 'NDVI',
                align: 'right',
                render: (row) => (
                  <span className="ndvi-chip" style={{ background: ndviColor(row.ndvi) }}>
                    {row.ndvi.toFixed(2)}
                  </span>
                ),
              },
              { key: 'ndwi', header: 'NDWI', align: 'right', render: (row) => row.ndwi.toFixed(2) },
              { key: 'area_ha', header: 'Area (ha)', align: 'right', render: (row) => row.area_ha.toFixed(1) },
              { key: 'last_scan', header: 'Last scan' },
            ]}
            rows={watchlist.items}
          />
        )}
      </Panel>
    </div>
  );
}
