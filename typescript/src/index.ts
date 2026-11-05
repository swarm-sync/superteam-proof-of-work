import { createServer } from "node:http";
import { Logger } from "./logger.js";
import { createApp } from "./server.js";

const logger = new Logger("webhook-server");
const port = Number(process.env["PORT"] ?? 3000);

const { processor, handler } = createApp();
const server = createServer(handler);

server.listen(port, () => {
  logger.info("listening", { port });
});

const shutdown = (signal: string): void => {
  logger.info("shutting down", { signal });
  server.close(() => {
    processor.stop();
    process.exit(0);
  });
  // Force-exit if connections hang: availability of the process matters
  // more than draining a demo in-flight request.
  setTimeout(() => process.exit(1), 5_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
