# Superteam Earn — Proof of Work submission (TypeScript)

**Suggested title (74 chars):**
Idempotent webhook processor: retries, backoff & circuit breaker (TypeScript)

**Description:**
Typed, fault-tolerant webhook ingestion service in strict TypeScript (zero
`any`): exactly-once processing via a first-claim-wins idempotency store,
a job queue with exponential backoff + jitter and a dead-letter queue, and a
circuit breaker that fails fast instead of hammering a sick downstream.
Nine `node:test` tests prove idempotency (including concurrent duplicates),
retry-to-success, dead-lettering, validation, and breaker behavior; a live
HTTP demo shows the same flows end to end. No runtime dependencies.

**Skills tag:** Typescript

**What it demonstrates:** reliability engineering — data integrity,
fault tolerance, observability (structured JSON logging), and strict typing.

Public link: https://github.com/swarm-sync/superteam-proof-of-work/tree/main/typescript
