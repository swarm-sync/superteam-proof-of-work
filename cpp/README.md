# C++ Bounty Listings Engine

A small, dependency-free C++17 program that loads bounty listings from JSON,
then filters, searches, and sorts them from the command line — the kind of
tool a bounty board (e.g. Superteam Earn) needs to let builders find work
that matches their skills and pay expectations.

No external libraries. Builds anywhere with a C++17 compiler.

## What it does

- **Validated listing model** — every listing needs a unique non-empty id,
  title, org, a reward ≥ $0, and at least one skill. Invalid data is
  rejected with a reason, never silently stored.
- **Filter / search / sort** — by skill (case-insensitive), minimum reward,
  status (`open` / `closed`), and keyword substring over title + org;
  sort by reward (high/low) or title.
- **JSON import** — a small built-in parser for a JSON array of listings
  (no third-party JSON library).
- **CLI** — one binary, plain flags, exit code 2 on bad usage.

## Build / run / verify

Requires `g++` (C++17) and `make`. If `/tmp` is full on your machine,
set `TMPDIR` to a writable directory first (the Makefile also defaults
to a project-local `.tmp`).

```sh
export TMPDIR=~/tmp          # only needed if /tmp is full
make                         # build build/bounty
make test                    # build + run unit tests
make run                     # build + list all sample listings
make clean                   # remove build artefacts
```

Expected test result (verified 2026-11-05, g++ 13.3.0, zero warnings
with `-Wall -Wextra`):

```
tests: 42 passed, 0 failed
```

## Examples

```sh
./build/bounty
./build/bounty --skill C++ --min-reward 1000
./build/bounty --status open --search solana --sort title
./build/bounty --file data/listings.json --sort reward-asc
./build/bounty --help
```

Sample output:

```
[bty-002] Optimise validator gossip throughput — Anza — $5000 — open — skills: C++, Networking, Performance
[bty-001] Build a Solana indexer in C++ — Solana Foundation — $2500 — open — skills: C++, Solana, RPC
4 listing(s) shown, of 8 total.
```

## Data format

`data/listings.json` is a JSON array of objects:

```json
[{"id": "bty-001", "title": "Build a Solana indexer in C++",
  "org": "Solana Foundation", "reward_usd": 2500,
  "skills": ["C++", "Solana", "RPC"], "status": "open"}]
```

`status` defaults to `"open"` when omitted. Any other field missing,
a negative reward, an empty skill, or an unknown status makes the
whole import fail with an error — no partial load.

## Architecture

Four components with explicit boundaries; each header documents its
single responsibility. Dependencies flow one way:
`main → importer/store/query → listing`. Nothing depends on the CLI,
and the model knows nothing about files or JSON.

| Component | Files | Responsibility |
|---|---|---|
| **Model** | `include/listing.h`, `src/listing.cpp` | The `Listing` value type + validation. Knows nothing about files, JSON, sorting, or the CLI. |
| **Store** | `include/store.h`, `src/store.cpp` | Owns the collection. Rejects invalid listings and duplicate ids; answers lookups. No filtering, sorting, or I/O. |
| **Query** | `include/query.h`, `src/query.cpp` | Pure functions: filter, search, sort. No state, no I/O, no mutation of the store — trivially testable in isolation. |
| **Importer** | `include/importer.h`, `src/importer.cpp` | The only place that knows JSON syntax. A minimal recursive-descent parser for the listing shape; callers only ever see `Listing` values or an error string. |
| **CLI** | `src/main.cpp` | Thin orchestration only: parse argv, load the file, call store/query, print results. No logic lives here. |

Why this split, and what it buys at 10× scale:

- **Loose coupling:** swapping the JSON parser for a real library (or a
  network source) touches only `importer`; swapping the in-memory store
  for a database touches only `store`. The model, query, and CLI are
  unaffected.
- **Testability:** `query` is pure functions and `listing` is pure
  validation, so the 42 unit tests in `tests/test_main.cpp` cover the
  core behaviour without files, processes, or fixtures.
- **Fail-closed validation:** invalid data is rejected at the boundary
  (importer → model → store), so every listing the query layer ever
  sees is already valid — no defensive checks scattered through the code.

## Layout

```
cpp/
├── Makefile                 # build / test / run / clean
├── README.md
├── SUBMISSION.md            # Superteam Earn submission details
├── data/listings.json       # 8 sample Solana-ecosystem bounties
├── include/                 # listing.h, store.h, query.h, importer.h
├── src/                     # listing.cpp, store.cpp, query.cpp, importer.cpp, main.cpp
└── tests/test_main.cpp      # dependency-free unit tests (42 checks)
```
