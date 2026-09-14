from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import get_settings
    from app.data.demo_data import demo_payload, demo_health
    from app.api.routes import router as api_router
except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
    from backend.app.config import get_settings
    from backend.app.data.demo_data import demo_payload, demo_health
    from backend.app.api.routes import router as api_router

settings = get_settings()

app = FastAPI(
    title="Agri Intelligence Platform",
    version="0.1.0",
    description="Agricultural mechanization intelligence platform MVP",
)

app.include_router(api_router)

origins = settings.cors_allowed_origins.split(",") if settings.cors_allowed_origins else ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return demo_health()


@app.get("/ready")
def readiness_check():
    return {"status": "ready", "mode": "demo" if settings.demo_mode else "live"}


@app.get("/data-quality")
def data_quality():
    payload = demo_payload()
    return {
        "dataset": "platform_overview",
        "overall_score": payload["summary"]["data_quality_score"],
        "completeness": 98.4,
        "validity": 97.8,
        "uniqueness": 99.1,
        "freshness": 96.5,
    }


@app.get("/summary")
def summarised_metrics():
    return demo_payload()["summary"]


@app.get("/farmers")
def list_farmers():
    payload = demo_payload()
    farmers = payload["farmers"]
    return {"total": len(farmers), "items": farmers}


@app.get("/recommendations/tractor")
def tractor_recommendations(farm_id: str = "FRM-1001"):
    payload = demo_payload()
    tractors = [
        {
            "tractor_id": tractor["id"],
            "distance_km": 8.0 + idx,
            "available": tractor["status"] == "active",
            "capacity_ha_hr": tractor["capacity_ha_hr"],
            "historical_performance": 0.8 + idx * 0.02,
            "operator_rating": 4.4 + (idx % 3) * 0.1,
            "previous_jobs_nearby": 9 + idx * 3,
        }
        for idx, tractor in enumerate(payload["tractors"])
    ]
    recommendations = []
    for tractor in tractors:
        score = (
            (100 - tractor["distance_km"] * 4) * 0.30
            + (100 if tractor["available"] else 0) * 0.25
            + (80 if tractor["capacity_ha_hr"] >= 2.5 else 60) * 0.20
            + (tractor["historical_performance"] * 100) * 0.15
            + (tractor["operator_rating"] / 5 * 100) * 0.10
        )
        recommendations.append({
            "tractor_id": tractor["tractor_id"],
            "score": round(score, 2),
            "distance_km": tractor["distance_km"],
            "available": tractor["available"],
            "capability": "Suitable" if tractor["capacity_ha_hr"] >= 2.5 else "Marginal",
            "operator_rating": tractor["operator_rating"],
            "previous_jobs_nearby": tractor["previous_jobs_nearby"],
            "rationale": f"Distance {tractor['distance_km']} km from farm {farm_id}; available={tractor['available']}"
        })
    return sorted(recommendations, key=lambda item: item["score"], reverse=True)
