// Bounty domain model for the Bounty Tracker.
// A bounty is a paid task posted by a sponsor; hunters submit work and the
// sponsor picks a winner. Rewards are denominated in SOL or USDC.
export type BountyStatus = 'open' | 'in-review' | 'awarded' | 'closed';
export type RewardCurrency = 'SOL' | 'USDC';

export interface Bounty {
  id: string;
  title: string;
  sponsor: string;
  description: string;
  rewardAmount: number;
  rewardCurrency: RewardCurrency;
  status: BountyStatus;
  skills: string[];
  submissions: number;
  deadline: string; // ISO date, e.g. "2026-12-15"
  createdAt: string; // ISO date
}

export const BOUNTY_STATUSES: BountyStatus[] = ['open', 'in-review', 'awarded', 'closed'];

export const STATUS_LABELS: Record<BountyStatus, string> = {
  open: 'Open',
  'in-review': 'In Review',
  awarded: 'Awarded',
  closed: 'Closed',
};

export const SKILL_OPTIONS = [
  'React',
  'TypeScript',
  'Angular',
  'Node.js',
  'Python',
  'Rust',
  'Solana',
  'UI/UX Design',
  'Graphic Design',
  'Content',
] as const;

export function isValidStatus(value: unknown): value is BountyStatus {
  return typeof value === 'string' && (BOUNTY_STATUSES as string[]).includes(value);
}

/** Reward shown as a short human string, e.g. "2.5 SOL". */
export function formatReward(bounty: Pick<Bounty, 'rewardAmount' | 'rewardCurrency'>): string {
  return `${bounty.rewardAmount} ${bounty.rewardCurrency}`;
}

/** Days left until the deadline, counted in whole calendar days; negative when overdue. */
export function daysUntilDeadline(bounty: Pick<Bounty, 'deadline'>, now = new Date()): number {
  const [year, month, day] = bounty.deadline.split('-').map(Number);
  const deadlineDay = new Date(year, month - 1, day);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((deadlineDay.getTime() - startOfToday.getTime()) / 86_400_000);
}
