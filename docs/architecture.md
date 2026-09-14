# Architecture overview

## Business objective

This project simulates a small but realistic agricultural mechanization platform for a region such as Kenya, where operational data spans farmers, farms, tractors, bookings, payments, maintenance, remote sensing, and field conditions.

## Publicly documented challenge vs simulated challenge

The system is designed around public, industry-wide operational realities such as:

- fragmented operational records across multiple systems
- poor visibility into farm condition and vegetation stress
- tractor utilization and allocation inefficiency
- maintenance risk monitoring
- geospatial visibility of demand and coverage
- financial and operational performance tracking

The platform does not claim to represent confidential internal company data or proprietary diagnostics.

## System components

Data sources -> ingestion -> raw lake -> validation -> transformation -> curated layer -> GIS and remote sensing -> analytics marts -> API -> dashboard

### Core design

- Synthetic operational datasets create realistic business entities and relationships.
- A PostgreSQL + PostGIS layer handles application-facing, relational, and spatial data.
- Parquet and raw object storage preserve ingestion snapshots.
- DuckDB and Pandas support analytical aggregation and data-quality checks.
- FastAPI exposes curated metrics and operational endpoints.
- React frontend renders an executive dashboard and GIS-heavy views.

## Why these choices

- PostgreSQL/PostGIS: relational integrity, spatial queries, standard GIS operations
- DuckDB: lightweight analytical processing for batch transformations
- Parquet: columnar storage for analytic snapshots and data lake patterns
- FastAPI: high-performance Python API with OpenAPI docs
- React + TypeScript: professional dashboard experience and easy integration
- Docker Compose: simple local deployment without heavy infrastructure

## Data flow

1. Synthetic or live source data is ingested.
2. Raw data is stored with timestamps and source metadata.
3. Validation checks for duplicates, invalid coordinates, missing IDs, and negative payment values.
4. Curated views produce business-ready tables.
5. GIS and satellite transformations compute vegetation and resource coverage metrics.
6. Analytic marts expose utilization, revenue, maintenance, and demand views.
7. API endpoints serve the web app and operational monitoring.

## Deployment approach

The MVP is designed for local Docker development, with support for demo mode and optional live API integration through environment variables.

## v2: what's implemented today

- `backend/app/data/generate_demo_data.py` produces the synthetic operational dataset (500
  farmers, 1,000 farms, 100 tractors, 10,000 bookings) with region-consistent coordinates and
  NDVI/NDWI signals, written to `data/demo/*.csv`.
- `backend/app/data/repository.py` is the single data-access seam: it loads those CSVs (cached
  per-process), and every API route computes its response from real aggregates over them —
  pagination/filtering, GeoJSON export for the map, monthly time series, region rollups, and a
  geodesic tractor-recommendation ranking. Swapping this module for one that queries the
  PostgreSQL/PostGIS schema below is the intended path to `LIVE_DATA_MODE=true`.
- `frontend/src/pages/*` is a routed, eight-page dashboard (React Router) with paginated tables,
  Recharts trend/mix charts, and a MapLibre GL map rendering the farm and tractor GeoJSON layers.
  `frontend/src/theme.ts` centralizes the chart/map color system (validated categorical palette,
  NDVI sequential ramp, reserved status colors) so identity stays consistent across every view.

## Next phase

Wire `repository.py` to PostgreSQL/PostGIS for `LIVE_DATA_MODE`, add Sentinel-2 ingestion for real
NDVI/NDWI instead of the synthetic signal, and add auth/session handling ahead of any multi-tenant
deployment.
