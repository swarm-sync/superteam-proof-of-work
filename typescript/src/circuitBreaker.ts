/**
 * Circuit breaker (closed -> open -> half-open -> closed).
 *
 * Closed: calls pass through. After `failureThreshold` consecutive failures
 * the breaker opens and calls fail fast for `resetTimeoutMs` instead of
 * hammering a sick downstream. After the timeout, one probe call is allowed
 * (half-open); success closes the breaker, failure re-opens it.
 */

export type BreakerState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

export class CircuitBreakerOpenError extends Error {
  constructor() {
    super("circuit breaker is open");
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  #state: BreakerState = "closed";
  #consecutiveFailures = 0;
  #openedAt = 0;
  readonly #failureThreshold: number;
  readonly #resetTimeoutMs: number;
  #onOpen: (() => void) | undefined;

  constructor(options: CircuitBreakerOptions = {}, onOpen?: () => void) {
    this.#failureThreshold = options.failureThreshold ?? 5;
    this.#resetTimeoutMs = options.resetTimeoutMs ?? 10_000;
    this.#onOpen = onOpen;
  }

  get state(): BreakerState {
    if (this.#state === "open" && Date.now() - this.#openedAt >= this.#resetTimeoutMs) {
      this.#state = "half-open";
    }
    return this.#state;
  }

  /**
   * Run `fn` guarded by the breaker. Throws CircuitBreakerOpenError while
   * open instead of calling `fn` at all.
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      throw new CircuitBreakerOpenError();
    }
    try {
      const result = await fn();
      this.#onSuccess();
      return result;
    } catch (error) {
      this.#onFailure();
      throw error;
    }
  }

  #onSuccess(): void {
    this.#consecutiveFailures = 0;
    this.#state = "closed";
  }

  #onFailure(): void {
    this.#consecutiveFailures += 1;
    if (this.#consecutiveFailures >= this.#failureThreshold) {
      this.#state = "open";
      this.#openedAt = Date.now();
      this.#onOpen?.();
    }
  }
}
