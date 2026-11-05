import { useMemo } from 'react'
import { useBounties } from '../context/BountyContext'
import { computeStats, formatUsd } from '../utils/bounties'

/** Summary cards computed from the full bounty set (not the filtered view). */
export function StatsBar() {
  const { bounties } = useBounties()
  const stats = useMemo(() => computeStats(bounties), [bounties])

  const cards = [
    { label: 'Total bounties', value: String(stats.total) },
    { label: 'Open now', value: String(stats.open) },
    { label: 'Total rewards on offer', value: formatUsd(stats.totalRewardsUsd) },
    { label: 'Paid out (USDC)', value: formatUsd(stats.totalPaidOutUsd) },
    { label: 'Avg. submissions', value: stats.avgSubmissions.toFixed(1) },
  ]

  return (
    <dl
      aria-label="Bounty totals"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {c.label}
          </dt>
          <dd className="mt-1 text-xl font-bold text-slate-900">{c.value}</dd>
        </div>
      ))}
    </dl>
  )
}
