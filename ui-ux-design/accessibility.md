# Accessibility Annotation — Earn Discovery Redesign

Target: **WCAG 2.2 AA** throughout the prototype, with AAA contrast where it costs nothing (see `design-system.md` for computed ratios). This document annotates what was built, where, and what remains untested.

## 1. What was built into the prototype

### Keyboard navigation
- **Skip link** ("Skip to main content") is the first focusable element; visible on focus, jumps to `<main id="main">`.
- **Logical tab order:** header nav → view toggles → hero filters → search → sort → results → cards (title link, then save button) → footer. DOM order matches visual order on every screen; no `tabindex` above 0 except `-1` on headings that receive focus after routing.
- **Hash routing moves focus:** after each route change, the new screen's `h1` receives focus (`tabindex="-1"`), so screen-reader and keyboard users land on the new content instead of staying at the top of the old page.
- **Esc returns to Discover** from the detail and apply screens — a documented, discoverable exit (also listed in the footer).
- **All filters are real `<button>`s** with `aria-pressed`; the search is a labelled `<input type="search">`; sort is a native `<select>`. No div-buttons, no click-only controls.
- **Save buttons** are real buttons with `aria-pressed` and a text change (☆ Save → ★ Saved), so the state is perceivable without colour.
- **Apply form:** step navigation is button-driven; on step change, focus moves to the first field of the new step; on validation failure, focus stays on the invalid field and `aria-invalid="true"` is set.
- **Focus visible everywhere:** `:focus-visible` gives a 3px `#1D4ED8` outline with 2px offset on all interactive elements, in both themes.

### Screen readers
- Results count is `role="status"` + `aria-live="polite"` — filter changes announce "6 bounties · UI/UX Design" without moving focus.
- Step indicator uses `aria-current="step"` on the current step and a `done` class (with accent colour + text state) on completed steps.
- Reward split is a `role="list"` with three `role="listitem"` entries on the detail page — announced as a list, not a run-on sentence.
- Decorative elements are hidden: the colour thumbs are `aria-hidden="true"` (the sponsor/type text is duplicated in the card body), the success emoji is `aria-hidden="true"`.
- Form errors are plain text adjacent to their fields (DOM order), announced when they appear because the field receives `aria-invalid` and the error is the next sibling; the review box is `aria-live="polite"`.
- The `sr-only` search label and the visually-hidden sort label give every control an accessible name.

### Contrast & colour
- Every text/background pair in the system meets AA; most meet AAA (computed ratios in `design-system.md`). The one near-miss found during design — `#8B5CF6` on dark at 4.45:1 — was **rejected** and replaced with `#A78BFA`.
- Colour is never the only signal: badges have text labels; the save state changes text and icon, not just colour; errors add text and `aria-invalid`; step state is conveyed by text ("1 · Your profile") as well as colour.
- The **Wireframe toggle** re-skins the whole prototype in grayscale — a live test that no meaning depends on colour.

### Motion
- `prefers-reduced-motion: reduce` disables smooth scrolling and all transitions/animations via a media query in the prototype CSS.
- No auto-playing, blinking, or parallax content. The only "animation" is a 150ms background/transform transition on hover.

### Forms & errors
- Validation is **inline and immediate per step**, not a summary at the end: the exact field, the exact problem, in plain language ("Add a valid link starting with https://").
- The wallet-address field carries the honest warning that payouts can't be reversed — before the user types, not after a mistake.
- Submit is never disabled: a disabled button hides *why* you can't proceed. Instead, validation explains.
- Character counter on the approach field (`0 / 1200 characters`) is visible text, updated on input.

### Responsive / zoom
- Layout is fluid with breakpoints at 640 / 860 / 960px; the card grid collapses 3 → 2 → 1 column.
- Text is set in `px` with a 16px base, but the layout uses no fixed heights that would clip text at 200% zoom; the hero title uses `clamp()` so it scales down on narrow screens.
- Touch targets: buttons and pills are ≥ 36px tall on mobile (primary buttons 44px); the minimum recommended target is 24×24px (WCAG 2.2 AA) — this design exceeds it.

## 2. WCAG 2.2 AA checklist (annotated)

| Criterion | Status in prototype | Note |
|---|---|---|
| 1.1.1 Non-text content | ✅ | Decorative art hidden; badges/chips are text |
| 1.3.1 Info & relationships | ✅ | Real headings, lists, labels; step list is an `<ol>` |
| 1.3.2 Meaningful sequence | ✅ | DOM order = visual order |
| 1.4.1 Use of colour | ✅ | Text/icon always accompanies colour |
| 1.4.3 Contrast (minimum) | ✅ | All text pairs ≥ 4.5:1 (computed) |
| 1.4.10 Reflow | ✅ | 320px width: single column, no horizontal scroll |
| 1.4.11 Non-text contrast | ✅ | Input borders, focus ring ≥ 3:1 against adjacent colours |
| 1.4.12 Text spacing | ⚠️ untested | No fixed heights; verify with a text-spacing bookmarklet |
| 2.1.1 Keyboard | ✅ | Every action reachable by keyboard |
| 2.1.2 No keyboard trap | ✅ | No modals; Esc exits to Discover |
| 2.2.2 Pause, stop, hide | ✅ | No moving content |
| 2.4.1 Bypass blocks | ✅ | Skip link |
| 2.4.3 Focus order | ✅ | Logical, matches visual order |
| 2.4.7 Focus visible | ✅ | 3px outline, all themes |
| 2.4.11 Focus not obscured (minimum) | ✅ | Sticky header is 60px; focus target scrolls into view below it via heading focus |
| 2.5.8 Target size (minimum) | ✅ | ≥ 24×24px everywhere |
| 3.2.1 On focus | ✅ | Focus never triggers a context change |
| 3.2.2 On input | ✅ | Changing a filter updates results (expected, announced); it never navigates |
| 3.3.1 Error identification | ✅ | Field-level errors in text |
| 3.3.2 Labels or instructions | ✅ | All fields labelled; hints provided |
| 3.3.3 Error suggestion | ✅ | Errors say how to fix ("starting with https://") |
| 4.1.2 Name, role, value | ✅ | Native controls; `aria-pressed`/`aria-current`/`aria-invalid` where state is custom |
| 4.1.3 Status messages | ✅ | `role="status"` on results count and review box |

## 3. Known gaps — not yet verified

These are honest gaps, not hidden ones. They are the first tasks for a real testing pass:

1. **No screen-reader test run** — the ARIA is written to spec, but it has not been driven through VoiceOver/NVDA. Highest-priority follow-up.
2. **No automated audit** — no Lighthouse/WAVE/axe run was available in this build environment; run `axe-core` against `prototype/index.html` before presenting as "audited".
3. **Text-spacing (1.4.12) and 200% zoom** — not manually exercised; the layout is designed to tolerate them but that is unproven.
4. **Reduced-motion** is implemented via media query but not tested with the OS setting on.
5. **Colour-thumb contrast** — the sponsor colour blocks use white text on saturated backgrounds (`#0E7C4A` white text = 5.25:1 ✓; `#BE185D` and `#B45309` white text are decorative only and `aria-hidden`, so they carry no information — acceptable, but a real brand palette would need checking).
6. **Timezone handling** — the detail page says "check the deadline in your own timezone"; a production version should render the deadline in the user's local time automatically.
