# Bounty Board — Swift

A SwiftPM bounty-board CLI: browse, filter, sort, and page bounty
listings from the terminal, with a validated domain model and a
thread-safe store. Built with Swift 6.2.1 on Linux; no Xcode needed.

## What it is

- `Sources/BountyBoard/Bounty.swift` — the `Bounty` value type
  (`struct`, `Codable`, `Sendable`): `Decimal` rewards (never float, so
  money is exact), validation with typed `BountyError` (empty title,
  non-positive or oversized reward, deadline not after creation,
  empty/duplicate skills), whitespace trimming on decode, and a custom
  `Codable` implementation that accepts the reward as a number or a
  numeric string.
- `BountyStore.swift` — a thread-safe store (`final class`, `@unchecked
  Sendable`, locked internally): add with validation + duplicate-ID
  rejection, fetch by ID, totals.
- `BountyQuery.swift` — `BountyFilter` (status, skill, sponsor substring,
  reward range, actionable-only), `PageRequest` (validated, page size
  capped at 100), stable sort by created/reward/deadline/title, and
  paging in one pass.
- `BountyJSON.swift` — ISO 8601 JSON import/export plus 8 realistic
  seed listings with deadlines relative to today, so the demo never goes
  stale.
- `Sources/BountyCLI/main.swift` — the `bounty-board` CLI: `--status`,
  `--skill`, `--sponsor`, `--min/max-reward`, `--actionable-only`,
  `--sort`, `--order`, `--page`, `--page-size`, `--file`, `--json`,
  `--summary`.
- `Tests/BountyBoardTests/` — 61 XCTest tests across validation, JSON
  round-trips, querying/sorting/paging, and store behavior (including a
  concurrent-adds test), with JSON fixtures.

## Requirements

- Swift 6.2.1 toolchain for Ubuntu 24.04. On this machine it lives at
  `~/swift-6.2.1-RELEASE-ubuntu24.04/usr/bin/swift` (downloaded from
  swift.org; add it to `PATH` as below). No other dependencies.

## Build, test, verify

```sh
export TMPDIR=~/tmp   # only if /tmp is full
export PATH="$HOME/swift-6.2.1-RELEASE-ubuntu24.04/usr/bin:$PATH"

swift build            # builds the library + CLI — expected: Build complete!
./.build/debug/bounty-board --summary
./.build/debug/bounty-board --sort reward --order desc --page-size 3

# Tests — expected: Executed 61 tests, with 0 failures
swift test --scratch-path /tmp/swift-build
```

Why `--scratch-path /tmp/swift-build` for tests: on this VM the project
lives on an overlay filesystem, and SwiftPM's copy of the test `Fixtures`
resource fails there with a permissions error (`NSCocoaErrorDomain
Code=513`). Building with the scratch path on tmpfs avoids the copy
failure. Plain `swift build` works in the default `.build` directory
because the library and CLI ship no resources.

## Design notes

- Rewards are `Decimal`, and the JSON decoder accepts them as a number
  or a numeric string — boards disagree on the wire format, and the
  model should not care.
- Validation lives in one place (`Bounty.validate()`), enforced both by
  the throwing `init(validated:)` and by `Codable` decode, so an invalid
  listing can never enter the store through any path.
- Title sort is plain lexicographic (`<`), not `localizedStandardCompare`:
  the localized order is ICU/locale-dependent on Linux, so it would make
  the sort — and its test — differ between machines.
- `BountyStore` is a reference type with a lock because the store is
  shared mutable state; everything it holds is a value type, so there
  are no aliasing surprises.
