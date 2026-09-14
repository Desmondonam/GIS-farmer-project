from pathlib import Path

from backend.app.data.generate_demo_data import generate_demo_datasets
from pipelines.ingest import ingest_demo_data


def test_ingest_demo_data_pipeline():
    dataset_paths = generate_demo_datasets()
    summary = ingest_demo_data(dataset_paths)

    assert summary["total_files"] == len(dataset_paths)
    assert summary["records_loaded"] > 0
    assert summary["files_processed"] == len(dataset_paths)
    assert all(path.exists() for path in dataset_paths.values())
