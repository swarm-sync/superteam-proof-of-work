# Bounty Tracker — Angular 20

A bounty/project tracker for the Solana ecosystem: browse bounties, see
what is open and what it pays, post a new bounty, and move bounties through
review to awarded. Built as a Superteam Earn proof-of-work artifact.

## What it demonstrates

- **Standalone components** (no NgModules) with lazy-loaded routes
- **Signals** — the bounty store is a `signal<Bounty[]>`; dashboard stats
  are `computed()` values that update automatically
- **Reactive forms with validation** — required/min-length rules plus
  custom validators (future-date deadline, positive reward amount), with
  accessible inline error messages
- **Services + HttpClient** — `BountyService` fetches the seed list from a
  local mock API (`public/mock-bounties.json`, served as a static asset)
  and persists user edits to `localStorage`
- **Routing** — dashboard, list, detail (`/bounties/:id`), and create pages
- **Reusable component** — `BountyCardComponent` shared by dashboard and list
- **Unit tests** — service (with `HttpClientTestingModule`), validators,
  model helpers, and the app shell

## Run it

Requires Node.js 20+ and npm.

```bash
cd angular
npm install
npm start          # dev server at http://localhost:4200
```

## Build

```bash
npm run build      # production build into dist/bounty-tracker/
```

## Test

```bash
npm test           # Karma + Jasmine, headless Chrome (CHROME_BIN must point at a Chrome/Chromium binary)
```

## Project layout

```
src/
  app/
    app.ts / app.routes.ts / app.config.ts   # shell, lazy routes, HttpClient provider
    models/bounty.model.ts                  # Bounty type, statuses, helpers
    validators/bounty.validators.ts         # future-date + positive-amount validators
    services/bounty.service.ts              # HttpClient seed load, signal store, CRUD, stats
    components/bounty-card/                 # reusable bounty card
    pages/
      dashboard/   bounty-list/             # browse + filter + search + delete
      bounty-detail/                        # detail + status transitions
      bounty-form/                          # reactive form to post a bounty
public/
  mock-bounties.json                        # local mock API seed data (6 bounties)
```

## Notes

- The mock API is read-only by design: the seed JSON is a static asset, so
  creates/updates/deletes live in the signal store and `localStorage`.
  The service is explicit about this boundary in its doc comment.
- The dashboard's "≈ USD" total uses a fixed indicative SOL price ($180)
  for display only; it is not a quote.
