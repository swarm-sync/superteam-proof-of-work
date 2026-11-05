/**
 * In-memory job queue with bounded concurrency and backoff-aware scheduling.
 *
 * A worker loop pulls the earliest due job, runs it, and on failure either
 * re-queues it after the retry delay or moves it to the dead-letter list
 * once `maxAttempts` is exhausted. Nothing is silently dropped: every
 * terminal failure lands in the dead-letter list for inspection/replay.
 * (Production: back this with a durable queue — SQS, Postgres, Redis
 * Streams — same state machine, same contract.)
 */
import { Logger } from "./logger.js";
import type { Job, JobStatus } from "./types.js";

export interface QueueOptions {
  concurrency?: number;
  onDeadLetter?: (job: Job) => void;
}

export type JobRunner = (job: Job) => Promise<void>;

export class JobQueue {
  readonly #jobs = new Map<string, Job>();
  readonly #deadLetter: Job[] = [];
  readonly #concurrency: number;
  readonly #logger: Logger;
  readonly #onDeadLetter: ((job: Job) => void) | undefined;
  #running = 0;
  #timer: NodeJS.Timeout | undefined;
  #stopped = false;

  constructor(logger: Logger, options: QueueOptions = {}) {
    this.#logger = logger;
    this.#concurrency = options.concurrency ?? 2;
    this.#onDeadLetter = options.onDeadLetter;
  }

  enqueue(job: Job): void {
    this.#jobs.set(job.id, job);
    this.#logger.debug("job enqueued", { jobId: job.id, key: job.idempotencyKey });
  }

  getJob(id: string): Job | undefined {
    return this.#jobs.get(id);
  }

  listJobs(): Job[] {
    return [...this.#jobs.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  deadLetter(): Job[] {
    return [...this.#deadLetter];
  }

  /** Start the worker loop. `runner` performs one attempt of a job. */
  start(runner: JobRunner, pollIntervalMs = 50): void {
    this.#stopped = false;
    const tick = (): void => {
      if (this.#stopped) return;
      void this.#drain(runner).finally(() => {
        if (!this.#stopped) {
          this.#timer = setTimeout(tick, pollIntervalMs);
        }
      });
    };
    tick();
  }

  stop(): void {
    this.#stopped = true;
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
    }
  }

  async #drain(runner: JobRunner): Promise<void> {
    const now = Date.now();
    const due = [...this.#jobs.values()]
      .filter((j) => j.status === "pending" && j.nextAttemptAt <= now)
      .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);
    for (const job of due) {
      if (this.#running >= this.#concurrency) return;
      this.#running += 1;
      job.status = "processing";
      job.updatedAt = Date.now();
      void runner(job).finally(() => {
        this.#running -= 1;
      });
    }
  }

  /** Called by the runner after an attempt finishes. */
  complete(job: Job): void {
    job.status = "succeeded";
    job.updatedAt = Date.now();
    this.#jobs.delete(job.id);
  }

  /** Called by the runner after a failed attempt. */
  fail(job: Job, errorMessage: string, retryDelayMs: number): void {
    job.lastError = errorMessage;
    job.updatedAt = Date.now();
    if (job.attempts >= job.maxAttempts) {
      job.status = "dead";
      this.#jobs.delete(job.id);
      this.#deadLetter.push(job);
      this.#logger.error("job dead-lettered", {
        jobId: job.id,
        key: job.idempotencyKey,
        attempts: job.attempts,
        error: errorMessage,
      });
      this.#onDeadLetter?.(job);
    } else {
      job.status = "pending";
      job.nextAttemptAt = Date.now() + retryDelayMs;
      this.#logger.warn("job scheduled for retry", {
        jobId: job.id,
        key: job.idempotencyKey,
        attempts: job.attempts,
        retryInMs: retryDelayMs,
        error: errorMessage,
      });
    }
  }
}

export type { JobStatus };
