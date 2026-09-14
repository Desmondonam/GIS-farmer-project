"""Backward-compatible entry points onto the CSV-backed repository.

Kept small and separate from ``repository.py`` so callers that only need a
health check or the top-level KPI summary don't need to know the repository
module exists.
"""

from __future__ import annotations

from typing import Any, Dict

try:
    from backend.app.data import repository
except ModuleNotFoundError:  # pragma: no cover - repository-layout fallback
    from app.data import repository  # type: ignore


def demo_payload() -> Dict[str, Any]:
    return {
        "summary": repository.compute_summary(),
        "farmers": repository.get_farmers(),
        "farms": repository.get_farms(),
        "tractors": repository.get_tractors(),
        "bookings": repository.get_bookings(),
    }


def demo_health() -> Dict[str, str]:
    return {"status": "ok", "service": "agri-intelligence-platform"}
