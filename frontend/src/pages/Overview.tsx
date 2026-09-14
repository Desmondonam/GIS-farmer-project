import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DonutChart } from '../charts/DonutChart';
import { EntityBarChart } from '../charts/EntityBarChart';
import { TrendLineChart } from '../charts/TrendLineChart';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { categorical, ink } from '../theme';

const currency = (value: number) =>
  `KSh ${value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : value.toLocaleString()}`;

async function loadOverview() {
  const [summary, demand, timeseries, pipelines, vegetation] = await Promise.all([
    api.summary(),
    api.demand(),
    api.demandTimeseries(),
    api.pipelineStatus(),
    api.vegetation(),
  ]);
  return { summary, demand, timeseries, pipelines, vegetation };
}

export default function Overview() {
  const { data, loading, error, refetch } = useApi(loadOverview, []);

  const regionRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.demand.bookings_per_region)
      .map(([region, value]) => ({ region, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const operationRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.demand.bookings_per_operation).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading && !data) return <LoadingState label="Loading executive overview…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { summary, pipelines, vegetation } = data;
  const failingPipelines = pipelines.items.filter((p) => p.status !== 'success').length;
  const lowVegRegions = vegetation.items.filter((v) => v.status === 'low_vegetation').length;

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard label="Total farmers" value={summary.total_farmers.toLocaleString()} highlight />
        <KpiCard label="Total farms" value={summary.total_farms.toLocaleString()} />
        <KpiCard
          label="Fleet utilization"
          value={`${(summary.utilization_rate * 100).toFixed(0)}%`}
          hint={`${summary.active_tractors}/${summary.total_tractors} tractors active`}
          tone={summary.utilization_rate > 0.5 ? 'good' : 'warning'}
        />
        <KpiCard label="Revenue (completed)" value={currency(summary.revenue)} tone="good" />
        <KpiCard
          label="Outstanding payments"
          value={currency(summary.outstanding_payments)}
          tone={summary.outstanding_payments > summary.revenue * 0.2 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Data quality"
          value={`${summary.data_quality_score.toFixed(1)}%`}
          tone={summary.data_quality_score > 90 ? 'good' : 'warning'}
        />
      </div>

      <div className="grid-2">
        <Panel title="Booking volume" note="Monthly, all regions">
          <TrendLineChart
            data={data.timeseries.items}
            xKey="month"
            yKey="bookings"
            color={categorical[0]}
            valueFormatter={(v) => v.toLocaleString()}
          />
        </Panel>
        <Panel title="Completed revenue" note="Monthly, KSh">
          <TrendLineChart
            data={data.timeseries.items}
            xKey="month"
            yKey="revenue"
            color={categorical[2]}
            valueFormatter={(v) => currency(v)}
          />
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Demand by region" note={`${summary.total_bookings.toLocaleString()} bookings`}>
          <EntityBarChart data={regionRows} categoryKey="region" valueKey="value" />
        </Panel>
        <Panel title="Demand mix" note="By operation type">
          <DonutChart data={operationRows} />
        </Panel>
      </div>

      <div className="grid-2">
        <Panel
          title="Pipeline health"
          note={failingPipelines ? `${failingPipelines} needs attention` : 'All green'}
          actions={
            <Link className="panel-link" to="/data-quality">
              View data quality →
            </Link>
          }
        >
          <ul className="list">
            {pipelines.items.map((pipeline) => (
              <li key={pipeline.pipeline}>
                <span>
                  {pipeline.pipeline.replace(/_/g, ' ')}
                  <small>{pipeline.records.toLocaleString()} records</small>
                </span>
                <StatusBadge value={pipeline.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Key insights"
          note="Generated from live aggregates"
          actions={
            <Link className="panel-link" to="/vegetation">
              View vegetation →
            </Link>
          }
        >
          <ul className="bullet-list">
            <li>
              <strong style={{ color: ink.primary }}>{regionRows[0]?.region}</strong> leads demand with{' '}
              {regionRows[0]?.value.toLocaleString()} bookings.
            </li>
            <li>
              Average NDVI across monitored farms is <strong>{summary.avg_ndvi.toFixed(2)}</strong>
              {lowVegRegions > 0 ? `, with ${lowVegRegions} region(s) flagged low-vegetation.` : ', within healthy range.'}
            </li>
            <li>
              Regional imbalance sits at <strong>{(summary.supply_demand_gap * 100).toFixed(0)}%</strong> — the gap
              between the most and least tractor-starved region's bookings-per-tractor load.
            </li>
            <li>
              {summary.completed_jobs.toLocaleString()} of {summary.total_bookings.toLocaleString()} bookings
              completed ({((summary.completed_jobs / summary.total_bookings) * 100).toFixed(0)}%).
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
