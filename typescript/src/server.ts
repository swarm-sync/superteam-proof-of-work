/**
 * Minimal HTTP front-end for the processor (Node built-in `http` only).
 *
 *   POST /webhooks          accept a webhook delivery
 *   GET  /jobs/:id          job status
 *   GET  /jobs              pending jobs
 *   GET  /dead-letter       dead-lettered jobs
 *   GET  /metrics           processor counters + breaker state
 *   GET  /health            liveness probe
 *
 * The demo handler below simulates a flaky downstream: events whose type
 * contains "flaky" fail twice, then succeed — so a live `curl` shows retries
 * working. Replace `demoHandler` with a real side-effecting handler.
 */
import { type IncomingMessage, type ServerResponse } from "node:http";
import { Logger } from "./logger.js";
import { WebhookProcessor } from "./processor.js";
import type { WebhookEvent } from "./types.js";

const logger = new Logger("webhook-server");
const flakyFailures = new Map<string, number>();

async function demoHandler(event: WebhookEvent): Promise<{ ok: boolean; reason?: string }> {
  if (event.type.includes("flaky")) {
    const seen = (flakyFailures.get(event.id) ?? 0) + 1;
    flakyFailures.set(event.id, seen);
    if (seen <= 2) {
      return { ok: false, reason: `simulated downstream 503 (attempt ${seen})` };
    }
  }
  logger.info("handler applied side effect", { eventId: event.id, type: event.type });
  return { ok: true };
}

export function createApp(): { processor: WebhookProcessor; handler: (req: IncomingMessage, res: ServerResponse) => void } {
  const processor = new WebhookProcessor(demoHandler, {
    maxAttempts: 5,
    baseDelayMs: 200,
    maxDelayMs: 5_000,
    failureThreshold: 5,
    resetTimeoutMs: 2_000,
    concurrency: 2,
  });

  const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  const readBody = (req: IncomingMessage): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "null"));
        } catch {
          reject(new Error("invalid JSON body"));
        }
      });
      req.on("error", reject);
    });

  const handler = (req: IncomingMessage, res: ServerResponse): void => {
    void (async () => {
      const url = new URL(req.url ?? "/", "http://localhost");
      try {
        if (req.method === "POST" && url.pathname === "/webhooks") {
          const body = await readBody(req);
          const result = processor.receive(body);
          if (result.outcome === "rejected") {
            sendJson(res, 400, { error: result.reason });
            return;
          }
          if (result.outcome === "duplicate") {
            sendJson(res, 200, { outcome: "duplicate", status: result.status, jobId: result.jobId });
            return;
          }
          sendJson(res, 202, { outcome: "accepted", jobId: result.jobId });
          return;
        }
        if (req.method === "GET" && url.pathname === "/jobs") {
          sendJson(res, 200, processor.listJobs());
          return;
        }
        if (req.method === "GET" && url.pathname.startsWith("/jobs/")) {
          const job = processor.getJob(url.pathname.slice("/jobs/".length));
          if (job === undefined) {
            sendJson(res, 404, { error: "job not found" });
            return;
          }
          sendJson(res, 200, job);
          return;
        }
        if (req.method === "GET" && url.pathname === "/dead-letter") {
          sendJson(res, 200, processor.deadLetter());
          return;
        }
        if (req.method === "GET" && url.pathname === "/metrics") {
          sendJson(res, 200, { ...processor.metrics(), breaker: processor.breakerState() });
          return;
        }
        if (req.method === "GET" && url.pathname === "/health") {
          sendJson(res, 200, { status: "ok" });
          return;
        }
        sendJson(res, 404, { error: "not found" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        logger.error("request failed", { error: message });
        sendJson(res, 400, { error: message });
      }
    })();
  };

  return { processor, handler };
}
