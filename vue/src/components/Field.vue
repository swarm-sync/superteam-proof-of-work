<template>
	<div class="field">
		<label :for="id">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
		<p v-if="hint" :id="`${id}-hint`" class="hint">{{ hint }}</p>
		<!-- aria-invalid + aria-describedby wire the error to the input for screen readers. -->
		<slot :describedby="describedby" :invalid="!!error" />
		<p v-if="error" :id="`${id}-error`" class="error" role="alert">{{ error }}</p>
	</div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
	id: { type: String, required: true },
	label: { type: String, required: true },
	hint: { type: String, default: '' },
	error: { type: String, default: '' },
	required: { type: Boolean, default: false }
});
const describedby = computed(() => [props.hint ? `${props.id}-hint` : '', props.error ? `${props.id}-error` : ''].filter(Boolean).join(' ') || undefined);
</script>

<style scoped>
.field { display: grid; gap: .3rem; margin-bottom: 1rem; }
.field > label { font-weight: 600; }
.hint { margin: 0; color: var(--muted); font-size: .95rem; }
.error { margin: 0; color: #b91c1c; font-weight: 600; }
</style>
