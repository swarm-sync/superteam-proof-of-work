import assert from "node:assert/strict";
import test from "node:test";
import { CircuitBreaker, CircuitBreakerOpenError } from "../src/circuitBreaker.js";
import { IdempotencyStore } from "../src/idempotency.js";
import { WebhookProcessor } from "../src/processor.js";
import { computeDelayMs } from "../src/retry.js";
import type { Job, WebhookEvent } from "../src/types.js";

const event = (id: string, type = "payment.succeeded"): WebhookEvent => ({
  id,
  type,
  createdAt: new Date().toISOString(),
  data: { amount: 1000, currency: "USD" },
});

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor(
  cond: () => boolean,
  timeoutMs = 5_000,
  stepMs = 25,
): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error("timed out waiting for condition");
    await sleep(stepMs);
  }
}

test("idempotency: the same delivery twice runs the handler exactly once", async () => {
  let calls = 0;
  const p = new WebhookProcessor(async () => {
    calls += 1;
    return { ok: true };
  });
  try {
    const first = p.receive(event("evt_1"));
    const second = p.receive(event("evt_1"));
    assert.equal(first.outcome, "accepted");
    assert.equal(second.outcome, "duplicate");
    await waitFor(() => p.metrics().succeeded === 1);
    assert.equal(calls, 1);
    // A third delivery after completion replays the recorded outcome.
    const third = p.receive(event("evt_1"));
    assert.equal(third.outcome, "duplicate");
    assert.equal(third.status, "succeeded");
    assert.equal(calls, 1);
  } finally {
    p.stop();
  }
});

test("idempotency: concurrent duplicate deliveries are de-duplicated", async () => {
  let calls = 0;
  const p = new WebhookProcessor(async () => {
    await sleep(50);
    calls += 1;
    return { ok: true };
  });
  try {
    const results = [event("evt_race"), event("evt_race"), event("evt_race")].map((e) => p.receive(e));
    assert.equal(results.filter((r) => r.outcome === "accepted").length, 1);
    assert.equal(results.filter((r) => r.outcome === "duplicate").length, 2);
    await waitFor(() => p.metrics().succeeded === 1);
    assert.equal(calls, 1);
  } finally {
    p.stop();
  }
});

test("retry: a handler that fails twice then succeeds is retried to success", async () => {
  let calls = 0;
  const p = new WebhookProcessor(
    async () => {
      calls += 1;
      return calls < 3 ? { ok: false, reason: "downstream 503" } : { ok: true };
    },
    { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 50 },
  );
  try {
    p.receive(event("evt_retry"));
    await waitFor(() => p.metrics().succeeded === 1);
    assert.equal(calls, 3);
  } finally {
    p.stop();
  }
});

test("dead letter: a permanently failing handler exhausts attempts and is dead-lettered", async () => {
  const p = new WebhookProcessor(async () => ({ ok: false, reason: "always down" }), {
    maxAttempts: 3,
    baseDelayMs: 5,
    maxDelayMs: 10,
  });
  try {
    p.receive(event("evt_dead"));
    await waitFor(() => p.deadLetter().length === 1);
    const dead = p.deadLetter()[0] as Job;
    assert.equal(dead.attempts, 3);
    assert.equal(dead.status, "dead");
    assert.equal(dead.lastError, "always down");
    assert.equal(p.metrics().deadLettered, 1);
    // Re-delivery after terminal failure replays "failed" without re-running.
    const replay = p.receive(event("evt_dead"));
    assert.equal(replay.outcome, "duplicate");
    if (replay.outcome === "duplicate") assert.equal(replay.status, "failed");
  } finally {
    p.stop();
  }
});

test("validation: malformed events are rejected, never queued or retried", async () => {
  let calls = 0;
  const p = new WebhookProcessor(async () => {
    calls += 1;
    return { ok: true };
  });
  try {
    assert.equal(p.receive({ id: "x" }).outcome, "rejected");
    assert.equal(p.receive(null).outcome, "rejected");
    assert.equal(p.receive({ id: "x", type: "t", createdAt: "not-a-date", data: {} }).outcome, "rejected");
    assert.equal(p.receive("garbage").outcome, "rejected");
    await sleep(100);
    assert.equal(calls, 0);
    assert.equal(p.metrics().received, 4);
  } finally {
    p.stop();
  }
});

test("retry policy: backoff is bounded by the cap", () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    assert.ok(computeDelayMs(attempt, { baseDelayMs: 100, maxDelayMs: 1_000 }) <= 1_000);
  }
  assert.ok(computeDelayMs(0, { baseDelayMs: 100, maxDelayMs: 1_000 }) >= 0);
});

test("circuit breaker: opens after the failure threshold and fails fast", async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60 });
  const boom = async (): Promise<never> => {
    throw new Error("down");
  };
  await assert.rejects(() => breaker.call(boom), /down/);
  assert.equal(breaker.state, "closed");
  await assert.rejects(() => breaker.call(boom), /down/);
  assert.equal(breaker.state, "open");
  await assert.rejects(() => breaker.call(boom), CircuitBreakerOpenError);
  // After the reset window, a probe is allowed and success closes it.
  await sleep(80);
  assert.equal(breaker.state, "half-open");
  assert.equal(await breaker.call(async () => "ok"), "ok");
  assert.equal(breaker.state, "closed");
});

test("circuit breaker: processor stops hammering a sick downstream", async () => {
  let calls = 0;
  const p = new WebhookProcessor(async () => {
    calls += 1;
    return { ok: false, reason: "sick" };
  }, { maxAttempts: 10, baseDelayMs: 5, maxDelayMs: 10, failureThreshold: 2, resetTimeoutMs: 1_000 });
  try {
    p.receive(event("evt_breaker"));
    await sleep(400);
    // Exactly 2 calls: the first two failures trip the breaker, and every
    // later attempt inside the 1s reset window fails fast without calling
    // the handler at all. Without the breaker this would be ~10 calls.
    assert.equal(calls, 2);
    assert.equal(p.metrics().breakerOpened, 1);
  } finally {
    p.stop();
  }
});

test("idempotency store: first claim wins, outcomes are recorded once", () => {
  const store = new IdempotencyStore();
  const job = {
    id: "j1",
    idempotencyKey: "k1",
    event: event("k1"),
    attempts: 0,
    maxAttempts: 3,
    status: "pending",
    nextAttemptAt: 0,
    lastError: null,
    createdAt: 0,
    updatedAt: 0,
  } satisfies Job;
  assert.equal(store.claim("k1", job), true);
  assert.equal(store.claim("k1", job), false);
  store.recordOutcome("k1", { status: "succeeded", recordedAt: Date.now() });
  assert.equal(store.getOutcome("k1")?.status, "succeeded");
  assert.equal(store.claim("k1", job), false);
});
