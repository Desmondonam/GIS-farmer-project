from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import get_settings
    from app.data import repository
    from app.data.demo_data import demo_health
    from app.api.routes import router as api_router
except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
    from backend.app.config import get_settings
    from backend.app.data import repository
    from backend.app.data.demo_data import demo_health
    from backend.app.api.routes import router as api_router

settings = get_settings()

app = FastAPI(
    title="Agri Intelligence Platform",
    version="2.0.0",
    description="Agricultural mechanization intelligence platform — fleet, GIS, and demand analytics.",
)

app.include_router(api_router)

origins = (
    [origin.strip() for origin in settings.cors_allowed_origins.split(",") if origin.strip()]
    if settings.cors_allowed_origins
    else ["http://localhost:5173"]
)

# Every route here is a public, unauthenticated GET over synthetic demo data —
# there is no session/cookie to protect — so credentials stay off. That's what
# makes `allow_origins=["*"]` valid; browsers reject a wildcard origin paired
# with allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return demo_health()


@app.get("/ready")
def readiness_check():
    return {"status": "ready", "mode": "demo" if settings.demo_mode else "live"}


@app.get("/summary")
def summarised_metrics():
    return repository.compute_summary()
