<script>
	// Accessible modal dialog: role="dialog" + aria-modal, labelled by its heading,
	// Escape closes, focus moves in on open and returns to the trigger on close,
	// and Tab is trapped inside while open (WCAG 2.1.2 / 2.4.3).
	import { formatUsd, formatDate } from './bounties.js';
	let { bounty, onClose, returnFocusTo } = $props();
	let dialogEl = $state(null);
	let closeBtn = $state(null);

	$effect(() => {
		closeBtn?.focus();
		const onKey = (e) => {
			if (e.key === 'Escape') { e.preventDefault(); onClose(); }
			if (e.key === 'Tab' && dialogEl) {
				const focusable = [...dialogEl.querySelectorAll('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
				if (!focusable.length) return;
				const first = focusable[0], last = focusable[focusable.length - 1];
				if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
				else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
			}
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			returnFocusTo?.focus?.();
		};
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
	<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" bind:this={dialogEl}>
		<h2 id="dialog-title">{bounty.title}</h2>
		<p><strong>{bounty.sponsor}</strong> · {bounty.skill} · {bounty.difficulty}</p>
		<p>{bounty.summary}</p>
		<dl>
			<div><dt>Reward</dt><dd>{formatUsd(bounty.rewardUsd)}</dd></div>
			<div><dt>Deadline</dt><dd><time datetime={bounty.deadline}>{formatDate(bounty.deadline)}</time></dd></div>
		</dl>
		<p class="note">This demo has no backend — in production the Apply button would open the sponsor's submission flow.</p>
		<div class="actions">
			<button type="button" bind:this={closeBtn} onclick={onClose}>Close</button>
			<a class="apply" href="#bounties">Back to bounties</a>
		</div>
	</div>
</div>

<style>
	.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.6); display: grid; place-items: center; padding: 1rem; z-index: 20; }
	.dialog { background: var(--surface); border-radius: var(--radius); padding: 1.5rem; max-width: 32rem; width: 100%; max-height: 90vh; overflow: auto; }
	.dialog h2 { margin-top: 0; }
	.actions { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
	.actions button { background: var(--accent); color: #fff; border: 0; border-radius: .5rem; padding: .6rem 1rem; min-height: 44px; cursor: pointer; }
	.note { color: var(--muted); font-size: .95rem; }
</style>
