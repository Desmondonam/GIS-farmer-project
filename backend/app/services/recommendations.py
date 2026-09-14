from __future__ import annotations

from typing import Any, Dict, List


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
