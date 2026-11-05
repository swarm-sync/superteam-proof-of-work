<template>
	<!-- Accessible stepper: an <ol> with aria-current="step" on the current item.
	     Completed steps are buttons (can go back); future steps are plain text. -->
	<nav aria-label="Application progress">
		<ol class="stepper">
			<li v-for="(s, i) in steps" :key="s.id" :aria-current="i === current ? 'step' : undefined" :class="{ done: i < current, current: i === current }">
				<button v-if="i < current" type="button" @click="$emit('go', i)" :aria-label="`Go back to step ${i + 1}: ${s.label}`">
					<span class="num" aria-hidden="true">✓</span> {{ s.label }}
				</button>
				<span v-else><span class="num" aria-hidden="true">{{ i + 1 }}</span> {{ s.label }}<small>{{ s.hint }}</small></span>
			</li>
		</ol>
	</nav>
</template>

<script setup>
defineProps({ steps: { type: Array, required: true }, current: { type: Number, required: true } });
defineEmits(['go']);
</script>

<style scoped>
.stepper { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.stepper li { border: 1px solid var(--border); border-radius: .5rem; padding: .6rem .75rem; background: var(--surface); color: var(--muted); }
.stepper li.current { border-color: var(--accent); color: var(--ink); font-weight: 700; background: #eff6ff; }
.stepper li.done button { color: var(--accent); background: none; border: 0; padding: 0; cursor: pointer; font-weight: 600; text-align: left; min-height: 44px; }
.num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--border); margin-right: .4rem; font-size: .85rem; }
.current .num { background: var(--accent); color: #fff; }
.done .num { background: #16a34a; color: #fff; }
small { display: block; font-weight: 400; color: var(--muted); margin-left: 2rem; }
@media (min-width: 720px) { .stepper { grid-template-columns: repeat(4, 1fr); } }
</style>
