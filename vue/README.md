# Solana Grant Application Wizard — Accessible Vue 3 App

A **multi-step grant application wizard** for the Solana ecosystem, built with **Vue 3 Composition API + Vite**. Four steps — Project → Team → Budget → Review — with per-step validation, an accessible stepper, autosaved drafts, and focus management on every step change.

## What it demonstrates

- **Vue 3 Composition API**: `useWizard` composable (step state machine, validation guards, submit), `useDraft` composable (debounced localStorage autosave/restore)
- **Typed props**: every component declares typed props with `defineProps` (`String`/`Number`/`Object`/`Array`, required flags) and explicit `defineEmits`
- **Reusable components**: `Field` (label + hint + `aria-invalid`/`aria-describedby` error wiring), `Stepper`, and one component per step
- **Pure, tested logic**: validation in `src/lib/validation.js`, covered by 5 Vitest tests
- **WCAG 2.1 AA accessibility** (see below)
- **No backend, no data leaving the browser**: the draft lives only in localStorage; submission is a demo confirmation

## Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---|---|
| Keyboard | Skip link; visible `:focus-visible` outlines; step heading (`tabindex="-1"`) receives focus on every step change; error summary (`role="alert"`, `tabindex="-1"`) receives focus when validation fails |
| Screen readers | Stepper is an `<ol>` with `aria-current="step"`; determinate `role="progressbar"` with `aria-valuenow`; errors linked to inputs via `aria-describedby` + `aria-invalid`; error summary announces the problem count; success panel uses `role="status"` |
| Validation | Per-step, on Continue — never silently; all steps re-validated before submit (review alone cannot bypass it) |
| Contrast & motion | Body text ≥ 4.5:1; `prefers-reduced-motion` honoured; 44px minimum touch targets |

## Performance approach

- **Tiny bundle**: production JS 84.70 kB (32.52 kB gzip), CSS 5.41 kB — Vue runtime only, no UI library, no icon font, system fonts.
- **No network on the critical path**: no API calls, no fonts, no images — the form is interactive as soon as the JS loads.
- **Cheap reactivity**: validation runs only on navigation/submit, not per keystroke; draft autosave is debounced (400 ms) and local only.
- **Next step in production**: code-split steps with `defineAsyncComponent`, add server persistence with optimistic UI, and measure INP on low-end mobile.

## Run it

```bash
cd vue
npm install
npm run dev      # http://localhost:5174
npm test         # Vitest, 5 tests
npm run build    # production build into dist/
npm run preview  # serve the production build on http://localhost:4174
```

Requires Node 18+ (verified on Node v24.22.1, npm 10.9.4).

## Verification (run 2026-11-05, this machine)

- `npm install` — added 69 packages, no errors
- `npm test` — **5 passed / 5** (`src/lib/validation.test.js`)
- `npm run build` — success in 5.10s; `dist/assets/index-8iWDiws0.js` 84.70 kB (gzip 32.52 kB), CSS 5.41 kB (gzip 1.60 kB)
- `npm run preview` smoke test — `GET /` → **200**, JS asset → **200**

## Known limitation

Demo only: submission shows a confirmation and clears the draft, but sends nothing to a server. No real grant is filed.
