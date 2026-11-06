# Bounty Listings CLI — Kotlin

A dependency-free Kotlin CLI for bounty listings: create, list, filter,
sort, page, and fetch listings as JSON. No Gradle, no Maven, no network —
the standalone `kotlinc` compiler and the jars in `lib/` are all it needs.

## What it is

- `src/main/kotlin/bounty/Listing.kt` — the domain model: `Listing` data
  class, `Category` / `Status` enums, money as integer minor units (never
  float) so reward arithmetic is exact.
- `ListingService.kt` — the service layer: validation, filtering by
  category/status/reward range/search text, sorting by reward/deadline/
  created, and paging. Failures are `ListingResult` sealed types, never
  exceptions leaking across the boundary.
- `ListingRepository.kt` — a coroutine-safe in-memory store (`Mutex` +
  `StateFlow`-friendly design; no uncontrolled global scope).
- `Validation.kt` / `Json.kt` — input validation and a hand-rolled JSON
  reader/writer (no serialization dependency to download).
- `Main.kt` — the CLI: `seed`, `list`, `get`, `create`, `open`. Output is
  JSON on stdout; failures are a JSON error body on stderr with exit
  code 2.
- `src/test/kotlin/bounty/ListingServiceTest.kt` — 22 JUnit 4 tests:
  validation edges, filter combinations, sort orders, paging bounds,
  and create/open flows.

## Requirements

- Temurin OpenJDK 21 at `~/.jdk21` (the scripts set `JAVA_HOME`).
- Kotlin compiler 2.2.10 at `~/.kotlin-dist/kotlinc` (the scripts set the
  path). The jars in `lib/` (kotlin-stdlib, kotlin-test, JUnit 4,
  kotlinx-coroutines) are vendored — nothing is downloaded at build time.

## Build, test, verify

```sh
export TMPDIR=~/tmp   # only if /tmp is full

./build.sh   # compiles main + tests — expected: Build OK.
./test.sh    # builds, then runs JUnit — expected: OK (22 tests)

# Run the CLI
./run.sh seed                                    # 8 seeded listings, JSON
./run.sh list --sort reward --dir desc --size 3  # top 3 by reward
./run.sh create '{"title":"...","description":"...","category":"DEVELOPMENT","rewardMinorUnits":100000,"currency":"USDC","deadline":null}'
```

Note: the store lives for one invocation, so each `./run.sh` call starts
from an empty store (or the seed set with `seed`). That is deliberate —
this is a CLI demo of the service layer, not a server.

## Design notes

- Rewards are integer minor units (cents / lamport-style smallest unit),
  so `$500.00` is `50000` — no floating-point rounding anywhere.
- `ListingResult` is a sealed hierarchy (`Ok` / `NotFound` / `Invalid`),
  so callers handle every outcome; the compiler rejects an unhandled arm.
- Coroutines use structured lifetimes (`runBlocking` only at the CLI
  entry point); no `GlobalScope` anywhere.
- JSON is parsed and written by hand (`Json.kt`) because the sandbox
  proxy blocks Maven Central from the JVM — the Java artifact in this
  same collection is dependency-free for the same reason.
