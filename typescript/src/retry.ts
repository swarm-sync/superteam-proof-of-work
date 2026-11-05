/**
 * Retry policy: exponential backoff with full jitter.
 *
 * delay(attempt) = min(cap, base * 2^attempt) with a uniform random jitter
 * in [0, delay]. Jitter prevents a fleet of workers from retrying in lockstep
 * (thundering herd) after a shared outage.
 */

export interface RetryOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
}

export function computeDelayMs(attempt: number, options: RetryOptions = {}): number {
  const base = options.baseDelayMs ?? 200;
  const cap = options.maxDelayMs ?? 30_000;
  const uncapped = base * 2 ** attempt;
  const bounded = Math.min(cap, uncapped);
  // Full jitter: uniform in [0, bounded].
  return Math.floor(Math.random() * bounded);
}

export function maxAttempts(options: RetryOptions = {}): number {
  return options.maxAttempts ?? 5;
}
