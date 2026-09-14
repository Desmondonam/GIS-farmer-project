from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_bookings_endpoint():
    response = client.get("/bookings")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert len(payload["items"]) >= 1


def test_telemetry_endpoint():
    response = client.get("/telemetry")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert payload["items"][0]["tractor_id"]


def test_payments_endpoint():
    response = client.get("/payments")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert payload["items"][0]["amount"] >= 0


def test_pipeline_status_endpoint():
    response = client.get("/pipeline-status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert payload["items"][0]["status"] in {"success", "running", "failed"}
