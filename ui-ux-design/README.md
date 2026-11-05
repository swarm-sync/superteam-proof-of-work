# UI/UX Design — Superteam Earn Bounty Discovery Redesign

A complete UX case-study package redesigning **Superteam Earn's bounty discovery experience for first-time contributors** — so a newcomer can tell in under a minute whether a bounty fits their skills, time, and experience, and apply with confidence.

## What this demonstrates

- **End-to-end UX case study** — problem framing, personas, honest research assumptions, design decisions with trade-offs, and measurable success criteria.
- **Interactive prototype** — a real clickable product flow (not screenshots): discovery with working filters/search/sort/save, a bounty detail page, and a validated 3-step application with a review step and success state.
- **Accessibility as a built-in** — skip link, keyboard navigation, focus management on route change, ARIA live regions, inline validation, WCAG 2.2 AA annotation, and computed contrast ratios.
- **Design system** — tokens, colour palette with verified contrast ratios, typography scale, 8pt spacing grid, component states, dark mode, and a wireframe mode that proves the layout works without colour.

## Files

| File | What it is |
|---|---|
| `case-study.md` | Full case study: problem, users, research (assumptions labelled honestly), decisions, trade-offs, success metrics |
| `prototype/index.html` | Self-contained interactive prototype — Discover, Bounty detail, Apply (3 steps), success state |
| `flows/discovery-flow.svg` | Discovery user-flow diagram |
| `flows/apply-flow.svg` | Application user-flow diagram |
| `wireframes/wireframe-discover.svg` | Low-fi wireframe — Discover |
| `wireframes/wireframe-detail.svg` | Low-fi wireframe — Bounty detail |
| `wireframes/wireframe-apply.svg` | Low-fi wireframe — Apply flow |
| `design-system.md` | Tokens, palette + computed contrast ratios, type scale, spacing, components, dark mode |
| `accessibility.md` | WCAG 2.2 AA annotation, what was built, known gaps |
| `README.md` | This file |
| `SUBMISSION.md` | Suggested Superteam ADD-form copy |

## How to view the prototype

No build step, no server, no dependencies. Open `prototype/index.html` in any modern browser (double-click it, or serve the folder with any static server).

**Try this path (2 minutes):**
1. On Discover, click the **UI/UX Design** pill, turn on **First-timer friendly only**, sort by **Fewest submissions**.
2. Save a bounty with ☆ Save (it persists via localStorage).
3. Open a bounty card, read the reward split and judging criteria, click **Start application**.
4. On step 1, click **Continue** with empty fields — validation is inline, per field. Fill it in and complete all 3 steps to the success screen.
5. Toggle **Wireframe** (top-right) to see the same screens in low-fi grayscale, and **Dark** for dark mode.

**Keyboard:** Tab / Shift+Tab to move, Enter to open, Esc returns to Discover from any screen.

## Honesty notes

- This is a **design concept**, not a commissioned engagement: no usability tests were run on the live product and no Superteam analytics were accessed. Research assumptions are labelled as assumptions in the case study, with the test that would validate each one.
- Bounty listings in the prototype are **illustrative**, modelled on real Earn listing structures (reward splits, sponsors from the Solana ecosystem, realistic deadlines). They are not live listings.
- Accessibility gaps that are real and untested (no screen-reader run, no axe/Lighthouse audit in this environment) are listed in `accessibility.md` §3 rather than hidden.
