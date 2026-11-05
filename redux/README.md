# Bounty Task Tracker — Redux Toolkit

A task tracker for the work behind Solana bounty submissions: what is due,
what pays, and what is done. A different app from the React bounty dashboard
— this one exists to prove Redux Toolkit skill end to end.

## What it demonstrates

- **Redux Toolkit slices** — `tasksSlice` (entities + async state) and
  `filtersSlice` (status/priority/search/sort), both fully typed
- **Normalized state** — `createEntityAdapter` stores tasks as
  `{ ids, entities }`, sorted by due date; every view reads the same entity,
  updates are O(1) by id
- **Async thunks with proper error handling** — `fetchTasks`, `addTask`,
  `updateTaskStatus`, `deleteTask` are `createAsyncThunk`s over a simulated
  async API (`src/features/tasks/tasksApi.ts`); failures go through
  `rejectWithValue` so the UI gets a typed, human-readable message, per-row
  `savingIds` track in-flight saves, and failed operations leave state
  untouched
- **Memoized selectors** — `selectVisibleTasks` and `selectTaskStats` use
  `createSelector`, so filtering/sorting/stats recompute only when tasks or
  filters change, not on every render
- **Persisted state** — the normalized tasks slice is saved to `localStorage`
  on every change (with a write only when the serialized form actually
  changed) and rehydrated on load, so a reload never loses the list
- **Typed hooks** — `useAppDispatch` / `useAppSelector` throughout; no
  untyped `useDispatch` / `useSelector` anywhere
- **Accessible, responsive UI** — labelled controls, `aria-live` result count,
  `role="alert"` error banner with dismiss, skip link, visible focus ring,
  Tailwind breakpoints

## The simulated API

`src/features/tasks/tasksApi.ts` stands in for a real backend: an in-memory
task list with a small delay per call and a `failNextApiCalls(n)` switch so
the error path is testable. Swap the four `api*` functions for `fetch()` calls
and nothing else changes — thunks, slices, and selectors are backend-agnostic.

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

27 tests, all passing (verified 2026-11-05):

- `src/features/tasks/tasksSlice.test.ts` — 11 tests: initial state, fetch/add/
  update/delete through thunks, normalized shape and due-date ordering, fetch
  failure, add/update/delete failure paths (state untouched, error recorded,
  saving flags cleared), not-found delete, error clearing, localStorage
  persistence
- `src/features/tasks/tasksSelectors.test.ts` — 8 tests: all-tasks order,
  by-id lookup, counts, status/priority/search filtering, reward sorting,
  memoization (same state → same array reference), stats
- `src/App.test.tsx` — 8 tests: seed load, add via form, form validation,
  mark-done via status select, status filter, reward sort, API-failure banner
  + dismiss (task survives a failed delete), delete

## Project structure

```
src/
  main.tsx
  App.tsx                  Provider + Dashboard (loads tasks, error banner)
  index.css                Tailwind + global focus-ring styles
  app/
    store.ts               configureStore, localStorage persistence, createAppStore
    hooks.ts               Typed useAppDispatch / useAppSelector
  features/
    tasks/
      tasksApi.ts          Simulated async backend (+ failure switch for tests)
      tasksSlice.ts        Entity adapter, async thunks, error handling
      tasksSelectors.ts    Memoized visible-list + stats selectors
    filters/
      filtersSlice.ts      Status / priority / query / sort state
  components/
    StatsBar.tsx           Totals from the memoized stats selector
    TaskForm.tsx           Validated add-task form (dispatches addTask thunk)
    FilterBar.tsx          Search / status / priority / sort controls
    TaskList.tsx           Task rows: status select + delete (per-row saving state)
```

## Accessibility notes

- Every control has a visible label; icon-only buttons carry `aria-label`.
- Filter changes are announced via `aria-live="polite"` on the result count.
- Async errors surface in one `role="alert"` banner (not duplicated per form)
  with a Dismiss button.
- Status is conveyed by text, not color alone; contrast meets AA.
