# bounty — fast bounty-listings CLI in C

A small, dependency-free C11 command-line tool for working with bounty
listings (the kind of listings you'd find on a bounty board like Superteam
Earn). It parses and validates a TSV listings file, filters, sorts, and
searches it — and ships a built-in benchmark that measures every step, so
performance claims are numbers, not adjectives.

## What it does

- **`bounty validate --file FILE`** — checks every line of a TSV listings
  file and reports the first bad line, or `VALID` with the listing count.
- **`bounty list --file FILE [options]`** — prints matching listings:
  - `--status open|closed|draft` — filter by status
  - `--category NAME` — filter by category
  - `--min-reward USD` — minimum reward
  - `--sort reward|deadline|title` — highest reward, soonest deadline, A–Z
  - `--search TERM` — case-insensitive substring search over title + category
  - `--limit N` — cap the rows shown
- **`bounty bench [--n N] [--iters I]`** — generates N deterministic
  listings in memory and measures parse+validate, sort, and lookup
  throughput, including before/after comparisons (see Benchmarks).

Validation is strict: ids must be positive integers, rewards non-negative
numbers, statuses one of `open`/`closed`/`draft`, and deadlines real
calendar dates (2026-02-30 and 2027-02-29 are rejected; 2028-02-29 is
accepted).

## Listings file format (TSV, header optional)

```
id	title	category	status	reward_usd	deadline
1	Fix the login redirect	Security	open	500	2026-12-01
2	Write the onboarding guide	Docs	open	150	2026-11-20
```

A 10-listing sample is included at `data/sample.tsv`.

## Build

Requires only a C compiler (`gcc` or `clang`). No external dependencies.

```sh
export TMPDIR=~/tmp        # only needed if /tmp is full on your machine
make build                 # builds ./bounty
```

Compiled with `-std=c11 -O2 -Wall -Wextra -Werror` — zero warnings.

## Run

```sh
./bounty validate --file data/sample.tsv
./bounty list --file data/sample.tsv --status open --sort reward --limit 3
./bounty list --file data/sample.tsv --search security
./bounty list --file data/sample.tsv --category Backend --min-reward 500 --sort deadline
./bounty bench
./bounty --help
```

## Verify (tests)

```sh
export TMPDIR=~/tmp
make test
```

`make test` runs the unit-test binary plus CLI smoke checks
(`validate`, filtered/sorted `list`, `search`, and a small `bench` run).
Expected result: **`tests: 10085 passed, 0 failed`**, followed by
`VALID: 10 listing(s)` and the smoke-check listings. Exit code 0 means
everything passed; error paths are also checked (missing file → exit 2,
unknown status → exit 1, bad line → exit 2 with the line number).

## Benchmarks

Measured with `./bounty bench` (n = 50,000 listings, best of 5 iterations),
on this machine (gcc 13.3, `-O2`):

| Operation | Time | Throughput |
|---|---|---|
| Parse + validate | 18.3 ms | **2,729,588 listings/sec** (366 ns/listing) |
| Sort by reward (`qsort`) | 13.3 ms | **3,750,111 listings/sec** |
| Lookup, linear scan (100k lookups) | 4,171 ms | 41,711 ns/lookup |
| Lookup, binary search (100k lookups) | 8.6 ms | 86 ns/lookup — **482x faster** |

Before/after — sorting 2,000 listings:

| Sort | Time | |
|---|---|---|
| Bubble sort (naive, before) | 132.8 ms | |
| `qsort` (after) | 0.42 ms | **314x faster** |

Before/after — date parsing (found by profiling, not guessing):

The first version validated each deadline with `mktime()`, which does a
timezone/localtime lookup per line. Parse throughput was **221,802
listings/sec** (n = 20,000). Replacing it with arithmetic validation
(month lengths + leap-year rule, days-from-civil conversion) raised it to
**2,687,966 listings/sec** at the same n — **~12x faster** — with
identical validation behaviour (verified by the test suite, including
leap-year edge cases).

Reproduce all of the above any time with:

```sh
./bounty bench            # default: n=50000, iters=5
./bounty bench --n 20000 --iters 3
```

## Layout

```
c/
├── Makefile            # build / test / bench / clean
├── README.md
├── SUBMISSION.md
├── data/
│   └── sample.tsv      # 10 sample listings
├── src/
│   ├── bounty.h        # library API
│   ├── bounty.c        # parse / validate / filter / sort / search / lookup
│   └── main.c          # CLI (list / validate / bench) + benchmark
└── tests/
    └── test_bounty.c   # unit tests, no framework, no dependencies
```
