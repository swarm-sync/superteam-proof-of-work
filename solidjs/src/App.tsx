import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { CATEGORIES, PROJECTS, TELEMETRY, type Category, type Project } from "./data";
import { createSpringNumber, fmt } from "./lib/spring";
import { click, confirm, muted, tap, toggleMute } from "./lib/sound";

/* Cursor spotlight: tracks the pointer across a card's surface. */
function spotlight(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function App() {
  /* ---------- live-feeling telemetry (simulated ticks, spring-animated) ---------- */
  const [price, setPrice] = createSpringNumber(TELEMETRY.solPriceUsd);
  const [tps, setTps] = createSpringNumber(TELEMETRY.tps);
  const [validators, setValidators] = createSpringNumber(TELEMETRY.validators);
  const [blockTime, setBlockTime] = createSpringNumber(TELEMETRY.blockTimeMs);
  const [epoch, setEpoch] = createSpringNumber(TELEMETRY.epochProgress * 100);
  const [priceDelta, setPriceDelta] = createSignal(2.4);

  const tick = () => {
    setPrice(TELEMETRY.solPriceUsd * (1 + (Math.random() - 0.5) * 0.012));
    setTps(TELEMETRY.tps * (1 + (Math.random() - 0.5) * 0.18));
    setValidators(TELEMETRY.validators + Math.round((Math.random() - 0.5) * 6));
    setBlockTime(TELEMETRY.blockTimeMs * (1 + (Math.random() - 0.5) * 0.06));
    setEpoch(Math.min(99.9, Math.max(0.5, epoch() + (Math.random() - 0.5) * 0.4)));
    setPriceDelta(+(2.4 + (Math.random() - 0.5) * 1.2).toFixed(1));
  };
  const timer = window.setInterval(tick, reducedMotion ? 8000 : 2200);
  onCleanup(() => window.clearInterval(timer));

  /* ---------- fee calculator ---------- */
  const [txCount, setTxCount] = createSignal(100);
  const [priorityFee, setPriorityFee] = createSignal(1000); // micro-lamports per compute unit
  const fee = createMemo(() => {
    const cu = 200_000; // typical compute units per tx
    const lamportsPerTx = 5000 + (priorityFee() * cu) / 1_000_000;
    const totalLamports = lamportsPerTx * txCount();
    const sol = totalLamports / 1e9;
    return { lamports: totalLamports, sol, usd: sol * price() };
  });

  /* ---------- staking estimator ---------- */
  const [stake, setStake] = createSignal(250);
  const [apy, setApy] = createSignal(TELEMETRY.stakeApy);
  const yield_ = createMemo(() => ({
    yearly: (stake() * apy()) / 100,
    monthly: (stake() * apy()) / 100 / 12,
  }));

  /* ---------- SOL ⇄ USD converter ---------- */
  const [solIn, setSolIn] = createSignal(10);
  const [usdIn, setUsdIn] = createSignal(10 * TELEMETRY.solPriceUsd);
  const [lastEdited, setLastEdited] = createSignal<"sol" | "usd">("sol");
  const solToUsd = () => solIn() * price();
  const usdToSol = () => usdIn() / price();

  /* ---------- project explorer ---------- */
  const [category, setCategory] = createSignal<"All" | Category>("All");
  const [selected, setSelected] = createSignal<Project | null>(null);
  const loadFavs = (): Set<string> => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("sol-explorer-favs") ?? "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  };
  const [favs, setFavs] = createSignal<Set<string>>(loadFavs());
  const filtered = createMemo(() =>
    category() === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === category()),
  );
  const toggleFav = (id: string) => {
    const next = new Set(favs());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavs(next);
    try {
      localStorage.setItem("sol-explorer-favs", JSON.stringify([...next]));
    } catch { /* private mode — favorites still work for the session */ }
    tap(1.4);
  };
  const openProject = (p: Project) => {
    setSelected(selected()?.id === p.id ? null : p);
    tap();
  };

  /* range fill helper (drives the --fill gradient on sliders) */
  const fill = (v: number, min: number, max: number) =>
    ({ "--fill": `${((v - min) / (max - min)) * 100}%` }) as Record<string, string>;

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">◎</span>
          <span>
            Solana Explorer
            <small>SolidJS · Bento · Spring physics</small>
          </span>
        </div>
        <div class="top-controls">
          <span class="pill"><span class="dot" /> NETWORK LIVE · SIMULATED FEED</span>
          <span class="pill" title="Honors your OS reduced-motion setting">
            {reducedMotion ? "REDUCED MOTION · ON" : "MOTION · FULL"}
          </span>
          <button class="mute-btn" type="button" onClick={toggleMute} aria-pressed={muted()}>
            {muted() ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
        </div>
      </header>

      <main class="bento">
        {/* ---------- HERO (span 8) ---------- */}
        <section class="card hero span-8" onMouseMove={spotlight}>
          <p class="kicker">Ecosystem Explorer — Mainnet</p>
          <h1>
            The whole Solana
            <br />
            ecosystem, <span class="grad">one bento.</span>
          </h1>
          <p class="lede">
            Twelve flagship projects, live-feeling network telemetry, and three working
            micro-tools — a fee calculator, a staking estimator, and a SOL converter —
            built in SolidJS with spring physics, cursor spotlights, and tactile feedback.
          </p>
          <div class="ticker" aria-label="Live network ticker">
            <div class="tick">
              <label>SOL / USD</label>
              <strong>
                ${price().toFixed(2)}
                <span class={`delta${priceDelta() < 0 ? " down" : ""}`}>
                  {priceDelta() >= 0 ? "▲" : "▼"} {Math.abs(priceDelta())}%
                </span>
              </strong>
            </div>
            <div class="tick">
              <label>Throughput</label>
              <strong>{fmt.int(tps())} <span class="unit">TPS</span></strong>
            </div>
            <div class="tick">
              <label>Validators</label>
              <strong>{fmt.int(validators())}</strong>
            </div>
            <div class="tick">
              <label>Block time</label>
              <strong>{Math.round(blockTime())} <span class="unit">ms</span></strong>
            </div>
          </div>
        </section>

        {/* ---------- NETWORK HEALTH (span 4) ---------- */}
        <section class="card span-4" onMouseMove={spotlight}>
          <p class="kicker">Network health</p>
          <h2>Fast, cheap, up.</h2>
          <div class="stat-row">
            <label>Uptime (30d)</label>
            <strong>{fmt.pct(TELEMETRY.uptimePct)}</strong>
          </div>
          <div class="stat-row">
            <label>Median fee</label>
            <strong>{fmt.sol(TELEMETRY.avgFeeSol)} <span style="font-size:11px;color:var(--ink-dim)">SOL</span></strong>
          </div>
          <div class="stat-row">
            <label>Epoch progress</label>
            <span>
              <strong>{epoch().toFixed(1)}%</strong>
              <span class="sub">epoch 742 · ~2d left</span>
            </span>
          </div>
          <div class="bar" role="progressbar" aria-valuenow={Math.round(epoch())} aria-valuemin={0} aria-valuemax={100} aria-label="Epoch progress">
            <i style={{ width: `${epoch()}%` }} />
          </div>
          <p class="lede" style="margin-top:14px">
            A transaction costs about a quarter of a cent. Try the calculator →
          </p>
        </section>

        {/* ---------- FEE CALCULATOR (span 4) ---------- */}
        <section class="card span-4" onMouseMove={spotlight}>
          <p class="kicker">Micro-tool 01</p>
          <h2>Fee calculator</h2>
          <p class="lede">What do N transactions actually cost?</p>
          <div class="field">
            <label>Transactions <output>{fmt.int(txCount())}</output></label>
            <input
              type="range" min={1} max={1000} step={1} value={txCount()}
              style={fill(txCount(), 1, 1000)}
              aria-label="Number of transactions"
              onInput={(e) => setTxCount(+e.currentTarget.value)}
            />
          </div>
          <div class="field">
            <label>Priority fee <output>{fmt.int(priorityFee())} µLamports / CU</output></label>
            <input
              type="range" min={0} max={10000} step={100} value={priorityFee()}
              style={fill(priorityFee(), 0, 10000)}
              aria-label="Priority fee in micro-lamports per compute unit"
              onInput={(e) => setPriorityFee(+e.currentTarget.value)}
            />
          </div>
          <div class="result" aria-live="polite">
            <div class="big">{fmt.sol(fee().sol)} <span class="unit">SOL</span></div>
            <div class="note">
              ≈ <b>{fmt.usd(fee().usd)}</b> · {fmt.int(fee().lamports)} lamports ·{" "}
              {fmt.sol(fee().sol / Math.max(txCount(), 1))} SOL / tx
            </div>
          </div>
        </section>

        {/* ---------- STAKING ESTIMATOR (span 4) ---------- */}
        <section class="card span-4" onMouseMove={spotlight}>
          <p class="kicker">Micro-tool 02</p>
          <h2>Staking estimator</h2>
          <p class="lede">Yield on staked SOL, before validator commission.</p>
          <div class="field">
            <label>Amount staked <output>{fmt.int(stake())} SOL</output></label>
            <input
              type="range" min={1} max={10000} step={1} value={stake()}
              style={fill(stake(), 1, 10000)}
              aria-label="Amount staked in SOL"
              onInput={(e) => setStake(+e.currentTarget.value)}
            />
          </div>
          <div class="field">
            <label>APY <output>{apy().toFixed(1)}%</output></label>
            <input
              type="range" min={4} max={10} step={0.1} value={apy()}
              style={fill(apy(), 4, 10)}
              aria-label="Staking APY percent"
              onInput={(e) => setApy(+e.currentTarget.value)}
            />
          </div>
          <div class="result" aria-live="polite">
            <div class="big">+{fmt.sol(yield_().yearly)} <span class="unit">SOL / yr</span></div>
            <div class="note">
              ≈ <b>{fmt.usd(yield_().yearly * price())} / yr</b> ·{" "}
              {fmt.sol(yield_().monthly)} SOL / mo · {fmt.usd(stake() * price())} staked
            </div>
          </div>
        </section>

        {/* ---------- CONVERTER (span 4) ---------- */}
        <section class="card span-4" onMouseMove={spotlight}>
          <p class="kicker">Micro-tool 03</p>
          <h2>SOL ⇄ USD</h2>
          <p class="lede">Converted at the live ticker price above.</p>
          <div class="field">
            <label>SOL</label>
            <input
              type="number" min={0} step="any" value={lastEdited() === "sol" ? solIn() : usdToSol().toFixed(4)}
              aria-label="Amount in SOL"
              onInput={(e) => { setLastEdited("sol"); setSolIn(+e.currentTarget.value || 0); }}
            />
          </div>
          <div class="field">
            <label>USD</label>
            <input
              type="number" min={0} step="any" value={lastEdited() === "usd" ? usdIn() : solToUsd().toFixed(2)}
              aria-label="Amount in USD"
              onInput={(e) => { setLastEdited("usd"); setUsdIn(+e.currentTarget.value || 0); }}
            />
          </div>
          <div class="result" aria-live="polite">
            <div class="big">
              {lastEdited() === "sol"
                ? `${fmt.int(solIn())} SOL = ${fmt.usd(solToUsd())}`
                : `${fmt.usd(usdIn())} = ${fmt.sol(usdToSol())} SOL`}
            </div>
            <div class="note">1 SOL = <b>${price().toFixed(2)}</b> (simulated tick)</div>
          </div>
        </section>

        {/* ---------- PROJECT EXPLORER (span 8) ---------- */}
        <section class="card span-8" onMouseMove={spotlight}>
          <p class="kicker">Project explorer — {PROJECTS.length} flagships</p>
          <h2>Tap a project. Feel it open.</h2>
          <p class="lede">Filter by category, star your favorites (saved locally), and open a card for the story behind it.</p>
          <div class="chips" role="group" aria-label="Filter projects by category">
            <For each={CATEGORIES}>
              {(c) => (
                <button
                  type="button"
                  class="chip"
                  aria-pressed={category() === c}
                  onClick={() => { setCategory(c); setSelected(null); click(1.2); }}
                >
                  {c}
                </button>
              )}
            </For>
          </div>
          <div class="projects">
            <For each={filtered()}>
              {(p) => (
                <button
                  type="button"
                  class="proj"
                  aria-expanded={selected()?.id === p.id}
                  onClick={() => openProject(p)}
                >
                  <span
                    class={`star${favs().has(p.id) ? " fav" : ""}`}
                    role="button"
                    tabindex={0}
                    aria-label={`Favorite ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); } }}
                  >
                    {favs().has(p.id) ? "★" : "☆"}
                  </span>
                  <span class="glyph" aria-hidden="true">{p.glyph}</span>
                  <strong>{p.name}</strong>
                  <span>{p.tagline}</span>
                  <span class="meta"><span>{p.category.toUpperCase()}</span><span>EST. {p.founded}</span></span>
                </button>
              )}
            </For>
          </div>
          <Show when={selected()}>
            {(p) => (
              <div class="detail" role="region" aria-label={`${p().name} details`}>
                <h3>{p().name} — {p().category}</h3>
                <p>{p().detail}</p>
                <div class="facts">
                  <span>SCALE <b>{p().tvl}</b></span>
                  <span>REACH <b>{p().users}</b></span>
                  <span>FOUNDED <b>{p().founded}</b></span>
                </div>
                <button type="button" class="close" onClick={() => { setSelected(null); click(0.8); }}>
                  Close ✕
                </button>
              </div>
            )}
          </Show>
        </section>

        {/* ---------- WHY SOLID (span 4) ---------- */}
        <section class="card span-4" onMouseMove={spotlight}>
          <p class="kicker">Under the hood</p>
          <h2>Why SolidJS?</h2>
          <p class="lede">
            Fine-grained reactivity: only the number that changes re-renders — no virtual
            DOM diffing. The ticker, sliders, and filters above update in place, which is
            exactly what a live telemetry dashboard wants.
          </p>
          <div class="stat-row"><label>Framework</label><strong>SolidJS 1.9</strong></div>
          <div class="stat-row"><label>Bundler</label><strong>Vite 8</strong></div>
          <div class="stat-row"><label>Spring</label><strong>k 300 · c 30 · m 0.8</strong></div>
          <div class="stat-row"><label>Audio</label><strong>Web Audio synth</strong></div>
          <div class="stat-row"><label>Deps at runtime</label><strong>solid-js only</strong></div>
          <button
            type="button"
            class="mute-btn"
            style={{ "margin-top": "16px", width: "100%" }}
            onClick={() => confirm()}
          >
            ▶ Play confirm chirp
          </button>
        </section>
      </main>

      <footer class="footer">
        <span><b>Solana Ecosystem Explorer</b> — SolidJS proof of work · built by Stella</span>
        <span>TELEMETRY IS SIMULATED FOR DEMO · NOT FINANCIAL ADVICE · NO WALLET, NO KEYS</span>
      </footer>
    </div>
  );
}
