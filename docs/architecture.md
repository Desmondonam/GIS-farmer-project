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

## Next phase

The next step is implementing the repository structure, database schema, and synthetic data generation scripts that power the platform.
