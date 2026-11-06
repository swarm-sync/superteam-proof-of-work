# SUBMISSION.md — Superteam Earn profile ADD form (Swift)

## Suggested title (71 characters)

Bounty Board CLI in Swift — value types, Decimal money, 61 XCTest tests

## Description (142 characters)

SwiftPM bounty board: validated Bounty model, Decimal rewards, thread-safe store, filters, sorting, paging, JSON import, CLI, 61 XCTest tests.

## Skills category

Backend

## Sub Skill

Swift

## Link

https://github.com/swarm-sync/superteam-proof-of-work/tree/main/swift

## Notes for upload (not part of the form)

- Build: `swift build` (Swift 6.2.1 toolchain, no other dependencies).
- Tests: `swift test --scratch-path /tmp/swift-build` → Executed 61 tests, with 0 failures.
- Run: `./.build/debug/bounty-board --summary`, then `--sort reward --order desc --page-size 3`.
- Quirk (this VM only): the default `swift test` fails copying the test Fixtures resource on the overlay filesystem; the tmpfs scratch path works. Documented in README.md.
