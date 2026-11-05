<template>
	<fieldset>
		<legend class="visually-hidden">Budget and timeline</legend>
		<Field id="amountUsd" label="Amount requested (USD)" :error="errors.amountUsd" required hint="Between $500 and $100,000.">
			<template #default="{ describedby, invalid }">
				<input id="amountUsd" v-model="form.amountUsd" type="number" inputmode="numeric" min="500" max="100000" step="100" :aria-invalid="invalid" :aria-describedby="describedby" />
			</template>
		</Field>
		<Field id="weeks" label="Timeline (weeks)" :error="errors.weeks" required hint="2–52 weeks from approval.">
			<template #default="{ describedby, invalid }">
				<input id="weeks" v-model="form.weeks" type="number" inputmode="numeric" min="2" max="52" step="1" :aria-invalid="invalid" :aria-describedby="describedby" />
			</template>
		</Field>
		<Field id="milestones" label="Milestones" :error="errors.milestones" required hint="One per line — each milestone should be verifiable.">
			<template #default="{ describedby, invalid }">
				<textarea id="milestones" v-model="form.milestones" rows="4" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="Week 4: working prototype&#10;Week 8: public beta"></textarea>
			</template>
		</Field>
	</fieldset>
</template>

<script setup>
import Field from './Field.vue';
defineProps({ form: { type: Object, required: true }, errors: { type: Object, default: () => ({}) } });
</script>

<style scoped>
fieldset { border: 0; margin: 0; padding: 0; }
input, textarea { width: 100%; border: 1px solid var(--border); border-radius: .5rem; padding: .6rem .75rem; min-height: 44px; background: #fff; }
textarea { min-height: 100px; resize: vertical; }
</style>
