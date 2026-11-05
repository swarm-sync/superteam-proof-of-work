/** Structured JSON logger. One JSON object per line, safe for log aggregators. */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

export class Logger {
  readonly #service: string;

  constructor(service: string) {
    this.#service = service;
  }

  debug(message: string, fields: LogFields = {}): void {
    this.#write("debug", message, fields);
  }

  info(message: string, fields: LogFields = {}): void {
    this.#write("info", message, fields);
  }

  warn(message: string, fields: LogFields = {}): void {
    this.#write("warn", message, fields);
  }

  error(message: string, fields: LogFields = {}): void {
    this.#write("error", message, fields);
  }

  #write(level: LogLevel, message: string, fields: LogFields): void {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      service: this.#service,
      msg: message,
      ...fields,
    });
    if (level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }
}
