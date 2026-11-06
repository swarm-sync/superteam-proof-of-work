# Superteam Earn Submission — C++ Bounty Listings Engine

- **Title (ADD form):** C++ Bounty Listings Engine — Filter, Search & Sort
- **Description (159 characters):** Dependency-free C++17 bounty-listings engine: validated listings, skill/reward search, sorting, JSON import and a CLI. Clean components, tested with make test.
- **Skills category:** Backend
- **Sub Skill:** C++
- **Link:** https://github.com/swarm-sync/superteam-proof-of-work/tree/main/cpp

## What it is

A dependency-free C++17 program that loads bounty listings from JSON and
lets builders filter by skill, minimum reward, and status, search by
keyword, and sort by reward or title — via a small CLI. Clean component
boundaries (model / store / query / importer / CLI), 42 unit tests,
zero compiler warnings with `-Wall -Wextra`.

## Verify

```sh
export TMPDIR=~/tmp   # only if /tmp is full
make test             # expected: tests: 42 passed, 0 failed
make run              # lists the 8 sample listings, highest reward first
```
