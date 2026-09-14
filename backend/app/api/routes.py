from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

from backend.app.data.demo_data import demo_payload
from backend.app.services.analytics import compute_utilization_metrics, compute_demand_metrics, compute_revenue_metrics
from backend.app.services.satellite import summarize_farm_vegetation

router = APIRouter()


@router.get("/farmers")
def list_farmers():
    payload = demo_payload()
    return {"total": len(payload["farmers"]), "items": payload["farmers"]}


@router.get("/farms")
def list_farms():
    payload = demo_payload()
    return {"total": len(payload["farms"]), "items": payload["farms"]}


@router.get("/tractors")
def list_tractors():
    payload = demo_payload()
    return {"total": len(payload["tractors"]), "items": payload["tractors"]}


@router.get("/bookings")
def list_bookings():
    payload = demo_payload()
    return {"total": len(payload["bookings"]), "items": payload["bookings"]}


@router.get("/telemetry")
def list_telemetry():
    items = [
        {"tractor_id": "TR-001", "observed_at": "2026-09-14T10:00:00Z", "speed_kmh": 12.5, "engine_hours": 210.0},
        {"tractor_id": "TR-002", "observed_at": "2026-09-14T10:15:00Z", "speed_kmh": 9.1, "engine_hours": 70.0},
        {"tractor_id": "TR-003", "observed_at": "2026-09-14T10:20:00Z", "speed_kmh": 14.7, "engine_hours": 185.0},
    ]
    return {"total": len(items), "items": items}


@router.get("/payments")
def list_payments():
    items = [
        {"payment_id": "PAY-101", "booking_id": "BKG-1001", "amount": 42000, "payment_status": "paid"},
        {"payment_id": "PAY-102", "booking_id": "BKG-1002", "amount": 36000, "payment_status": "pending"},
    ]
    return {"total": len(items), "items": items}


@router.get("/pipeline-status")
def pipeline_status():
    items = [
        {"pipeline": "telemetry_ingest", "status": "success", "last_run": "2026-09-14T10:30:00Z", "records": 85300},
        {"pipeline": "booking_sync", "status": "running", "last_run": "2026-09-14T10:45:00Z", "records": 10000},
        {"pipeline": "sentinel_processing", "status": "success", "last_run": "2026-09-14T09:40:00Z", "records": 2431},
    ]
    return {"total": len(items), "items": items}


@router.get("/vegetation")
def vegetation_for_farms():
    payload = demo_payload()
    items = []
    for farm in payload["farms"]:
        items.append({
            "farm_id": farm["id"],
            "region": farm["region"],
            **summarize_farm_vegetation([
                {"ndvi": farm.get("ndvi", 0.5), "ndwi": farm.get("ndwi", 0.2), "cloud_percentage": 12.0},
            ])
        })
    return {"total": len(items), "items": items}


@router.get("/recommendations/tractor")
def recommendations(farm_id: str = Query("FRM-1001")):
    payload = demo_payload()
    tractors = payload["tractors"]
    recommendations_list = []
    for idx, tractor in enumerate(tractors):
        score = 82.5 - idx * 2.1 + (15 if tractor["status"] == "active" else 0)
        recommendations_list.append({
            "tractor_id": tractor["id"],
            "score": round(max(score, 0), 2),
            "distance_km": 8.0 + idx,
            "available": tractor["status"] == "active",
            "capability": "Suitable" if tractor["capacity_ha_hr"] >= 2.5 else "Moderate",
            "operator_rating": 4.6,
            "previous_jobs_nearby": 10 + idx,
            "rationale": f"Recommended for farm {farm_id} due to proximity and availability",
        })
    return sorted(recommendations_list, key=lambda item: item["score"], reverse=True)


@router.get("/analytics/utilization")
def analytics_utilization():
    payload = demo_payload()
    return compute_utilization_metrics(payload["tractors"], payload["bookings"])


@router.get("/analytics/demand")
def analytics_demand():
    payload = demo_payload()
    return compute_demand_metrics(payload["bookings"])


@router.get("/analytics/revenue")
def analytics_revenue():
    payload = demo_payload()
    return compute_revenue_metrics(payload["bookings"])
