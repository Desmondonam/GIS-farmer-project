from __future__ import annotations

import csv
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data" / "demo"

# Approximate county-seat coordinates so simulated geometry clusters the way a
# real regional map would, instead of walking a synthetic grid unrelated to
# the labelled region.
REGION_CENTERS = {
    "Kiambu": (-1.1714, 36.8356),
    "Machakos": (-1.5177, 37.2634),
    "Nakuru": (-0.3031, 36.0800),
    "Nairobi": (-1.2921, 36.8219),
    "Embu": (-0.5387, 37.4573),
}

regions = list(REGION_CENTERS.keys())
ops = ["Land preparation", "Planting", "Weeding", "Harvesting", "Soil management"]
statuses = ["completed", "completed", "completed", "completed", "pending", "cancelled"]
tractor_statuses = ["active", "active", "active", "active", "idle", "maintenance"]


def _stable_unit(*parts: object) -> float:
    """Deterministic pseudo-random float in [0, 1) derived from the given parts.

    Using a hash instead of a linear formula keeps the demo dataset reproducible
    (same seed material -> same value every run) while avoiding the visible
    banding/periodicity a modulo-based formula produces.
    """
    digest = hashlib.sha256("|".join(str(p) for p in parts).encode("utf-8")).hexdigest()
    return int(digest[:12], 16) / float(16 ** 12)


def _jitter(center: float, spread: float, *seed_parts: object) -> float:
    return center + (_stable_unit(*seed_parts) - 0.5) * 2 * spread


def generate_demo_datasets() -> Dict[str, Path]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataset_paths: Dict[str, Path] = {}

    farmers = [
        {
            "farmer_id": f"FAR-{idx:03d}",
            "name": f"Farmer {idx}",
            "region": regions[idx % len(regions)],
            "farms": 2 + (idx % 3),
            "phone": f"+2547{(10000000 + idx * 37) % 100000000:08d}",
            "joined_at": (datetime(2024, 1, 1) + timedelta(days=(idx * 5) % 720)).date().isoformat(),
        }
        for idx in range(1, 501)
    ]

    farms = []
    for idx in range(1, 1001):
        farmer_id = farmers[(idx - 1) % len(farmers)]["farmer_id"]
        region = regions[(idx - 1) % len(regions)]
        center_lat, center_lon = REGION_CENTERS[region]
        # NDVI/NDWI vary by region (soil/climate) and per-farm noise, and drift
        # slightly with month so a time trend is visible in the dashboard.
        region_bias = {"Kiambu": 0.08, "Nakuru": 0.05, "Machakos": -0.06, "Nairobi": -0.02, "Embu": 0.1}[region]
        base_ndvi = 0.52 + region_bias + (_stable_unit("ndvi", idx) - 0.5) * 0.5
        base_ndvi = max(0.08, min(0.92, base_ndvi))
        base_ndwi = max(0.02, min(0.55, 0.2 + (_stable_unit("ndwi", idx) - 0.5) * 0.35))
        farms.append({
            "farm_id": f"FRM-{idx:04d}",
            "farmer_id": farmer_id,
            "region": region,
            "area_ha": round(3 + _stable_unit("area", idx) * 45, 2),
            "lat": round(_jitter(center_lat, 0.32, "lat", idx), 5),
            "lon": round(_jitter(center_lon, 0.32, "lon", idx), 5),
            "ndvi": round(base_ndvi, 3),
            "ndwi": round(base_ndwi, 3),
            "cloud_pct": round(_stable_unit("cloud", idx) * 30, 1),
            "last_scan": (datetime(2026, 8, 15) + timedelta(days=idx % 28)).date().isoformat(),
        })

    tractors = []
    for idx in range(1, 101):
        region = regions[idx % len(regions)]
        center_lat, center_lon = REGION_CENTERS[region]
        status = tractor_statuses[idx % len(tractor_statuses)]
        tractors.append({
            "tractor_id": f"TR-{idx:03d}",
            "owner_id": f"OWN-{(idx % 20) + 1:03d}",
            "model": ["Massey Ferguson 290", "New Holland TT75", "John Deere 5075E", "Kubota M7060"][idx % 4],
            "status": status,
            "region": region,
            "capacity_ha_hr": round(2.0 + (idx % 8) * 0.3, 2),
            "operating_hours": round(150 + (idx % 15) * 12 + _stable_unit("hours", idx) * 40, 2),
            "lat": round(_jitter(center_lat, 0.28, "tlat", idx), 5),
            "lon": round(_jitter(center_lon, 0.28, "tlon", idx), 5),
            "last_service_hours_ago": int(20 + _stable_unit("service", idx) * 380),
        })

    bookings = []
    for idx in range(1, 10001):
        region = regions[idx % len(regions)]
        farmer_id = farmers[(idx - 1) % len(farmers)]["farmer_id"]
        tractor_id = tractors[(idx - 1) % len(tractors)]["tractor_id"]
        status = statuses[idx % len(statuses)]
        amount = round(9000 + _stable_unit("amount", idx) * 45000, 2)
        bookings.append({
            "booking_id": f"BKG-{idx:05d}",
            "farmer_id": farmer_id,
            "tractor_id": tractor_id,
            "region": region,
            "status": status,
            "crop_operation": ops[idx % len(ops)],
            "amount": amount,
            "payment_status": "paid" if status == "completed" and _stable_unit("paid", idx) > 0.12 else (
                "pending" if status != "cancelled" else "void"
            ),
            "requested_at": (datetime(2025, 9, 15) + timedelta(days=idx % 365, hours=idx % 24)).isoformat(),
        })

    for name, rows in {
        "farmers.csv": farmers,
        "farms.csv": farms,
        "tractors.csv": tractors,
        "bookings.csv": bookings,
    }.items():
        file_path = DATA_DIR / name
        with file_path.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        dataset_paths[name] = file_path

    return dataset_paths


if __name__ == "__main__":
    paths = generate_demo_datasets()
    for name, path in paths.items():
        print(f"wrote {name} -> {path}")
