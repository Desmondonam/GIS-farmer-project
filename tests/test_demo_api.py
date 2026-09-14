import pytest
from fastapi.testclient import TestClient

try:
    from backend.app.main import app
except ModuleNotFoundError:  # pragma: no cover - fallback for repo path layout
    from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_utilization_endpoint():
    response = client.get("/analytics/utilization")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_tractors"] >= 1
    assert payload["utilization_rate"] > 0


def test_data_quality_summary_endpoint():
    response = client.get("/data-quality")
    assert response.status_code == 200
    payload = response.json()
    assert payload["overall_score"] > 0


def test_farmers_endpoint():
    response = client.get("/farmers")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert len(payload["items"]) >= 1


def test_recommendations_endpoint():
    response = client.get("/recommendations/tractor?farm_id=FRM-1001")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) >= 1
    assert payload[0]["score"] > 0
