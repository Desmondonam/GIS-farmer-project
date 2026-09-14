import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Tractor } from '../api/types';
import { EntityBarChart } from '../charts/EntityBarChart';
import { DataTable, Pager } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState, LoadingState, EmptyState } from '../components/States';
import { useApi } from '../hooks/useApi';

const LIMIT = 12;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'maintenance', label: 'Maintenance' },
];

async function loadFleetOverview() {
  const [utilization, byRegion, regions] = await Promise.all([
    api.utilization(),
    api.utilizationByRegion(),
    api.regions(),
  ]);
  return { utilization, byRegion, regions: regions.items };
}

export default function Fleet() {
  const { data, loading, error, refetch } = useApi(loadFleetOverview, []);
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);

  const tractorsFetcher = useMemo(
    () => () => api.tractors({ region, status, limit: LIMIT, offset }),
    [region, status, offset],
  );
  const { data: tractorPage, loading: tableLoading, error: tableError } = useApi(tractorsFetcher, [
    region,
    status,
    offset,
  ]);

  if (loading && !data) return <LoadingState label="Loading fleet analytics…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { utilization, byRegion, regions } = data;

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard label="Total tractors" value={utilization.total_tractors.toLocaleString()} highlight />
        <KpiCard label="Active" value={utilization.active_tractors.toLocaleString()} tone="good" />
        <KpiCard label="Idle" value={utilization.idle_tractors.toLocaleString()} tone="warning" />
        <KpiCard label="Operating hours" value={Math.round(utilization.operating_hours).toLocaleString()} />
        <KpiCard label="Jobs completed" value={utilization.jobs_completed.toLocaleString()} />
        <KpiCard label="Revenue / tractor" value={`KSh ${Math.round(utilization.revenue_per_tractor).toLocaleString()}`} />
      </div>

      <Panel title="Utilization by region" note="Active vs. fleet size">
        <EntityBarChart
          data={byRegion.items.map((row) => ({ region: row.region, value: Math.round(row.utilization_rate * 100) }))}
          categoryKey="region"
          valueKey="value"
          valueFormatter={(v) => `${v}%`}
        />
      </Panel>

      <Panel
        title="Fleet roster"
        note={tractorPage ? `${tractorPage.total.toLocaleString()} tractors` : undefined}
        actions={
          <FilterBar
            regions={regions}
            region={region}
            onRegionChange={(value) => {
              setRegion(value);
              setOffset(0);
            }}
            statusOptions={STATUS_OPTIONS}
            status={status}
            onStatusChange={(value) => {
              setStatus(value);
              setOffset(0);
            }}
          />
        }
      >
        {tableError && <ErrorState message={tableError} />}
        {tableLoading && !tractorPage && <LoadingState label="Loading tractors…" />}
        {tractorPage && tractorPage.items.length === 0 && <EmptyState />}
        {tractorPage && tractorPage.items.length > 0 && (
          <>
            <DataTable<Tractor>
              rowKey={(row) => row.tractor_id}
              columns={[
                { key: 'tractor_id', header: 'ID' },
                { key: 'model', header: 'Model' },
                { key: 'region', header: 'Region' },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                {
                  key: 'capacity_ha_hr',
                  header: 'Capacity (ha/hr)',
                  align: 'right',
                  render: (row) => row.capacity_ha_hr.toFixed(1),
                },
                {
                  key: 'operating_hours',
                  header: 'Operating hrs',
                  align: 'right',
                  render: (row) => Math.round(row.operating_hours).toLocaleString(),
                },
              ]}
              rows={tractorPage.items}
            />
            <Pager total={tractorPage.total} limit={LIMIT} offset={offset} onChange={setOffset} />
          </>
        )}
      </Panel>
    </div>
  );
}
