import { describe, expect, it } from 'vitest'
import { BOUNTIES } from '../data/bounties'
import {
  computeStats,
  daysUntil,
  filterBounties,
  formatDate,
  formatUsd,
  sortBounties,
  DEFAULT_FILTERS,
} from './bounties'

describe('filterBounties', () => {
  it('returns everything with default filters', () => {
    expect(filterBounties(BOUNTIES, DEFAULT_FILTERS)).toHaveLength(BOUNTIES.length)
  })

  it('filters by category', () => {
    const dev = filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, category: 'Development' })
    expect(dev.length).toBeGreaterThan(0)
    expect(dev.every((b) => b.category === 'Development')).toBe(true)
  })

  it('filters by status', () => {
    const closed = filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, status: 'closed' })
    expect(closed.length).toBe(3)
    expect(closed.every((b) => b.status === 'closed')).toBe(true)
  })

  it('filters by minimum reward', () => {
    const big = filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, minReward: 3000 })
    expect(big.length).toBe(3)
    expect(big.every((b) => b.rewardUsd >= 3000)).toBe(true)
  })

  it('searches title, sponsor, description, and skills case-insensitively', () => {
    expect(filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, query: 'anchor' })).toHaveLength(1)
    expect(filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, query: 'JUPITER' })).toHaveLength(1)
    expect(filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, query: 'figma' })).toHaveLength(2)
    expect(filterBounties(BOUNTIES, { ...DEFAULT_FILTERS, query: 'zzz-no-match' })).toHaveLength(0)
  })

  it('combines filters', () => {
    const result = filterBounties(BOUNTIES, {
      ...DEFAULT_FILTERS,
      category: 'Development',
      status: 'open',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bty-009')
  })
})

describe('sortBounties', () => {
  it('sorts by reward descending', () => {
    const sorted = sortBounties(BOUNTIES, 'rewardUsd', 'desc')
    expect(sorted[0].rewardUsd).toBe(5000)
    expect(sorted[sorted.length - 1].rewardUsd).toBe(600)
  })

  it('sorts by reward ascending', () => {
    const sorted = sortBounties(BOUNTIES, 'rewardUsd', 'asc')
    expect(sorted[0].rewardUsd).toBe(600)
  })

  it('sorts by deadline ascending (soonest first)', () => {
    const sorted = sortBounties(BOUNTIES, 'deadline', 'asc')
    expect(sorted[0].deadline).toBe('2026-09-30')
  })

  it('sorts by title alphabetically', () => {
    const sorted = sortBounties(BOUNTIES, 'title', 'asc')
    expect(sorted[0].title.startsWith('Anchor')).toBe(true)
  })

  it('does not mutate the input array', () => {
    const copy = [...BOUNTIES]
    sortBounties(BOUNTIES, 'rewardUsd', 'desc')
    expect(BOUNTIES).toEqual(copy)
  })
})

describe('formatters', () => {
  it('formats USD without decimals', () => {
    expect(formatUsd(2500)).toBe('$2,500')
    expect(formatUsd(600)).toBe('$600')
  })

  it('formats ISO dates', () => {
    expect(formatDate('2026-11-05')).toBe('Nov 5, 2026')
  })

  it('counts days until a deadline from a fixed reference date', () => {
    const from = new Date('2026-11-01T12:00:00')
    expect(daysUntil('2026-11-05', from)).toBe(4)
    expect(daysUntil('2026-10-30', from)).toBe(-2)
    expect(daysUntil('2026-11-01', from)).toBe(0)
  })
})

describe('computeStats', () => {
  it('summarizes the bounty set', () => {
    const stats = computeStats(BOUNTIES)
    expect(stats.total).toBe(12)
    expect(stats.open).toBe(6)
    expect(stats.totalRewardsUsd).toBe(27050)
    expect(stats.totalPaidOutUsd).toBe(4200)
    expect(stats.avgSubmissions).toBeCloseTo(38.75, 2)
  })

  it('handles an empty list without NaN', () => {
    const stats = computeStats([])
    expect(stats).toEqual({
      total: 0,
      open: 0,
      totalRewardsUsd: 0,
      totalPaidOutUsd: 0,
      avgSubmissions: 0,
    })
  })
})
