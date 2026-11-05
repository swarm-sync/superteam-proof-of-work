/** Shared domain types. No `any` anywhere in this codebase. */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface WebhookEvent {
  /** Provider-supplied unique delivery id (e.g. Stripe `evt_...`). */
  id: string;
  /** Event type, e.g. `payment.succeeded`. */
  type: string;
  /** ISO-8601 timestamp from the provider. */
  createdAt: string;
  /** Arbitrary event payload; must be JSON-serialisable. */
  data: Record<string, JsonValue>;
}

export type JobStatus = "pending" | "processing" | "succeeded" | "failed" | "dead";

export interface Job {
  id: string;
  /** Idempotency key: the webhook event id. Duplicate deliveries reuse it. */
  idempotencyKey: string;
  event: WebhookEvent;
  attempts: number;
  maxAttempts: number;
  status: JobStatus;
  /** Epoch ms when the next attempt may run (backoff). */
  nextAttemptAt: number;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface HandlerResult {
  ok: boolean;
  /** Short machine-readable reason, e.g. `downstream_503`. */
  reason?: string;
}

export type EventHandler = (event: WebhookEvent) => Promise<HandlerResult>;

export interface ProcessorMetrics {
  received: number;
  duplicates: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  breakerOpened: number;
}
