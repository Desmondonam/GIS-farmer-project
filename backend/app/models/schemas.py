from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Farmer(BaseModel):
    farmer_id: str
    name: str
    region: str
    created_at: Optional[str] = None


class Farm(BaseModel):
    farm_id: str
    farmer_id: str
    name: str
    region: str
    area_ha: float
    geometry_wkt: Optional[str] = None


class Tractor(BaseModel):
    tractor_id: str
    owner_id: str
    status: str
    region: str
    capacity_ha_hr: float
    available: bool = True


class Booking(BaseModel):
    booking_id: str
    farmer_id: str
    tractor_id: str
    crop_operation: str
    status: str
    amount: float
    requested_at: Optional[str] = None


class DataQualityResult(BaseModel):
    dataset: str
    records: int
    valid: int
    invalid: int
    completeness: float
    validity: float
    uniqueness: float
    freshness: float
    overall_score: float


class Recommendation(BaseModel):
    tractor_id: str
    score: float
    distance_km: float
    available: bool
    capability: str
    operator_rating: float
    previous_jobs_nearby: int
    rationale: str
