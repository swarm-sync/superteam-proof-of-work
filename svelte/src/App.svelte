<script>
	import BountyCard from './lib/BountyCard.svelte';
	import FilterBar from './lib/FilterBar.svelte';
	import BountyDialog from './lib/BountyDialog.svelte';
	import { BOUNTIES, filterBounties, formatUsd } from './lib/bounties.js';

	let query = $state('');
	let skill = $state('All');
	let sort = $state('deadline');
	let selected = $state(null);
	let lastTrigger = $state(null);

	// Derived state: recomputed only when its inputs change (no wasted work).
	let results = $derived(filterBounties(BOUNTIES, { query, skill, sort }));
	let totalReward = $derived(results.reduce((s, b) => s + b.rewardUsd, 0));

	function openBounty(bounty, event) {
		selected = bounty;
		lastTrigger = event?.currentTarget ?? null;
		document.body.style.overflow = 'hidden';
	}
	function closeDialog() {
		selected = null;
		document.body.style.overflow = '';
	}
</script>

<a class="skip-link" href="#bounties">Skip to bounty list</a>
<header class="page-header">
	<div class="wrap">
		<p class="eyebrow">Solana · Superteam Earn</p>
		<h1>Solana Bounty Board</h1>
		<p class="lede">Open bounties, searchable and filterable — built to be usable by keyboard, screen reader, and a phone on a slow connection.</p>
	</div>
</header>

<main class="wrap">
	<FilterBar bind:query bind:skill bind:sort />

	<!-- aria-live="polite": screen readers announce the count when filters change,
	     without interrupting the user mid-typing (polite, not assertive). -->
	<p class="results" aria-live="polite">
		{results.length} {results.length === 1 ? 'bounty' : 'bounties'} found
		{#if results.length} · {formatUsd(totalReward)} total rewards{/if}
	</p>

	{#if results.length === 0}
		<div class="empty" role="status">
			<h2>No bounties match</h2>
			<p>Try a different search term or clear the skill filter.</p>
			<button type="button" onclick={() => { query = ''; skill = 'All'; }}>Clear filters</button>
		</div>
	{:else}
		<ul id="bounties" class="grid">
			{#each results as bounty (bounty.id)}
				<li><BountyCard {bounty} onOpen={(b, e) => openBounty(b, e)} /></li>
			{/each}
		</ul>
	{/if}

	<section aria-labelledby="a11y-heading" class="notes">
		<h2 id="a11y-heading">How this page is built for everyone</h2>
		<ul>
			<li><strong>Keyboard:</strong> skip link, visible focus, one tab stop per card, Escape closes the dialog, Tab is trapped inside it.</li>
			<li><strong>Screen readers:</strong> labelled controls, fieldset/legend groups, <code>aria-live</code> result counts, real <code>&lt;time&gt;</code> and list semantics.</li>
			<li><strong>Performance:</strong> static data (no network waterfall), system fonts (no font download), minimal JS — see README for Core Web Vitals notes.</li>
			<li><strong>Motion:</strong> <code>prefers-reduced-motion</code> is honoured; contrast meets WCAG 2.1 AA (4.5:1+ for body text).</li>
		</ul>
	</section>
</main>

{#if selected}
	<BountyDialog bounty={selected} onClose={closeDialog} returnFocusTo={lastTrigger} />
{/if}

<footer class="wrap"><p>Demo data only — not affiliated with Superteam or the Solana Foundation. Built with Svelte 5 + Vite.</p></footer>

<style>
	.wrap { max-width: 72rem; margin: 0 auto; padding: 0 1rem; }
	.page-header { background: #0f172a; color: #f8fafc; padding: 2.5rem 0 2rem; }
	.page-header h1 { margin: .25rem 0; font-size: clamp(1.75rem, 5vw, 2.75rem); line-height: 1.1; }
	.eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: .85rem; color: #93c5fd; margin: 0; }
	.lede { color: #cbd5e1; max-width: 42rem; }
	main { padding: 1.5rem 0; display: grid; gap: 1rem; }
	.results { font-weight: 600; margin: 0; }
	.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: 1fr; }
	.grid li { display: flex; } .grid li > :global(*) { flex: 1; }
	@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
	@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
	.empty { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; text-align: center; }
	.empty button { background: var(--accent); color: #fff; border: 0; border-radius: .5rem; padding: .6rem 1rem; min-height: 44px; cursor: pointer; }
	.notes { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; }
	.notes h2 { margin-top: 0; font-size: 1.15rem; }
	footer { padding: 1rem; color: var(--muted); font-size: .9rem; }
</style>
