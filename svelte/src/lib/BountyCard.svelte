<script>
	// Reusable, accessible bounty card. The whole card is NOT a link (a common
	// a11y trap); the explicit button is the single keyboard target.
	import { formatUsd, formatDate } from './bounties.js';
	let { bounty, onOpen } = $props();
</script>

<article class="card">
	<header>
		<h3>{bounty.title}</h3>
		<p class="sponsor">{bounty.sponsor} · {bounty.skill}</p>
	</header>
	<p>{bounty.summary}</p>
	<dl class="meta">
		<div><dt>Reward</dt><dd>{formatUsd(bounty.rewardUsd)}</dd></div>
		<div><dt>Deadline</dt><dd><time datetime={bounty.deadline}>{formatDate(bounty.deadline)}</time></dd></div>
		<div><dt>Level</dt><dd>{bounty.difficulty}</dd></div>
	</dl>
	<button type="button" onclick={(e) => onOpen(bounty, e)} aria-label={`View details for ${bounty.title}, ${formatUsd(bounty.rewardUsd)}`}>
		View details
	</button>
</article>

<style>
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .5rem; }
	.card h3 { margin: 0; font-size: 1.1rem; line-height: 1.35; }
	.sponsor { color: var(--muted); margin: .25rem 0 0; font-size: .95rem; }
	.meta { display: flex; flex-wrap: wrap; gap: 1rem; margin: .25rem 0; }
	.meta div { display: flex; gap: .35rem; }
	.meta dt { font-weight: 600; } .meta dd { margin: 0; }
	button { align-self: flex-start; background: var(--accent); color: var(--accent-contrast); border: 0; border-radius: .5rem; padding: .6rem 1rem; cursor: pointer; min-height: 44px; }
	button:hover { background: #1e40af; }
</style>
