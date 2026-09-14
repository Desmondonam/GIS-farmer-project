from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

try:
    from backend.app.data import repository
    from backend.app.services.analytics import (
        compute_demand_metrics,
        compute_revenue_metrics,
        compute_utilization_metrics,
    )
    from backend.app.services.data_quality import compute_data_quality
    from backend.app.services.recommendations import recommend_tractors_for_farm
except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
    from app.data import repository  # type: ignore
    from app.services.analytics import (  # type: ignore
        compute_demand_metrics,
        compute_revenue_metrics,
        compute_utilization_metrics,
    )
    from app.services.data_quality import compute_data_quality  # type: ignore
    from app.services.recommendations import recommend_tractors_for_farm  # type: ignore

router = APIRouter()


def _paginate(items: List[Dict[str, Any]], limit: int, offset: int) -> Dict[str, Any]:
    window = items[offset : offset + limit]
    return {"total": len(items), "limit": limit, "offset": offset, "items": window}


def _filter(items: List[Dict[str, Any]], **filters: Optional[str]) -> List[Dict[str, Any]]:
    result = items
    for field, value in filters.items():
        if value is None:
            continue
        result = [row for row in result if str(row.get(field, "")).lower() == value.lower()]
    return result


@router.get("/regions")
def list_regions():
    return {"items": repository.get_regions()}


@router.get("/farmers")
def list_farmers(
    region: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    items = _filter(repository.get_farmers(), region=region)
    if search:
        needle = search.lower()
        items = [row for row in items if needle in row.get("name", "").lower() or needle in row.get("farmer_id", "").lower()]
    return _paginate(items, limit, offset)


@router.get("/farms")
def list_farms(
    region: Optional[str] = None,
    farmer_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    items = _filter(repository.get_farms(), region=region, farmer_id=farmer_id)
    return _paginate(items, limit, offset)


@router.get("/farms/geojson")
def farms_geojson(region: Optional[str] = None):
    return repository.farms_geojson(region)


@router.get("/tractors")
def list_tractors(
    region: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    items = _filter(repository.get_tractors(), region=region, status=status)
    return _paginate(items, limit, offset)


@router.get("/tractors/geojson")
def tractors_geojson(region: Optional[str] = None):
    return repository.tractors_geojson(region)


@router.get("/bookings")
def list_bookings(
    region: Optional[str] = None,
    status: Optional[str] = None,
    crop_operation: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    items = _filter(repository.get_bookings(), region=region, status=status, crop_operation=crop_operation)
    return _paginate(items, limit, offset)


@router.get("/telemetry")
def list_telemetry(limit: int = Query(25, ge=1, le=200)):
    """Illustrative live-telemetry snapshot derived from the active fleet.

    There is no live telemetry feed in demo mode, so each active tractor gets
    one deterministic reading instead of a handful of hardcoded rows.
    """
    now = datetime.now(timezone.utc)
    items = []
    for tractor in repository.get_tractors():
        if tractor.get("status") != "active":
            continue
        seed = abs(hash(tractor["tractor_id"])) % 1000
        items.append({
            "tractor_id": tractor["tractor_id"],
            "observed_at": (now - timedelta(minutes=seed % 45)).isoformat(),
            "speed_kmh": round(6 + (seed % 140) / 10, 1),
            "engine_hours": tractor.get("operating_hours", 0),
            "region": tractor.get("region"),
        })
        if len(items) >= limit:
            break
    return {"total": len(items), "items": items}


@router.get("/payments")
def list_payments(
    payment_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    bookings = repository.get_bookings()
    items = [
        {
            "payment_id": f"PAY-{booking['booking_id'].split('-')[-1]}",
            "booking_id": booking["booking_id"],
            "farmer_id": booking.get("farmer_id"),
            "amount": booking.get("amount"),
            "payment_status": booking.get("payment_status"),
            "requested_at": booking.get("requested_at"),
        }
        for booking in bookings
        if booking.get("status") != "cancelled"
    ]
    items = _filter(items, payment_status=payment_status)
    return _paginate(items, limit, offset)


@router.get("/pipeline-status")
def pipeline_status():
    counts = {
        "farmers": len(repository.get_farmers()),
        "farms": len(repository.get_farms()),
        "tractors": len(repository.get_tractors()),
        "bookings": len(repository.get_bookings()),
    }
    now = datetime.now(timezone.utc)
    items = [
        {
            "pipeline": "booking_sync",
            "status": "success",
            "last_run": (now - timedelta(minutes=8)).isoformat(),
            "records": counts["bookings"],
            "failed": 0,
        },
        {
            "pipeline": "farm_registry_sync",
            "status": "success",
            "last_run": (now - timedelta(minutes=22)).isoformat(),
            "records": counts["farms"],
            "failed": 0,
        },
        {
            "pipeline": "fleet_telemetry_ingest",
            "status": "success",
            "last_run": (now - timedelta(minutes=3)).isoformat(),
            "records": counts["tractors"],
            "failed": 0,
        },
        {
            "pipeline": "sentinel_ndvi_processing",
            "status": "success",
            "last_run": (now - timedelta(hours=2, minutes=10)).isoformat(),
            "records": counts["farms"],
            "failed": 3,
        },
    ]
    return {"total": len(items), "items": items}


@router.get("/vegetation")
def vegetation_for_farms(region: Optional[str] = None, limit: int = Query(100, ge=1, le=1000)):
    items = repository.vegetation_by_region()
    if region:
        items = [row for row in items if row["region"].lower() == region.lower()]
    return {"total": len(items), "items": items[:limit]}


@router.get("/vegetation/watchlist")
def vegetation_watchlist(threshold: float = 0.35, limit: int = Query(25, ge=1, le=200)):
    """Farms whose latest NDVI reading sits at or below the stress threshold."""
    farms = [f for f in repository.get_farms() if float(f.get("ndvi", 1)) <= threshold]
    farms.sort(key=lambda f: float(f.get("ndvi", 1)))
    return {"total": len(farms), "items": farms[:limit]}


@router.get("/recommendations/tractor")
def recommendations(farm_id: str = Query(...), limit: int = Query(10, ge=1, le=50)):
    farms = repository.get_farms()
    if not any(f.get("farm_id") == farm_id for f in farms):
        raise HTTPException(status_code=404, detail=f"farm {farm_id} not found")
    return recommend_tractors_for_farm(farm_id, farms, repository.get_tractors(), repository.get_bookings(), limit)


@router.get("/analytics/utilization")
def analytics_utilization():
    return compute_utilization_metrics(repository.get_tractors(), repository.get_bookings())


@router.get("/analytics/utilization/by-region")
def analytics_utilization_by_region():
    tractors = repository.get_tractors()
    regions = sorted({t.get("region", "unknown") for t in tractors})
    rows = []
    for region in regions:
        region_tractors = [t for t in tractors if t.get("region") == region]
        active = sum(1 for t in region_tractors if t.get("status") == "active")
        rows.append({
            "region": region,
            "total_tractors": len(region_tractors),
            "active_tractors": active,
            "idle_tractors": len(region_tractors) - active,
            "utilization_rate": round(active / max(len(region_tractors), 1), 3),
        })
    return {"items": rows}


@router.get("/analytics/demand")
def analytics_demand():
    return compute_demand_metrics(repository.get_bookings())


@router.get("/analytics/demand/timeseries")
def analytics_demand_timeseries():
    return {"items": repository.bookings_timeseries()}


@router.get("/analytics/revenue")
def analytics_revenue():
    return compute_revenue_metrics(repository.get_bookings())


@router.get("/analytics/revenue/by-region")
def analytics_revenue_by_region():
    bookings = repository.get_bookings()
    regions = sorted({b.get("region", "unknown") for b in bookings})
    rows = []
    for region in regions:
        region_bookings = [b for b in bookings if b.get("region") == region]
        completed = [b for b in region_bookings if b.get("status") == "completed"]
        outstanding = sum(float(b.get("amount", 0)) for b in region_bookings if b.get("payment_status") == "pending")
        rows.append({
            "region": region,
            "revenue": round(sum(float(b.get("amount", 0)) for b in completed), 2),
            "completed_jobs": len(completed),
            "outstanding_payments": round(outstanding, 2),
        })
    return {"items": rows}


@router.get("/analytics/vegetation")
def analytics_vegetation():
    return {"items": repository.vegetation_by_region()}


@router.get("/data-quality")
def data_quality_report():
    datasets = {
        "farmers": repository.get_farmers(),
        "farms": repository.get_farms(),
        "tractors": repository.get_tractors(),
        "bookings": repository.get_bookings(),
    }
    reports = [compute_data_quality(name, rows) for name, rows in datasets.items()]
    overall = round(sum(r["overall_score"] for r in reports) / len(reports), 2)
    return {"overall_score": overall, "datasets": reports}
