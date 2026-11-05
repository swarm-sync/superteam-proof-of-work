<template>
	<section aria-labelledby="review-heading">
		<h2 id="review-heading">Review your application</h2>
		<p>Check everything below. Use “Edit” to jump back to a step — your answers are kept.</p>
		<dl class="review">
			<div><dt>Project</dt><dd>{{ form.title }}</dd><dd class="sub">{{ form.category }}</dd></div>
			<div><dt>Summary</dt><dd>{{ form.summary }}</dd></div>
			<div><dt>Lead</dt><dd>{{ form.leadName }} · {{ form.leadEmail }}</dd></div>
			<div v-if="form.repoUrl"><dt>Repository</dt><dd>{{ form.repoUrl }}</dd></div>
			<div><dt>Amount</dt><dd>{{ usd }}</dd></div>
			<div><dt>Timeline</dt><dd>{{ form.weeks }} weeks</dd></div>
			<div><dt>Milestones</dt><dd style="white-space: pre-line">{{ form.milestones }}</dd></div>
		</dl>
		<div class="edit-row">
			<button type="button" @click="$emit('edit', 0)">Edit project</button>
			<button type="button" @click="$emit('edit', 1)">Edit team</button>
			<button type="button" @click="$emit('edit', 2)">Edit budget</button>
		</div>
	</section>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ form: { type: Object, required: true } });
defineEmits(['edit']);
const usd = computed(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(props.form.amountUsd || 0)));
</script>

<style scoped>
.review { display: grid; gap: .75rem; }
.review > div { border-bottom: 1px solid var(--border); padding-bottom: .75rem; }
.review dt { font-weight: 700; } .review dd { margin: .1rem 0 0; }
.sub { color: var(--muted); }
.edit-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; }
.edit-row button { background: #fff; border: 1px solid var(--accent); color: var(--accent); border-radius: .5rem; padding: .55rem .9rem; min-height: 44px; cursor: pointer; }
</style>
