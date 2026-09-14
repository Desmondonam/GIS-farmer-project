# Agri Intelligence Platform

A production-style agricultural mechanization intelligence platform inspired by the operational
realities of equipment-sharing services (farmer/tractor booking, GIS, remote sensing, fleet
utilization) — built with synthetic data only, no proprietary or personal records.

## What's in v2

v1 shipped the scaffolding: a FastAPI skeleton returning three hand-typed demo records, and a
single-page dashboard with four stat cards. v2 makes the platform real:

- **Real data.** 500 farmers, 1,000 geotagged farms, 100 tractors, and 10,000 bookings, generated
  deterministically (`backend/app/data/generate_demo_data.py`) with region-consistent coordinates,
  NDVI/NDWI signals, and realistic status/payment distributions. Every endpoint computes its
  response from these CSVs — nothing is hardcoded.
- **A real backend.** A CSV-backed repository layer (`backend/app/data/repository.py`) with
  pagination, filtering, GeoJSON export, region rollups, a monthly demand/revenue time series, a
  geodesic (haversine) tractor-recommendation engine, and a data-quality report computed against
  each dataset's own primary key (not a foreign key, which would misreport a healthy bookings
  table as "all duplicates").
- **A real dashboard.** Eight routed pages (React Router) instead of one: Overview, Fleet &
  Utilization, Farms & GIS Map, Demand & Bookings, Revenue & Finance, Vegetation, Data Quality, and
  a tractor Recommendation engine — with paginated/filterable tables, trend and mix charts
  (Recharts), and a live **MapLibre GL** map plotting every farm (colored by NDVI) and tractor
  (colored by status), with click-through popups and a deep link into the recommendation engine.
- **A validated color system.** Chart and map colors follow a colorblind-safe categorical palette
  (each region/operation keeps the same color across every chart on the platform) plus a
  dedicated NDVI sequential ramp and a reserved status palette (see `frontend/src/theme.ts`).

## Stack

- **Backend:** Python, FastAPI, Pandas (for the eventual DuckDB/Postgres swap-in), Pydantic v2
- **Frontend:** React 18, TypeScript, Vite, React Router, Recharts, MapLibre GL JS
- **Data:** CSV-backed demo repository today; PostgreSQL + PostGIS schema (`backend/app/db/schema.sql`)
  and Docker Compose are in place for the live-data path
- **Tests:** Pytest (23 backend tests covering analytics, data quality, satellite indices,
  validation, ingestion, and every API route)

## Run locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# or, from the repo root: python -m uvicorn backend.app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:5173 (reads `VITE_API_BASE_URL`, defaults to `http://localhost:8000`)

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs
- Database: localhost:5432 (PostGIS — provisioned for the live-data path; demo mode doesn't need it)

## Demo mode

`DEMO_MODE=true` (the default) serves every endpoint from the generated CSVs in `data/demo/`. Set
`LIVE_DATA_MODE=true` and point `POSTGRES_*` at a running PostGIS instance to swap in real data —
`repository.py` is the intended seam: replace its CSV loaders with queries against the schema in
`backend/app/db/schema.sql` and every route/page above it is unaffected.

## API surface

| Area | Endpoints |
|---|---|
| Core entities | `GET /farmers`, `/farms`, `/tractors`, `/bookings`, `/payments` (all paginated, filterable by region/status) |
| GIS | `GET /farms/geojson`, `/tractors/geojson` (region-filterable FeatureCollections) |
| Analytics | `GET /analytics/utilization[/by-region]`, `/analytics/demand[/timeseries]`, `/analytics/revenue[/by-region]`, `/analytics/vegetation` |
| Recommendations | `GET /recommendations/tractor?farm_id=...` — ranked by haversine distance, availability, capacity fit, and regional track record |
| Quality & ops | `GET /data-quality`, `/pipeline-status`, `/vegetation/watchlist`, `/telemetry` |
| Meta | `GET /health`, `/ready`, `/summary`, `/regions` |

## Testing

```bash
python -m pytest tests/ -v
```

## Notes

Synthetic operational data only — coordinates, names, and financial figures are generated, not
sourced from any real company or individual. This repository is structured to extend stepwise into
a production platform with live weather, Copernicus Sentinel access, and PostGIS-backed geospatial
analytics.
