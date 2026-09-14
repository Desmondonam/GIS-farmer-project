from __future__ import annotations

from collections import Counter
from typing import Any, Dict, Iterable, List


def is_valid_coordinate(lat: float, lon: float) -> bool:
    return -90 <= float(lat) <= 90 and -180 <= float(lon) <= 180


def duplicate_count(values: Iterable[str]) -> int:
    counts = Counter(values)
    return sum(count - 1 for count in counts.values() if count > 1)


def compute_data_quality(dataset_name: str, records: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = max(len(records), 1)
    valid = 0
    invalid = 0
    missing_ids = 0
    duplicate_ids = 0
    for record in records:
        farmer_id = record.get("farmer_id")
        tractor_id = record.get("tractor_id")
        if farmer_id is None or farmer_id == "":
            missing_ids += 1
        if tractor_id is None or tractor_id == "":
            missing_ids += 1

        lat = record.get("latitude")
        lon = record.get("longitude")
        if lat is not None and lon is not None:
            if is_valid_coordinate(lat, lon):
                valid += 1
            else:
                invalid += 1
        else:
            valid += 1

    duplicates = duplicate_count([str(record.get("farmer_id")) for record in records if record.get("farmer_id")])
    duplicate_ids += duplicates

    completeness = max(0.0, 100.0 - ((missing_ids / total) * 100.0))
    validity = max(0.0, 100.0 - ((invalid / total) * 100.0))
    uniqueness = max(0.0, 100.0 - ((duplicate_ids / total) * 100.0))
    freshness = 96.5
    overall = (completeness + validity + uniqueness + freshness) / 4

    return {
        "dataset": dataset_name,
        "records": total,
        "valid": valid,
        "invalid": invalid,
        "completeness": round(completeness, 2),
        "validity": round(validity, 2),
        "uniqueness": round(uniqueness, 2),
        "freshness": round(freshness, 2),
        "overall_score": round(overall, 2),
    }
