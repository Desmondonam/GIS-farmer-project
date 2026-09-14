from backend.app.services.satellite import ndvi, ndwi, summarize_farm_vegetation


def test_ndvi_calculation():
    value = ndvi(0.2, 0.7)
    assert value == 0.5555555555555556


def test_ndwi_calculation():
    value = ndwi(0.4, 0.2)
    assert value == 0.3333333333333333


def test_summary_of_farm_vegetation():
    summary = summarize_farm_vegetation([
        {"ndvi": 0.6, "ndwi": 0.2, "cloud_percentage": 12.0},
        {"ndvi": 0.7, "ndwi": 0.35, "cloud_percentage": 18.0},
    ])
    assert summary["mean_ndvi"] > 0.5
    assert summary["status"] == "healthy_vegetation"
