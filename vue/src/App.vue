<template>
	<a class="skip-link" href="#wizard-heading">Skip to application form</a>
	<header class="page-header">
		<div class="wrap">
			<p class="eyebrow">Solana · Grants</p>
			<h1>Solana Grant Application</h1>
			<p class="lede">Four steps, about five minutes. Your draft autosaves in this browser — close the tab and come back, nothing is lost.</p>
		</div>
	</header>

	<main class="wrap">
		<div v-if="submitted" class="success" role="status" tabindex="-1" ref="successRef">
			<h2 id="wizard-heading">Application received (demo)</h2>
			<p>Thank you, {{ form.leadName }}. This demo stores nothing on a server — in production this would send the application and show a reference number.</p>
			<p><strong>{{ form.title }}</strong> · {{ formattedAmount }} · {{ form.weeks }} weeks</p>
			<button type="button" @click="startOver">Start a new application</button>
		</div>

		<template v-else>
			<Stepper :steps="STEPS" :current="step" @go="onGo" />
			<!-- Determinate progressbar: screen readers hear the percentage. -->
			<div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Step ${step + 1} of ${STEPS.length}`">
				<div class="bar" :style="{ width: progress + '%' }"></div>
			</div>
			<p class="step-count" aria-live="polite">Step {{ step + 1 }} of {{ STEPS.length }}: {{ STEPS[step].label }}</p>

			<form @submit.prevent="onSubmit" novalidate>
				<!-- h2 with tabindex -1 is the focus target on step change (WCAG 2.4.3):
				     keyboard and screen-reader users land at the new step's heading. -->
				<h2 id="wizard-heading" ref="headingRef" tabindex="-1">{{ STEPS[step].label }} — {{ STEPS[step].hint }}</h2>
				<div v-if="Object.keys(errors).length" class="error-summary" role="alert" tabindex="-1" ref="errorRef">
					<p><strong>There {{ Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems` }} on this step.</strong> Fix the highlighted fields below.</p>
				</div>
				<StepProject v-if="step === 0" :form="form" :errors="errors" />
				<StepTeam v-else-if="step === 1" :form="form" :errors="errors" />
				<StepBudget v-else-if="step === 2" :form="form" :errors="errors" />
				<StepReview v-else :form="form" @edit="onGo" />
				<div class="actions">
					<button v-if="!isFirst" type="button" class="secondary" @click="onBack">Back</button>
					<button v-if="!isLast" type="button" class="primary" @click="onNext">Continue</button>
					<button v-else type="submit" class="primary">Submit application</button>
				</div>
			</form>
			<p class="draft-note">Draft saved in this browser only. <button type="button" class="linklike" @click="clearDraft">Clear draft</button></p>
		</template>
	</main>
	<footer class="wrap"><p>Demo only — no data leaves your browser. Built with Vue 3 Composition API + Vite.</p></footer>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import Stepper from './components/Stepper.vue';
import StepProject from './components/StepProject.vue';
import StepTeam from './components/StepTeam.vue';
import StepBudget from './components/StepBudget.vue';
import StepReview from './components/StepReview.vue';
import { STEPS, emptyForm, useWizard } from './composables/useWizard.js';
import { useDraft } from './composables/useDraft.js';

const form = ref(emptyForm());
const { step, errors, submitted, isFirst, isLast, progress, next, back, goTo, submit } = useWizard(form);
const { clear } = useDraft(form);
const headingRef = ref(null);
const errorRef = ref(null);
const successRef = ref(null);

const formattedAmount = computed(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(form.amountUsd || 0)));

async function focusHeading() { await nextTick(); headingRef.value?.focus(); }
async function onNext() { const ok = next(); await nextTick(); if (!ok) errorRef.value?.focus(); else focusHeading(); }
async function onBack() { back(); await focusHeading(); }
async function onGo(i) { if (goTo(i)) await focusHeading(); }
async function onSubmit() {
	if (submit()) { clear(); await nextTick(); successRef.value?.focus(); }
	else { await nextTick(); errorRef.value?.focus(); }
}
function clearDraft() { clear(); form.value = emptyForm(); }
function startOver() { form.value = emptyForm(); submitted.value = false; step.value = 0; }
</script>

<style scoped>
.wrap { max-width: 56rem; margin: 0 auto; padding: 0 1rem; }
.page-header { background: #0f172a; color: #f8fafc; padding: 2.5rem 0 2rem; }
.page-header h1 { margin: .25rem 0; font-size: clamp(1.75rem, 5vw, 2.5rem); line-height: 1.1; }
.eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: .85rem; color: #93c5fd; margin: 0; }
.lede { color: #cbd5e1; max-width: 42rem; }
main { padding: 1.5rem 0; display: grid; gap: 1rem; }
.progress { height: .5rem; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.bar { height: 100%; background: var(--accent); transition: width .25s ease; }
.step-count { font-weight: 600; margin: 0; }
form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; }
form h2 { margin-top: 0; font-size: 1.25rem; }
.error-summary { border: 2px solid #b91c1c; background: #fef2f2; border-radius: .5rem; padding: .75rem 1rem; margin-bottom: 1rem; }
.actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
.primary { background: var(--accent); color: #fff; border: 0; border-radius: .5rem; padding: .65rem 1.25rem; min-height: 44px; cursor: pointer; }
.secondary { background: #fff; border: 1px solid var(--border); border-radius: .5rem; padding: .65rem 1.25rem; min-height: 44px; cursor: pointer; }
.linklike { background: none; border: 0; color: var(--accent); text-decoration: underline; cursor: pointer; padding: 0; }
.draft-note { color: var(--muted); font-size: .95rem; }
.success { background: var(--surface); border: 2px solid #16a34a; border-radius: var(--radius); padding: 1.5rem; }
.success button { background: var(--accent); color: #fff; border: 0; border-radius: .5rem; padding: .65rem 1.25rem; min-height: 44px; cursor: pointer; }
footer { padding: 1rem; color: var(--muted); font-size: .9rem; }
</style>
