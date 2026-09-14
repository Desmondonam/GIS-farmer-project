from functools import lru_cache
from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "agri-intelligence-platform"
    app_env: str = "development"
    demo_mode: bool = True
    live_data_mode: bool = False
    postgres_db: str = "agri_db"
    postgres_user: str = "agri_user"
    postgres_password: str = "agri_password"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    cors_allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache

def get_settings() -> Settings:
    import os

    return Settings(
        app_name=os.getenv("APP_NAME", "agri-intelligence-platform"),
        app_env=os.getenv("APP_ENV", "development"),
        demo_mode=os.getenv("DEMO_MODE", "true").lower() == "true",
        live_data_mode=os.getenv("LIVE_DATA_MODE", "false").lower() == "true",
        postgres_db=os.getenv("POSTGRES_DB", "agri_db"),
        postgres_user=os.getenv("POSTGRES_USER", "agri_user"),
        postgres_password=os.getenv("POSTGRES_PASSWORD", "agri_password"),
        postgres_host=os.getenv("POSTGRES_HOST", "localhost"),
        postgres_port=int(os.getenv("POSTGRES_PORT", "5432")),
        cors_allowed_origins=os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"),
    )
