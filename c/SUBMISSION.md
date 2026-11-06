# SUBMISSION.md — Superteam Earn profile ADD form (C)

## Suggested title

Bounty Listings CLI in C — fast TSV parser, filter/sort/search + benchmark

## Description (141 characters)

Fast C CLI for bounty listings: parse and validate TSV files, filter by status, category and reward, sort, search, plus a built-in benchmark.

## Skills category

Backend

## Sub Skill

C

## Link

https://github.com/swarm-sync/superteam-proof-of-work/tree/main/c

## Notes for upload (not part of the form)

- Build: `make build` (C11, gcc, no dependencies, `-Wall -Wextra -Werror` clean).
- Tests: `make test` → `tests: 10085 passed, 0 failed` (unit tests + CLI smoke checks).
- Benchmark (`./bounty bench`, n=50,000): parse+validate 2,729,588 listings/sec;
  sort 3,750,111 listings/sec; binary search 482x faster than linear scan;
  qsort 314x faster than bubble sort on 2,000 items. Full numbers in README.md.
