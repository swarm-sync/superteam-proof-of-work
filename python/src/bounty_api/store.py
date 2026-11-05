"""Repository layer.

The ``BountyRepository`` protocol is the seam between the service layer and
persistence: the in-memory implementation below is thread-safe and is what
tests and the demo run use; a Postgres implementation can replace it without
changing any service or router code (dependency inversion / SOLID-D).
"""

from __future__ import annotations

import threading
from datetime import UTC, datetime
from typing import Protocol

from .models import Bounty, BountyCreate, BountyUpdate


class BountyNotFoundError(LookupError):
    """Raised when a bounty id does not exist."""


class BountyRepository(Protocol):
    """Persistence contract for bounties."""

    def list_all(self) -> list[Bounty]: ...

    def get(self, bounty_id: int) -> Bounty | None: ...

    def create(self, payload: BountyCreate) -> Bounty: ...

    def update(self, bounty_id: int, payload: BountyUpdate) -> Bounty: ...

    def delete(self, bounty_id: int) -> bool: ...

    def count(self) -> int: ...


class InMemoryBountyRepository:
    """Thread-safe in-memory store. Suitable for tests, demos, and local dev.

    Not durable: data lives only for the process lifetime. Production
    deployments should inject a database-backed ``BountyRepository``.
    """

    def __init__(self, seed: list[BountyCreate] | None = None) -> None:
        self._lock = threading.RLock()
        self._items: dict[int, Bounty] = {}
        self._next_id = 1
        for item in seed or []:
            self.create(item)

    @staticmethod
    def _now() -> datetime:
        return datetime.now(UTC)

    def list_all(self) -> list[Bounty]:
        with self._lock:
            return list(self._items.values())

    def get(self, bounty_id: int) -> Bounty | None:
        with self._lock:
            return self._items.get(bounty_id)

    def create(self, payload: BountyCreate) -> Bounty:
        with self._lock:
            now = self._now()
            bounty = Bounty(
                **payload.model_dump(), id=self._next_id, created_at=now, updated_at=now
            )
            self._items[self._next_id] = bounty
            self._next_id += 1
            return bounty

    def update(self, bounty_id: int, payload: BountyUpdate) -> Bounty:
        with self._lock:
            existing = self._items.get(bounty_id)
            if existing is None:
                raise BountyNotFoundError(f"bounty {bounty_id} not found")
            merged = existing.model_dump()
            merged.update(payload.model_dump(exclude_unset=True))
            merged["updated_at"] = self._now()
            updated = Bounty(**merged)
            self._items[bounty_id] = updated
            return updated

    def delete(self, bounty_id: int) -> bool:
        with self._lock:
            return self._items.pop(bounty_id, None) is not None

    def count(self) -> int:
        with self._lock:
            return len(self._items)
