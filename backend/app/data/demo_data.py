from __future__ import annotations

from typing import Dict, List, Any


def demo_payload() -> Dict[str, Any]:
    return {
        "summary": {
            "total_farmers": 500,
            "total_farms": 1000,
            "total_tractors": 100,
            "active_tractors": 72,
            "utilization_rate": 0.68,
            "total_bookings": 10000,
            "completed_jobs": 8840,
            "revenue": 2480000,
            "outstanding_payments": 126000,
            "avg_ndvi": 0.61,
            "supply_demand_gap": 0.14,
            "data_quality_score": 97.4,
            "pipeline_status": "healthy",
        },
        "farmers": [
            {"id": "FAR-001", "name": "Samuel Njoroge", "region": "Kiambu", "farms": 3},
            {"id": "FAR-002", "name": "Anne Wanjiku", "region": "Nakuru", "farms": 2},
            {"id": "FAR-003", "name": "James Mwangi", "region": "Machakos", "farms": 4},
        ],
        "farms": [
            {"id": "FRM-1001", "farmer_id": "FAR-001", "region": "Kiambu", "area_ha": 18.4, "ndvi": 0.66, "ndwi": 0.27},
            {"id": "FRM-1002", "farmer_id": "FAR-001", "region": "Kiambu", "area_ha": 22.1, "ndvi": 0.58, "ndwi": 0.19},
            {"id": "FRM-1003", "farmer_id": "FAR-002", "region": "Nakuru", "area_ha": 31.6, "ndvi": 0.7, "ndwi": 0.33},
        ],
        "tractors": [
            {"id": "TR-001", "owner_id": "OWN-001", "region": "Kiambu", "status": "active", "utilization": 0.82, "capacity_ha_hr": 2.8, "operating_hours": 210.0},
            {"id": "TR-002", "owner_id": "OWN-002", "region": "Machakos", "status": "idle", "utilization": 0.31, "capacity_ha_hr": 2.4, "operating_hours": 70.0},
            {"id": "TR-003", "owner_id": "OWN-003", "region": "Nakuru", "status": "active", "utilization": 0.76, "capacity_ha_hr": 3.1, "operating_hours": 185.0},
        ],
        "bookings": [
            {"id": "BKG-1001", "farmer_id": "FAR-001", "tractor_id": "TR-001", "region": "Kiambu", "status": "completed", "amount": 42000},
            {"id": "BKG-1002", "farmer_id": "FAR-002", "tractor_id": "TR-003", "region": "Nakuru", "status": "pending", "amount": 36000},
        ],
        "analytics": {
            "utilization": {
                "total_tractors": 100,
                "active_tractors": 72,
                "idle_tractors": 28,
                "operating_hours": 14800,
                "utilization_rate": 0.68,
                "jobs_completed": 8840,
                "revenue_per_tractor": 24800,
            },
            "demand": {
                "bookings_per_region": {"Kiambu": 2890, "Nakuru": 2410, "Machakos": 2130},
                "bookings_per_month": {"2026-01": 820, "2026-02": 950, "2026-03": 1020},
                "bookings_per_operation": {"Land preparation": 3200, "Planting": 2200, "Harvesting": 1800},
            },
            "revenue": {
                "revenue_by_region": {"Kiambu": 720000, "Nakuru": 630000, "Machakos": 590000},
                "avg_booking_value": 24800,
                "collection_rate": 0.94,
            },
        },
        "pipeline_status": [
            {"pipeline": "telemetry_ingest", "status": "success", "last_run": "2026-09-13T10:30:00Z", "records": 85300, "failed": 3},
            {"pipeline": "booking_sync", "status": "success", "last_run": "2026-09-13T10:32:00Z", "records": 10000, "failed": 0},
            {"pipeline": "sentinel_processing", "status": "success", "last_run": "2026-09-13T09:40:00Z", "records": 2431, "failed": 12},
        ],
    }


def demo_health() -> Dict[str, str]:
    return {"status": "ok", "service": "agri-intelligence-platform"}
