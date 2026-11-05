'use strict';

/**
 * Persistence layer — Node's built-in `node:sqlite` (Node >= 22.5, no native
 * add-on to compile). A single DatabaseSync connection is serialised by the
 * event loop, which is correct for this service's write volume; a pool would
 * be the next step if concurrent writes grew.
 *
 * Schema notes:
 * - `users.email` is UNIQUE (CITEXT-style: stored lower-cased, see repo).
 * - `bounties.reward_usd` is INTEGER cents-free dollars; CHECK keeps it sane.
 * - `applications` enforces one application per user per bounty (UNIQUE).
 * - Foreign keys are ON, and indexes cover the list filters (status, skill).
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bounties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 120),
  description TEXT NOT NULL CHECK (length(description) >= 20),
  skill TEXT NOT NULL,
  reward_usd INTEGER NOT NULL CHECK (reward_usd >= 1 AND reward_usd <= 1000000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed','cancelled')),
  sponsor_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_skill ON bounties(skill);
CREATE INDEX IF NOT EXISTS idx_bounties_sponsor ON bounties(sponsor_id);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  bounty_id TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES users(id),
  pitch TEXT NOT NULL CHECK (length(pitch) >= 20 AND length(pitch) <= 2000),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (bounty_id, applicant_id)
);
`;

const SEED_BOUNTIES = [
  ['Build a Solana validator-ordering explainer dashboard', 'Interactive dashboard visualising how Solana validators order transactions, with real mainnet timing data and a one-command local run.', 'Javascript', 2500, 'open'],
  ['Write an Anchor program for SPL token escrow', 'Escrow program with init, deposit, release and cancel instructions, plus a full test suite and deployment docs.', 'Typescript', 1800, 'open'],
  ['Design a bounty-board landing page', 'High-converting landing page for a Solana bounty board: hero, live listings, sponsor proof. Figma + production React.', 'React', 1200, 'open'],
  ['Audit a Jupiter swap integration', 'Review a Jupiter aggregator integration for slippage, MEV and error-handling gaps; deliver a written findings report.', 'Typescript', 3000, 'in_progress'],
  ['Solana wallet onboarding flow in Svelte', 'Connect-wallet, sign-message and session-restore flow with graceful failure states and tests.', 'Svelte', 900, 'open'],
  ['Python indexer for Superteam Earn submissions', 'Indexer that polls the Earn API, normalises submissions and exposes a queryable summary endpoint.', 'Python', 1500, 'closed'],
];

function createDb(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

/** Seed a demo sponsor + bounties exactly once (idempotent). */
function seed(db) {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM bounties').get().n;
  if (existing > 0) return;
  const crypto = require('node:crypto');
  const sponsorId = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync('demo-password-123', salt, 64).toString('hex');
  db.prepare('INSERT INTO users (id, email, password_hash, password_salt, name) VALUES (?, ?, ?, ?, ?)')
    .run(sponsorId, 'demo@sponsor.example', hash, salt, 'Demo Sponsor');
  const insert = db.prepare(
    'INSERT INTO bounties (id, title, description, skill, reward_usd, status, sponsor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  for (const [title, description, skill, reward, status] of SEED_BOUNTIES) {
    insert.run(crypto.randomUUID(), title, description, skill, reward, status, sponsorId);
  }
}

module.exports = { createDb, seed };
