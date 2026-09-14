from __future__ import annotations

from typing import Dict, Any, List


def compute_utilization_metrics(tractors: List[Dict[str, Any]], bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_tractors = len(tractors)
    active_tractors = sum(1 for tractor in tractors if tractor.get("status") == "active")
    idle_tractors = total_tractors - active_tractors

    operating_hours = 0.0
    for tractor in tractors:
        hours = tractor.get("operating_hours")
        if hours is None:
            hours = 180.0 if tractor.get("status") == "active" else 60.0
        operating_hours += float(hours)

    jobs_completed = sum(1 for booking in bookings if booking.get("status") == "completed")
    revenue_per_tractor = sum(float(booking.get("amount", 0)) for booking in bookings if booking.get("status") == "completed") / max(total_tractors, 1)
    utilization_rate = operating_hours / max((total_tractors * 24 * 30), 1)

    return {
        "total_tractors": total_tractors,
        "active_tractors": active_tractors,
        "idle_tractors": idle_tractors,
        "operating_hours": round(operating_hours, 2),
        "utilization_rate": round(utilization_rate, 4),
        "jobs_completed": jobs_completed,
        "revenue_per_tractor": round(revenue_per_tractor, 2),
    }


def compute_demand_metrics(bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_region: Dict[str, int] = {}
    by_operation: Dict[str, int] = {}
    for booking in bookings:
        region = booking.get("region", "unknown")
        op = booking.get("crop_operation", "unknown")
        by_region[region] = by_region.get(region, 0) + 1
        by_operation[op] = by_operation.get(op, 0) + 1

    return {
        "bookings_per_region": by_region,
        "bookings_per_operation": by_operation,
        "total_bookings": len(bookings),
    }


def compute_revenue_metrics(bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
    completed = [booking for booking in bookings if booking.get("status") == "completed"]
    revenue = sum(float(booking.get("amount", 0)) for booking in completed)
    avg_booking_value = revenue / max(len(completed), 1)
    return {
        "gross_revenue": round(revenue, 2),
        "average_booking_value": round(avg_booking_value, 2),
        "completed_jobs": len(completed),
    }
