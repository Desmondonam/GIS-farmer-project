from __future__ import annotations

import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data" / "demo"


def generate_demo_datasets() -> Dict[str, Path]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataset_paths: Dict[str, Path] = {}

    farmers = [
        {"farmer_id": f"FAR-{idx:03d}", "name": f"Farmer {idx}", "region": regions[idx % len(regions)], "farms": 2 + (idx % 3)}
        for idx in range(1, 501)
    ]
    farms = []
    for idx in range(1, 1001):
        farmer_id = farmers[(idx - 1) % len(farmers)]["farmer_id"]
        farms.append({
            "farm_id": f"FRM-{idx:04d}",
            "farmer_id": farmer_id,
            "region": regions[(idx - 1) % len(regions)],
            "area_ha": round(12 + ((idx * 1.7) % 35), 2),
            "lat": round(-1.2 + ((idx % 50) * 0.08), 5),
            "lon": round(36.3 + ((idx % 40) * 0.06), 5),
        })

    tractors = []
    for idx in range(1, 101):
        tractors.append({
            "tractor_id": f"TR-{idx:03d}",
            "owner_id": f"OWN-{(idx % 20) + 1:03d}",
            "status": "active" if idx % 5 else "idle",
            "region": regions[idx % len(regions)],
            "capacity_ha_hr": round(2.0 + (idx % 8) * 0.3, 2),
            "operating_hours": round(150 + (idx % 15) * 12, 2),
        })

    bookings = []
    for idx in range(1, 10001):
        booking_region = regions[idx % len(regions)]
        farmer_id = farmers[(idx - 1) % len(farmers)]["farmer_id"]
        tractor_id = tractors[(idx - 1) % len(tractors)]["tractor_id"]
        bookings.append({
            "booking_id": f"BKG-{idx:05d}",
            "farmer_id": farmer_id,
            "tractor_id": tractor_id,
            "region": booking_region,
            "status": "completed" if idx % 5 else "pending",
            "crop_operation": ops[idx % len(ops)],
            "amount": round(12000 + (idx % 40) * 300, 2),
            "requested_at": (datetime(2026, 1, 1) + timedelta(days=idx % 365)).isoformat(),
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


regions = ["Kiambu", "Machakos", "Nakuru", "Nairobi", "Embu"]
ops = ["Land preparation", "Planting", "Weeding", "Harvesting", "Soil management"]
