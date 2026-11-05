# Superteam Earn — Proof of Work Submission

## Suggested ADD-form title (68 chars)

Bounty Task Tracker — Redux Toolkit, Normalized State + Async Thunks

## Description

A bounty task tracker built to prove Redux Toolkit skill end to end:
normalized state with createEntityAdapter, async thunks with rejectWithValue
error handling (failed saves leave state untouched and surface a readable
banner), memoized createSelector views for filtering/sorting/stats, a
separate filters slice, and localStorage persistence so the list survives
reloads. 27 passing Vitest + Testing Library tests cover the slice, the
selectors (including memoization), and the full user flow — add, validate,
mark done, filter, sort, fail, delete.

## Skills

Redux Toolkit, React, TypeScript, Tailwind CSS, Vitest, Testing Library

## Links

Public link: https://github.com/swarm-sync/superteam-proof-of-work/tree/main/redux

## How to run

```bash
cd redux
npm install
npm run dev     # http://localhost:5173
npm test        # 27 tests
npm run build   # production build
```

Verified 2026-11-05: `npm test` — 27/27 passing; `npm run build` — succeeds
(Node v24.22.1, npm 10.9.4). No secrets, no paid services, no external calls.
The API layer is simulated in-process; swap `tasksApi.ts` for real fetch()
calls and nothing else changes.
