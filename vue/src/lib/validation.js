// Pure validation — framework-independent, unit-tested (see validation.test.js).
export function isEmail(v) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
}
export function isUrl(v) {
	if (!v) return true; // optional field
	try { const u = new URL(String(v).trim()); return u.protocol === 'https:'; } catch { return false; }
}
export function validateProject(f) {
	const e = {};
	if (!f.title?.trim() || f.title.trim().length < 10) e.title = 'Give the project a title of at least 10 characters.';
	if (!f.category) e.category = 'Choose a category.';
	if (!f.summary?.trim() || f.summary.trim().length < 50) e.summary = 'Write at least 50 characters so reviewers understand the idea.';
	return e;
}
export function validateTeam(f) {
	const e = {};
	if (!f.leadName?.trim()) e.leadName = 'Enter the lead name.';
	if (!isEmail(f.leadEmail)) e.leadEmail = 'Enter a valid email address.';
	if (!isUrl(f.repoUrl)) e.repoUrl = 'Enter a valid https:// URL, or leave it blank.';
	return e;
}
export function validateBudget(f) {
	const e = {};
	const amount = Number(f.amountUsd);
	if (!Number.isFinite(amount) || amount < 500 || amount > 100000) e.amountUsd = 'Request between $500 and $100,000.';
	if (!Number.isInteger(Number(f.weeks)) || Number(f.weeks) < 2 || Number(f.weeks) > 52) e.weeks = 'Enter a timeline of 2–52 weeks.';
	if (!f.milestones?.trim()) e.milestones = 'List at least one milestone.';
	return e;
}
export const STEP_VALIDATORS = [validateProject, validateTeam, validateBudget, () => ({})];
