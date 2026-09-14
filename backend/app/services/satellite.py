from __future__ import annotations

from typing import Dict, List, Any


def ndvi(red: float, nir: float) -> float:
    denom = nir + red
    if abs(denom) < 1e-9:
        return 0.0
    return (nir - red) / denom


def ndwi(green: float, nir: float) -> float:
    denom = green + nir
    if abs(denom) < 1e-9:
        return 0.0
    return (green - nir) / denom


def summarize_farm_vegetation(observations: List[Dict[str, float]]) -> Dict[str, Any]:
    if not observations:
        return {"mean_ndvi": 0.0, "mean_ndwi": 0.0, "cloud_percentage": 0.0, "status": "insufficient_data"}

    ndvi_values = [float(obs.get("ndvi", 0.0)) for obs in observations]
    ndwi_values = [float(obs.get("ndwi", 0.0)) for obs in observations]
    cloud_values = [float(obs.get("cloud_percentage", 0.0)) for obs in observations]

    mean_ndvi = sum(ndvi_values) / len(ndvi_values)
    mean_ndwi = sum(ndwi_values) / len(ndwi_values)
    mean_cloud = sum(cloud_values) / len(cloud_values)

    if mean_ndvi > 0.55:
        vegetation_status = "healthy_vegetation"
    elif mean_ndvi > 0.3:
        vegetation_status = "moderate_vegetation"
    else:
        vegetation_status = "low_vegetation"

    return {
        "mean_ndvi": round(mean_ndvi, 4),
        "mean_ndwi": round(mean_ndwi, 4),
        "cloud_percentage": round(mean_cloud, 2),
        "status": vegetation_status,
    }
