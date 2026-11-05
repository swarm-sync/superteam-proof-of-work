# Design System — "Earn Discovery" (concept)

Design tokens for the Superteam Earn bounty-discovery redesign. All contrast ratios were **computed** (WCAG relative-luminance formula, sRGB), not estimated. AA normal text needs ≥ 4.5:1; AA large text ≥ 3:1; AAA normal ≥ 7:1.

## 1. Colour

### Light mode (default)

| Token | Hex | Used for | Contrast on | Ratio | WCAG |
|---|---|---|---|---|---|
| `--ink` | `#14161F` | Primary text | `#FFFFFF` | **18.04:1** | AAA |
| `--ink-2` | `#4B5563` | Secondary text, meta | `#FFFFFF` | **7.56:1** | AAA |
| `--surface` | `#FFFFFF` | Page background | — | — | — |
| `--surface-2` | `#F6F7FB` | Cards, panels | — | — | — |
| `--surface-3` / `--primary-soft` | `#F3EFFF` | Tinted surfaces, badges | — | — | — |
| `--line` | `#E2E5EC` | Hairline borders | — | — | — |
| `--line-strong` | `#C9CEDB` | Input borders | — | — | — |
| `--primary` "Orbit Violet" | `#5B21B6` | Links, primary buttons, active states | `#FFFFFF` | **8.98:1** | AAA |
| White on `--primary` | `#FFFFFF` on `#5B21B6` | Button labels | `#5B21B6` | **8.98:1** | AAA |
| `--accent` "Mint" | `#0E7C4A` | Success, first-timer badges | `#FFFFFF` | **5.25:1** | AA |
| `--accent-soft` | `#EAF7EF` | Success backgrounds | `#0E7C4A` text | **4.76:1** | AA |
| `--warn` | `#92400E` | Warnings, amber badges | `#FFFFFF` | **7.09:1** | AAA |
| `--warn-soft` | `#FEF3C7` | Warning backgrounds | `#92400E` text | **6.37:1** | AAA |
| `--danger` | `#B91C1C` | Errors | `#FFFFFF` | **6.47:1** | AAA |
| `--gold` | `#FFD166` | Highlights, reward emphasis | `#14161F` text | **12.51:1** | AAA |
| `--focus` | `#1D4ED8` | Focus ring | — | — | 3px outline, non-text |

### Dark mode

| Token | Hex | Contrast on | Ratio | WCAG |
|---|---|---|---|---|
| `--ink` | `#F2F3F7` on `#0F111A` | — | **16.98:1** | AAA |
| `--ink-2` | `#A7AEC2` on `#0F111A` | — | **8.50:1** | AAA |
| `--primary` | `#A78BFA` on `#0F111A` | — | **6.92:1** | AAA |
| `--accent` | `#34D399` on `#0F111A` | — | **9.79:1** | AAA |

> **Deliberate choice:** the light-mode violet `#5B21B6` fails as a dark-mode primary (too dark on a dark surface), so dark mode uses the lighter `#A78BFA`. The mid-violet `#8B5CF6` was tested on `#0F111A` and **rejected** — 4.45:1, just under the 4.5:1 AA bar for normal text. Never use `#8B5CF6` for text on dark.

### Usage rules
- Colour is never the only signal: badges pair colour with text ("First-timer friendly", not a green dot); errors pair colour with text and an icon; the save state pairs colour with a ★/☆ change and `aria-pressed`.
- The **Wireframe toggle** in the prototype re-skins every screen in grayscale to prove no meaning is carried by colour alone.

## 2. Typography

System stack (no webfont dependency — the prototype must work offline): `Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

| Style | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | clamp(28px, 4.5vw, 40px) / 1.15 | 800 | −0.02em | Page hero (Discover) |
| H1 | 32px / 1.15 | 800 | −0.02em | Bounty title |
| H2 | 24px / 1.25 | 700 | −0.01em | Section headings |
| H3 | 18px / 1.3 | 700 | 0 | Card titles, panel headings |
| Body | 16px / 1.55 | 400 | 0 | Body copy (16px minimum — no 14px body text) |
| Meta | 14px / 1.5 | 400–600 | 0 | Dates, counts, secondary info |
| Caption / badge | 12–12.5px / 1.4 | 700 | +0.04em (uppercase) | Tags, badges |
| Reward | 22px / 1.2 | 800 | −0.02em | Reward on cards; 32px on detail |

- **Scale ratio:** 1.25 (major third) from the 16px base: 12.5 → 16 → 20 → 25 → 31.25 (rounded to the table above for implementation).
- **Line length:** body copy capped at ~65ch (`.lede` max-width 640px).
- **Numbers:** reward figures use tabular spacing via `font-weight:800` and `letter-spacing:-.02em`; never set prices in a light weight.

## 3. Spacing — 8pt grid

Base unit 4px; all spacing is a multiple of 4: `--space-1:4px, --space-2:8px, --space-3:16px, --space-4:24px, --space-5:32px, --space-6:48px`. Component padding: cards 16px, panels 20px, buttons 10px vertical / 18px horizontal. Grid gaps: 16px (cards), 24px (two-column layout). Page max-width 1120px, side padding 16px mobile / 24px desktop.

## 4. Components (states documented)

### Button — primary
- **Default:** violet `#5B21B6`, white bold text, 10px radius, 10px/18px padding.
- **Hover:** `#4C1D95`. **Active:** translateY(1px). **Focus:** 3px `--focus` outline, 2px offset. **Disabled:** not used for primary actions in this flow — validation is inline instead of disabling submit (disabled buttons hide the reason; see accessibility notes).

### Button — ghost / toggle pills
- Ghost: transparent, 1px `--line-strong` border. Pills: 999px radius, `aria-pressed` true → filled primary with white text.
- **Save button:** `aria-pressed` toggles ☆ Save → ★ Saved; saved state uses `--accent-soft` background + accent border.

### Bounty card
- Anatomy: colour thumb (sponsor + type) → badge row (experience tag + days left) → title (link) → blurb → reward + split → skill chips → footer (submission count + save).
- **Hover:** border turns primary. **Focus:** the title link takes focus (the whole card is not a link — nested interactive elements must stay individually focusable).
- **Responsive:** 1 column <640px, 2 columns 640–960px, 3 columns ≥960px.

### Form fields
- Labels above inputs, bold 15px; hint text 13.5px `--ink-2` below; error text 13.5px `--danger` bold, shown only on failed validation, with `aria-invalid="true"` on the field and the error linked by proximity (error element follows the input in DOM order).
- Inputs: 1px `--line-strong` border, 10px radius, 11px/12px padding; focus gets the global focus ring (never remove the outline without replacing it).
- **Step indicator:** 3 segments, current = primary with `aria-current="step"`, completed = accent with a check state.

### Tags / badges
- Uppercase, 12px, 700 weight, 999px radius. Variants: primary-soft (default), accent-soft (first-timer friendly), warn-soft (deadline pressure). Text label always present.

### Empty state
- Dashed border, centred, explains the situation and offers one recovery action ("Clear all filters") — never a dead end.

## 5. Motion

- Transitions: background/transform 150ms ease. No layout-shifting animations. `scroll-behavior:smooth` on `html`, **disabled** under `prefers-reduced-motion: reduce` (all animation/transition set to `none`).
- No auto-playing motion anywhere in the prototype; the success state uses a static emoji, not an animated confetti or spinner.

## 6. Dark / light guidance

- Dark mode is a full token swap (see table), not an overlay: surfaces darken, text lightens, primary lightens, borders use `--line:#262B3A`.
- Elevation in dark mode comes from border + shadow opacity, not lighter surfaces — surface-2 is only one step lighter than the page background.
- The wireframe mode is a third theme: grayscale + dashed borders, proving layout independence from colour.

## 7. Developer handoff notes

- Tokens live in `:root` in `prototype/index.html` (`<style>` block, "TOKENS" section) — copy them verbatim; do not re-derive hex values from screenshots.
- Breakpoints: 640px, 860px, 960px. Grid: `repeat(auto)` replaced by explicit 1/2/3-column rules for predictable card heights.
- All interactive states are real in the prototype — inspect the live CSS rather than this document when they disagree; this document is the spec, the prototype is the source of truth.
