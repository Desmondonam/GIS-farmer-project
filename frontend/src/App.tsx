import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:8000';

type Summary = {
  total_farmers: number;
  total_farms: number;
  total_tractors: number;
  active_tractors: number;
  utilization_rate: number;
  total_bookings: number;
  completed_jobs: number;
  revenue: number;
  outstanding_payments: number;
  avg_ndvi: number;
  supply_demand_gap: number;
  data_quality_score: number;
  pipeline_status: string;
};

type Utilization = {
  total_tractors: number;
  active_tractors: number;
  idle_tractors: number;
  operating_hours: number;
  utilization_rate: number;
  jobs_completed: number;
  revenue_per_tractor: number;
};

type Demand = {
  bookings_per_region: Record<string, number>;
  bookings_per_operation: Record<string, number>;
  total_bookings: number;
};

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [utilization, setUtilization] = useState<Utilization | null>(null);
  const [demand, setDemand] = useState<Demand | null>(null);

  useEffect(() => {
    const load = async () => {
      const [summaryRes, utilRes, demandRes] = await Promise.all([
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/analytics/utilization`),
        fetch(`${API_BASE}/analytics/demand`),
      ]);

      const summaryData = await summaryRes.json();
      const utilData = await utilRes.json();
      const demandData = await demandRes.json();

      setSummary(summaryData);
      setUtilization(utilData);
      setDemand(demandData);
    };

    load().catch(() => {
      setSummary({
        total_farmers: 500,
        total_farms: 1000,
        total_tractors: 100,
        active_tractors: 72,
        utilization_rate: 0.68,
        total_bookings: 10000,
        completed_jobs: 8840,
        revenue: 2480000,
        outstanding_payments: 126000,
        avg_ndvi: 0.61,
        supply_demand_gap: 0.14,
        data_quality_score: 97.4,
        pipeline_status: 'healthy',
      });
      setUtilization({
        total_tractors: 100,
        active_tractors: 72,
        idle_tractors: 28,
        operating_hours: 14800,
        utilization_rate: 0.68,
        jobs_completed: 8840,
        revenue_per_tractor: 24800,
      });
      setDemand({
        bookings_per_region: { Kiambu: 2890, Nakuru: 2410, Machakos: 2130 },
        bookings_per_operation: { 'Land preparation': 3200, Planting: 2200, Harvesting: 1800 },
        total_bookings: 10000,
      });
    });
  }, []);

  const regionRows = useMemo(() => {
    if (!demand) return [];
    return Object.entries(demand.bookings_per_region).map(([region, value]) => ({ region, value }));
  }, [demand]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Agri Intelligence Platform</p>
          <h1>Mechanization operations intelligence</h1>
        </div>
        <div className="status-pill">DEMO MODE</div>
      </header>

      <main className="dashboard-grid">
        <section className="metric-card metric-highlight">
          <span>Total Farmers</span>
          <strong>{summary?.total_farmers ?? 500}</strong>
        </section>
        <section className="metric-card">
          <span>Total Farms</span>
          <strong>{summary?.total_farms ?? 1000}</strong>
        </section>
        <section className="metric-card">
          <span>Total Tractors</span>
          <strong>{summary?.total_tractors ?? 100}</strong>
        </section>
        <section className="metric-card">
          <span>Utilization Rate</span>
          <strong>{((summary?.utilization_rate ?? utilization?.utilization_rate ?? 0.68) * 100).toFixed(0)}%</strong>
        </section>

        <section className="panel panel-wide">
          <div className="panel-header">
            <h2>Executive overview</h2>
          </div>
          <div className="summary-row">
            <div>
              <label>Active tractors</label>
              <strong>{summary?.active_tractors ?? utilization?.active_tractors ?? 72}</strong>
            </div>
            <div>
              <label>Total bookings</label>
              <strong>{summary?.total_bookings ?? demand?.total_bookings ?? 10000}</strong>
            </div>
            <div>
              <label>Revenue</label>
              <strong>KSh {((summary?.revenue ?? 2480000) / 1000000).toFixed(2)}M</strong>
            </div>
            <div>
              <label>Data quality</label>
              <strong>{(summary?.data_quality_score ?? 97.4).toFixed(1)}%</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Demand by region</h2>
          </div>
          <ul className="list">
            {regionRows.map(({ region, value }) => (
              <li key={region}>
                <span>{region}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Key insights</h2>
          </div>
          <ul className="bullet-list">
            <li>Kiambu shows the highest demand concentration.</li>
            <li>Average NDVI across monitored farms is improving.</li>
            <li>Maintenance risk remains elevated for several tractors.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
