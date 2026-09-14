import maplibregl, { type Map as MapLibreMap, type MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { FarmProperties, GeoJsonFeatureCollection, TractorProperties } from '../api/types';
import { Panel } from '../components/Panel';
import { ErrorState, LoadingState } from '../components/States';
import { useApi } from '../hooks/useApi';
import { ink, ndviRamp, status } from '../theme';

const KENYA_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'osm', type: 'raster', source: 'osm' },
    // A dark scrim keeps the bright OSM basemap from fighting the panel chrome.
    { id: 'scrim', type: 'background', paint: { 'background-color': '#0b1f17', 'background-opacity': 0.28 } },
  ],
};

const NDVI_COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'ndvi'], 0],
  0,
  ndviRamp[0],
  0.15,
  ndviRamp[1],
  0.3,
  ndviRamp[2],
  0.45,
  ndviRamp[3],
  0.6,
  ndviRamp[4],
  0.75,
  ndviRamp[5],
  0.9,
  ndviRamp[6],
];

const TRACTOR_COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'active',
  status.good,
  'idle',
  status.warning,
  'maintenance',
  status.serious,
  ink.muted,
];

function fitToFeatures(map: MapLibreMap, collections: Array<GeoJsonFeatureCollection>) {
  const bounds = new maplibregl.LngLatBounds();
  let has = false;
  for (const collection of collections) {
    for (const feature of collection.features) {
      bounds.extend(feature.geometry.coordinates);
      has = true;
    }
  }
  if (has) map.fitBounds(bounds, { padding: 48, maxZoom: 11, duration: 500 });
}

export default function FarmsMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const navigate = useNavigate();

  const [region, setRegion] = useState('');
  const [showFarms, setShowFarms] = useState(true);
  const [showTractors, setShowTractors] = useState(true);

  const { data: regionsData } = useApi(() => api.regions(), []);
  const farmsFetcher = useMemo(() => () => api.farmsGeoJson(region || undefined), [region]);
  const tractorsFetcher = useMemo(() => () => api.tractorsGeoJson(region || undefined), [region]);
  const { data: farms, loading: farmsLoading, error: farmsError } = useApi(farmsFetcher, [region]);
  const { data: tractors, loading: tractorsLoading, error: tractorsError } = useApi(tractorsFetcher, [region]);

  // Initialize the map once.
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: KENYA_STYLE,
      center: [36.9, -1.05],
      zoom: 7.4,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('farms', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('tractors', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      map.addLayer({
        id: 'farms-layer',
        type: 'circle',
        source: 'farms',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'area_ha'], 10], 3, 4, 48, 11],
          'circle-color': NDVI_COLOR_EXPRESSION,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(11,31,23,0.65)',
          'circle-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'tractors-layer',
        type: 'circle',
        source: 'tractors',
        paint: {
          'circle-radius': 6,
          'circle-color': TRACTOR_COLOR_EXPRESSION,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0b1f17',
        },
      });

      for (const layerId of ['farms-layer', 'tractors-layer']) {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      map.on('click', 'farms-layer', (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        if (!feature) return;
        const props = feature.properties as FarmProperties;
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        const el = document.createElement('div');
        el.className = 'map-popup';
        el.innerHTML = `
          <p class="map-popup-title">${props.farm_id}</p>
          <dl>
            <div><dt>Region</dt><dd>${props.region}</dd></div>
            <div><dt>Area</dt><dd>${Number(props.area_ha).toFixed(1)} ha</dd></div>
            <div><dt>NDVI</dt><dd>${Number(props.ndvi).toFixed(2)}</dd></div>
            <div><dt>NDWI</dt><dd>${Number(props.ndwi).toFixed(2)}</dd></div>
            <div><dt>Last scan</dt><dd>${props.last_scan}</dd></div>
          </dl>`;
        const button = document.createElement('button');
        button.className = 'btn-primary map-popup-btn';
        button.textContent = 'Recommend tractors for this farm';
        button.addEventListener('click', () => navigate(`/recommendations?farm_id=${props.farm_id}`));
        el.appendChild(button);

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(coords)
          .setDOMContent(el)
          .addTo(map);
      });

      map.on('click', 'tractors-layer', (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        if (!feature) return;
        const props = feature.properties as TractorProperties;
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
          .setLngLat(coords)
          .setHTML(
            `<div class="map-popup">
              <p class="map-popup-title">${props.tractor_id}</p>
              <dl>
                <div><dt>Model</dt><dd>${props.model}</dd></div>
                <div><dt>Status</dt><dd>${props.status}</dd></div>
                <div><dt>Region</dt><dd>${props.region}</dd></div>
                <div><dt>Capacity</dt><dd>${Number(props.capacity_ha_hr).toFixed(1)} ha/hr</dd></div>
                <div><dt>Operating hrs</dt><dd>${Math.round(Number(props.operating_hours)).toLocaleString()}</dd></div>
              </dl>
            </div>`,
          )
          .addTo(map);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push fresh data into the map whenever farms/tractors change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !farms || !tractors) return;

    const apply = () => {
      const farmsSource = map.getSource('farms') as maplibregl.GeoJSONSource | undefined;
      const tractorsSource = map.getSource('tractors') as maplibregl.GeoJSONSource | undefined;
      if (!farmsSource || !tractorsSource) return;
      farmsSource.setData(farms);
      tractorsSource.setData(tractors);
      fitToFeatures(map, [farms, tractors]);
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [farms, tractors]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('farms-layer')) return;
    map.setLayoutProperty('farms-layer', 'visibility', showFarms ? 'visible' : 'none');
  }, [showFarms]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('tractors-layer')) return;
    map.setLayoutProperty('tractors-layer', 'visibility', showTractors ? 'visible' : 'none');
  }, [showTractors]);

  const avgNdvi = useMemo(() => {
    if (!farms || farms.features.length === 0) return null;
    const sum = farms.features.reduce((total, f) => total + Number(f.properties.ndvi ?? 0), 0);
    return sum / farms.features.length;
  }, [farms]);

  return (
    <div className="page-stack">
      <Panel
        title="Farms & fleet map"
        note="Click a marker for details"
        wide
        tall
        actions={
          <div className="map-toolbar">
            <select className="filter-select" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">All regions</option>
              {(regionsData?.items ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="map-toggle">
              <input type="checkbox" checked={showFarms} onChange={(e) => setShowFarms(e.target.checked)} />
              Farms
            </label>
            <label className="map-toggle">
              <input type="checkbox" checked={showTractors} onChange={(e) => setShowTractors(e.target.checked)} />
              Tractors
            </label>
          </div>
        }
      >
        {(farmsError || tractorsError) && <ErrorState message={farmsError ?? tractorsError ?? 'Map data failed to load'} />}
        <div className="map-stats">
          <span>{farms ? farms.features.length.toLocaleString() : '—'} farms shown</span>
          <span>{tractors ? tractors.features.length.toLocaleString() : '—'} tractors shown</span>
          <span>Avg NDVI in view: {avgNdvi !== null ? avgNdvi.toFixed(2) : '—'}</span>
        </div>
        <div className="map-canvas-wrap">
          <div ref={mapContainer} className="map-canvas" />
          {(farmsLoading || tractorsLoading) && !farms && (
            <div className="map-loading-overlay">
              <LoadingState label="Loading geospatial data…" />
            </div>
          )}
          <div className="map-legend">
            <p>NDVI</p>
            <div className="legend-ramp">
              {ndviRamp.map((color) => (
                <span key={color} style={{ background: color }} />
              ))}
            </div>
            <div className="legend-ramp-labels">
              <span>Low</span>
              <span>High</span>
            </div>
            <p>Tractors</p>
            <div className="legend-dots">
              <span>
                <i style={{ background: status.good }} /> Active
              </span>
              <span>
                <i style={{ background: status.warning }} /> Idle
              </span>
              <span>
                <i style={{ background: status.serious }} /> Maintenance
              </span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
