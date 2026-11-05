"""HTTP layer: FastAPI routers for bounty listings.

Routers stay thin — they parse/validate input via Pydantic and delegate to
``BountyService``. Domain errors become uniform JSON error bodies.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from ..deps import get_service
from ..models import (
    Bounty,
    BountyCreate,
    BountyFilters,
    BountyUpdate,
    PaginatedBounties,
    Pagination,
)
from ..services import BountyService

router = APIRouter(prefix="/bounties", tags=["bounties"])


def _filters(
    status_: str | None = Query(default=None, alias="status"),
    skill: str | None = Query(default=None),
    sponsor: str | None = Query(default=None),
    min_reward_usd: float | None = Query(default=None, ge=0),
    max_reward_usd: float | None = Query(default=None, ge=0),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc"),
) -> BountyFilters:
    # A model-level ValidationError raised inside a dependency is not
    # converted to a 422 by FastAPI, so translate it explicitly.
    try:
        return BountyFilters(
            status=status_,
            skill=skill,
            sponsor=sponsor,
            min_reward_usd=min_reward_usd,
            max_reward_usd=max_reward_usd,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
    except ValidationError as exc:
        raise RequestValidationError(errors=exc.errors()) from exc


def _pagination(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Pagination:
    return Pagination(page=page, page_size=page_size)


@router.get("", response_model=PaginatedBounties, summary="List bounties")
def list_bounties(
    filters: BountyFilters = Depends(_filters),
    pagination: Pagination = Depends(_pagination),
    service: BountyService = Depends(get_service),
) -> PaginatedBounties:
    """List bounties with filtering, sorting, and pagination."""
    return service.list_bounties(filters, pagination)


@router.post(
    "",
    response_model=Bounty,
    status_code=status.HTTP_201_CREATED,
    summary="Create a bounty",
)
def create_bounty(payload: BountyCreate, service: BountyService = Depends(get_service)) -> Bounty:
    """Create a bounty. Validation failures return 422 with field details."""
    return service.create_bounty(payload)


@router.get("/{bounty_id}", response_model=Bounty, summary="Get one bounty")
def get_bounty(bounty_id: int, service: BountyService = Depends(get_service)) -> Bounty:
    """Fetch a single bounty by id; 404 when it does not exist."""
    return service.get_bounty(bounty_id)


@router.patch("/{bounty_id}", response_model=Bounty, summary="Update a bounty")
def update_bounty(
    bounty_id: int, payload: BountyUpdate, service: BountyService = Depends(get_service)
) -> Bounty:
    """Partially update a bounty; 404 when it does not exist."""
    return service.update_bounty(bounty_id, payload)


@router.delete("/{bounty_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a bounty")
def delete_bounty(bounty_id: int, service: BountyService = Depends(get_service)) -> None:
    """Delete a bounty; 404 when it does not exist."""
    service.delete_bounty(bounty_id)
