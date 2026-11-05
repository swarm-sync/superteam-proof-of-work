# Bounty Listings API

A production-grade **FastAPI** service for bounty listings — the shape of a
Superteam Earn board: sponsors post paid bounties, builders browse, filter,
and sort them.

## Why this subject

I chose a bounty-listings API over a generic data-processing CLI because it
is the closest thing to the real product surface of the Solana ecosystem job
board this profile is for: it demonstrates HTTP API design, request
validation, pagination/filtering, and layered architecture — the skills a
sponsor hiring for bounty-platform work actually needs to see. A CLI would
have shown scripting; this shows a service.

## What it demonstrates

- **Layered, SOLID architecture** — routers (HTTP only) → service layer
  (business rules) → repository protocol (persistence seam). The in-memory
  store can be swapped for Postgres without touching the service or API.
- **Dependency injection** — the repository and service are wired in an
  application factory (`create_app`); each test builds a fresh app with a
  fresh store, so tests are fully isolated.
- **Pydantic v2 validation as the security boundary** — reward bounds,
  future deadlines, duplicate-skill rejection, whitespace stripping, sane
  filter ranges, restricted sort fields. Invalid input returns 422 with
  field-level detail; unknown ids return a uniform 404 error body.
- **Filtering, sorting, pagination** — by status, skill, sponsor
  (case-insensitive substring), reward range; sort by `created_at` /
  `reward_usd` / `deadline`; page size capped at 100.
- **Thread-safe in-memory store** (`threading.RLock`) with seed demo data.
- **Testing** — 34 tests (API end-to-end, service unit, model validation),
  96.7% coverage, enforced minimum 90% in `pyproject.toml`.
- **Modern tooling** — `pyproject.toml` packaging (hatchling), `ruff`
  lint + format, `pytest-cov`, console script entry point.

## Project layout

```
pyproject.toml
src/bounty_api/
  __init__.py      # public exports, __version__
  __main__.py      # `python -m bounty_api` entry point
  app.py           # FastAPI application factory + error handlers + /health
  config.py        # env-based settings (no secrets needed)
  deps.py          # dependency-injection seam
  models.py        # Pydantic schemas: Bounty, filters, pagination, errors
  routers/
    bounties.py    # CRUD endpoints (thin: validate, delegate)
  seed.py          # demo dataset (5 realistic bounties)
  services.py      # filtering / sorting / pagination business logic
  store.py         # BountyRepository protocol + thread-safe in-memory store
tests/
  conftest.py          # fresh-app fixtures (seeded + empty)
  test_bounties_api.py # HTTP end-to-end tests
  test_services.py     # service-layer unit tests
  test_models.py       # validation-rule unit tests
```

## Install

Requires Python 3.11+.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run

```bash
bounty-api
# or: python -m bounty_api
# or: uvicorn bounty_api.app:app --reload
```

The server binds `127.0.0.1:8000` by default. Override with
`BOUNTY_API_HOST` / `BOUNTY_API_PORT`; set `BOUNTY_API_SEED=false` to start
with an empty store.

Interactive docs: http://127.0.0.1:8000/docs

## Try it

```bash
# Health + seed count
curl -s http://127.0.0.1:8000/health

# List, filtered + sorted + paginated
curl -s "http://127.0.0.1:8000/bounties?skill=development&sort_by=reward_usd&sort_dir=desc&page_size=2"

# Create a bounty
curl -s -X POST http://127.0.0.1:8000/bounties \
  -H "Content-Type: application/json" \
  -d '{"title":"Build a Solana escrow program","description":"Anchor program with escrow, dispute resolution, and tests.","sponsor":"Solana Foundation","reward_usd":3000,"deadline":"2027-01-15","skills":["development"]}'

# 404 shape
curl -s http://127.0.0.1:8000/bounties/999
```

## Test

```bash
pytest -q --cov=bounty_api --cov-report=term-missing
ruff check src tests
ruff format --check src tests
```

## Notes / limits

- The default store is **in-memory**: data lives only for the process
  lifetime. It is a deliberate demo/test choice, not a production database —
  the repository protocol is the swap point for Postgres.
- No authentication is included by design; this is a listings service, and
  auth would be a separate, explicitly scoped layer.
