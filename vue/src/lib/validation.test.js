import { describe, expect, it } from 'vitest';
import { isEmail, isUrl, validateProject, validateTeam, validateBudget } from './validation.js';

describe('validation', () => {
	it('accepts a valid email and rejects bad ones', () => {
		expect(isEmail('ben@example.org')).toBe(true);
		expect(isEmail('not-an-email')).toBe(false);
		expect(isEmail('')).toBe(false);
	});
	it('requires https for an optional repo URL', () => {
		expect(isUrl('')).toBe(true);
		expect(isUrl('https://github.com/x/y')).toBe(true);
		expect(isUrl('http://github.com/x/y')).toBe(false);
	});
	it('project step needs title, category and a 50-char summary', () => {
		expect(validateProject({ title: 'x', category: '', summary: 'short' })).toHaveProperty('title');
		expect(validateProject({ title: 'A real project title', category: 'Tooling', summary: 'a'.repeat(60) })).toEqual({});
	});
	it('budget step enforces range and timeline', () => {
		expect(validateBudget({ amountUsd: 100, weeks: 1, milestones: '' })).toHaveProperty('amountUsd');
		expect(validateBudget({ amountUsd: 5000, weeks: 12, milestones: 'Milestone 1: prototype' })).toEqual({});
	});
	it('team step validates email', () => {
		expect(validateTeam({ leadName: 'Ben', leadEmail: 'bad', repoUrl: '' })).toHaveProperty('leadEmail');
	});
});
