from backend.app.data.generate_demo_data import generate_demo_datasets


def test_demo_dataset_generation():
    dataset_paths = generate_demo_datasets()
    assert "farmers.csv" in dataset_paths
    assert "farms.csv" in dataset_paths
    assert "tractors.csv" in dataset_paths
    assert "bookings.csv" in dataset_paths

    for path in dataset_paths.values():
        assert path.exists()
        assert path.stat().st_size > 0
