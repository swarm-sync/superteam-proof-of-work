#!/usr/bin/env python3
"""Solforge brand kit builder — generates every SVG master, then renders PNG exports via cairosvg.

Brand: SOLFORGE — Solana developer tooling (build, test & ship Solana programs faster).
Tone: Precise · Bold · Developer-first.
Palette: Forge Violet #6D28D9 / Deep Violet #4C1D95 / Pulse Mint #00D9A6 /
         Solar Amber #FFB020 / Midnight #0B0B1A / Paper #F6F4FF / Slate #8A8FA3 / Ink #16132B
Type: Space Grotesk 700 (display) / Inter 400+600 (body) / JetBrains Mono 500 (code/labels)
All logo letterforms are vector paths (5x7 geometric pixel font) — no <text> in logo masters.
"""
import os
from pathlib import Path

BASE = Path(__file__).parent
LOGOS = BASE / "logos"
EXPORTS = BASE / "exports"
ASSETS = BASE / "assets"
for d in (LOGOS, EXPORTS, ASSETS):
    d.mkdir(parents=True, exist_ok=True)

VIOLET = "#6D28D9"
DEEP = "#4C1D95"
MINT = "#00D9A6"
AMBER = "#FFB020"
MIDNIGHT = "#0B0B1A"
PAPER = "#F6F4FF"
SLATE = "#8A8FA3"
INK = "#16132B"
WHITE = "#FFFFFF"

# ---------------------------------------------------------------- logo mark ---
# The Forge mark: rounded-square ingot, gradient violet; white S-flame stroke;
# mint spark diamond escaping the top-right corner (the "forge spark" hook).
S_PATH = ("M84 38 C84 28 72 22 60 22 C44 22 36 32 36 44 "
          "C36 60 84 56 84 74 C84 88 74 98 60 98 C48 98 38 92 36 82")
SPARK = "96,8 106,18 96,28 86,18"


def symbol_group(fill_square, s_stroke, spark_fill, grad_id=None):
    sq = (f'<rect x="8" y="8" width="104" height="104" rx="26" fill="{fill_square}" stroke="none"/>'
          if grad_id is None else
          f'<rect x="8" y="8" width="104" height="104" rx="26" fill="url(#{grad_id})" stroke="none"/>')
    return (sq +
            f'<path d="{S_PATH}" fill="none" stroke="{s_stroke}" stroke-width="13" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
            f'<polygon points="{SPARK}" fill="{spark_fill}" stroke="none"/>')


def svg_doc(viewbox, inner, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" '
            f'aria-label="{title}" preserveAspectRatio="xMidYMid meet">\n'
            f'<title>{title}</title>\n{inner}\n</svg>\n')


GRAD = ('<defs><linearGradient id="forge" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{VIOLET}"/><stop offset="1" stop-color="{DEEP}"/>'
        '</linearGradient></defs>')

# ------------------------------------------------------- geometric wordmark ---
# 5x7 pixel font, drawn as filled rects -> pure <path> wordmark, no <text>.
FONT = {
    "S": [".###.", "#...#", "#....", ".###.", "....#", "#...#", ".###."],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "G": [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
}
CELL = 10
WM_W, WM_H = 470, 70  # 8 letters x 50 + 7 gaps x 10


def wordmark_path(x0=0, y0=0, fill=VIOLET):
    """Return a single <path> of rects spelling SOLFORGE."""
    parts = []
    for i, ch in enumerate("SOLFORGE"):
        ox = x0 + i * 60
        for r, row in enumerate(FONT[ch]):
            for c, px in enumerate(row):
                if px == "#":
                    parts.append(f"M{ox + c * CELL} {y0 + r * CELL}h{CELL}v{CELL}h-{CELL}Z")
    return f'<path d="{" ".join(parts)}" fill="{fill}" stroke="none"/>'


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")
    print("wrote", path)

# ------------------------------------------------------------------- logos ---
# 1. Symbol only (color)
write(LOGOS / "solforge-logo-symbol.svg",
      svg_doc("0 0 120 120", GRAD + symbol_group(None, WHITE, MINT, "forge"),
              "Solforge logo mark"))
# 2. Vertical lockup: mark above wordmark
write(LOGOS / "solforge-logo-primary.svg",
      svg_doc("0 0 510 240",
              GRAD +
              f'<g transform="translate(195,0)">{symbol_group(None, WHITE, MINT, "forge")}</g>'
               +
              wordmark_path(20, 150, VIOLET),
              "Solforge primary logo"))
# 3. Horizontal lockup: mark left, wordmark right (wordmark scaled to 48 tall)
write(LOGOS / "solforge-logo-horizontal.svg",
      svg_doc("0 0 510 140",
              GRAD +
              f'<g transform="translate(20,10)">{symbol_group(None, WHITE, MINT, "forge")}</g>' +
              f'<g transform="translate(164,46) scale(0.6857)">{wordmark_path(0, 0, INK)}</g>',
              "Solforge horizontal logo"))
# 4. Wordmark only (color)
write(LOGOS / "solforge-logo-wordmark.svg",
      svg_doc("0 0 510 110", wordmark_path(20, 20, VIOLET), "Solforge wordmark"))
# 5. Monochrome (all ink, flat — no gradient)
write(LOGOS / "solforge-logo-monochrome.svg",
      svg_doc("0 0 510 240",
              f'<g transform="translate(195,0)">{symbol_group(INK, PAPER, INK)}</g>' +
              wordmark_path(20, 150, INK),
              "Solforge logo monochrome"))
# 6. Reversed (white on transparent, for dark backgrounds)
write(LOGOS / "solforge-logo-reversed.svg",
      svg_doc("0 0 510 240",
              f'<g transform="translate(195,0)">{symbol_group(WHITE, MIDNIGHT, MINT)}</g>' +
              wordmark_path(20, 150, WHITE),
              "Solforge logo reversed"))
# 7. Favicon (symbol only, same as #1 but standalone file)
write(LOGOS / "solforge-favicon.svg",
      svg_doc("0 0 120 120", GRAD + symbol_group(None, WHITE, MINT, "forge"),
              "Solforge favicon"))
# 8. App icon (full-bleed gradient tile, mark scaled up)
write(LOGOS / "solforge-app-icon.svg",
      svg_doc("0 0 1024 1024",
              GRAD +
              '<rect x="0" y="0" width="1024" height="1024" rx="230" fill="url(#forge)" stroke="none"/>'
              f'<g transform="translate(152,152) scale(6)">{symbol_group("none", WHITE, MINT)}</g>',
              "Solforge app icon"))
print("logos done")

# ------------------------------------------------------------- applied assets ---
# Display graphics use real <text> (Space Grotesk / Inter / JetBrains Mono,
# installed locally from Google Fonts, OFL) — logo masters stay path-only.
DISPLAY = "'Space Grotesk', sans-serif"
BODY = "'Inter', sans-serif"
MONO = "'JetBrains Mono', monospace"

MARK = symbol_group(None, WHITE, MINT, "forge")  # 120x120 symbol, gradient def needed


def asset_svg(w, h, inner, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="{title}">\n<title>{title}</title>\n{GRAD}{inner}\n</svg>\n')

# 1. X / Twitter banner 1500x500
write(ASSETS / "solforge-x-banner.svg", asset_svg(1500, 500, f'''
<rect x="0" y="0" width="1500" height="500" fill="{MIDNIGHT}"/>
<circle cx="1350" cy="60" r="320" fill="{VIOLET}" opacity="0.28"/>
<circle cx="120" cy="470" r="200" fill="{MINT}" opacity="0.10"/>
<g transform="translate(70,170) scale(1.333)">{MARK}</g>
<text x="272" y="292" font-family="{DISPLAY}" font-weight="700" font-size="96" fill="{WHITE}">SOLFORGE</text>
<text x="274" y="348" font-family="{BODY}" font-size="30" fill="#C9C4E8">Ship Solana programs at the speed of thought.</text>
<rect x="274" y="372" width="120" height="6" fill="{MINT}"/>
<rect x="1050" y="392" width="380" height="56" rx="28" fill="#1A1433"/>
<text x="1080" y="428" font-family="{MONO}" font-size="24" fill="{MINT}">$ solforge deploy --mainnet</text>
<text x="1430" y="72" text-anchor="end" font-family="{MONO}" font-size="22" fill="{SLATE}">SOLANA DEV TOOLING</text>''',
    "Solforge X banner"))

# 2. Bounty card template 1200x630 (OG size)
write(ASSETS / "solforge-bounty-card.svg", asset_svg(1200, 630, f'''
<rect x="0" y="0" width="1200" height="630" fill="url(#forge)"/>
<circle cx="1080" cy="90" r="260" fill="{WHITE}" opacity="0.08"/>
<circle cx="1080" cy="90" r="180" fill="{WHITE}" opacity="0.06"/>
<g transform="translate(64,56) scale(0.9)">{MARK}</g>
<text x="64" y="300" font-family="{DISPLAY}" font-weight="700" font-size="72" fill="{WHITE}">Build the fastest</text>
<text x="64" y="384" font-family="{DISPLAY}" font-weight="700" font-size="72" fill="{WHITE}">Solana test harness</text>
<rect x="64" y="428" width="400" height="64" rx="32" fill="{AMBER}"/>
<text x="90" y="470" font-family="{MONO}" font-weight="700" font-size="26" fill="{INK}">$500 USDC · BOUNTY</text>
<text x="64" y="580" font-family="{BODY}" font-size="24" fill="#E9E4FF">solforge.dev  ·  @solforge  ·  Superteam Earn</text>''',
    "Solforge bounty card template"))

# 3. Presentation title slide 1920x1080
write(ASSETS / "solforge-title-slide.svg", asset_svg(1920, 1080, f'''
<rect x="0" y="0" width="1920" height="1080" fill="{MIDNIGHT}"/>
<circle cx="960" cy="300" r="420" fill="{VIOLET}" opacity="0.22"/>
<g transform="translate(840,150) scale(2)">{MARK}</g>
<text x="960" y="640" text-anchor="middle" font-family="{DISPLAY}" font-weight="700" font-size="150" fill="{WHITE}">SOLFORGE</text>
<text x="960" y="730" text-anchor="middle" font-family="{BODY}" font-size="44" fill="#C9C4E8">Ship Solana programs at the speed of thought.</text>
<rect x="880" y="780" width="160" height="8" fill="{MINT}"/>
<text x="960" y="990" text-anchor="middle" font-family="{MONO}" font-size="28" fill="{SLATE}">SOLFORGE — DEVELOPER PREVIEW · SOLANA BREAKPOINT 2026</text>''',
    "Solforge title slide"))

# 4. Social post 1080x1080
write(ASSETS / "solforge-social-post.svg", asset_svg(1080, 1080, f'''
<rect x="0" y="0" width="1080" height="1080" fill="{PAPER}"/>
<g transform="translate(440,90) scale(1.667)">{MARK}</g>
<text x="540" y="480" text-anchor="middle" font-family="{DISPLAY}" font-weight="700" font-size="84" fill="{INK}">Ship faster</text>
<text x="540" y="570" text-anchor="middle" font-family="{DISPLAY}" font-weight="700" font-size="84" fill="{INK}">on Solana.</text>
<text x="540" y="680" text-anchor="middle" font-family="{MONO}" font-size="30" fill="{VIOLET}">+ test in milliseconds</text>
<text x="540" y="740" text-anchor="middle" font-family="{MONO}" font-size="30" fill="{VIOLET}">+ deploy with one command</text>
<text x="540" y="800" text-anchor="middle" font-family="{MONO}" font-size="30" fill="{VIOLET}">+ debug with real traces</text>
<rect x="390" y="870" width="300" height="72" rx="36" fill="{VIOLET}"/>
<text x="540" y="917" text-anchor="middle" font-family="{MONO}" font-weight="700" font-size="32" fill="{WHITE}">solforge.dev</text>''',
    "Solforge social post"))

# 5. Color palette sheet 1200x860
SWATCHES = [
    ("Forge Violet", VIOLET, "Primary · brand, CTAs", WHITE),
    ("Deep Violet", DEEP, "Primary dark · gradients", WHITE),
    ("Pulse Mint", MINT, "Accent · success, spark", INK),
    ("Solar Amber", AMBER, "Accent · rewards, alerts", INK),
    ("Midnight", MIDNIGHT, "Dark surfaces", WHITE),
    ("Paper", PAPER, "Light surfaces", INK),
    ("Slate", SLATE, "Muted text on dark", WHITE),
    ("Ink", INK, "Headlines on light", WHITE),
]


def _rgb(hexv):
    h = hexv.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


palette_inner = f'<rect x="0" y="0" width="1200" height="860" fill="{WHITE}"/>\n' \
    f'<text x="60" y="90" font-family="{DISPLAY}" font-weight="700" font-size="48" fill="{INK}">Solforge — Color System</text>\n' \
    f'<text x="60" y="130" font-family="{BODY}" font-size="22" fill="{SLATE}">Eight tokens. Violet leads, mint sparks, amber only for rewards.</text>\n'
for i, (name, hexv, use, txt) in enumerate(SWATCHES):
    x = 60 + (i % 4) * 290
    y = 170 + (i // 4) * 330
    border = f' stroke="{SLATE}" stroke-width="1"' if hexv in (PAPER,) else ""
    r, g, b = _rgb(hexv)
    palette_inner += (f'<rect x="{x}" y="{y}" width="260" height="150" rx="16" fill="{hexv}"{border}/>\n'
                      f'<text x="{x}" y="{y + 196}" font-family="{DISPLAY}" font-weight="700" font-size="24" fill="{INK}">{name}</text>\n'
                      f'<text x="{x}" y="{y + 226}" font-family="{MONO}" font-size="20" fill="{VIOLET}">{hexv}</text>\n'
                      f'<text x="{x}" y="{y + 252}" font-family="{MONO}" font-size="18" fill="{SLATE}">rgb({r}, {g}, {b})</text>\n'
                      f'<text x="{x}" y="{y + 282}" font-family="{BODY}" font-size="18" fill="{SLATE}">{use}</text>\n')
write(ASSETS / "solforge-color-palette.svg", asset_svg(1200, 860, palette_inner, "Solforge color palette"))

# 6. Typography specimen 1200x900
type_inner = f'''<rect x="0" y="0" width="1200" height="900" fill="{WHITE}"/>
<text x="60" y="90" font-family="{DISPLAY}" font-weight="700" font-size="48" fill="{INK}">Solforge — Typography</text>
<text x="60" y="220" font-family="{DISPLAY}" font-weight="700" font-size="110" fill="{VIOLET}">Aa</text>
<text x="220" y="180" font-family="{DISPLAY}" font-weight="700" font-size="36" fill="{INK}">Space Grotesk Bold — Display</text>
<text x="220" y="230" font-family="{DISPLAY}" font-weight="700" font-size="44" fill="{INK}">Ship at the speed of thought</text>
<text x="60" y="380" font-family="{BODY}" font-size="96" fill="{INK}">Aa</text>
<text x="220" y="340" font-family="{DISPLAY}" font-weight="700" font-size="36" fill="{INK}">Inter — Body</text>
<text x="220" y="390" font-family="{BODY}" font-size="26" fill="#3A3654">Solforge compiles, tests and deploys Solana programs from one CLI.</text>
<text x="60" y="530" font-family="{MONO}" font-size="80" fill="{MINT}">Aa</text>
<text x="220" y="500" font-family="{DISPLAY}" font-weight="700" font-size="36" fill="{INK}">JetBrains Mono — Code &amp; labels</text>
<text x="220" y="550" font-family="{MONO}" font-size="28" fill="{INK}">$ solforge test --watch</text>
<rect x="60" y="620" width="1080" height="1" fill="{SLATE}"/>
<text x="60" y="680" font-family="{MONO}" font-size="20" fill="{SLATE}">SCALE — Display 64/700 · H1 48/700 · H2 36/700 · Body 18/400 · Caption 14/600 · Code 16/500</text>
<text x="60" y="720" font-family="{MONO}" font-size="22" fill="{SLATE}">LINE HEIGHT — Display 1.05 · Headings 1.15 · Body 1.6 · Code 1.5</text>
<text x="60" y="790" font-family="{BODY}" font-size="22" fill="{SLATE}">Display never set below 32px. Body never set in Space Grotesk. Code never set in Inter.</text>'''
write(ASSETS / "solforge-typography-specimen.svg", asset_svg(1200, 900, type_inner, "Solforge typography specimen"))
print("assets done")

# ---------------------------------------------------------------- PNG exports ---
import cairosvg
from PIL import Image

JOBS = [
    ("logos/solforge-logo-primary.svg", "exports/logo-primary-light-1024.png", 1024, None),
    ("logos/solforge-logo-reversed.svg", "exports/logo-primary-dark-1024.png", 1024, MIDNIGHT),
    ("logos/solforge-logo-horizontal.svg", "exports/logo-horizontal-1024.png", 1024, None),
    ("logos/solforge-logo-symbol.svg", "exports/logo-symbol-512.png", 512, None),
    ("logos/solforge-logo-symbol.svg", "exports/logo-symbol-256.png", 256, None),
    ("logos/solforge-logo-symbol.svg", "exports/logo-symbol-64.png", 64, None),
    ("logos/solforge-logo-symbol.svg", "exports/logo-symbol-32.png", 32, None),
    ("logos/solforge-logo-symbol.svg", "exports/logo-symbol-16.png", 16, None),
    ("logos/solforge-app-icon.svg", "exports/icon-512.png", 512, None),
    ("logos/solforge-app-icon.svg", "exports/icon-180.png", 180, None),
    ("assets/solforge-x-banner.svg", "exports/x-banner-1500x500.png", 1500, None),
    ("assets/solforge-bounty-card.svg", "exports/bounty-card-1200x630.png", 1200, None),
    ("assets/solforge-title-slide.svg", "exports/title-slide-1920x1080.png", 1920, None),
    ("assets/solforge-social-post.svg", "exports/social-post-1080x1080.png", 1080, None),
    ("assets/solforge-color-palette.svg", "exports/color-palette-1200x860.png", 1200, None),
    ("assets/solforge-typography-specimen.svg", "exports/typography-1200x900.png", 1200, None),
]
for src, dst, width, bg in JOBS:
    kw = {"url": str(BASE / src), "write_to": str(BASE / dst), "output_width": width}
    if bg:
        kw["background_color"] = bg
    cairosvg.svg2png(**kw)
    print("png", dst)

# favicon.ico from the 16/32/48 renders
cairosvg.svg2png(url=str(BASE / "logos/solforge-logo-symbol.svg"),
                 write_to=str(BASE / "exports/logo-symbol-48.png"), output_width=48)
imgs = [Image.open(BASE / f"exports/logo-symbol-{s}.png") for s in (16, 32, 48)]
imgs[0].save(BASE / "exports/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)],
             append_images=imgs[1:])
print("ico exports/favicon.ico")
print("BUILD COMPLETE")
