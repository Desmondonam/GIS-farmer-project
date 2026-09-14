"""CSV-backed data repository.

Demo mode is not a hand-typed fixture: it loads the generated operational
CSVs (500 farmers, 1,000 farms, 100 tractors, 10,000 bookings — see
``generate_demo_data.py``) once per process and serves every endpoint off
real aggregates computed from those rows. Swapping this module for one that
queries PostgreSQL/PostGIS is the intended seam for ``LIVE_DATA_MODE``.
"""

from __future__ import annotations

import csv
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parents[3]


def _resolve_data_dir() -> Path:
    """Locate the demo CSVs across every deployment shape this repo supports.

    - Local dev / pytest (run from the repo root): ``<repo>/data/demo``.
    - Docker Compose: ``docker-compose.yml`` bind-mounts ``./data`` to
      ``/data`` in the backend container regardless of how the app package
      itself was laid out, so that mount wins when present.
    - ``AGRI_DATA_DIR`` always wins when set, for custom deployments.
    """
    env_dir = os.getenv("AGRI_DATA_DIR")
    if env_dir:
        return Path(env_dir)
    docker_mount = Path("/data/demo")
    if docker_mount.exists():
        return docker_mount
    return REPO_ROOT / "data" / "demo"


DATA_DIR = _resolve_data_dir()

_NUMERIC_FIELDS: Dict[str, Dict[str, type]] = {
    "farmers.csv": {"farms": int},
    "farms.csv": {
        "area_ha": float, "lat": float, "lon": float,
        "ndvi": float, "ndwi": float, "cloud_pct": float,
    },
    "tractors.csv": {
        "capacity_ha_hr": float, "operating_hours": float,
        "lat": float, "lon": float, "last_service_hours_ago": int,
    },
    "bookings.csv": {"amount": float},
}


def _read_csv(name: str) -> List[Dict[str, Any]]:
    path = DATA_DIR / name
    if not path.exists():
        try:
            from backend.app.data.generate_demo_data import generate_demo_datasets
        except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
            from app.data.generate_demo_data import generate_demo_datasets  # type: ignore
        generate_demo_datasets()

    casters = _NUMERIC_FIELDS.get(name, {})
    rows: List[Dict[str, Any]] = []
    with path.open("r", newline="", encoding="utf-8") as handle:
        for raw_row in csv.DictReader(handle):
            row: Dict[str, Any] = dict(raw_row)
            for field, caster in casters.items():
                value = row.get(field)
                if value not in (None, ""):
                    try:
                        row[field] = caster(value)
                    except ValueError:
                        pass
            rows.append(row)
    return rows


@lru_cache(maxsize=1)
def get_farmers() -> List[Dict[str, Any]]:
    return _read_csv("farmers.csv")


@lru_cache(maxsize=1)
def get_farms() -> List[Dict[str, Any]]:
    return _read_csv("farms.csv")


@lru_cache(maxsize=1)
def get_tractors() -> List[Dict[str, Any]]:
    return _read_csv("tractors.csv")


@lru_cache(maxsize=1)
def get_bookings() -> List[Dict[str, Any]]:
    return _read_csv("bookings.csv")


def reset_cache() -> None:
    """Clear cached datasets (used by tests after regenerating CSVs)."""
    get_farmers.cache_clear()
    get_farms.cache_clear()
    get_tractors.cache_clear()
    get_bookings.cache_clear()


def get_regions() -> List[str]:
    regions = {row.get("region") for row in get_farms() if row.get("region")}
    return sorted(regions)


def farms_by_id() -> Dict[str, Dict[str, Any]]:
    return {row["farm_id"]: row for row in get_farms()}


def tractors_by_id() -> Dict[str, Dict[str, Any]]:
    return {row["tractor_id"]: row for row in get_tractors()}


def _month_key(iso_timestamp: str) -> str:
    try:
        return datetime.fromisoformat(iso_timestamp).strftime("%Y-%m")
    except (TypeError, ValueError):
        return "unknown"


def compute_summary() -> Dict[str, Any]:
    farmers = get_farmers()
    farms = get_farms()
    tractors = get_tractors()
    bookings = get_bookings()

    active_tractors = sum(1 for t in tractors if t.get("status") == "active")
    completed = [b for b in bookings if b.get("status") == "completed"]
    pending_amount = sum(
        float(b.get("amount", 0)) for b in bookings if b.get("payment_status") == "pending"
    )
    revenue = sum(float(b.get("amount", 0)) for b in completed)
    total_hours = sum(float(t.get("operating_hours", 0)) for t in tractors)
    utilization_rate = total_hours / max(len(tractors) * 24 * 30, 1)

    ndvi_values = [float(f.get("ndvi", 0)) for f in farms if f.get("ndvi") not in (None, "")]
    avg_ndvi = sum(ndvi_values) / max(len(ndvi_values), 1)

    # Regional imbalance: how much worse the most tractor-starved region's
    # bookings-per-active-tractor pressure is versus the least-starved one,
    # normalized to [0, 1). 0 = every region carries the same demand per
    # tractor (well-allocated fleet); near 1 = demand is concentrated where
    # supply is thin.
    demand_regions = Counter(b.get("region", "unknown") for b in bookings)
    supply_regions = Counter(t.get("region", "unknown") for t in tractors if t.get("status") == "active")
    pressure = [demand / max(supply_regions.get(region, 0), 1) for region, demand in demand_regions.items()]
    supply_demand_gap = (max(pressure) - min(pressure)) / max(pressure) if pressure else 0.0

    try:  # local import avoids a cycle with services importing repository
        from backend.app.services.data_quality import compute_data_quality
    except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
        from app.services.data_quality import compute_data_quality  # type: ignore

    quality = compute_data_quality("bookings", bookings)

    return {
        "total_farmers": len(farmers),
        "total_farms": len(farms),
        "total_tractors": len(tractors),
        "active_tractors": active_tractors,
        "utilization_rate": round(utilization_rate, 4),
        "total_bookings": len(bookings),
        "completed_jobs": len(completed),
        "revenue": round(revenue, 2),
        "outstanding_payments": round(pending_amount, 2),
        "avg_ndvi": round(avg_ndvi, 3),
        "supply_demand_gap": round(min(supply_demand_gap, 1.0), 3),
        "data_quality_score": quality["overall_score"],
        "pipeline_status": "healthy",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def bookings_timeseries() -> List[Dict[str, Any]]:
    monthly: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"bookings": 0, "revenue": 0.0, "completed": 0})
    for booking in get_bookings():
        key = _month_key(booking.get("requested_at", ""))
        bucket = monthly[key]
        bucket["bookings"] += 1
        if booking.get("status") == "completed":
            bucket["completed"] += 1
            bucket["revenue"] += float(booking.get("amount", 0))
    return [
        {"month": month, **{k: (round(v, 2) if k == "revenue" else v) for k, v in values.items()}}
        for month, values in sorted(monthly.items())
        if month != "unknown"
    ]


def vegetation_by_region() -> List[Dict[str, Any]]:
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for farm in get_farms():
        grouped[farm.get("region", "unknown")].append(farm)

    try:
        from backend.app.services.satellite import summarize_farm_vegetation
    except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
        from app.services.satellite import summarize_farm_vegetation  # type: ignore

    results = []
    for region, farms in sorted(grouped.items()):
        observations = [
            {"ndvi": f.get("ndvi", 0), "ndwi": f.get("ndwi", 0), "cloud_percentage": f.get("cloud_pct", 0)}
            for f in farms
        ]
        summary = summarize_farm_vegetation(observations)
        results.append({"region": region, "farm_count": len(farms), **summary})
    return results


def farms_geojson(region: str | None = None) -> Dict[str, Any]:
    features = []
    for farm in get_farms():
        if region and farm.get("region") != region:
            continue
        lat, lon = farm.get("lat"), farm.get("lon")
        if lat in (None, "") or lon in (None, ""):
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
            "properties": {
                "farm_id": farm["farm_id"],
                "farmer_id": farm.get("farmer_id"),
                "region": farm.get("region"),
                "area_ha": farm.get("area_ha"),
                "ndvi": farm.get("ndvi"),
                "ndwi": farm.get("ndwi"),
                "last_scan": farm.get("last_scan"),
            },
        })
    return {"type": "FeatureCollection", "features": features}


def tractors_geojson(region: str | None = None) -> Dict[str, Any]:
    features = []
    for tractor in get_tractors():
        if region and tractor.get("region") != region:
            continue
        lat, lon = tractor.get("lat"), tractor.get("lon")
        if lat in (None, "") or lon in (None, ""):
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
            "properties": {
                "tractor_id": tractor["tractor_id"],
                "model": tractor.get("model"),
                "status": tractor.get("status"),
                "region": tractor.get("region"),
                "capacity_ha_hr": tractor.get("capacity_ha_hr"),
                "operating_hours": tractor.get("operating_hours"),
            },
        })
    return {"type": "FeatureCollection", "features": features}
