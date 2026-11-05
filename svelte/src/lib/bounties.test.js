import { describe, expect, it } from 'vitest';
import { BOUNTIES, filterBounties } from './bounties.js';

describe('filterBounties', () => {
	it('returns all bounties with defaults, sorted by deadline', () => {
		const out = filterBounties(BOUNTIES);
		expect(out).toHaveLength(BOUNTIES.length);
		expect(out[0].deadline <= out[1].deadline).toBe(true);
	});
	it('filters by skill', () => {
		expect(filterBounties(BOUNTIES, { skill: 'Security' })).toHaveLength(1);
		expect(filterBounties(BOUNTIES, { skill: 'Frontend' }).every((b) => b.skill === 'Frontend')).toBe(true);
	});
	it('searches title, sponsor and summary case-insensitively', () => {
		expect(filterBounties(BOUNTIES, { query: 'WALLET' })).toHaveLength(1);
		expect(filterBounties(BOUNTIES, { query: 'helius' })).toHaveLength(2);
	});
	it('sorts by reward descending', () => {
		const out = filterBounties(BOUNTIES, { sort: 'reward-desc' });
		expect(out[0].rewardUsd).toBe(3000);
	});
	it('returns an empty list (not an error) when nothing matches', () => {
		expect(filterBounties(BOUNTIES, { query: 'zzzz-no-match' })).toEqual([]);
	});
});
