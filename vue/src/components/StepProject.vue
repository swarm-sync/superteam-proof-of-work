<template>
	<fieldset>
		<legend class="visually-hidden">Project details</legend>
		<Field id="title" label="Project title" :error="errors.title" required hint="A clear, specific title — at least 10 characters.">
			<template #default="{ describedby, invalid }">
				<input id="title" v-model="form.title" type="text" :aria-invalid="invalid" :aria-describedby="describedby" autocomplete="off" />
			</template>
		</Field>
		<Field id="category" label="Category" :error="errors.category" required>
			<template #default="{ describedby, invalid }">
				<select id="category" v-model="form.category" :aria-invalid="invalid" :aria-describedby="describedby">
					<option value="" disabled>Choose a category</option>
					<option>Developer Tooling</option><option>DeFi</option><option>Payments</option>
					<option>Consumer App</option><option>Infrastructure</option><option>Education</option>
				</select>
			</template>
		</Field>
		<Field id="summary" label="Project summary" :error="errors.summary" required hint="What it does, who it helps, and why now — at least 50 characters.">
			<template #default="{ describedby, invalid }">
				<textarea id="summary" v-model="form.summary" rows="5" :aria-invalid="invalid" :aria-describedby="describedby"></textarea>
				<p class="count" aria-live="polite">{{ form.summary.trim().length }} / 50 characters minimum</p>
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
input, select, textarea { width: 100%; border: 1px solid var(--border); border-radius: .5rem; padding: .6rem .75rem; min-height: 44px; background: #fff; }
textarea { min-height: 110px; resize: vertical; }
.count { margin: .2rem 0 0; color: var(--muted); font-size: .9rem; }
</style>
