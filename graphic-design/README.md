# Solforge — Complete Brand Identity Kit

A complete, original brand identity for **Solforge**, a fictional Solana
developer-tooling startup (one CLI that compiles, tests and deploys Solana
programs). Tagline: *"Ship Solana programs at the speed of thought."*

**Tone in 3 adjectives: Precise · Bold · Developer-first.**

This is a Graphic Design proof-of-work artifact for a Superteam Earn profile.
Every file here is real, finished design work — hand-written vector masters
plus raster exports rendered from them — not prompts, mockups, or placeholders.

## What it demonstrates

- **Logo design:** an original mark (violet ingot + white S-flame stroke + mint
  spark), developed across 8 lockups: primary, horizontal, symbol, wordmark,
  monochrome, reversed, favicon, app icon.
- **Vector craft:** logo masters are pure SVG paths — the wordmark is a
  geometric 5×7 pixel font drawn as path data, so it renders identically
  everywhere with no font dependency. No `<text>` in any logo master.
- **Color system:** 8 tokens with hex/RGB values, usage rules, and measured
  WCAG contrast ratios (all text pairs AA or AAA).
- **Typography system:** a 3-family scale (Space Grotesk / Inter / JetBrains
  Mono) with sizes, weights, line heights, and usage rules.
- **Applied design:** the identity applied to 4 real formats (X banner, bounty
  card, title slide, social post) plus palette and type specimen sheets.
- **Production discipline:** a single reproducible build script, PNG exports at
  real sizes (16 px favicon → 1920 px slide), a favicon.ico, and a written
  verification log.

## File inventory

```
graphic-design/
├── README.md                        this file
├── SUBMISSION.md                    Superteam ADD-form copy
├── verification-log.md              measured verification results
├── build.py                         single source of truth — rebuilds everything
├── brand-preview.html               open in a browser to view the whole kit
├── logos/                           SVG masters (vector, path-only letterforms)
│   ├── solforge-logo-primary.svg        vertical lockup (default)
│   ├── solforge-logo-horizontal.svg     icon left, wordmark right
│   ├── solforge-logo-symbol.svg         mark alone
│   ├── solforge-logo-wordmark.svg       geometric wordmark alone
│   ├── solforge-logo-monochrome.svg     single-color, all ink
│   ├── solforge-logo-reversed.svg       white version for dark backgrounds
│   ├── solforge-favicon.svg             favicon source
│   └── solforge-app-icon.svg            full-bleed gradient app tile
├── assets/                          applied + system SVG sheets
│   ├── solforge-x-banner.svg            1500 × 500
│   ├── solforge-bounty-card.svg         1200 × 630 (OG size)
│   ├── solforge-title-slide.svg         1920 × 1080
│   ├── solforge-social-post.svg         1080 × 1080
│   ├── solforge-color-palette.svg       1200 × 860 swatch sheet
│   └── solforge-typography-specimen.svg 1200 × 900 type specimen
├── exports/                         PNG renders + favicon.ico
│   ├── logo-primary-light-1024.png  logo-primary-dark-1024.png
│   ├── logo-horizontal-1024.png
│   ├── logo-symbol-512/256/64/32/16.png
│   ├── icon-512.png  icon-180.png  favicon.ico
│   ├── x-banner-1500x500.png  bounty-card-1200x630.png
│   ├── title-slide-1920x1080.png  social-post-1080x1080.png
│   └── color-palette-1200x860.png  typography-1200x900.png
└── guidelines/
    └── brand-guidelines.md          logo usage, clear space, do/don'ts, voice
```

## How each asset was produced

1. **Brand strategy first** (per the Photo Agent / logo-studio workflow):
   three divergent metaphor directions were considered (architectural ingot,
   flame/energy, typographic letterform); the winner merges all three — a
   forge ingot holding an S-flame, with a spark as the memorable hook.
2. **Logo masters** were hand-written as SVG in `build.py`: the mark is
   explicit geometry (rounded rect, one Bézier S-stroke, one diamond); the
   wordmark is generated from a 5×7 pixel-font table into `<path>` rects.
3. **Applied assets** were composed as SVG using the installed brand fonts
   (Space Grotesk, Inter, JetBrains Mono — SIL OFL, downloaded from Google
   Fonts) and the same mark geometry.
4. **PNG exports** were rendered from the SVG masters with **cairosvg 2.9.1**
   (Cairo + librsvg stack), one render per size — no screenshots, no
   re-drawing. `favicon.ico` was built from the 16/32/48 px renders with Pillow.
5. **Verification** (`verify.py`, results in `verification-log.md`): every SVG
   parsed for well-formedness, logo masters checked for zero `<text>` elements,
   every PNG checked for magic bytes + exact dimensions, and every claimed
   contrast ratio recomputed from the hex values.

## Rebuild

```bash
python3 build.py     # regenerates all SVGs and all PNG exports
python3 verify.py    # re-runs every check, rewrites verification-log.md
```

Requires Python 3, `cairosvg`, `Pillow`, and the three brand fonts installed
(the fonts are only needed to render the applied-asset text, not the logos).

## Viewing

Open `brand-preview.html` in any browser — it shows every lockup on light and
dark backgrounds at multiple sizes, plus the applied assets. Or open any PNG in
`exports/` directly.

## Brand at a glance

- Palette: Forge Violet `#6D28D9` · Deep Violet `#4C1D95` · Pulse Mint
  `#00D9A6` · Solar Amber `#FFB020` · Midnight `#0B0B1A` · Paper `#F6F4FF` ·
  Slate `#8A8FA3` · Ink `#16132B`
- Type: Space Grotesk 700 (display) · Inter 400/600 (body) · JetBrains Mono
  500 (code/labels)
- Clear space: the height of the mint spark diamond, on all sides.
- Minimum sizes: symbol 24 px · horizontal lockup 160 px wide · primary
  lockup 200 px wide.
