# toolkit — dependency-free vanilla JavaScript utility library

A small, well-tested ES2023 toolkit: data helpers, formatting, timing
utilities and a tiny observable store. Zero dependencies, no build step.

## What it demonstrates

- Idiomatic modern JavaScript (ES modules, JSDoc types, `Intl` APIs)
- Defensive, well-tested code: edge cases (circular refs, invalid input,
  non-mutating sorts) are handled and covered by tests
- Browser + Node from the same source file

## Contents

| File | What it is |
|---|---|
| `src/index.js` | The library (~400 lines): `deepClone`, `deepEqual`, `pick`, `omit`, `groupBy`, `sortBy`, `chunk`, `unique`, `clamp`, `formatMoney`, `formatDate`, `timeAgo`, `escapeHtml`, `slugify`, `debounce`, `throttle`, `retry`, `pipe`, `memoize`, `createStore` |
| `test/toolkit.test.js` | 17 tests across 6 suites using Node's built-in `node:test` runner — no test framework to install |
| `demo.html` | Interactive browser demo (money/date formatting, groupBy/sortBy, debounced search, observable-store counter, deepClone check) |
| `package.json` | `"type": "module"`, `npm test` script; no dependencies |

## Run / verify

```bash
cd javascript
node --check src/index.js   # syntax check
npm test                    # runs the 17 tests (no install needed)
```

Open the demo (no server needed, but any static server works):

```bash
npx serve .                  # or: python3 -m http.server 8000
# then open http://localhost:8000/demo.html (or 3000 for npx serve)
```

## Verified

- `node --check src/index.js` — clean
- `npm test` on Node v24.22.1 — **17 tests, 17 pass, 0 fail** (2026-11-05)
