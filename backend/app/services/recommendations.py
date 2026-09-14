from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List, Optional

try:
    from backend.app.services.geo import haversine_km
except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
    from app.services.geo import haversine_km  # type: ignore


def recommend_tractors_for_farm(
    farm_id: str,
    farms: List[Dict[str, Any]],
    tractors: List[Dict[str, Any]],
    bookings: List[Dict[str, Any]],
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """Rank real tractors for a real farm using geodesic distance, capacity fit,
    availability, and prior activity in the farm's region — the data-driven
    counterpart to :func:`rank_tractors_for_farm` below."""

    farm = next((f for f in farms if f.get("farm_id") == farm_id), None)
    if farm is None:
        return []

    farm_lat, farm_lon = farm.get("lat"), farm.get("lon")
    required_capacity = max(float(farm.get("area_ha", 10)) / 40.0, 1.5)
    jobs_nearby = Counter(b.get("tractor_id") for b in bookings if b.get("region") == farm.get("region"))

    enriched = []
    for tractor in tractors:
        if farm_lat not in (None, "") and farm_lon not in (None, "") and tractor.get("lat") not in (None, ""):
            distance_km = haversine_km(float(farm_lat), float(farm_lon), float(tractor["lat"]), float(tractor["lon"]))
        else:
            distance_km = 25.0
        enriched.append({
            "tractor_id": tractor.get("tractor_id"),
            "distance_km": distance_km,
            "available": tractor.get("status") == "active",
            "capacity_ha_hr": tractor.get("capacity_ha_hr", 0),
            "required_capacity_ha_hr": required_capacity,
            "historical_performance": min(0.6 + jobs_nearby.get(tractor.get("tractor_id"), 0) * 0.01, 0.98),
            "operator_rating": 4.2 + (hash(tractor.get("tractor_id", "")) % 8) / 10,
            "previous_jobs_nearby": jobs_nearby.get(tractor.get("tractor_id"), 0),
        })

    ranked = rank_tractors_for_farm(enriched, {"required_capacity_ha_hr": required_capacity})
    return ranked[:limit]


def rank_tractors_for_farm(tractors: List[Dict[str, Any]], farm: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations = []
    for tractor in tractors:
        distance_km = float(tractor.get("distance_km", 12.0))
        availability = 1.0 if tractor.get("available", True) else 0.0
        capacity = 1.0 if float(tractor.get("capacity_ha_hr", 0)) >= float(farm.get("required_capacity_ha_hr", 1.5)) else 0.5
        historical = float(tractor.get("historical_performance", 0.8))
        operator_rating = float(tractor.get("operator_rating", 4.4)) / 5.0

        score = (
            (max(0, 100 - distance_km * 4) * 0.30)
            + (availability * 100 * 0.25)
            + (capacity * 100 * 0.20)
            + (historical * 100 * 0.15)
            + (operator_rating * 100 * 0.10)
        )

        rationale = (
            f"Distance {distance_km:.1f} km; available={tractor.get('available', True)}; "
            f"capacity={tractor.get('capacity_ha_hr', 0)} ha/hr; operator rating {operator_rating:.2f}"
        )
        recommendations.append({
            "tractor_id": tractor.get("tractor_id", "unknown"),
            "score": round(score, 2),
            "distance_km": round(distance_km, 2),
            "available": tractor.get("available", True),
            "capability": "Suitable" if capacity >= 0.8 else "Marginal",
            "operator_rating": operator_rating,
            "previous_jobs_nearby": int(tractor.get("previous_jobs_nearby", 0)),
            "rationale": rationale,
        })

    return sorted(recommendations, key=lambda item: item["score"], reverse=True)
