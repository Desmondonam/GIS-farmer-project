from __future__ import annotations

from typing import Any, Dict, Iterable, List


def validate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    errors: List[str] = []

    if record.get("farmer_id") in (None, ""):
        errors.append("missing_farmer_id")
    if record.get("tractor_id") in (None, ""):
        errors.append("missing_tractor_id")
    if record.get("amount") is not None and float(record.get("amount", 0)) < 0:
        errors.append("negative_amount")

    lat = record.get("latitude")
    lon = record.get("longitude")
    if lat is not None and lon is not None:
        if not (-90 <= float(lat) <= 90 and -180 <= float(lon) <= 180):
            errors.append("invalid_coordinates")

    if record.get("area_ha") is not None and float(record.get("area_ha", 0)) <= 0:
        errors.append("invalid_farm_area")

    return {"valid": not errors, "errors": errors}


def validate_records(records: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    results = [validate_record(record) for record in records]
    valid = sum(1 for result in results if result["valid"])
    invalid = len(results) - valid
    return {
        "total": len(results),
        "valid": valid,
        "invalid": invalid,
        "validity_rate": round((valid / max(len(results), 1)) * 100, 2),
        "errors": [error for result in results for error in result["errors"]],
    }
