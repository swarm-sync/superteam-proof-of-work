"""Unit tests for the service layer — business rules without HTTP."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from bounty_api.models import (
    BountyCreate,
    BountyFilters,
    BountySkill,
    BountyStatus,
    BountyUpdate,
    Pagination,
)
from bounty_api.services import BountyService
from bounty_api.store import BountyNotFoundError, InMemoryBountyRepository

FUTURE = date.today() + timedelta(days=30)


def _payload(**overrides: object) -> BountyCreate:
    base: dict[str, object] = {
        "title": "Test bounty",
        "description": "A sufficiently long description for validation.",
        "sponsor": "Acme",
        "reward_usd": 500,
        "deadline": FUTURE,
        "skills": [BountySkill.DEVELOPMENT],
    }
    base.update(overrides)
    return BountyCreate(**base)  # type: ignore[arg-type]


@pytest.fixture()
def service() -> BountyService:
    repo = InMemoryBountyRepository(
        seed=[
            _payload(title="Cheap dev task", reward_usd=100),
            _payload(
                title="Expensive design task",
                reward_usd=5000,
                skills=[BountySkill.DESIGN],
                status=BountyStatus.CLOSED,
            ),
            _payload(title="Mid research task", reward_usd=900, skills=[BountySkill.RESEARCH]),
        ]
    )
    return BountyService(repo)


def test_filter_by_status_and_reward_range(service: BountyService) -> None:
    result = service.list_bounties(
        BountyFilters(status=BountyStatus.OPEN, min_reward_usd=200, max_reward_usd=1000),
        Pagination(),
    )
    assert result.total == 1
    assert result.items[0].title == "Mid research task"


def test_sort_by_deadline_desc_is_default_order(service: BountyService) -> None:
    result = service.list_bounties(BountyFilters(), Pagination())
    assert result.total == 3


def test_pagination_beyond_last_page_returns_empty(service: BountyService) -> None:
    result = service.list_bounties(BountyFilters(), Pagination(page=99, page_size=10))
    assert result.items == []
    assert result.total == 3
    assert result.pages == 1


def test_get_missing_raises(service: BountyService) -> None:
    with pytest.raises(BountyNotFoundError):
        service.get_bounty(12345)


def test_delete_missing_raises(service: BountyService) -> None:
    with pytest.raises(BountyNotFoundError):
        service.delete_bounty(12345)


def test_update_preserves_unset_fields(service: BountyService) -> None:
    updated = service.update_bounty(1, BountyUpdate(reward_usd=250))
    assert updated.reward_usd == 250
    assert updated.title == "Cheap dev task"
    assert updated.sponsor == "Acme"


def test_create_assigns_sequential_ids(service: BountyService) -> None:
    created = service.create_bounty(_payload(title="Fourth task"))
    assert created.id == 4
    assert service.count() == 4
