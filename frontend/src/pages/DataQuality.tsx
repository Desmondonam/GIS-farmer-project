import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';

async function loadQuality() {
  const [quality, pipelines] = await Promise.all([api.dataQuality(), api.pipelineStatus()]);
  return { quality, pipelines };
}

function scoreTone(value: number): 'good' | 'warning' | 'critical' {
  if (value >= 90) return 'good';
  if (value >= 75) return 'warning';
  return 'critical';
}

export default function DataQuality() {
  const { data, loading, error, refetch } = useApi(loadQuality, []);

  if (loading && !data) return <LoadingState label="Loading data quality report…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { quality, pipelines } = data;

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <KpiCard
          label="Overall data quality"
          value={`${quality.overall_score.toFixed(1)}%`}
          tone={scoreTone(quality.overall_score)}
          highlight
        />
        {quality.datasets.map((dataset) => (
          <KpiCard
            key={dataset.dataset}
            label={dataset.dataset}
            value={`${dataset.overall_score.toFixed(1)}%`}
            hint={`${dataset.records.toLocaleString()} records`}
            tone={scoreTone(dataset.overall_score)}
          />
        ))}
      </div>

      <Panel title="Quality dimensions by dataset" note="Completeness · Validity · Uniqueness · Freshness">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th className="align-right">Records</th>
                <th className="align-right">Completeness</th>
                <th className="align-right">Validity</th>
                <th className="align-right">Uniqueness</th>
                <th className="align-right">Freshness</th>
                <th className="align-right">Overall</th>
              </tr>
            </thead>
            <tbody>
              {quality.datasets.map((dataset) => (
                <tr key={dataset.dataset}>
                  <td style={{ textTransform: 'capitalize' }}>{dataset.dataset}</td>
                  <td className="align-right">{dataset.records.toLocaleString()}</td>
                  <td className="align-right">{dataset.completeness.toFixed(1)}%</td>
                  <td className="align-right">{dataset.validity.toFixed(1)}%</td>
                  <td className="align-right">{dataset.uniqueness.toFixed(1)}%</td>
                  <td className="align-right">{dataset.freshness.toFixed(1)}%</td>
                  <td className="align-right" style={{ fontWeight: 700 }}>
                    {dataset.overall_score.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Ingestion pipelines" note="Most recent run per pipeline">
        <ul className="list">
          {pipelines.items.map((pipeline) => (
            <li key={pipeline.pipeline}>
              <span>
                {pipeline.pipeline.replace(/_/g, ' ')}
                <small>
                  {pipeline.records.toLocaleString()} records
                  {pipeline.failed > 0 ? ` · ${pipeline.failed} failed` : ''} · last run{' '}
                  {new Date(pipeline.last_run).toLocaleTimeString()}
                </small>
              </span>
              <StatusBadge value={pipeline.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
