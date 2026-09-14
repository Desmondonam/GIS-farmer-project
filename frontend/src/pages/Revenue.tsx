import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Payment } from '../api/types';
import { EntityBarChart } from '../charts/EntityBarChart';
import { DataTable, Pager } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';

const LIMIT = 12;
const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];

const currency = (value: number) => `KSh ${Math.round(value).toLocaleString()}`;

async function loadRevenue() {
  const [revenue, byRegion, summary] = await Promise.all([api.revenue(), api.revenueByRegion(), api.summary()]);
  return { revenue, byRegion, summary };
}

export default function Revenue() {
  const { data, loading, error, refetch } = useApi(loadRevenue, []);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [offset, setOffset] = useState(0);

  const paymentsFetcher = useMemo(
    () => () => api.payments({ status: paymentStatus, limit: LIMIT, offset }),
    [paymentStatus, offset],
  );
  const { data: paymentPage, loading: tableLoading, error: tableError } = useApi(paymentsFetcher, [
    paymentStatus,
    offset,
  ]);

  const regionRows = useMemo(() => {
    if (!data) return [];
    return [...data.byRegion.items].sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  if (loading && !data) return <LoadingState label="Loading revenue analytics…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { revenue, summary } = data;
  const collectionRate = summary.revenue / Math.max(summary.revenue + summary.outstanding_payments, 1);

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard label="Gross revenue" value={currency(revenue.gross_revenue)} highlight />
        <KpiCard label="Avg booking value" value={currency(revenue.average_booking_value)} />
        <KpiCard label="Completed jobs" value={revenue.completed_jobs.toLocaleString()} />
        <KpiCard label="Outstanding payments" value={currency(summary.outstanding_payments)} tone="warning" />
        <KpiCard
          label="Collection rate"
          value={`${(collectionRate * 100).toFixed(0)}%`}
          tone={collectionRate > 0.85 ? 'good' : 'warning'}
        />
      </div>

      <Panel title="Revenue by region">
        <EntityBarChart
          data={regionRows.map((row) => ({ region: row.region, value: row.revenue }))}
          categoryKey="region"
          valueKey="value"
          valueFormatter={(v) => currency(v)}
        />
      </Panel>

      <Panel title="Outstanding payments by region">
        <EntityBarChart
          data={regionRows.map((row) => ({ region: row.region, value: row.outstanding_payments }))}
          categoryKey="region"
          valueKey="value"
          valueFormatter={(v) => currency(v)}
        />
      </Panel>

      <Panel
        title="Payments"
        note={paymentPage ? `${paymentPage.total.toLocaleString()} records` : undefined}
        actions={
          <FilterBar
            statusOptions={STATUS_OPTIONS}
            status={paymentStatus}
            onStatusChange={(value) => {
              setPaymentStatus(value);
              setOffset(0);
            }}
          />
        }
      >
        {tableError && <ErrorState message={tableError} />}
        {tableLoading && !paymentPage && <LoadingState label="Loading payments…" />}
        {paymentPage && paymentPage.items.length === 0 && <EmptyState />}
        {paymentPage && paymentPage.items.length > 0 && (
          <>
            <DataTable<Payment>
              rowKey={(row) => row.payment_id}
              columns={[
                { key: 'payment_id', header: 'Payment' },
                { key: 'booking_id', header: 'Booking' },
                { key: 'farmer_id', header: 'Farmer' },
                { key: 'amount', header: 'Amount (KSh)', align: 'right', render: (row) => Math.round(row.amount).toLocaleString() },
                { key: 'payment_status', header: 'Status', render: (row) => <StatusBadge value={row.payment_status} /> },
                { key: 'requested_at', header: 'Date', render: (row) => new Date(row.requested_at).toLocaleDateString() },
              ]}
              rows={paymentPage.items}
            />
            <Pager total={paymentPage.total} limit={LIMIT} offset={offset} onChange={setOffset} />
          </>
        )}
      </Panel>
    </div>
  );
}
