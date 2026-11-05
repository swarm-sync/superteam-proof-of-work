"""Bounty-listings API: validated CRUD, filtering, pagination, sorting.

Domain model: a *bounty* is a paid task posted by a sponsor (the shape of a
Superteam Earn listing). The service layer owns all business rules; the
repository is an injectable protocol so the in-memory store can be swapped
for Postgres without touching the API layer.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator, model_validator


class BountyStatus(StrEnum):
    """Lifecycle of a bounty."""

    OPEN = "open"
    IN_REVIEW = "in_review"
    CLOSED = "closed"


class BountySkill(StrEnum):
    """Skill tags a bounty may require."""

    DEVELOPMENT = "development"
    DESIGN = "design"
    CONTENT = "content"
    MARKETING = "marketing"
    RESEARCH = "research"


class BountyBase(BaseModel):
    """Fields shared by create/update payloads."""

    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    sponsor: str = Field(min_length=2, max_length=80)
    reward_usd: float = Field(gt=0, le=1_000_000)
    deadline: date
    skills: list[BountySkill] = Field(default_factory=list, max_length=10)
    status: BountyStatus = BountyStatus.OPEN

    @field_validator("title", "description", "sponsor", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("deadline")
    @classmethod
    def _deadline_not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("deadline must be today or in the future")
        return value

    @field_validator("skills")
    @classmethod
    def _unique_skills(cls, value: list[BountySkill]) -> list[BountySkill]:
        if len(set(value)) != len(value):
            raise ValueError("skills must not contain duplicates")
        return value


class BountyCreate(BountyBase):
    """Payload for POST /bounties."""


class BountyUpdate(BaseModel):
    """Partial update; every field optional, same per-field rules as create."""

    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    sponsor: str | None = Field(default=None, min_length=2, max_length=80)
    reward_usd: float | None = Field(default=None, gt=0, le=1_000_000)
    deadline: date | None = None
    skills: list[BountySkill] | None = Field(default=None, max_length=10)
    status: BountyStatus | None = None

    @field_validator("title", "description", "sponsor", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("deadline")
    @classmethod
    def _deadline_not_in_past(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise ValueError("deadline must be today or in the future")
        return value

    @field_validator("skills")
    @classmethod
    def _unique_skills(cls, value: list[BountySkill] | None) -> list[BountySkill] | None:
        if value is not None and len(set(value)) != len(value):
            raise ValueError("skills must not contain duplicates")
        return value

    @model_validator(mode="after")
    def _at_least_one_field(self) -> BountyUpdate:
        if all(v is None for v in self.model_dump().values()):
            raise ValueError("at least one field must be provided")
        return self


class Bounty(BountyBase):
    """A stored bounty, as returned by the API."""

    id: int
    created_at: datetime
    updated_at: datetime


class BountyFilters(BaseModel):
    """Validated query-string filters for GET /bounties."""

    status: BountyStatus | None = None
    skill: BountySkill | None = None
    sponsor: str | None = Field(default=None, min_length=1, max_length=80)
    min_reward_usd: float | None = Field(default=None, ge=0)
    max_reward_usd: float | None = Field(default=None, ge=0)
    sort_by: str = Field(default="created_at", pattern="^(created_at|reward_usd|deadline)$")
    sort_dir: str = Field(default="desc", pattern="^(asc|desc)$")

    @model_validator(mode="after")
    def _reward_range_sane(self) -> BountyFilters:
        lo, hi = self.min_reward_usd, self.max_reward_usd
        if lo is not None and hi is not None and lo > hi:
            raise ValueError("min_reward_usd must not exceed max_reward_usd")
        return self


class Pagination(BaseModel):
    """Validated pagination params; page is 1-based, size capped at 100."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedBounties(BaseModel):
    """Envelope for list responses."""

    items: list[Bounty]
    total: int
    page: int
    page_size: int
    pages: int


class ErrorBody(BaseModel):
    """Uniform error shape returned by every error handler."""

    detail: str
    code: str


class HealthResponse(BaseModel):
    """GET /health response."""

    status: str = "ok"
    version: str
    bounties: int
