'use strict';

/**
 * Tests — Node's built-in runner (`node --test`), no test framework dep.
 * Every test builds a fresh app on an in-memory SQLite DB (seeded), so
 * tests are isolated and need no port, no files, no network.
 * Coverage: success, failure, and edge cases per Shane standards.
 */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');

let app;
beforeEach(async () => {
  app = buildApp({ dbPath: ':memory:', logger: false, jwtSecret: 'test-secret' });
  await app.ready();
  // afterEach-style cleanup is handled by t.after in each test via app.close
});

async function register(email = 'alice@example.com', password = 'password-123', name = 'Alice') {
  const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email, password, name } });
  return { res, body: JSON.parse(res.body) };
}
async function login(email = 'alice@example.com', password = 'password-123') {
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
  return JSON.parse(res.body);
}
async function authToken() {
  const { body } = await register();
  return body.token;
}
const auth = (token) => ({ authorization: `Bearer ${token}` });
const bountyPayload = (over = {}) => ({
  title: 'Build a Solana dashboard', description: 'A real dashboard with live validator data and tests included.', skill: 'Javascript', rewardUsd: 1500, ...over,
});

// ---------- health / misc ----------
test('GET /health returns ok', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).status, 'ok');
});

test('unknown route returns typed 404', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'GET', url: '/nope' });
  assert.equal(res.statusCode, 404);
  assert.equal(JSON.parse(res.body).error.code, 'NOT_FOUND');
});

// ---------- auth: success ----------
test('register returns 201 with user (no password) and JWT', async (t) => {
  t.after(() => app.close());
  const { res, body } = await register();
  assert.equal(res.statusCode, 201);
  assert.equal(body.user.email, 'alice@example.com');
  assert.equal(body.user.password, undefined);
  assert.match(body.token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test('login with correct credentials returns 200 and a token', async (t) => {
  t.after(() => app.close());
  await register();
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'alice@example.com', password: 'password-123' } });
  assert.equal(res.statusCode, 200);
  assert.ok(JSON.parse(res.body).token);
});

// ---------- auth: failure / edge ----------
test('register with duplicate email returns 409 CONFLICT', async (t) => {
  t.after(() => app.close());
  await register();
  const { res, body } = await register();
  assert.equal(res.statusCode, 409);
  assert.equal(body.error.code, 'CONFLICT');
});

test('register with short password returns 422 VALIDATION_ERROR', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com', password: 'short', name: 'A' } });
  assert.equal(res.statusCode, 422);
  assert.equal(JSON.parse(res.body).error.code, 'VALIDATION_ERROR');
});

test('register with invalid email returns 422', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'not-an-email', password: 'password-123', name: 'A' } });
  assert.equal(res.statusCode, 422);
});

test('login with wrong password returns 401 (same message as unknown email)', async (t) => {
  t.after(() => app.close());
  await register();
  const badPass = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'alice@example.com', password: 'wrong-pass-1' } });
  const unknown = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'nobody@example.com', password: 'wrong-pass-1' } });
  assert.equal(badPass.statusCode, 401);
  assert.equal(unknown.statusCode, 401);
  assert.equal(JSON.parse(badPass.body).error.message, JSON.parse(unknown.body).error.message);
});

test('login with missing field returns 422', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com' } });
  assert.equal(res.statusCode, 422);
});

// ---------- bounties: list / read ----------
test('list returns seeded bounties with pagination meta', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'GET', url: '/bounties' });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.meta.total, 6);
  assert.equal(body.meta.page, 1);
  assert.equal(body.data.length, 6);
});

test('list filters by status and skill, and paginates', async (t) => {
  t.after(() => app.close());
  const open = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?status=open' })).body);
  assert.equal(open.meta.total, 4);
  assert.ok(open.data.every((b) => b.status === 'open'));
  const ts = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?skill=Typescript' })).body);
  assert.equal(ts.meta.total, 2);
  const page2 = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?page=2&pageSize=2' })).body);
  assert.equal(page2.data.length, 2);
  assert.equal(page2.meta.totalPages, 3);
});

test('list filters by reward range and search', async (t) => {
  t.after(() => app.close());
  const rich = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?minReward=2000' })).body);
  assert.equal(rich.meta.total, 2);
  const found = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?search=Anchor' })).body);
  assert.equal(found.meta.total, 1);
});

test('list with minReward > maxReward returns 400', async (t) => {
  t.after(() => app.close());
  const res = await app.inject({ method: 'GET', url: '/bounties?minReward=5000&maxReward=100' });
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error.code, 'BAD_REQUEST');
});

test('list with invalid status returns 422; pageSize > 50 returns 422', async (t) => {
  t.after(() => app.close());
  assert.equal((await app.inject({ method: 'GET', url: '/bounties?status=bogus' })).statusCode, 422);
  assert.equal((await app.inject({ method: 'GET', url: '/bounties?pageSize=51' })).statusCode, 422);
});

test('get one bounty by id; unknown id returns 404 NOT_FOUND', async (t) => {
  t.after(() => app.close());
  const list = JSON.parse((await app.inject({ method: 'GET', url: '/bounties' })).body);
  const res = await app.inject({ method: 'GET', url: `/bounties/${list.data[0].id}` });
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).id, list.data[0].id);
  const missing = await app.inject({ method: 'GET', url: '/bounties/00000000-0000-0000-0000-000000000000' });
  assert.equal(missing.statusCode, 404);
  assert.equal(JSON.parse(missing.body).error.code, 'NOT_FOUND');
});

// ---------- bounties: create / update / delete ----------
test('create bounty requires auth (401 without token, 401 with bad token)', async (t) => {
  t.after(() => app.close());
  assert.equal((await app.inject({ method: 'POST', url: '/bounties', payload: bountyPayload() })).statusCode, 401);
  const bad = await app.inject({ method: 'POST', url: '/bounties', headers: auth('garbage.token.here'), payload: bountyPayload() });
  assert.equal(bad.statusCode, 401);
});

test('create bounty succeeds with auth and returns 201', async (t) => {
  t.after(() => app.close());
  const token = await authToken();
  const res = await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload() });
  assert.equal(res.statusCode, 201);
  const body = JSON.parse(res.body);
  assert.equal(body.title, 'Build a Solana dashboard');
  assert.equal(body.status, 'open');
});

test('create bounty with reward 0 or unknown skill returns 422', async (t) => {
  t.after(() => app.close());
  const token = await authToken();
  assert.equal((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload({ rewardUsd: 0 }) })).statusCode, 422);
  assert.equal((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload({ skill: 'Cobol' }) })).statusCode, 422);
  assert.equal((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload({ title: 'Hi' }) })).statusCode, 422);
});

test('non-sponsor cannot edit or delete; sponsor can', async (t) => {
  t.after(() => app.close());
  const sponsorToken = await authToken();
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(sponsorToken), payload: bountyPayload() })).body);
  const { body: other } = await register('bob@example.com', 'password-123', 'Bob');
  const forbiddenRes = await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(other.token), payload: { title: 'Hijacked title here' } });
  assert.equal(forbiddenRes.statusCode, 403);
  assert.equal(JSON.parse(forbiddenRes.body).error.code, 'FORBIDDEN');
  const delForbidden = await app.inject({ method: 'DELETE', url: `/bounties/${created.id}`, headers: auth(other.token) });
  assert.equal(delForbidden.statusCode, 403);
  const ok = await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(sponsorToken), payload: { status: 'in_progress' } });
  assert.equal(ok.statusCode, 200);
  assert.equal(JSON.parse(ok.body).status, 'in_progress');
  const del = await app.inject({ method: 'DELETE', url: `/bounties/${created.id}`, headers: auth(sponsorToken) });
  assert.equal(del.statusCode, 204);
  assert.equal((await app.inject({ method: 'GET', url: `/bounties/${created.id}` })).statusCode, 404);
});

test('closed bounty cannot change status (terminal state)', async (t) => {
  t.after(() => app.close());
  const token = await authToken();
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload() })).body);
  await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(token), payload: { status: 'closed' } });
  const reopen = await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(token), payload: { status: 'open' } });
  assert.equal(reopen.statusCode, 400);
  assert.equal(JSON.parse(reopen.body).error.code, 'BAD_REQUEST');
});

test('patch with empty body returns 422; patch unknown bounty returns 404', async (t) => {
  t.after(() => app.close());
  const token = await authToken();
  assert.equal((await app.inject({ method: 'PATCH', url: '/bounties/00000000-0000-0000-0000-000000000000', headers: auth(token), payload: { title: 'New title here' } })).statusCode, 404);
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload() })).body);
  assert.equal((await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(token), payload: {} })).statusCode, 422);
});

// ---------- applications ----------
test('apply succeeds; duplicate apply returns 409; own bounty returns 400', async (t) => {
  t.after(() => app.close());
  const sponsorToken = await authToken();
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(sponsorToken), payload: bountyPayload() })).body);
  const { body: applicant } = await register('carol@example.com', 'password-123', 'Carol');
  const pitch = 'I have shipped three Solana dashboards and can deliver in two weeks.';
  const first = await app.inject({ method: 'POST', url: `/bounties/${created.id}/applications`, headers: auth(applicant.token), payload: { pitch } });
  assert.equal(first.statusCode, 201);
  const dup = await app.inject({ method: 'POST', url: `/bounties/${created.id}/applications`, headers: auth(applicant.token), payload: { pitch } });
  assert.equal(dup.statusCode, 409);
  const own = await app.inject({ method: 'POST', url: `/bounties/${created.id}/applications`, headers: auth(sponsorToken), payload: { pitch } });
  assert.equal(own.statusCode, 400);
});

test('apply to closed bounty returns 400; short pitch returns 422', async (t) => {
  t.after(() => app.close());
  const token = await authToken();
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(token), payload: bountyPayload() })).body);
  await app.inject({ method: 'PATCH', url: `/bounties/${created.id}`, headers: auth(token), payload: { status: 'closed' } });
  const { body: applicant } = await register('dave@example.com', 'password-123', 'Dave');
  const closed = await app.inject({ method: 'POST', url: `/bounties/${created.id}/applications`, headers: auth(applicant.token), payload: { pitch: 'I would love to do this work for you.' } });
  assert.equal(closed.statusCode, 400);
  const list = JSON.parse((await app.inject({ method: 'GET', url: '/bounties?status=open' })).body);
  const short = await app.inject({ method: 'POST', url: `/bounties/${list.data[0].id}/applications`, headers: auth(applicant.token), payload: { pitch: 'too short' } });
  assert.equal(short.statusCode, 422);
});

test('only sponsor can list applications', async (t) => {
  t.after(() => app.close());
  const sponsorToken = await authToken();
  const created = JSON.parse((await app.inject({ method: 'POST', url: '/bounties', headers: auth(sponsorToken), payload: bountyPayload() })).body);
  const { body: applicant } = await register('erin@example.com', 'password-123', 'Erin');
  await app.inject({ method: 'POST', url: `/bounties/${created.id}/applications`, headers: auth(applicant.token), payload: { pitch: 'I have shipped three Solana dashboards and can deliver in two weeks.' } });
  const denied = await app.inject({ method: 'GET', url: `/bounties/${created.id}/applications`, headers: auth(applicant.token) });
  assert.equal(denied.statusCode, 403);
  const ok = await app.inject({ method: 'GET', url: `/bounties/${created.id}/applications`, headers: auth(sponsorToken) });
  assert.equal(ok.statusCode, 200);
  assert.equal(JSON.parse(ok.body).length, 1);
});
