/**
 * Idempotency store.
 *
 * Guarantees: for a given key, the first `claim()` wins; later callers see
 * the recorded outcome instead of re-running the side effect. Entries expire
 * after a TTL so the store stays bounded (production: back this with Redis
 * SET key value NX EX ttl / a DB unique constraint — same contract).
 */
import type { Job } from "./types.js";

export interface Outcome {
  status: "succeeded" | "failed";
  recordedAt: number;
}

export class IdempotencyStore {
  readonly #claims = new Map<string, Job>();
  readonly #outcomes = new Map<string, Outcome>();
  readonly #ttlMs: number;

  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    this.#ttlMs = ttlMs;
  }

  /**
   * Atomically claim a key for `job`. Returns `true` when this caller owns
   * the work; `false` when the key was already claimed (duplicate delivery).
   */
  claim(key: string, job: Job): boolean {
    this.#sweep();
    if (this.#claims.has(key) || this.#outcomes.has(key)) {
      return false;
    }
    this.#claims.set(key, job);
    return true;
  }

  recordOutcome(key: string, outcome: Outcome): void {
    this.#claims.delete(key);
    this.#outcomes.set(key, outcome);
  }

  getOutcome(key: string): Outcome | undefined {
    this.#sweep();
    return this.#outcomes.get(key);
  }

  getClaim(key: string): Job | undefined {
    return this.#claims.get(key);
  }

  has(key: string): boolean {
    return this.#claims.has(key) || this.#outcomes.has(key);
  }

  size(): number {
    return this.#claims.size + this.#outcomes.size;
  }

  #sweep(): void {
    const now = Date.now();
    for (const [key, outcome] of this.#outcomes) {
      if (now - outcome.recordedAt > this.#ttlMs) {
        this.#outcomes.delete(key);
      }
    }
  }
}
