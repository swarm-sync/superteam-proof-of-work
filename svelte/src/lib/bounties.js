// Sample bounty data (static, no network — keeps LCP/CLS fast and the demo offline-runnable).
// In production this would come from a paginated API; the filter/sort layer is
// deliberately pure so it is unit-testable and framework-independent.
export const BOUNTIES = [
	{ id: 'b1', title: 'Build a Solana validator uptime dashboard', sponsor: 'Superteam', rewardUsd: 2500, skill: 'Frontend', deadline: '2026-11-20', difficulty: 'Advanced', summary: 'Real-time dashboard showing validator uptime, skip rate and vote latency, with an accessible table and chart alternative.' },
	{ id: 'b2', title: 'Accessible wallet-connect component', sponsor: 'Solana Foundation', rewardUsd: 1200, skill: 'Frontend', deadline: '2026-11-14', difficulty: 'Intermediate', summary: 'A wallet-connect button and modal that works fully by keyboard, announces state to screen readers, and respects reduced motion.' },
	{ id: 'b3', title: 'Token-2022 transfer-hook explainer', sponsor: 'Helius', rewardUsd: 800, skill: 'Writing', deadline: '2026-11-12', difficulty: 'Beginner', summary: 'A short, accurate explainer with runnable code samples for Token-2022 transfer hooks.' },
	{ id: 'b4', title: 'Jito bundle simulator (CLI)', sponsor: 'Jito', rewardUsd: 3000, skill: 'Backend', deadline: '2026-11-28', difficulty: 'Advanced', summary: 'CLI that simulates a Jito bundle locally and reports expected profit, tips and failure modes before submission.' },
	{ id: 'b5', title: 'Mobile-first NFT gallery', sponsor: 'Metaplex', rewardUsd: 1500, skill: 'Frontend', deadline: '2026-11-18', difficulty: 'Intermediate', summary: 'A fast, mobile-first gallery with lazy-loaded images, alt text and no layout shift.' },
	{ id: 'b6', title: 'Anchor program audit checklist', sponsor: 'Neodyme', rewardUsd: 2000, skill: 'Security', deadline: '2026-11-25', difficulty: 'Advanced', summary: 'A practical Anchor audit checklist with a worked example and common pitfalls.' },
	{ id: 'b7', title: 'Solana Pay checkout demo for cafés', sponsor: 'Solana Pay', rewardUsd: 900, skill: 'Frontend', deadline: '2026-11-15', difficulty: 'Beginner', summary: 'A one-page checkout demo a café owner can try in under a minute, on a phone, with no account.' },
	{ id: 'b8', title: 'Compressed NFT airdrop script', sponsor: 'Helius', rewardUsd: 1100, skill: 'Backend', deadline: '2026-11-22', difficulty: 'Intermediate', summary: 'A scripted, resumable compressed-NFT airdrop with dry-run mode and clear error messages.' }
];

export const SKILLS = ['All', 'Frontend', 'Backend', 'Writing', 'Security'];

/** Pure filter + sort. Case-insensitive search over title/sponsor/summary. */
export function filterBounties(list, { query = '', skill = 'All', sort = 'deadline' } = {}) {
	const q = query.trim().toLowerCase();
	const filtered = list.filter((b) => {
		const matchesSkill = skill === 'All' || b.skill === skill;
		const matchesQuery =
			!q || [b.title, b.sponsor, b.summary].some((t) => t.toLowerCase().includes(q));
		return matchesSkill && matchesQuery;
	});
	const sorted = [...filtered];
	if (sort === 'reward-desc') sorted.sort((a, b) => b.rewardUsd - a.rewardUsd);
	else if (sort === 'reward-asc') sorted.sort((a, b) => a.rewardUsd - b.rewardUsd);
	else sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
	return sorted;
}

export function formatUsd(n) {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso) {
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
}
