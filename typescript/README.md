# Idempotent Webhook Processor — TypeScript

A typed, fault-tolerant webhook ingestion service. Providers (Stripe, GitHub,
Solana programs, payment gateways) retry deliveries; this service guarantees
each event's side effect runs **exactly once**, retries transient failures with
backoff, and stops hammering a sick downstream instead of amplifying an outage.

## What it demonstrates

- **Idempotency** — first-claim-wins key store: duplicate deliveries (including
  concurrent ones) replay the recorded outcome instead of re-running the
  handler. Outcomes are recorded only at terminal state (success or
  dead-letter), never mid-retry.
- **Job queue with retries** — bounded concurrency, exponential backoff with
  full jitter (no thundering-herd retries), dead-letter queue: nothing is
  silently dropped.
- **Circuit breaker** — closed → open → half-open → closed. Handler-reported
  failures count toward the threshold exactly like exceptions (a real bug this
  test suite caught during development). While open, attempts fail fast
  without touching the downstream.
- **Validation** — malformed events are rejected (400) and never queued or
  retried; retrying a payload that can never succeed only burns capacity.
- **Structured logging** — one JSON object per line (`ts`, `level`, `service`,
  `msg`, plus context fields), ready for any log aggregator.
- **Strict TypeScript** — `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals`; zero `any` in the codebase
  (verify with `grep -rn ": any" src test` — no matches).

## Layout

```
src/
  types.ts          domain types (WebhookEvent, Job, metrics)
  processor.ts      composition: validate → claim key → enqueue → run
  queue.ts          in-memory job queue, concurrency + dead-letter
  idempotency.ts    first-claim-wins key store with TTL
  circuitBreaker.ts closed/open/half-open breaker
  retry.ts          exponential backoff with full jitter
  logger.ts         structured JSON logger
  server.ts         HTTP API (Node built-in http, no framework)
  index.ts          entrypoint, graceful shutdown
test/
  processor.test.ts 9 tests (node:test, no test framework dependency)
```

The in-memory store/queue are explicitly the swappable layer: the README in
`processor.ts` and `queue.ts` documents the production backing (Redis
`SET NX EX` / a DB unique constraint, SQS or Postgres queue) behind the same
contract. The state machine and guarantees are the point, not the storage.

## Run it

```bash
npm install
npm test          # typecheck + build + 9 tests
npm start         # listens on :3000 (PORT env var overrides)
```

## Try it live

```bash
# Accept a delivery (202)
curl -X POST localhost:3000/webhooks -H 'content-type: application/json' \
  -d '{"id":"evt_1","type":"payment.succeeded","createdAt":"2026-11-05T18:00:00Z","data":{"amount":5000}}'

# Same delivery again → duplicate, handler NOT re-run (200)
curl -X POST localhost:3000/webhooks -H 'content-type: application/json' \
  -d '{"id":"evt_1","type":"payment.succeeded","createdAt":"2026-11-05T18:00:00Z","data":{"amount":5000}}'

# Flaky event: the demo handler fails twice, then succeeds — watch retries in the logs
curl -X POST localhost:3000/webhooks -H 'content-type: application/json' \
  -d '{"id":"evt_2","type":"payment.flaky","createdAt":"2026-11-05T18:00:00Z","data":{}}'

# Malformed → 400, never queued
curl -X POST localhost:3000/webhooks -H 'content-type: application/json' -d '{"id":"bad"}'

curl localhost:3000/metrics      # counters + breaker state
curl localhost:3000/dead-letter  # jobs that exhausted all attempts
curl localhost:3000/health
```

## Verified

- `npm test`: **9 passed, 0 failed** (Node v24.22.1, TypeScript 5.6.3),
  verified 2026-11-05.
- Live smoke test: accept → duplicate (`in-flight`) → flaky event retried
  twice then succeeded → malformed rejected with 400 → `/metrics` showed
  `received:4 duplicates:1 succeeded:2 failed:2 deadLettered:0 breaker:closed`.
- `npm run typecheck` clean under strict mode.

## Requirements

Node.js ≥ 20. No runtime dependencies — only `typescript` and `@types/node`
as dev dependencies. No accounts, keys, or network calls at runtime.
