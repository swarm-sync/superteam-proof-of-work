# Bounty Listings API — Node.js (Fastify)

A production-grade REST API for bounty listings, modelled on Superteam Earn:
sponsors post bounties, builders apply. Real, runnable code — no stubs,
no mocks in the implementation path (tests use a real in-memory SQLite
database through the same repository layer as production).

## What it demonstrates

- **Framework choice — Fastify, not Express.** Schema-first validation is
  built in (Ajv, no extra validator to wire up), it is ~2× faster on JSON
  workloads, structured logging (Pino) and hooks ship by default, and its
  plugin system keeps auth / rate-limiting as isolated, testable units.
  Express would need express-validator + morgan + helmet + a JWT
  middleware to reach the same baseline — more surface, more drift.
- **JWT auth** (`@fastify/jwt`): register / login, scrypt password hashing
  (Node stdlib, constant-time compare), login errors that never reveal
  whether an email exists, passwords never logged or returned.
- **Input validation**: Fastify JSON Schemas are the single source of
  truth, mirrored in `openapi.yaml`. Invalid input → `422 VALIDATION_ERROR`
  with the failing fields.
- **Typed errors, correct HTTP codes**: `src/errors.js` — `BAD_REQUEST`
  400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT`
  409, `VALIDATION_ERROR` 422, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500.
  Every error body is `{ error: { code, message, details?, requestId } }`.
- **Rate limiting**: 100 req/min global, 10 req/min on auth routes
  (`@fastify/rate-limit`, per-route overrides).
- **Pagination / filtering / sorting**: `GET /bounties?status=&skill=&
  minReward=&maxReward=&search=&sort=&order=&page=&pageSize=` (pageSize
  capped at 50), with `{ data, meta: { page, pageSize, total, totalPages } }`.
- **Business rules in the service layer** (not the routes): only the
  sponsor may edit/delete a bounty or see its applications; you cannot
  apply to your own bounty, to a non-open bounty, or twice; `closed` /
  `cancelled` are terminal states.
- **Persistence**: SQLite via Node's built-in `node:sqlite` (no native
  add-on to compile). Clean repository layer — SQL lives only in
  `src/repositories/`; swapping in Postgres means changing that folder.
  Foreign keys on, indexes on the list filters, `UNIQUE(bounty_id,
  applicant_id)` enforces one application per builder.
- **Structured logging**: Pino JSON logs with a per-request UUID;
  `Authorization` headers and passwords are redacted.
- **Tests**: Node's built-in runner, 24 tests covering success, failure,
  and edge cases (see `test/api.test.js`).

## Layout

```
src/
  server.js            entry point (listen + graceful shutdown)
  app.js               Fastify factory (testable without a port)
  config.js            env-driven config, safe local defaults
  errors.js            typed AppError + factories
  auth.js              requireAuth pre-handler
  schemas.js           Fastify/Ajv JSON Schemas
  db.js                node:sqlite schema + idempotent seed (6 bounties)
  repositories/        SQL only here (users, bounties, applications)
  services/            business rules (auth, bounty)
  routes/              HTTP only — auth.js, bounties.js
test/api.test.js       24 tests, fresh in-memory DB per test file run
openapi.yaml           OpenAPI 3.0 contract (mirrors src/schemas.js)
```

## Install / run / test

Requires **Node.js ≥ 22.5** (for built-in `node:sqlite`) and npm.

```bash
npm install
npm test          # node --test test/api.test.js  — 24 tests, no port needed
npm start         # listens on http://127.0.0.1:3000
npm run dev       # same, with --watch for development
```

Optional environment (see `.env.example`):

```bash
PORT=3000 HOST=127.0.0.1 JWT_SECRET=<long-random-secret> DB_PATH=./data/bounties.sqlite
```

On first start the database is created and seeded with 6 bounties and a
demo sponsor (`demo@sponsor.example` / `demo-password-123` — demo only).

## Smoke test (server running)

```bash
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3000/bounties?status=open\&pageSize=2

# register, then create a bounty (replace $TOKEN with the returned token)
curl -s -X POST http://127.0.0.1:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password-123","name":"Alice"}'
curl -s -X POST http://127.0.0.1:3000/bounties \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Build a Solana dashboard","description":"A real dashboard with live validator data and tests included.","skill":"Javascript","rewardUsd":1500}'
```

## Verification (run 2026-11-05)

- `npm install` — clean install, 3 production deps (fastify,
  @fastify/jwt, @fastify/rate-limit). (`npm audit` could not run here —
  the registry returned a policy error — so no vulnerability claim is made.)
- `npm test` — 24/24 tests pass.
- Live smoke test with curl against the running server — health, list,
  register, create, and an unauthenticated 401 all verified (see the
  build report / SUBMISSION notes for exact outputs).

## Notes / limits

- Single-process SQLite is the right call at this scale; under real
  concurrent-write load the next step is Postgres + a connection pool.
- No refresh-token flow yet — access tokens expire in 24h by default;
  that is a deliberate, documented gap, not an oversight.
- No CORS configured: this is an API service, not a browser app; add
  `@fastify/cors` with an explicit allow-list before serving a frontend.
