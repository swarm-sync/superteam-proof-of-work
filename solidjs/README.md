# Solana Ecosystem Explorer — SolidJS Bento

An interactive Solana ecosystem explorer built in **SolidJS + Vite**, designed in the
Stella system: asymmetrical bento layouts, spring-physics motion, cursor spotlights,
tactile sound + haptics, and full `prefers-reduced-motion` support.

## What it is

A single-page dashboard that makes the Solana ecosystem explorable instead of just
readable:

- **Live-feeling telemetry** — SOL/USD price, TPS, validator count, block time and
  epoch progress tick every ~2.2s and glide to their new values on a real spring
  integrator (stiffness 300, damping 30, mass 0.8), not a CSS ease.
- **Three working micro-tools, embedded in the grid:**
  1. **Fee calculator** — transactions × priority fee (µ-lamports/CU) → total cost in
     lamports, SOL and USD at the live ticker price.
  2. **Staking estimator** — SOL staked × APY → yearly/monthly yield.
  3. **SOL ⇄ USD converter** — two-way, synced to the ticker price.
- **Project explorer** — 12 real Solana flagship projects (Jupiter, Jito, Kamino,
  Drift, Pyth, Helium, Render, Magic Eden, Tensor, Squads, Orca, Hivemapper),
  filterable by category (DeFi / Infra / NFTs / DePIN / Consumer). Tap a card for a
  spring-animated detail panel; star favorites (persisted in `localStorage`).
- **Tactile layer** — every tap plays a synthesized mechanical click (Web Audio API,
  no audio files) and a micro-vibration via `navigator.vibrate()` on supported
  devices. A global mute toggle in the header persists across visits.
- **Cursor spotlights** — each bento card carries a radial glow that tracks the
  pointer across its surface.

## What it demonstrates

- SolidJS fine-grained reactivity (only the number that changes re-renders — ideal
  for live telemetry; no virtual-DOM diffing).
- A hand-rolled spring integrator in `src/lib/spring.ts` driving animated numbers.
- Synthesized Web Audio micro-sounds + haptics with a global mute (`src/lib/sound.ts`).
- Accessible-by-default: keyboard-focusable cards/chips, `aria-live` results,
  `aria-pressed`/`aria-expanded` states, visible focus rings, and a
  `prefers-reduced-motion` media query that kills all animation *and* slows the
  telemetry tick to 8s with instant value jumps.
- Zero runtime dependencies beyond `solid-js`. No wallet, no keys, no network calls
  at runtime (telemetry is clearly labelled simulated; fonts load from Google Fonts
  with system fallbacks).

## Run it

```bash
cd superteam-proof-of-work/solidjs
npm install     # installs solid-js, vite, vite-plugin-solid, typescript
npm run dev     # Vite dev server — http://localhost:5173
npm run build   # tsc + vite build → dist/ (verified: builds clean, 32 kB JS / 12.7 kB gzip)
npm run preview # serves the production build — http://localhost:4173
```

Requires Node 18+ (verified on Node v24.22.1, npm 10.9.4).

## Design tokens

| Token | Value |
|---|---|
| Background / surface | `#0a0a0f` / `#101016` / `#15151d` / `#1c1c28` |
| Razor border | `rgba(255,255,255,0.08)` (strong: `0.16`) |
| Accent gradient | `#9945FF → #14F195` (Solana violet → green) |
| Display type | Space Grotesk (700, tight tracking, oversized hero) |
| Mono / data type | JetBrains Mono |
| Spring | stiffness 300, damping 30, mass 0.8; CSS approx. `cubic-bezier(0.22, 1.36, 0.36, 1)` |
| Card radius | 18px (12px inner) |
| Spotlight | 340px radial glow, `rgba(153,69,255,0.14)`, tracks `--mx`/`--my` |
| Sound | Web Audio square blip, 1800→420 Hz, 28 ms, gain 0.06 → 0.0001 |
| Haptic | `navigator.vibrate(12)` per tap |

## Files

```
index.html            title, meta, Google Fonts
src/index.tsx         Solid render entry
src/App.tsx           bento layout: hero, health, 3 micro-tools, explorer, footer
src/data.ts           12 real projects + telemetry baselines
src/index.css         full token system, bento grid, spotlight, reduced-motion guard
src/lib/spring.ts     spring integrator (createSpringNumber) + formatters
src/lib/sound.ts      synthesized clicks, confirm chirp, haptics, persisted mute
```

## Verification (Nov 5, 2026)

- `npm install` — 78 packages, clean.
- `npm run build` — `tsc -b && vite build` succeeds; `dist/` = 32.34 kB JS (12.72 kB gzip),
  10.33 kB CSS. Two TS errors were found and fixed during the build (unused import,
  `Set<string>` initializer typing).
- `npm run dev` (port 5199) — served HTML with the correct title; `/src/index.tsx`
  transformed and served by Vite.
- `npm run preview` (port 5200) — HTTP 200, correct title. Bundle contains the app
  strings (Jupiter, Fee calculator, Staking estimator).
- Runtime rendering was verified at the HTTP/bundle level only — no live browser
  session was available to this agent, so visual rendering in a real browser is the
  one unverified step (run `npm run dev` and open http://localhost:5173 to see it).
