"""Application factory.

``create_app`` wires the repository -> service -> router dependency chain
and registers error handlers. Using a factory (instead of a module-level
``app``) keeps tests isolated: each test builds a fresh app with its own
in-memory store.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .config import Settings
from .deps import get_service
from .models import ErrorBody, HealthResponse
from .routers import bounties as bounties_router
from .seed import SEED_BOUNTIES
from .services import BountyService
from .store import BountyNotFoundError, InMemoryBountyRepository


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build a configured FastAPI application."""
    settings = settings or Settings.from_env()
    repository = InMemoryBountyRepository(seed=SEED_BOUNTIES if settings.seed_demo_data else None)
    service = BountyService(repository)

    app = FastAPI(
        title="Bounty Listings API",
        description=(
            "A production-grade FastAPI service for bounty listings: "
            "validated CRUD, filtering, sorting, and pagination."
        ),
        version=settings.version,
    )
    app.dependency_overrides[get_service] = lambda: service
    app.include_router(bounties_router.router)

    @app.exception_handler(BountyNotFoundError)
    async def _not_found_handler(_request: Request, exc: BountyNotFoundError) -> JSONResponse:
        body = ErrorBody(detail=str(exc), code="bounty_not_found")
        return JSONResponse(status_code=404, content=body.model_dump())

    @app.get("/health", response_model=HealthResponse, tags=["ops"])
    def health() -> HealthResponse:
        return HealthResponse(version=settings.version, bounties=service.count())

    return app


# Convenience instance for `uvicorn bounty_api.app:app`.
app = create_app()
