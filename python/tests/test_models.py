"""Unit tests for Pydantic validation rules — the security boundary."""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from bounty_api.models import BountyCreate, BountyFilters, BountyUpdate

FUTURE = date.today() + timedelta(days=10)
PAST = date.today() - timedelta(days=1)


def _valid(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "title": "Valid title",
        "description": "A description long enough to pass validation.",
        "sponsor": "Acme",
        "reward_usd": 100,
        "deadline": FUTURE,
    }
    base.update(overrides)
    return base


def test_whitespace_is_stripped() -> None:
    bounty = BountyCreate(**_valid(title="  Padded title  "))
    assert bounty.title == "Padded title"


def test_past_deadline_rejected() -> None:
    with pytest.raises(ValidationError, match="deadline"):
        BountyCreate(**_valid(deadline=PAST))


def test_reward_bounds_enforced() -> None:
    with pytest.raises(ValidationError):
        BountyCreate(**_valid(reward_usd=0))
    with pytest.raises(ValidationError):
        BountyCreate(**_valid(reward_usd=1_000_001))
    assert BountyCreate(**_valid(reward_usd=1_000_000)).reward_usd == 1_000_000


def test_duplicate_skills_rejected() -> None:
    with pytest.raises(ValidationError, match="duplicates"):
        BountyCreate(**_valid(skills=["development", "development"]))


def test_update_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError, match="at least one field"):
        BountyUpdate()


def test_filter_reward_range_must_be_sane() -> None:
    with pytest.raises(ValidationError, match="min_reward_usd"):
        BountyFilters(min_reward_usd=500, max_reward_usd=100)


def test_filter_sort_fields_restricted() -> None:
    with pytest.raises(ValidationError):
        BountyFilters(sort_by="sponsor")
    with pytest.raises(ValidationError):
        BountyFilters(sort_dir="sideways")
