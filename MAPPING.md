# Superteam Proof-of-Work — Skill → Agent Mapping

Ben's Superteam Earn profile Skills picker: 20 skills. Account: rainking6693@gmail.com (Google), Solana wallet already connected. Goal: one best-possible proof-of-work artifact per skill, uploaded via the profile ADD button.

## Mapping table

| # | Skill | Agent | Fit | Reason |
|---|-------|-------|-----|--------|
| 1 | React | Casey | Strong | Explicit React/Next.js specialist (hooks, Tailwind, a11y, components) |
| 2 | Svelte | frontend-architect | Strong | Modern-frameworks generalist; accessible, performant UIs |
| 3 | SolidJS | stella | Strong | Design technologist; interactive, reactive micro-interaction apps |
| 4 | Elm | — | GAP | No Elm profile in the library. Fallback stretch: frontend-architect |
| 5 | Redux | Casey | Strong | React-ecosystem state management; natural pair with React |
| 6 | Vue | frontend-architect | Strong | Modern frameworks incl. Vue; component architecture + a11y |
| 7 | Angular | Bob | Strong | Full-stack product engineer; Angular is a full enterprise framework |
| 8 | Javascript | Tom | Strong | Full-stack product engineer; JS is core |
| 9 | Typescript | backend-architect | Strong | Typed, reliable backend systems; TS is the natural language |
| 10 | PHP | Bob | Stretch | No PHP specialist in the library; Bob's full-stack backend is closest |
| 11 | Node.js | Shane | Strong | APIs, backend runtime, business logic |
| 12 | Python | python-expert | Strong | Explicit production-Python specialist |
| 13 | Swift | — | GAP | No iOS/Swift profile in the library. No good fallback |
| 14 | Laravel | Tom | Stretch | No Laravel specialist; Tom's full-stack backend is closest (PHP framework) |
| 15 | Kotlin | — | GAP | No Android/Kotlin profile in the library. No good fallback |
| 16 | C | — | GAP | No C/systems profile. Fallback stretch: performance-engineer |
| 17 | C++ | — | GAP | No C++ profile. Fallback stretch: system-architect / performance-engineer |
| 18 | Java | backend-architect | Stretch | No Java specialist; backend-architect credibly builds a Java/Spring service |
| 19 | UI/UX Design | Jules | Strong | Explicit wireframes, flows, accessibility, UI/UX specialist |
| 20 | Graphic Design | photo-agent | Strong | Brand kits, logos, identity packages (SVG/PNG/WebP) |

Strong fits: 13. Stretch fits: 2 (PHP, Java — plus Laravel counted as stretch; total stretch 3: PHP, Laravel, Java). Gaps: 5 (Elm, Swift, Kotlin, C, C++).

## Build plan

- 15 artifacts built by 10 builder subagents (one per agent profile), under `~/workspace/superteam-proof-of-work/<skill-slug>/`.
- Each artifact folder: real runnable code + README.md (what it is, how to run/verify) + SUBMISSION.md (suggested ADD-form title, description, skills tag, link placeholder).
- No public hosting route authorized yet: links are TBD pending a parent decision (no public repos/accounts created by builders). BenStoneAI GitHub is flagged; the arbitrage-only token must never be used here.
- Uploads (ADD button) and the ADD-form inspection require a live Halo browser session with Ben's rainking6693 profile — coordinator subagent cannot drive a browser; parent agent to run Steps 2 and 4.
- Do NOT touch `~/workspace/superteam-inside-the-block/` (separate Inside-the-Block bounty builder; deadline today 2:59 PM MST).

## Status — FINAL (2026-11-05 ~11:55 MST)

- Mapping: DONE (this file).
- Builds: ALL 10 BUILDERS DONE. 15 artifacts built and independently verified by the coordinator (re-ran tests/builds myself; see table below). 220 tests re-run passing, plus builds for SolidJS/Angular.
- ADD-form inspection: PENDING — needs parent/Halo (coordinator subagent cannot drive a live browser).
- Uploads: NONE DONE — needs parent/Halo + public-link decision.
- Gaps (Elm, Swift, Kotlin, C, C++): reported honestly; stretch builders NOT dispatched unless parent approves.

## Verified artifact list (coordinator re-runs)

| Skill | Folder | Verification by coordinator |
|---|---|---|
| React | react/ | 23/23 tests pass (re-run) |
| Redux | redux/ | 27/27 tests pass (re-run) |
| Svelte | svelte/ | 5/5 tests pass (re-run; needed TMPDIR workaround — /tmp full) |
| Vue | vue/ | 5/5 tests pass (re-run) |
| SolidJS | solidjs/ | build passes, bundle sizes match claim |
| Angular | angular/ | build passes (re-run); 19/19 tests are worker evidence (needs Chrome) |
| PHP | php/ | 29/29 tests pass (re-run); all files php -l clean |
| Laravel | laravel/ | All files php -l clean; tests NOT executed — Composer cannot reach Packagist through this VM's proxy |
| Javascript | javascript/ | 17/17 tests pass (re-run) |
| Typescript | typescript/ | 9/9 tests pass + typecheck clean (re-run) |
| Java | java/ | 47/47 checks pass (re-run; needs JAVA_HOME=$HOME/.jdk21) |
| Node.js | nodejs/ | 24/24 tests pass (re-run) |
| Python | python/ | 34/34 tests pass (re-run) |
| UI/UX Design | ui-ux-design/ | All 11 files present; prototype HTML tag-balanced; 5 SVGs well-formed (jsdom functional checks rest on worker evidence) |
| Graphic Design | graphic-design/ | verify.py re-run: ALL CHECKS PASSED, 0 failures; PNG/ICO files confirmed real |

## Environment notes (VM changes made during this job)

- PHP 8.3.6 installed via apt (Bob's builder fixed a broken apt mirror first). Composer 2.11.1 installed at /usr/local/bin/composer (coordinator).
- Temurin OpenJDK 21 at ~/.jdk21, Maven 3.9.9 at ~/.maven (Backend Architect builder). Maven Central unreachable from the JVM through this sandbox's proxy; Java artifact is dependency-free for that reason.
- /tmp (512M tmpfs) is 100% full — builders' temp files. Workaround TMPDIR=~/tmp works. A /tmp cleanup is advisable before further verification runs.
- No spend, no accounts, no publishes, no secrets anywhere. ~/workspace/superteam-inside-the-block/ untouched.
