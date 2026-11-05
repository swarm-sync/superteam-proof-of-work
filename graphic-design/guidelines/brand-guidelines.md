# Solforge — Brand Guidelines

**Solforge** is a fictional Solana developer-tooling startup: one CLI that compiles,
tests and deploys Solana programs. Tagline: **"Ship Solana programs at the speed
of thought."**

**Tone in 3 adjectives: Precise · Bold · Developer-first.**

This document is the usage authority for the identity. Everything in this kit is
original work created for this project — no existing brand assets were copied.
Solforge is a fictional brand; no trademark clearance has been performed.

---

## 1. The mark

The Forge mark is a rounded-square ingot in a Forge Violet → Deep Violet gradient,
holding a white **S-flame** — a single continuous stroke that reads as both the
letter S and a flame rising from the forge. A **mint spark** diamond escapes the
top-right corner. That spark is the memorable hook: it is the one element that
must never be removed, recolored, or moved.

Construction (120 × 120 unit grid):
- Ingot: x 8, y 8, 104 × 104, corner radius 26.
- S-flame: one open stroke, width 13, round caps.
- Spark: diamond centered at (96, 18), 20 units across.

### Lockups

| File | Use |
|---|---|
| `logos/solforge-logo-primary.svg` | Default. Vertical lockup, mark above wordmark. Marketing, covers, first choice. |
| `logos/solforge-logo-horizontal.svg` | Headers, nav bars, footers — anywhere horizontal space is tight. |
| `logos/solforge-logo-symbol.svg` | The mark alone. Avatars, app tiles, favicons, watermarks. |
| `logos/solforge-logo-wordmark.svg` | Text only, for when the mark already appears nearby. |
| `logos/solforge-logo-monochrome.svg` | Single-color reproduction (print, fax, engraving, one-color merch). All ink `#16132B`. |
| `logos/solforge-logo-reversed.svg` | White version for dark backgrounds. Never use the color logo on Midnight. |
| `logos/solforge-favicon.svg` | Browser favicon source (same art as the symbol). |
| `logos/solforge-app-icon.svg` | Full-bleed gradient tile for app stores / launchers. |

### Clear space

Clear space = **x**, where x is the height of the mint spark diamond (20 units on
the 120-unit mark). Keep at least x of empty space on all sides of any lockup.
Nothing — no text, no rule, no other logo, no page edge — enters the clear space.

### Minimum size

- Symbol alone: **24 px** (16 px favicon use only, where the spark may drop to a dot).
- Horizontal lockup: **160 px wide**.
- Primary (vertical) lockup: **200 px wide**.
- Below these sizes, use the symbol alone.

### Logo do's and don'ts

**Do**
- Use the primary lockup first; horizontal second; symbol alone only at small sizes.
- Use the reversed logo on Midnight and on the violet gradient.
- Use the monochrome logo for single-color reproduction.
- Keep the gradient direction: top-left violet → bottom-right deep violet.

**Don't**
- Don't stretch, squash, rotate, or re-space the logo.
- Don't recolor the mark, the S-flame, or the spark (mint is the only spark color).
- Don't place the color logo on Midnight, on violet, or on any low-contrast photo.
- Don't add drop shadows, glows, outlines, or bevels.
- Don't set the wordmark in any other typeface, and don't retype it — use the supplied SVG.
- Don't crop the spark off, and don't use the S-flame without the ingot except at favicon size.

---

## 2. Color system

| Token | Hex | RGB | Role |
|---|---|---|---|
| Forge Violet | `#6D28D9` | 109, 40, 217 | Primary. Brand, headlines on light, CTAs. |
| Deep Violet | `#4C1D95` | 76, 29, 149 | Primary dark. Gradient end, dark violet surfaces. |
| Pulse Mint | `#00D9A6` | 0, 217, 166 | Accent. The spark, success states, code highlights. |
| Solar Amber | `#FFB020` | 255, 176, 32 | Secondary accent. Rewards, bounties, alerts only. |
| Midnight | `#0B0B1A` | 11, 11, 26 | Dark surfaces, dark-mode background. |
| Paper | `#F6F4FF` | 246, 244, 255 | Light surfaces, light-mode background. |
| Slate | `#8A8FA3` | 138, 143, 163 | Muted text, captions, dividers. |
| Ink | `#16132B` | 22, 19, 43 | Headlines and body text on light. |

**Usage rules**
- Violet leads. Mint sparks. Amber is rationed: bounties, rewards, warnings — never
  as a general highlight, never beside mint at equal weight.
- Light mode: Paper background, Ink text, Violet accents. Dark mode: Midnight
  background, white text, Mint accents.
- The violet gradient is used for the mark, hero surfaces, and the bounty card —
  never for body text.
- Full swatch sheet: `assets/solforge-color-palette.svg` / `exports/color-palette-1200x860.png`.

**Contrast (WCAG, measured — see `verification-log.md`)**
- White on Forge Violet: 7.1:1 — AAA.
- Forge Violet on Paper: 6.5:1 — AA.
- Ink on Paper: 16.6:1 — AAA.
- Pulse Mint on Midnight: 10.7:1 — AAA.
- Solar Amber on Midnight: 10.7:1 — AAA.
- Slate on Midnight: 6.1:1 — AA (muted text only, never body copy).
- White on Deep Violet: 11.0:1 — AAA.

---

## 3. Typography

| Role | Font | Weight | Size / Line height |
|---|---|---|---|
| Display | Space Grotesk | 700 | 64 px / 1.05 |
| H1 | Space Grotesk | 700 | 48 px / 1.15 |
| H2 | Space Grotesk | 700 | 36 px / 1.15 |
| Body | Inter | 400 | 18 px / 1.6 |
| Caption | Inter | 600 | 14 px / 1.5 |
| Code / labels | JetBrains Mono | 500 | 16 px / 1.5 |

All three families are open-licensed (SIL OFL) Google Fonts.

**Rules**
- Display is Space Grotesk Bold only, never below 32 px.
- Body copy is Inter only — never set paragraphs in Space Grotesk.
- Commands, rewards, eyebrows and labels are JetBrains Mono — never set code in Inter.
- Headline case: sentence case. Eyebrows and labels: uppercase mono, short.
- Full specimen: `assets/solforge-typography-specimen.svg` / `exports/typography-1200x900.png`.

---

## 4. Voice

Solforge speaks like a senior engineer who respects your time: direct, specific,
no hype.

**Do:** name the outcome and the time it takes ("Test in milliseconds. Deploy
with one command."). Use the second person. Show the command.
**Don't:** say "revolutionary", "seamless", "next-gen", or "supercharge". Don't
promise what the tool doesn't do. Don't shout — one exclamation mark per page,
at most.

Example — good: *"`solforge test --watch` reruns your suite on every save.
Median run: 41 ms."*
Example — bad: *"Revolutionize your Solana workflow with our seamless,
next-generation super-tool!"*

---

## 5. Applied assets

| Asset | File | Size |
|---|---|---|
| X / Twitter banner | `assets/solforge-x-banner.svg` | 1500 × 500 |
| Bounty card template | `assets/solforge-bounty-card.svg` | 1200 × 630 |
| Presentation title slide | `assets/solforge-title-slide.svg` | 1920 × 1080 |
| Social post | `assets/solforge-social-post.svg` | 1080 × 1080 |
| Color palette sheet | `assets/solforge-color-palette.svg` | 1200 × 860 |
| Typography specimen | `assets/solforge-typography-specimen.svg` | 1200 × 900 |

PNG renders of every asset live in `exports/`. To reuse the bounty card, replace
the headline and the reward chip text only — layout, colors and spacing stay fixed.

---

## 6. File inventory

See `README.md` for the complete inventory. To rebuild every file from source,
run `python3 build.py` (requires Python 3 + `cairosvg`; the script is the single
source of truth for the whole kit).

---

*Solforge is a fictional brand created as a design exercise. Before any commercial
use, search the USPTO trademark database for similar marks and consult counsel.*
