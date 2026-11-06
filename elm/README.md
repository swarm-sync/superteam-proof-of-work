# Solana Bounty Board — Elm

A searchable, filterable Solana bounty board built in Elm with The Elm
Architecture (Model / Msg / update / view). No runtime exceptions by
construction: the compiler proves every branch is handled.

## What it is

- `src/Bounty.elm` — pure domain logic, free of any HTML so it is directly
  unit-testable: `Status` and `Sort` custom types (impossible states cannot
  be represented), case-insensitive search across title, org, skills and
  summary, status filtering, and four sort orders.
- `src/Main.elm` — the `Browser.sandbox` application: search box, status
  filter, sort selector, live result count, and the bounty list.
- `tests/BountyTest.elm` — 24 elm-test tests covering status parsing and
  labels, search matching (including the empty-query and no-match edges),
  combined query + status filtering, and every sort order.
- Sample data: 8 fictional Solana-ecosystem bounties with USDC rewards.

## Requirements

- Node.js (for the local Elm toolchain; `node_modules` is installed in
  this folder — no global install needed).
- Elm 0.19.1 (via the `elm` npm package), elm-test, elm-format.

## Build, test, verify

```sh
export TMPDIR=~/tmp   # only if /tmp is full

# Compile the app (proves the whole program typechecks)
./node_modules/.bin/elm make src/Main.elm --output=/tmp/bounty-board.js

# Run the test suite — expected: Passed: 24, Failed: 0
./node_modules/.bin/elm-test

# Check formatting
./node_modules/.bin/elm-format --validate src tests
```

The first `elm-test` run downloads `elm-explorations/test` from the Elm
package registry (already cached under `~/.elm` on this machine).

## Design notes

- Money is integer USDC (never float), so reward sorting and display are
  exact.
- Deadlines are ISO date strings (`YYYY-MM-DD`), so lexicographic sort is
  chronological sort — no date parsing needed for ordering.
- `matchesQuery` lowercases and trims once per call; the empty query
  matches everything, which keeps the "show all" case a normal path
  instead of a special case.
- The `select` elements read their value from the DOM `change` event
  through a `Json.Decode` decoder — the only place this app touches
  untyped data, and the decoder is narrow (one string field).
