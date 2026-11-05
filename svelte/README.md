# Solana Bounty Board — Accessible Svelte 5 App

An accessible, mobile-first bounty board for the Solana ecosystem, built with **Svelte 5 (runes) + Vite**. Eight sample bounties can be searched, filtered by skill, sorted by deadline or reward, and opened in an accessible modal dialog.

## What it demonstrates

- **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`) and reusable components (`BountyCard`, `FilterBar`, `BountyDialog`)
- **Pure, tested logic**: filtering/sorting lives in `src/lib/bounties.js`, framework-independent, covered by 5 Vitest tests
- **WCAG 2.1 AA accessibility** (see below)
- **Mobile-first responsive layout**: 1 column → 2 (≥640px) → 3 (≥1024px); 44px minimum touch targets
- **Performance**: static data (no network waterfall), system fonts (no font download), tiny bundle (see Verification)

## Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---|---|
| Keyboard | Skip link to the bounty list; visible `:focus-visible` outlines (never removed); one tab stop per card; Escape closes the dialog; Tab is trapped inside the dialog; focus returns to the triggering button on close |
| Screen readers | Labelled search/sort controls; skill radio group in `<fieldset>/<legend>`; `aria-live="polite"` result count; real `<time datetime>`, `<dl>` and list semantics; dialog has `role="dialog"`, `aria-modal`, `aria-labelledby` |
| Errors/empty state | Empty results announced with `role="status"` plus a “Clear filters” action |
| Contrast & motion | Body text ≥ 4.5:1; `prefers-reduced-motion` disables smooth scrolling/transitions |
| Touch | All interactive targets ≥ 44px |

## Performance — Core Web Vitals considerations

- **LCP**: no web fonts, no hero image, static data — first paint is the real content. Production JS is 53 kB (20 kB gzip).
- **CLS**: cards use a CSS grid with reserved layout; no late-loading images or fonts to shift content.
- **INP**: filtering is a cheap derived computation over 8 items; no per-keystroke network calls (search input is local state).
- **Next step in production**: paginate the API, add `loading="lazy"` images, and serve with cache headers + a CDN.

## Run it

```bash
cd svelte
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest, 5 tests
npm run build    # production build into dist/
npm run preview  # serve the production build on http://localhost:4173
npm run check    # svelte-check (type/a11y lint)
```

Requires Node 18+ (verified on Node v24.22.1, npm 10.9.4).

## Verification (run 2026-11-05, this machine)

- `npm install` — added 78 packages (after downgrading Vite 6 → 5: `@sveltejs/vite-plugin-svelte@4` peers Vite 5 only; see note below)
- `npm test` — **5 passed / 5** (`src/lib/bounties.test.js`)
- `npm run build` — success in 5.09s; `dist/assets/index-2KFz5BwT.js` 53.35 kB (gzip 20.40 kB), CSS 4.82 kB (gzip 1.48 kB)
- `npm run preview` smoke test — `GET /` → **200**, JS and CSS assets → **200**
- One build warning remains: Svelte's a11y lint flags the overlay `<div>` click handler (click-outside-to-close). The dialog itself is fully keyboard-operable (Escape + Close button), so the overlay click is a supplementary pointer affordance, not the only close path.

## Known limitation

No backend: bounty data is a static sample in `src/lib/bounties.js`. The “Apply” path is intentionally a demo note, not a fake submission.
