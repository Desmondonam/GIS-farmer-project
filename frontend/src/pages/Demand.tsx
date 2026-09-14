import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../api/types';
import { DonutChart } from '../charts/DonutChart';
import { EntityBarChart } from '../charts/EntityBarChart';
import { TrendLineChart } from '../charts/TrendLineChart';
import { DataTable, Pager } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { categorical } from '../theme';

const LIMIT = 12;
const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

async function loadDemand() {
  const [demand, timeseries, regions] = await Promise.all([api.demand(), api.demandTimeseries(), api.regions()]);
  return { demand, timeseries, regions: regions.items };
}

export default function Demand() {
  const { data, loading, error, refetch } = useApi(loadDemand, []);
  const [region, setRegion] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [offset, setOffset] = useState(0);

  const bookingsFetcher = useMemo(
    () => () => api.bookings({ region, status: bookingStatus, limit: LIMIT, offset }),
    [region, bookingStatus, offset],
  );
  const { data: bookingPage, loading: tableLoading, error: tableError } = useApi(bookingsFetcher, [
    region,
    bookingStatus,
    offset,
  ]);

  const regionRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.demand.bookings_per_region)
      .map(([r, value]) => ({ region: r, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const operationRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.demand.bookings_per_operation).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading && !data) return <LoadingState label="Loading demand analytics…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard label="Total bookings" value={data.demand.total_bookings.toLocaleString()} highlight />
        <KpiCard label="Top region" value={regionRows[0]?.region ?? '—'} hint={`${regionRows[0]?.value ?? 0} bookings`} />
        <KpiCard label="Regions served" value={regionRows.length.toString()} />
        <KpiCard label="Operation types" value={operationRows.length.toString()} />
      </div>

      <Panel title="Booking volume trend" note="Monthly across all regions">
        <TrendLineChart data={data.timeseries.items} xKey="month" yKey="bookings" color={categorical[0]} />
      </Panel>

      <div className="grid-2">
        <Panel title="Demand by region">
          <EntityBarChart data={regionRows} categoryKey="region" valueKey="value" />
        </Panel>
        <Panel title="Demand mix" note="By operation type">
          <DonutChart data={operationRows} />
        </Panel>
      </div>

      <Panel
        title="Bookings"
        note={bookingPage ? `${bookingPage.total.toLocaleString()} bookings` : undefined}
        actions={
          <FilterBar
            regions={data.regions}
            region={region}
            onRegionChange={(value) => {
              setRegion(value);
              setOffset(0);
            }}
            statusOptions={STATUS_OPTIONS}
            status={bookingStatus}
            onStatusChange={(value) => {
              setBookingStatus(value);
              setOffset(0);
            }}
          />
        }
      >
        {tableError && <ErrorState message={tableError} />}
        {tableLoading && !bookingPage && <LoadingState label="Loading bookings…" />}
        {bookingPage && bookingPage.items.length === 0 && <EmptyState />}
        {bookingPage && bookingPage.items.length > 0 && (
          <>
            <DataTable<Booking>
              rowKey={(row) => row.booking_id}
              columns={[
                { key: 'booking_id', header: 'Booking' },
                { key: 'region', header: 'Region' },
                { key: 'crop_operation', header: 'Operation' },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                {
                  key: 'payment_status',
                  header: 'Payment',
                  render: (row) => <StatusBadge value={row.payment_status} />,
                },
                {
                  key: 'amount',
                  header: 'Amount (KSh)',
                  align: 'right',
                  render: (row) => Math.round(row.amount).toLocaleString(),
                },
                {
                  key: 'requested_at',
                  header: 'Requested',
                  render: (row) => new Date(row.requested_at).toLocaleDateString(),
                },
              ]}
              rows={bookingPage.items}
            />
            <Pager total={bookingPage.total} limit={LIMIT} offset={offset} onChange={setOffset} />
          </>
        )}
      </Panel>
    </div>
  );
}
