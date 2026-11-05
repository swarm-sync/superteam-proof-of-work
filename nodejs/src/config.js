'use strict';

// Centralised config. Secrets come from the environment only — never
// committed, never logged. Defaults are safe for local dev only.
module.exports = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  // SQLite file path; ':memory:' keeps everything in-process (tests use this).
  dbPath: process.env.DB_PATH || './data/bounties.sqlite',
  rateLimit: {
    globalMax: Number(process.env.RATE_LIMIT_MAX || 100),
    globalWindowMs: 60_000,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  },
};
