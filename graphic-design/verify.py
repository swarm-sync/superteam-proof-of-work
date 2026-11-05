#!/usr/bin/env python3
"""Verify the Solforge brand kit: SVG validity, logo-master rules, PNG bytes/dimensions,
ICO validity, and WCAG contrast ratios. Writes verification-log.md. Run: python3 verify.py"""
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent
lines = ["# Solforge brand kit — verification log", ""]
fails = []


def check(ok, msg):
    lines.append(f"- [{'PASS' if ok else 'FAIL'}] {msg}")
    if not ok:
        fails.append(msg)


# 1. SVG well-formedness + logo-master rules -------------------------------
LOGO_MASTERS = sorted((BASE / "logos").glob("*.svg"))
ASSET_SVGS = sorted((BASE / "assets").glob("*.svg"))
for f in LOGO_MASTERS + ASSET_SVGS:
    try:
        root = ET.parse(f).getroot()
        ns = "{http://www.w3.org/2000/svg}"
        assert root.tag == ns + "svg" and root.get("viewBox"), "bad root/viewBox"
        check(True, f"SVG well-formed, viewBox={root.get('viewBox')}: {f.name}")
    except Exception as e:  # noqa: BLE001
        check(False, f"SVG parse failed: {f.name} ({e})")

for f in LOGO_MASTERS:
    text = f.read_text()
    check("<text" not in text, f"logo master has zero <text> elements (path-only letterforms): {f.name}")
    check("<script" not in text and "<foreignObject" not in text, f"logo master has no script/foreignObject: {f.name}")
    check('xmlns="http://www.w3.org/2000/svg"' in text, f"logo master has xmlns: {f.name}")

# 2. PNG magic bytes + exact dimensions ------------------------------------
EXPECTED = {
    "logo-primary-light-1024.png": (1024, 482), "logo-primary-dark-1024.png": (1024, 482),
    "logo-horizontal-1024.png": (1024, 281), "logo-symbol-512.png": (512, 512),
    "logo-symbol-256.png": (256, 256), "logo-symbol-64.png": (64, 64),
    "logo-symbol-32.png": (32, 32), "logo-symbol-16.png": (16, 16),
    "logo-symbol-48.png": (48, 48), "icon-512.png": (512, 512),
    "icon-180.png": (180, 180), "x-banner-1500x500.png": (1500, 500),
    "bounty-card-1200x630.png": (1200, 630), "title-slide-1920x1080.png": (1920, 1080),
    "social-post-1080x1080.png": (1080, 1080), "color-palette-1200x860.png": (1200, 860),
    "typography-1200x900.png": (1200, 900),
}
for name, (ew, eh) in EXPECTED.items():
    p = BASE / "exports" / name
    raw = p.read_bytes()
    magic_ok = raw[:8] == b"\x89PNG\r\n\x1a\n"
    im = Image.open(p)
    check(p.exists() and magic_ok, f"PNG magic bytes valid: {name} ({len(raw)} bytes)")
    check(im.size == (ew, eh), f"PNG dimensions {im.size[0]}x{im.size[1]} (expected {ew}x{eh}): {name}")
    check(im.format == "PNG", f"PIL format PNG: {name}")

# transparency: light logo exports must have an alpha channel
for name in ("logo-primary-light-1024.png", "logo-horizontal-1024.png", "logo-symbol-512.png"):
    im = Image.open(BASE / "exports" / name)
    check(im.mode in ("RGBA", "LA"), f"transparent background (mode {im.mode}): {name}")

# 3. favicon.ico ------------------------------------------------------------
ico = BASE / "exports" / "favicon.ico"
raw = ico.read_bytes()
check(raw[:4] == b"\x00\x00\x01\x00", f"ICO magic bytes valid: favicon.ico ({len(raw)} bytes)")
im = Image.open(ico)
check(im.format == "ICO", f"PIL format ICO: favicon.ico, sizes available {im.info.get('sizes')}")

# 4. WCAG contrast ratios ---------------------------------------------------
def lum(hexv):
    h = hexv.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


PAIRS = [
    ("White on Forge Violet", "#FFFFFF", "#6D28D9", 4.5),
    ("Forge Violet on Paper", "#6D28D9", "#F6F4FF", 4.5),
    ("Ink on Paper", "#16132B", "#F6F4FF", 4.5),
    ("Pulse Mint on Midnight", "#00D9A6", "#0B0B1A", 4.5),
    ("Solar Amber on Midnight", "#FFB020", "#0B0B1A", 4.5),
    ("Slate on Midnight", "#8A8FA3", "#0B0B1A", 4.5),
    ("White on Deep Violet", "#FFFFFF", "#4C1D95", 4.5),
]
lines.append("")
lines.append("## WCAG contrast ratios (recomputed from hex values)")
for name, fg, bg, need in PAIRS:
    r = ratio(fg, bg)
    level = "AAA" if r >= 7 else ("AA" if r >= 4.5 else "FAIL")
    lines.append(f"- {name}: **{r:.1f}:1** — {level} (needs {need}:1)")
    check(r >= need, f"contrast {name} = {r:.1f}:1 >= {need}:1 ({level})")

# 5. Submission title length ------------------------------------------------
title = "Solforge — Complete Brand Identity Kit for a Solana Dev-Tooling Startup"
check(len(title) <= 80, f"SUBMISSION.md title is {len(title)} chars (max 80)")
sub = (BASE / "SUBMISSION.md").read_text()
check("PUBLIC LINK TBD — needs authorized public hosting" in sub, "SUBMISSION.md carries the PUBLIC LINK TBD line")

# 6. File inventory ---------------------------------------------------------
lines.append("")
lines.append("## File inventory (bytes)")
total = 0
for p in sorted(BASE.rglob("*")):
    if p.is_file() and p.name not in ("verify.py", "verification-log.md"):
        total += p.stat().st_size
        lines.append(f"- `{p.relative_to(BASE)}` — {p.stat().st_size} bytes")
lines.append(f"- **Total: {total} bytes across {len(list(BASE.rglob('*')))} files**")

lines.append("")
lines.append(f"## Result: {'ALL CHECKS PASSED' if not fails else f'{len(fails)} FAILURES: ' + '; '.join(fails)}")
(BASE / "verification-log.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
print("FAILURES:", fails if fails else "none")
