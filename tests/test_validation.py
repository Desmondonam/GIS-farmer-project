from backend.app.services.validation import validate_record, validate_records


def test_validate_record():
    record = {"farmer_id": "FAR-001", "tractor_id": "TR-001", "amount": 2500, "latitude": 1.2, "longitude": 36.7}
    result = validate_record(record)
    assert result["valid"] is True
    assert result["errors"] == []


def test_validate_records_detects_invalid_data():
    records = [
        {"farmer_id": "FAR-001", "tractor_id": "TR-001", "amount": 1000, "latitude": 1.2, "longitude": 36.7},
        {"farmer_id": "", "tractor_id": "TR-002", "amount": -50, "latitude": 200, "longitude": 36.7},
    ]
    result = validate_records(records)
    assert result["total"] == 2
    assert result["invalid"] >= 1
    assert result["validity_rate"] < 100
