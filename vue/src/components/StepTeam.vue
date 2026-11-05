<template>
	<fieldset>
		<legend class="visually-hidden">Team details</legend>
		<Field id="leadName" label="Lead name" :error="errors.leadName" required>
			<template #default="{ describedby, invalid }">
				<input id="leadName" v-model="form.leadName" type="text" autocomplete="name" :aria-invalid="invalid" :aria-describedby="describedby" />
			</template>
		</Field>
		<Field id="leadEmail" label="Lead email" :error="errors.leadEmail" required hint="We only use this to contact you about the application.">
			<template #default="{ describedby, invalid }">
				<input id="leadEmail" v-model="form.leadEmail" type="email" autocomplete="email" :aria-invalid="invalid" :aria-describedby="describedby" />
			</template>
		</Field>
		<Field id="repoUrl" label="Repository URL (optional)" :error="errors.repoUrl" hint="An https:// link to existing code, if any.">
			<template #default="{ describedby, invalid }">
				<input id="repoUrl" v-model="form.repoUrl" type="url" inputmode="url" placeholder="https://github.com/…" :aria-invalid="invalid" :aria-describedby="describedby" />
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
input { width: 100%; border: 1px solid var(--border); border-radius: .5rem; padding: .6rem .75rem; min-height: 44px; background: #fff; }
</style>
