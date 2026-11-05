# Bounty API — Plain PHP 8, no framework

A small REST API for bounty listings (the same domain as the Angular
Bounty Tracker in `../angular/`), built as a Superteam Earn proof-of-work
artifact. Zero dependencies: no framework, no Composer packages — just
PHP 8.1+ with the `sqlite3` extension and the built-in web server.

## What it demonstrates

- **Hand-rolled router** — exact + `{param}` segment matching, per-method
  dispatch, 404 for unknown routes, 405 for a known path with a wrong method
- **REST + correct HTTP codes** — 200 list/show/update, 201 create,
  204 delete, 400 validation, 404 not found, 405 method not allowed
- **Input validation** — title/sponsor/description rules, reward > 0,
  currency allow-list, future-date deadline (including impossible dates),
  per-field JSON error details
- **Filtering + pagination** — `?status=`, `?skill=`, `?q=` (title/sponsor
  search), `?page=` / `?per_page=` (max 100) with a `meta` block
- **SQLite via PDO** — prepared statements throughout, schema created on
  first use, indexes on `status` and `created_at`
- **Testable design** — the router returns `[status, payload]` instead of
  echoing, so the test suite runs the whole API in-process against a
  throwaway database; the live server uses the exact same dispatch
- **Plain-PHP test suite** — 29 assertions, no PHPUnit required
  (`php tests/run_tests.php`)

## Run it

Requires PHP 8.1+ with `pdo_sqlite` (check with `php -m | grep -i sqlite`).

```bash
cd php
php bin/seed.php                    # seed 6 bounties (idempotent)
php -S localhost:8080 -t public     # built-in server
```

Database file: `data/bounties.sqlite` (created automatically; override with
the `BOUNTY_DB_PATH` environment variable).

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + bounty count |
| GET | `/api/bounties` | List; `?status=&skill=&q=&page=&per_page=` |
| GET | `/api/bounties/{id}` | One bounty |
| POST | `/api/bounties` | Create (201) |
| PATCH | `/api/bounties/{id}` | Partial update |
| DELETE | `/api/bounties/{id}` | Delete (204, no body) |

Create example:

```bash
curl -X POST localhost:8080/api/bounties \
  -H 'Content-Type: application/json' \
  -d '{"title":"Build a staking dashboard","sponsor":"Solana Foundation",
       "description":"A read-only dashboard showing validator APY and stake distribution.",
       "reward_amount":2500,"reward_currency":"USDC",
       "skills":["React","Solana"],"deadline":"2026-12-15"}'
```

Error shape (all errors):

```json
{"error": {"code": "validation_error", "message": "Validation failed.",
           "details": {"title": "Title needs at least 5 characters."}}}
```

## Test

```bash
php tests/run_tests.php   # 29 assertions, exit 0 when all pass
```

## Project layout

```
public/index.php            # front controller: parses request, dispatches, renders JSON
src/
  bootstrap.php             # PSR-4-lite autoloader (no Composer)
  App.php                   # route wiring (shared by server + tests)
  Router.php                # method/pattern router
  BountyController.php      # endpoint handlers
  BountyRepository.php      # PDO/SQLite persistence
  Database.php              # connection + schema
  Validator.php             # payload + pagination validation
  ApiException.php          # typed errors with HTTP status
  Response.php              # JSON success/error rendering
bin/seed.php                # idempotent seed data (6 bounties)
tests/run_tests.php         # plain-PHP test suite
data/                       # SQLite file lives here (git-ignored)
```
