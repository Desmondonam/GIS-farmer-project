from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, Any


def ingest_demo_data(dataset_paths: Dict[str, Path]) -> Dict[str, Any]:
    total_records = 0
    files_processed = 0

    for path in dataset_paths.values():
        with path.open("r", newline="") as handle:
            reader = csv.DictReader(handle)
            row_count = sum(1 for _ in reader)
            total_records += row_count
        files_processed += 1

    return {
        "total_files": len(dataset_paths),
        "files_processed": files_processed,
        "records_loaded": total_records,
        "status": "success",
    }
