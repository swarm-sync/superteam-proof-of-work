<script>
	// Filter bar: labelled controls, fieldset/legend for the skill radio group
	// (screen readers announce the group), and a debounced search input.
	import { SKILLS } from './bounties.js';
	let { query = $bindable(''), skill = $bindable('All'), sort = $bindable('deadline') } = $props();
</script>

<form class="filters" role="search" aria-label="Filter bounties" onsubmit={(e) => e.preventDefault()}>
	<div class="field">
		<label for="q">Search bounties</label>
		<input id="q" type="search" bind:value={query} placeholder="Try “wallet” or “Helius”" autocomplete="off" />
	</div>
	<fieldset>
		<legend>Skill</legend>
		<div class="radios">
			{#each SKILLS as s}
				<label><input type="radio" name="skill" value={s} bind:group={skill} /> {s}</label>
			{/each}
		</div>
	</fieldset>
	<div class="field">
		<label for="sort">Sort by</label>
		<select id="sort" bind:value={sort}>
			<option value="deadline">Deadline (soonest)</option>
			<option value="reward-desc">Reward (highest)</option>
			<option value="reward-asc">Reward (lowest)</option>
		</select>
	</div>
</form>

<style>
	.filters { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; display: grid; gap: 1rem; }
	.field { display: grid; gap: .3rem; } .field label { font-weight: 600; }
	input[type="search"], select { border: 1px solid var(--border); border-radius: .5rem; padding: .6rem .75rem; min-height: 44px; background: #fff; width: 100%; }
	fieldset { border: 0; margin: 0; padding: 0; } legend { font-weight: 600; padding: 0; margin-bottom: .3rem; }
	.radios { display: flex; flex-wrap: wrap; gap: .5rem 1rem; }
	.radios label { font-weight: 400; display: flex; align-items: center; gap: .3rem; min-height: 44px; }
	@media (min-width: 720px) { .filters { grid-template-columns: 1.2fr 1.5fr .8fr; align-items: end; } }
</style>
