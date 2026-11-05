import { computed, ref } from 'vue';
import { STEP_VALIDATORS } from '../lib/validation.js';

export const STEPS = [
	{ id: 'project', label: 'Project', hint: 'What you will build' },
	{ id: 'team', label: 'Team', hint: 'Who is building it' },
	{ id: 'budget', label: 'Budget', hint: 'Amount and timeline' },
	{ id: 'review', label: 'Review', hint: 'Check and submit' }
];

export const emptyForm = () => ({
	title: '', category: '', summary: '',
	leadName: '', leadEmail: '', repoUrl: '',
	amountUsd: '', weeks: '', milestones: ''
});

/**
 * useWizard — the wizard's state machine. Pure-ish: step index, per-step
 * errors, and navigation guards. The component owns DOM/focus concerns.
 */
export function useWizard(form) {
	const step = ref(0);
	const errors = ref({});
	const submitted = ref(false);

	const isFirst = computed(() => step.value === 0);
	const isLast = computed(() => step.value === STEPS.length - 1);
	const progress = computed(() => Math.round(((step.value + 1) / STEPS.length) * 100));

	function validateCurrent() {
		errors.value = STEP_VALIDATORS[step.value](form.value);
		return Object.keys(errors.value).length === 0;
	}
	function next() {
		if (!validateCurrent()) return false;
		if (step.value < STEPS.length - 1) step.value += 1;
		return true;
	}
	function back() {
		if (step.value > 0) { errors.value = {}; step.value -= 1; }
	}
	function goTo(index) {
		// Only allow jumping to a step already reached/validated, or backwards.
		if (index <= step.value) { errors.value = {}; step.value = index; return true; }
		return false;
	}
	function submit() {
		// Validate every step before accepting — review alone is not enough.
		for (let i = 0; i < STEPS.length - 1; i++) {
			if (Object.keys(STEP_VALIDATORS[i](form.value)).length) { step.value = i; errors.value = STEP_VALIDATORS[i](form.value); return false; }
		}
		submitted.value = true;
		return true;
	}
	return { step, errors, submitted, isFirst, isLast, progress, validateCurrent, next, back, goTo, submit };
}
