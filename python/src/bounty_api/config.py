"""Runtime configuration, read from the environment with safe defaults.

No secrets are read here and none are needed: the service is stateless
apart from its (in-memory) store. ``BOUNTY_API_SEED`` toggles the demo
dataset; ``BOUNTY_API_PORT`` / ``BOUNTY_API_HOST`` control the server bind.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Immutable application settings."""

    host: str = "127.0.0.1"
    port: int = 8000
    seed_demo_data: bool = True
    version: str = "0.1.0"

    @classmethod
    def from_env(cls) -> Settings:
        return cls(
            host=os.environ.get("BOUNTY_API_HOST", "127.0.0.1"),
            port=int(os.environ.get("BOUNTY_API_PORT", "8000")),
            seed_demo_data=os.environ.get("BOUNTY_API_SEED", "true").lower()
            in {"1", "true", "yes"},
        )
