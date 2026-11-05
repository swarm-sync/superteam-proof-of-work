# Case Study — Redesigning Bounty Discovery on Superteam Earn for First-Time Contributors

**Designer:** Jules (UI/UX design specialist) · **Date:** November 2026
**Subject:** Superteam Earn (earn.superteam.fun) — the Solana ecosystem's bounty, grant, and hackathon board
**Prototype:** [`prototype/index.html`](prototype/index.html) — clickable, responsive, keyboard-navigable
**Design system:** [`design-system.md`](design-system.md) · **Accessibility notes:** [`accessibility.md`](accessibility.md)
**Flows:** [`flows/discovery-flow.svg`](flows/discovery-flow.svg), [`flows/apply-flow.svg`](flows/apply-flow.svg)
**Wireframes:** [`wireframes/`](wireframes/)

---

## 1. The problem

Superteam Earn connects Solana-ecosystem sponsors (foundations, protocols, startups) with contributors who complete bounties, grants, and hackathons for USDC rewards. It is the front door to paid work in the Solana ecosystem — and for a first-time contributor, the front door is a wall.

A new visitor lands on a chronological list of 200+ listings. To judge whether any single bounty fits them, they must open it, read the full brief, and mentally cross-check reward, deadline, required skills, and expected effort. Nothing on the list answers the three questions every newcomer actually asks:

1. **Can I do this?** — Does it match my skills and experience level?
2. **Is it worth it?** — Reward vs. effort, and how many people I'm competing against.
3. **What happens if I try?** — What does "good" look like, and what does applying involve?

The result, stated plainly: most newcomers browse and leave. The platform optimises for sponsors posting work, not for contributors finding it — and a marketplace with no new contributors eventually has no submissions.

### Problem statement

> *First-time contributors cannot tell, from the listing page, which bounties fit their skills, time, and experience — so they browse without applying, and sponsors lose the fresh talent the ecosystem needs most.*

## 2. Users

Three personas, grounded in how Earn actually works (bounties are public, global, paid in USDC, judged by sponsors):

| Persona | Who | Goal | Biggest friction |
|---|---|---|---|
| **Maya, the first-timer** (primary) | Design student, 22, has a portfolio but no crypto work history | Win a first small bounty to get on the board | Can't tell which listings welcome beginners; fears wasting hours on a submission that gets ignored |
| **Dev, the side-hustler** | Mid-level frontend dev, employed full-time | Find one bounty a month that fits a weekend | No effort estimate and no way to filter by time available; deadlines buried in the brief |
| **Priya, the sponsor** | Ops lead at a Solana protocol | Get 10+ quality submissions, not 50 weak ones | The list rewards whoever posts most recently, not the best-matched listings; judging criteria are invisible until the brief |

**Scope decision:** this redesign serves Maya first. Dev benefits from the same information hierarchy; Priya benefits because better-matched applicants raise submission quality. Designing for the newcomer does not remove anything power users need — it surfaces what everyone was hunting for.

## 3. Research — stated honestly

This is a **design concept built from public observation, not a commissioned study**. No usability tests were run on the live product, no analytics were accessed, and no Superteam staff were interviewed. The following are the honest inputs:

**What I actually did**
- Studied the public Earn site: listing structure, bounty detail pages, the application flow, and the profile/skills model (the 20-skill picker, including UI/UX Design).
- Reviewed public Solana-ecosystem bounty listings and their reward splits (1st/2nd/3rd is the standard structure).
- Applied established heuristics (Nielsen's 10 usability heuristics; Hick's law on choice overload; Fogg's behaviour model — ability + motivation + trigger) and WCAG 2.2 AA as design constraints, not afterthoughts.

**Assumptions (labelled as such — test before shipping)**
- A1. First-time visitors abandon because they can't assess fit quickly, not because rewards are too low. *(Test: 5-second test on the current list — "find a bounty you could do".)*
- A2. "First-timer friendly" is a real, sponsor-declared property worth surfacing, not something to infer from reward size. *(Test: ask 10 sponsors whether they'd tag listings.)*
- A3. Showing submission counts helps newcomers (social proof + competition signal) rather than deterring them. *(Test: A/B — counts shown vs hidden; watch apply rate.)*
- A4. A 3-step application with a review step converts better than the current single long form. *(Test: funnel analytics on step completion.)*

**What would change my mind:** if funnel data showed newcomers *do* open listings but abandon at the wallet-address step, the fix would be onboarding, not discovery — and this redesign would be the wrong investment.

## 4. Design principles

1. **Fit before detail.** The list answers "can I do this?" at a glance; the detail page answers "how do I win?".
2. **One decision per screen.** Discover → evaluate → apply, each with a single primary action.
3. **Nothing hidden that changes the decision.** Reward split, deadline, submission count, and judging criteria are visible before any click that costs effort.
4. **Beginners are first-class.** "First-timer friendly" is a filter, a badge, and a sort signal — not a footnote.
5. **Accessible by construction.** Keyboard path, contrast, focus order, and reduced motion are in the prototype, not in a backlog ticket.

## 5. The redesign — what changed and why

### 5.1 Discovery: from chronological wall to match-first grid

| Before (observed) | After (this design) | Rationale |
|---|---|---|
| One long chronological list | Card grid, 3-col desktop / 1-col mobile | Cards carry the decision data; grid scans faster than a list (Gestalt proximity + chunking) |
| Skill buried in the brief | Skill chips on every card + skill filter pills at the top | Matches how people actually choose; Hick's law — 5 skill groups, not 200 listings |
| No experience signal | "First-timer friendly" badge + filter toggle | Removes the newcomer's #1 fear (A2); sponsors self-declare, so it's honest |
| Reward shown, split hidden | Reward + split on the card ($800 / $400 / $300) | 2nd/3rd place is often the realistic win for a newcomer; hiding it understates the value |
| No competition signal | Submission count on every card | Social proof + realistic odds (A3); also helps sponsors see demand |
| Deadline inside the brief | "4 days left" on the card, sortable by deadline | Urgency is a decision input, not a surprise |
| Search only | Search + sort (deadline / reward / fewest submissions) + beginner toggle | "Fewest submissions" is the newcomer's best friend — it surfaces winnable bounties |

### 5.2 Bounty detail: the brief, restructured as a decision

- **Reward split as a visual** (three boxes, not a sentence): the split is the first thing a contributor's eye finds.
- **"What 'good' looks like"** — judging criteria pulled out of the brief body into a checklist. If the sponsor hasn't written criteria, the template forces it: listings without criteria can't be marked first-timer friendly.
- **Timeline as a table** (open → deadline → judging → announcement), with the deadline in UTC and a note to check local time.
- **Sponsor card** with listing count and rating: trust signal for newcomers who don't know the sponsor.
- **"Before you apply" checklist**: one submission per person, edits allowed until deadline — the three facts people currently learn by making a mistake.

### 5.3 Apply: a 3-step flow with a review step

1. **Your profile** — name, portfolio link, Solana wallet address (with the honest warning that payouts can't be reversed).
2. **Your approach** — 3–5 sentences, character-counted; time commitment; optional file link. The approach is the submission for design bounties — it gets its own step, not a small box at the bottom.
3. **Review & submit** — everything on one screen, with an originality confirmation. Editing is possible until the deadline, and the success screen says so, with a reference number.

**Trade-off, stated:** three steps add one click versus a single form — but each step has one job, validation is inline and immediate, and the review step catches the two most common errors (wrong wallet address, empty approach). Funnel data should confirm the trade; if step-2 drop-off exceeds the single-form baseline, collapse steps 1–2.

## 6. User flows

- [`flows/discovery-flow.svg`](flows/discovery-flow.svg) — Land → filter/search → evaluate card → open detail → decide (apply / save / back). Includes the empty-state and no-match recovery paths.
- [`flows/apply-flow.svg`](flows/apply-flow.svg) — Start → step 1 (validate) → step 2 (validate) → step 3 (review + confirm) → success (reference number, edit window). Every validation failure returns the user to the exact field, with the error announced.

## 7. Wireframes → high-fidelity

Low-fidelity wireframes (structure only, no colour or brand) are in [`wireframes/`](wireframes/):
- `wireframe-discover.svg` — discovery grid, filter row, search
- `wireframe-detail.svg` — detail page, reward split, sponsor card
- `wireframe-apply.svg` — 3-step form with progress indicator

The prototype ships with a **Wireframe / High-fidelity toggle** (top-right) that re-skins the same live screens in grayscale dashed-line wireframe styling — so a reviewer can check that the layout holds up without colour carrying any meaning. This is the same test as the wireframes, live.

## 8. What success looks like (measurable)

| Metric | Baseline to capture first | Target (90 days post-launch) |
|---|---|---|
| First-time visitor → opens a bounty | Measure now | +40% |
| Time to first matching bounty (5-sec test) | ~never finds one | < 60 seconds |
| Apply-start → submit completion | Measure now | +25% |
| Share of submissions from first-timers | Measure now | +15 pts |
| Listings with published judging criteria | Measure now | 90%+ |

These targets are proposals, not promises — the baselines don't exist publicly, and any honest rollout starts by instrumenting them.

## 9. Trade-offs and open questions

- **Card density vs. information:** cards show 7 data points; more would slow scanning, fewer would force clicks. The split and submission count made the cut; region and sponsor rating did not (they live on the detail page).
- **"Fewest submissions" sort** could push low-quality listings up; mitigate by keeping the default sort on deadline.
- **Sponsor effort:** requiring judging criteria and a first-timer flag adds friction to posting. Mitigate with templates and a one-click flag; measure posting completion before and after.
- **Scope not attempted:** the profile/skills picker, the sponsor dashboard, and the judging workflow are out of scope for this case study — the discovery and apply flows are where newcomers are lost.

## 10. How to review this package

1. Open [`prototype/index.html`](prototype/index.html) in a browser. Try: filter by "UI/UX Design", turn on "First-timer friendly only", search "validator", sort by "Fewest submissions", save a bounty, open a detail page, complete the 3-step application (try submitting step 1 empty — validation is inline), and toggle Wireframe / Dark mode.
2. Read the flows, then the design system, then the accessibility notes — in that order.
3. The honest question for a reviewer: does this make a first-time contributor more likely to apply? Everything else is decoration.
