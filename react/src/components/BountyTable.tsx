import type { KeyboardEvent } from 'react'
import { STATUS_LABELS } from '../data/bounties'
import { useBounties } from '../context/BountyContext'
import { daysUntil, formatDate, formatUsd, type SortKey } from '../utils/bounties'

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Bounty' },
  { key: 'rewardUsd', label: 'Reward' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'submissions', label: 'Submissions' },
]

/**
 * Sortable, keyboard-navigable bounty table.
 * Rows are buttons: Enter/Space opens the detail panel, and arrow keys
 * move between rows. Sort buttons expose aria-sort on the column header.
 */
export function BountyTable() {
  const {
    visibleBounties,
    sortKey,
    sortDirection,
    setSort,
    select,
    selected,
    bookmarkedIds,
    toggleBookmark,
  } = useBounties()

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, index: number) => {
    const rows = document.querySelectorAll<HTMLTableRowElement>('[data-bounty-row]')
    if (e.key === 'ArrowDown' && index < rows.length - 1) {
      e.preventDefault()
      rows[index + 1].focus()
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      rows[index - 1].focus()
    }
  }

  if (visibleBounties.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-800">No bounties match your filters.</p>
        <p className="mt-1 text-sm text-slate-600">
          Try a different search term or clear the filters above.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Solana bounties, sorted by {sortKey}{' '}
          {sortDirection === 'asc' ? 'ascending' : 'descending'}. Activate a row to see
          details.
        </caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100">
            {SORT_COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className="px-4 py-3 font-semibold text-slate-700"
              >
                <button
                  type="button"
                  onClick={() => setSort(col.key)}
                  className="inline-flex items-center gap-1 hover:text-solana-purple"
                  aria-label={`Sort by ${col.label.toLowerCase()}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 font-semibold text-slate-700">
              Category
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-slate-700">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-slate-700">
              <span className="sr-only">Bookmark</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleBounties.map((bounty, index) => {
            const days = daysUntil(bounty.deadline)
            const isSelected = selected?.id === bounty.id
            const isBookmarked = bookmarkedIds.includes(bounty.id)
            return (
              <tr
                key={bounty.id}
                data-bounty-row
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${bounty.title}, ${formatUsd(bounty.rewardUsd)}, ${STATUS_LABELS[bounty.status]}. Press Enter for details.`}
                onClick={() => select(isSelected ? null : bounty.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    select(isSelected ? null : bounty.id)
                  } else {
                    handleRowKeyDown(e, index)
                  }
                }}
                className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-violet-50 ${
                  isSelected ? 'bg-violet-100' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <span className="block font-medium text-slate-900">{bounty.title}</span>
                  <span className="block text-xs text-slate-500">{bounty.sponsor}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatUsd(bounty.rewardUsd)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatDate(bounty.deadline)}
                  <span
                    className={`block text-xs ${
                      days < 0 ? 'font-medium text-red-600' : 'text-slate-500'
                    }`}
                  >
                    {days < 0
                      ? `Ended ${Math.abs(days)}d ago`
                      : days === 0
                        ? 'Ends today'
                        : `${days}d left`}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{bounty.submissions}</td>
                <td className="px-4 py-3 text-slate-700">{bounty.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      bounty.status === 'open'
                        ? 'bg-emerald-100 text-emerald-800'
                        : bounty.status === 'in-review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {STATUS_LABELS[bounty.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(bounty.id)
                    }}
                    aria-pressed={isBookmarked}
                    aria-label={
                      isBookmarked
                        ? `Remove ${bounty.title} from bookmarks`
                        : `Bookmark ${bounty.title}`
                    }
                    className="rounded-md px-2 py-1 text-lg leading-none hover:bg-violet-100"
                  >
                    <span aria-hidden="true">{isBookmarked ? '★' : '☆'}</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
