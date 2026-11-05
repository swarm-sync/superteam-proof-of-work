# Solana Bounty Tracker — React Dashboard

A polished, accessible dashboard for tracking bounties on the Solana ecosystem
(Superteam Earn style). Search, filter, sort, bookmark, and inspect bounties —
with full keyboard support and screen-reader announcements.

## What it demonstrates

- **React 19 + TypeScript** (Vite template) — functional components, hooks
  (`useState`, `useEffect`, `useMemo`, `useReducer`, `useRef`, custom hooks)
- **Context + reducer state management** (`src/context/BountyContext.tsx`) —
  filters, sorting, selection, and bookmarks in one typed store
- **Custom hooks** — `useBounties()` (typed context access) and
  `useDebouncedValue()` (debounced search input)
- **Sortable / filterable data table** — sort by bounty, reward, deadline, or
  submissions; filter by search text, category, status, and minimum reward
- **Detail view** — opens on row click/Enter, closes with Escape or the Close
  button; focus moves into the panel on open
- **Error boundary** (`src/components/ErrorBoundary.tsx`) — a render crash shows
  a recoverable message instead of a blank page
- **Accessibility (WCAG 2.1 AA)** — semantic table with `aria-sort`, labelled
  controls, `aria-live` result count, skip link, visible focus ring, arrow-key
  row navigation, `aria-pressed` bookmark toggles
- **Responsive by default** — Tailwind breakpoints; the table scrolls
  horizontally on small screens, stats reflow from 5 → 2 columns
- **Persisted bookmarks** — bookmarked bounty IDs survive reload via
  `localStorage`
- **Pure, tested utilities** — filtering, sorting, formatting, and stats live in
  `src/utils/bounties.ts` with no React dependency, so they are unit-tested in
  isolation

## Data

`src/data/bounties.ts` holds 12 realistic Solana bounties (sponsors, rewards,
deadlines, skills). It is sample data shown for demonstration; a live version
would fetch from the Superteam Earn API in the context provider.

## Run it

```bash
npm install   # install dependencies
npm run dev   # start the dev server (http://localhost:5173)
npm test      # run the test suite (Vitest + Testing Library)
npm run build # type-check (tsc) + production build into dist/
npm run preview # serve the production build locally
```

Requires Node 18+ (built and verified with Node v24.22.1, npm 10.9.4).

## Tests

23 tests, all passing (verified 2026-11-05):

- `src/utils/bounties.test.ts` — 16 tests: filtering (category/status/reward/
  search/combined), sorting (reward/deadline/title, no-mutation), formatters,
  stats incl. the empty-list edge case
- `src/App.test.tsx` — 7 tests: default render, search filter, category filter,
  reward sort, detail open/close with Escape, bookmark toggle, empty state

## Project structure

```
src/
  main.tsx                 Entry point
  App.tsx                  Layout: header, stats, filters, table, detail, footer
  index.css                Tailwind + global focus-ring styles
  data/bounties.ts         Types + 12 sample bounties
  utils/bounties.ts        Pure filter/sort/format/stats helpers
  context/BountyContext.tsx  Context + reducer + debounced-search hook
  components/
    StatsBar.tsx           Summary cards from the full bounty set
    FilterBar.tsx          Search / category / status / min-reward filters
    BountyTable.tsx        Sortable, keyboard-navigable table
    BountyDetail.tsx       Detail panel with focus management + Escape
    ErrorBoundary.tsx      Crash recovery UI
```

## Accessibility notes

- Every interactive element is reachable and operable by keyboard alone.
- Table rows are focusable (`tabIndex={0}`); ↑/↓ moves between rows, Enter or
  Space opens details, Escape closes them.
- Sort buttons announce direction via `aria-sort` on the column header.
- The result count uses `aria-live="polite"` so screen readers hear filter
  changes.
- Status is conveyed by text, not color alone; contrast meets AA.
