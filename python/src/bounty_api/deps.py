"""Dependency-injection seam.

Routers depend on ``get_service``; ``create_app`` replaces it per app via
``app.dependency_overrides``. This keeps the router importable on its own
and makes tests trivially isolated (fresh app = fresh store).
"""

from __future__ import annotations

from .services import BountyService


def get_service() -> BountyService:
    """Placeholder replaced by ``create_app`` via dependency overrides."""
    raise RuntimeError("BountyService is not configured for this app")
