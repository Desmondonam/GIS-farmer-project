# Agri Intelligence Platform

This repository is the first implementation of a production-style agricultural mechanization intelligence MVP inspired by the operational realities of equipment-sharing platforms, without cloning any private company.

## Objective

The project demonstrates a small but realistic data platform for a mechanization company that integrates:

- farmer and farm records
- tractor inventory and utilization
- bookings and payments
- geospatial boundaries and service locations
- remote-sensing indicators from Sentinel-2-style workflows
- availability and maintenance intelligence
- executive analytics and recommendation logic

## Publicly documented vs simulated challenges

This project separates what is publicly documented from what is simulated or inferred:

- Publicly documented challenges: fragmented farmer/tractor operations, need for efficient allocation, demand visibility, maintenance monitoring, and geospatial intelligence are common to digital agricultural services.
- Simulated/inferred operational challenges: specific internal company data pipelines and business constraints are not claimed as proprietary facts.

## Phase plan

1. Architecture and requirements
2. Repository structure
3. Database and synthetic data
4. Data ingestion and validation
5. Satellite and GIS pipeline
6. Analytics and matching engine
7. Backend API
8. Frontend dashboard
9. Docker and deployment
10. Documentation and testing

## Recommended architecture

Data sources -> ingestion -> raw storage -> validation -> transformation -> curated data -> geospatial processing -> analytics -> API -> web app

## Stack

- Python
- FastAPI
- PostgreSQL + PostGIS (recommended for production)
- DuckDB / Pandas for analytical transforms
- React + TypeScript + Vite
- Docker Compose
- MapLibre or Leaflet for GIS view
- Plotly for charts

## Run locally

```bash
cp .env.example .env

docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs
- Database: localhost:5432

## Demo mode

The application uses pre-generated demo data so the UI works immediately without live API calls.

## Notes

This repository is intentionally structured to allow stepwise extension into a production-grade platform with live weather, Copernicus Sentinel access, and stronger geospatial analytics.
# GIS-farmer-project
