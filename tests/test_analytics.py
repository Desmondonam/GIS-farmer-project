from backend.app.services.analytics import compute_utilization_metrics, compute_demand_metrics, compute_revenue_metrics


def test_compute_utilization_metrics():
    tractors = [
        {"status": "active", "operating_hours": 200},
        {"status": "idle", "operating_hours": 40},
    ]
    bookings = [
        {"status": "completed", "amount": 5000},
        {"status": "pending", "amount": 3000},
    ]
    result = compute_utilization_metrics(tractors, bookings)
    assert result["total_tractors"] == 2
    assert result["active_tractors"] == 1
    assert result["jobs_completed"] == 1
    assert result["utilization_rate"] > 0


def test_compute_demand_metrics():
    bookings = [
        {"region": "Kiambu", "crop_operation": "Land preparation"},
        {"region": "Kiambu", "crop_operation": "Planting"},
        {"region": "Nakuru", "crop_operation": "Land preparation"},
    ]
    result = compute_demand_metrics(bookings)
    assert result["bookings_per_region"]["Kiambu"] == 2
    assert result["bookings_per_operation"]["Land preparation"] == 2


def test_compute_revenue_metrics():
    bookings = [
        {"status": "completed", "amount": 1000},
        {"status": "completed", "amount": 2000},
        {"status": "pending", "amount": 500},
    ]
    result = compute_revenue_metrics(bookings)
    assert result["gross_revenue"] == 3000
    assert result["completed_jobs"] == 2
