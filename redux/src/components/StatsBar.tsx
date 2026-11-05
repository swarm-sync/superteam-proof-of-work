import { useAppSelector } from '../app/hooks'
import { selectTaskStats } from '../features/tasks/tasksSelectors'

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function StatsBar() {
  const stats = useAppSelector(selectTaskStats)
  const cards = [
    { label: 'Total tasks', value: String(stats.total) },
    { label: 'In progress', value: String(stats.inProgress) },
    { label: 'Done', value: String(stats.done) },
    { label: 'Overdue', value: String(stats.overdue) },
    { label: 'Rewards tracked', value: formatUsd(stats.totalRewardsUsd) },
    { label: 'Rewards earned', value: formatUsd(stats.doneRewardsUsd) },
  ]
  return (
    <dl
      aria-label="Task totals"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
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
