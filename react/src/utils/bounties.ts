/** Pure helpers for bounty data — fully unit-tested, no React needed. */
import type { Bounty, BountyCategory, BountyStatus } from '../data/bounties'

export type SortKey = 'rewardUsd' | 'deadline' | 'submissions' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface FilterState {
  query: string
  category: BountyCategory | 'all'
  status: BountyStatus | 'all'
  minReward: number
}

export const DEFAULT_FILTERS: FilterState = {
  query: '',
  category: 'all',
  status: 'all',
  minReward: 0,
}

export function filterBounties(bounties: Bounty[], filters: FilterState): Bounty[] {
  const query = filters.query.trim().toLowerCase()
  return bounties.filter((b) => {
    if (filters.category !== 'all' && b.category !== filters.category) return false
    if (filters.status !== 'all' && b.status !== filters.status) return false
    if (b.rewardUsd < filters.minReward) return false
    if (!query) return true
    const haystack = [b.title, b.sponsor, b.description, ...b.skills]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}

export function sortBounties(
  bounties: Bounty[],
  key: SortKey,
  direction: SortDirection,
): Bounty[] {
  const sorted = [...bounties]
  sorted.sort((a, b) => {
    let cmp: number
    if (key === 'title') cmp = a.title.localeCompare(b.title)
    else if (key === 'deadline') cmp = a.deadline.localeCompare(b.deadline)
    else cmp = a[key] - b[key]
    return direction === 'asc' ? cmp : -cmp
  })
  return sorted
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${iso}T00:00:00`))
}

/** Whole days from `from` until the deadline; negative when past due. */
export function daysUntil(deadline: string, from: Date = new Date()): number {
  const msPerDay = 86_400_000
  const end = new Date(`${deadline}T00:00:00`).getTime()
  const start = new Date(from.toDateString()).getTime()
  return Math.round((end - start) / msPerDay)
}

export interface BountyStats {
  total: number
  open: number
  totalRewardsUsd: number
  totalPaidOutUsd: number
  avgSubmissions: number
}

export function computeStats(bounties: Bounty[]): BountyStats {
  const total = bounties.length
  const open = bounties.filter((b) => b.status === 'open').length
  const totalRewardsUsd = bounties.reduce((s, b) => s + b.rewardUsd, 0)
  const totalPaidOutUsd = bounties.reduce((s, b) => s + b.paidOutUsd, 0)
  const avgSubmissions =
    total === 0 ? 0 : bounties.reduce((s, b) => s + b.submissions, 0) / total
  return { total, open, totalRewardsUsd, totalPaidOutUsd, avgSubmissions }
}
