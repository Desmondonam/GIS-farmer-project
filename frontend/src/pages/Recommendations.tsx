import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Recommendation } from '../api/types';
import { DataTable } from '../components/DataTable';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { ndviColor } from '../theme';

async function loadFarms() {
  const [pageA, pageB] = await Promise.all([api.farms({ limit: 500, offset: 0 }), api.farms({ limit: 500, offset: 500 })]);
  return [...pageA.items, ...pageB.items];
}

export default function Recommendations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: farms, loading: farmsLoading, error: farmsError } = useApi(loadFarms, []);

  const [region, setRegion] = useState('');
  const [farmId, setFarmId] = useState(searchParams.get('farm_id') ?? '');

  useEffect(() => {
    const fromUrl = searchParams.get('farm_id');
    if (fromUrl && fromUrl !== farmId) setFarmId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const regions = useMemo(() => (farms ? Array.from(new Set(farms.map((f) => f.region))).sort() : []), [farms]);
  const filteredFarms = useMemo(
    () => (farms ? farms.filter((f) => !region || f.region === region) : []),
    [farms, region],
  );
  const selectedFarm = useMemo(() => farms?.find((f) => f.farm_id === farmId) ?? null, [farms, farmId]);

  const recommendationsFetcher = useMemo(() => () => (farmId ? api.recommendations(farmId, 10) : Promise.resolve<Recommendation[]>([])), [
    farmId,
  ]);
  const { data: recommendations, loading: recLoading, error: recError } = useApi(recommendationsFetcher, [farmId]);

  const selectFarm = (id: string) => {
    setFarmId(id);
    setSearchParams(id ? { farm_id: id } : {});
  };

  return (
    <div className="page-stack">
      <Panel title="Tractor recommendation engine" note="Ranked by distance, availability, capacity fit, and track record">
        <div className="recommend-picker">
          <div>
            <label className="field-label" htmlFor="region-select">
              Region
            </label>
            <select
              id="region-select"
              className="filter-select"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="">All regions</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="farm-select">
              Farm
            </label>
            <select
              id="farm-select"
              className="filter-select"
              value={farmId}
              onChange={(event) => selectFarm(event.target.value)}
              disabled={farmsLoading}
            >
              <option value="">Select a farm…</option>
              {filteredFarms.map((farm) => (
                <option key={farm.farm_id} value={farm.farm_id}>
                  {farm.farm_id} · {farm.region} · {farm.area_ha.toFixed(1)} ha
                </option>
              ))}
            </select>
          </div>
        </div>

        {farmsError && <ErrorState message={farmsError} />}

        {selectedFarm && (
          <div className="farm-summary-strip">
            <span>
              <label>Region</label>
              <strong>{selectedFarm.region}</strong>
            </span>
            <span>
              <label>Area</label>
              <strong>{selectedFarm.area_ha.toFixed(1)} ha</strong>
            </span>
            <span>
              <label>NDVI</label>
              <strong>
                <span className="ndvi-chip" style={{ background: ndviColor(selectedFarm.ndvi) }}>
                  {selectedFarm.ndvi.toFixed(2)}
                </span>
              </strong>
            </span>
            <span>
              <label>Farmer</label>
              <strong>{selectedFarm.farmer_id}</strong>
            </span>
          </div>
        )}
      </Panel>

      <Panel title="Ranked tractors" note={selectedFarm ? `For ${selectedFarm.farm_id}` : 'Choose a farm to see recommendations'}>
        {!farmId && <EmptyState label="Pick a region and farm above to generate recommendations." />}
        {farmId && recLoading && !recommendations && <LoadingState label="Scoring tractors…" />}
        {farmId && recError && <ErrorState message={recError} />}
        {farmId && recommendations && recommendations.length === 0 && <EmptyState label="No tractors available." />}
        {recommendations && recommendations.length > 0 && (
          <DataTable<Recommendation>
            rowKey={(row) => row.tractor_id}
            columns={[
              { key: 'tractor_id', header: 'Tractor' },
              {
                key: 'score',
                header: 'Match score',
                render: (row) => (
                  <div className="score-cell">
                    <div className="score-track">
                      <div className="score-fill" style={{ width: `${Math.min(row.score, 100)}%` }} />
                    </div>
                    <span>{row.score.toFixed(1)}</span>
                  </div>
                ),
              },
              { key: 'distance_km', header: 'Distance', align: 'right', render: (row) => `${row.distance_km.toFixed(1)} km` },
              { key: 'available', header: 'Availability', render: (row) => <StatusBadge value={row.available ? 'active' : 'idle'} label={row.available ? 'Available' : 'Busy'} /> },
              { key: 'capability', header: 'Fit' },
              { key: 'operator_rating', header: 'Operator', align: 'right', render: (row) => `${(row.operator_rating * 5).toFixed(1)} / 5` },
              { key: 'previous_jobs_nearby', header: 'Prior jobs nearby', align: 'right' },
            ]}
            rows={recommendations}
          />
        )}
        {recommendations && recommendations.length > 0 && (
          <p className="panel-footnote">{recommendations[0].rationale}</p>
        )}
      </Panel>
    </div>
  );
}
