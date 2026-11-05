/**
 * Webhook processor: the composition point.
 *
 * Flow for each delivery:
 *   1. Validate the event shape (fail fast, 400-class, no retry).
 *   2. Claim the idempotency key. A duplicate delivery returns the recorded
 *      outcome without re-running the handler — the core guarantee.
 *   3. Enqueue a job; the queue runs the handler behind the circuit breaker
 *      with exponential-backoff retries; exhaustion dead-letters the job.
 *
 * Validation errors are never retried: retrying a malformed payload cannot
 * succeed, it only burns downstream capacity.
 */
import { randomUUID } from "node:crypto";
import { CircuitBreaker, CircuitBreakerOpenError } from "./circuitBreaker.js";
import { IdempotencyStore } from "./idempotency.js";
import { Logger } from "./logger.js";
import { JobQueue } from "./queue.js";
import { computeDelayMs, maxAttempts } from "./retry.js";
import type {
  EventHandler,
  Job,
  ProcessorMetrics,
  WebhookEvent,
} from "./types.js";

export type ReceiveResult =
  | { outcome: "accepted"; jobId: string }
  | { outcome: "duplicate"; jobId: string | null; status: "succeeded" | "failed" | "in-flight" }
  | { outcome: "rejected"; reason: string };

export interface ProcessorOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  failureThreshold?: number;
  resetTimeoutMs?: number;
  concurrency?: number;
}

export class WebhookProcessor {
  readonly #store = new IdempotencyStore();
  readonly #queue: JobQueue;
  readonly #breaker: CircuitBreaker;
  readonly #handler: EventHandler;
  readonly #logger = new Logger("webhook-processor");
  readonly #options: Required<ProcessorOptions>;
  readonly #metrics: ProcessorMetrics = {
    received: 0,
    duplicates: 0,
    succeeded: 0,
    failed: 0,
    deadLettered: 0,
    breakerOpened: 0,
  };

  constructor(handler: EventHandler, options: ProcessorOptions = {}) {
    this.#handler = handler;
    this.#options = {
      maxAttempts: options.maxAttempts ?? 5,
      baseDelayMs: options.baseDelayMs ?? 200,
      maxDelayMs: options.maxDelayMs ?? 30_000,
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeoutMs: options.resetTimeoutMs ?? 10_000,
      concurrency: options.concurrency ?? 2,
    };
    this.#breaker = new CircuitBreaker(
      {
        failureThreshold: this.#options.failureThreshold,
        resetTimeoutMs: this.#options.resetTimeoutMs,
      },
      () => {
        this.#metrics.breakerOpened += 1;
        this.#logger.warn("circuit breaker opened", {});
      },
    );
    this.#queue = new JobQueue(this.#logger, {
      concurrency: this.#options.concurrency,
      onDeadLetter: (job) => {
        this.#metrics.deadLettered += 1;
        // Terminal failure only: now the outcome is final and safe to replay.
        this.#store.recordOutcome(job.idempotencyKey, { status: "failed", recordedAt: Date.now() });
      },
    });
    this.#queue.start((job) => this.#runAttempt(job));
  }

  /** Accept one webhook delivery. Safe to call concurrently and repeatedly. */
  receive(event: unknown): ReceiveResult {
    this.#metrics.received += 1;
    const parsed = parseEvent(event);
    if (parsed === null) {
      this.#logger.warn("rejected malformed event", {});
      return { outcome: "rejected", reason: "event must have string id/type/createdAt and object data" };
    }

    const key = parsed.id;
    const recorded = this.#store.getOutcome(key);
    if (recorded !== undefined) {
      this.#metrics.duplicates += 1;
      this.#logger.info("duplicate delivery, replaying outcome", { key, status: recorded.status });
      return { outcome: "duplicate", jobId: null, status: recorded.status };
    }
    const inFlight = this.#store.getClaim(key);
    if (inFlight !== undefined) {
      this.#metrics.duplicates += 1;
      return { outcome: "duplicate", jobId: inFlight.id, status: "in-flight" };
    }

    const job: Job = {
      id: randomUUID(),
      idempotencyKey: key,
      event: parsed,
      attempts: 0,
      maxAttempts: maxAttempts({ maxAttempts: this.#options.maxAttempts }),
      status: "pending",
      nextAttemptAt: Date.now(),
      lastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (!this.#store.claim(key, job)) {
      // Lost a race with a concurrent identical delivery.
      this.#metrics.duplicates += 1;
      return { outcome: "duplicate", jobId: null, status: "in-flight" };
    }
    this.#queue.enqueue(job);
    this.#logger.info("event accepted", { key, jobId: job.id, type: parsed.type });
    return { outcome: "accepted", jobId: job.id };
  }

  getJob(jobId: string): Job | undefined {
    return this.#queue.getJob(jobId);
  }

  listJobs(): Job[] {
    return this.#queue.listJobs();
  }

  deadLetter(): Job[] {
    return this.#queue.deadLetter();
  }

  metrics(): ProcessorMetrics {
    return { ...this.#metrics };
  }

  breakerState(): string {
    return this.#breaker.state;
  }

  stop(): void {
    this.#queue.stop();
  }

  async #runAttempt(job: Job): Promise<void> {
    job.attempts += 1;
    try {
      // Throw inside the breaker call so a handler-reported failure counts
      // toward the breaker's failure threshold exactly like an exception.
      await this.#breaker.call(async () => {
        const result = await this.#handler(job.event);
        if (!result.ok) {
          throw new Error(result.reason ?? "handler reported failure");
        }
      });
      this.#store.recordOutcome(job.idempotencyKey, { status: "succeeded", recordedAt: Date.now() });
      this.#queue.complete(job);
      this.#metrics.succeeded += 1;
      this.#logger.info("event processed", { key: job.idempotencyKey, attempts: job.attempts });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      if (error instanceof CircuitBreakerOpenError) {
        // Breaker-open is not a handler failure: re-queue without burning an
        // attempt budget slot beyond the one already counted, and wait out
        // the reset window before the next try.
        job.attempts -= 1;
        this.#queue.fail(job, message, this.#options.resetTimeoutMs);
        return;
      }
      this.#metrics.failed += 1;
      // No outcome recorded yet: the job is still retrying, and the claim
      // stays live so duplicates report "in-flight" instead of a stale fail.
      const delay = computeDelayMs(job.attempts, {
        baseDelayMs: this.#options.baseDelayMs,
        maxDelayMs: this.#options.maxDelayMs,
      });
      this.#queue.fail(job, message, delay);
    }
  }
}

/** Narrow `unknown` into a WebhookEvent, or null when the shape is wrong. */
export function parseEvent(value: unknown): WebhookEvent | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v["id"] !== "string" || v["id"] === "") return null;
  if (typeof v["type"] !== "string" || v["type"] === "") return null;
  if (typeof v["createdAt"] !== "string" || Number.isNaN(Date.parse(v["createdAt"]))) return null;
  if (typeof v["data"] !== "object" || v["data"] === null || Array.isArray(v["data"])) return null;
  return {
    id: v["id"],
    type: v["type"],
    createdAt: v["createdAt"],
    data: v["data"] as WebhookEvent["data"],
  };
}
