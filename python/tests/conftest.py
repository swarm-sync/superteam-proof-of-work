"""Shared fixtures: a fresh app (and therefore a fresh store) per test."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from bounty_api.app import create_app
from bounty_api.config import Settings


@pytest.fixture()
def client() -> TestClient:
    """Test client backed by an app seeded with the demo dataset."""
    app = create_app(Settings(seed_demo_data=True))
    return TestClient(app)


@pytest.fixture()
def empty_client() -> TestClient:
    """Test client backed by an app with an empty store."""
    app = create_app(Settings(seed_demo_data=False))
    return TestClient(app)
