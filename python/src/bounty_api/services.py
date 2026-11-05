"""Service layer: pure business logic over a ``BountyRepository``.

Filtering, sorting, and pagination live here — not in the router — so the
rules are testable without HTTP and reusable by any transport (CLI, worker).
"""

from __future__ import annotations

from .models import (
    Bounty,
    BountyCreate,
    BountyFilters,
    BountyUpdate,
    PaginatedBounties,
    Pagination,
)
from .store import BountyNotFoundError, BountyRepository


class BountyService:
    """Application logic for bounty listings."""

    def __init__(self, repository: BountyRepository) -> None:
        self._repo = repository

    def list_bounties(self, filters: BountyFilters, pagination: Pagination) -> PaginatedBounties:
        items = self._repo.list_all()
        items = [b for b in items if self._matches(b, filters)]
        items.sort(
            key=lambda b: getattr(b, filters.sort_by),
            reverse=filters.sort_dir == "desc",
        )
        total = len(items)
        page_items = items[pagination.offset : pagination.offset + pagination.page_size]
        pages = (total + pagination.page_size - 1) // pagination.page_size
        return PaginatedBounties(
            items=page_items,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=pages,
        )

    @staticmethod
    def _matches(bounty: Bounty, filters: BountyFilters) -> bool:
        if filters.status is not None and bounty.status != filters.status:
            return False
        if filters.skill is not None and filters.skill not in bounty.skills:
            return False
        if filters.sponsor is not None and filters.sponsor.lower() not in bounty.sponsor.lower():
            return False
        if filters.min_reward_usd is not None and bounty.reward_usd < filters.min_reward_usd:
            return False
        return filters.max_reward_usd is None or bounty.reward_usd <= filters.max_reward_usd

    def get_bounty(self, bounty_id: int) -> Bounty:
        bounty = self._repo.get(bounty_id)
        if bounty is None:
            raise BountyNotFoundError(f"bounty {bounty_id} not found")
        return bounty

    def create_bounty(self, payload: BountyCreate) -> Bounty:
        return self._repo.create(payload)

    def update_bounty(self, bounty_id: int, payload: BountyUpdate) -> Bounty:
        return self._repo.update(bounty_id, payload)

    def delete_bounty(self, bounty_id: int) -> None:
        if not self._repo.delete(bounty_id):
            raise BountyNotFoundError(f"bounty {bounty_id} not found")

    def count(self) -> int:
        return self._repo.count()
