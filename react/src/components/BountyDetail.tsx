import { useEffect, useRef } from 'react'
import { STATUS_LABELS } from '../data/bounties'
import { useBounties } from '../context/BountyContext'
import { daysUntil, formatDate, formatUsd } from '../utils/bounties'

/**
 * Detail panel for the selected bounty. Focus moves into the panel when it
 * opens and returns to the table when it closes (Escape or the close button).
 */
export function BountyDetail() {
  const { selected, select, bookmarkedIds, toggleBookmark } = useBounties()
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selected) closeButtonRef.current?.focus()
  }, [selected])

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, select])

  if (!selected) return null

  const days = daysUntil(selected.deadline)
  const isBookmarked = bookmarkedIds.includes(selected.id)

  return (
    <section
      ref={panelRef}
      aria-labelledby="bounty-detail-title"
      aria-modal="false"
      className="rounded-lg border border-violet-300 bg-white p-5 shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="bounty-detail-title" className="text-xl font-bold text-slate-900">
            {selected.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sponsored by {selected.sponsor} · {selected.category} ·{' '}
            {STATUS_LABELS[selected.status]}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => select(null)}
          aria-label="Close bounty details"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Close ✕
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-800">{selected.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="font-medium text-slate-500">Reward</dt>
          <dd className="font-bold text-slate-900">{formatUsd(selected.rewardUsd)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Deadline</dt>
          <dd className="text-slate-900">
            {formatDate(selected.deadline)} (
            {days < 0 ? `ended ${Math.abs(days)}d ago` : days === 0 ? 'today' : `${days}d left`})
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Submissions</dt>
          <dd className="text-slate-900">{selected.submissions}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Paid out</dt>
          <dd className="text-slate-900">{formatUsd(selected.paidOutUsd)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-500">Skills</h3>
        <ul className="mt-1 flex flex-wrap gap-2" aria-label="Required skills">
          {selected.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => toggleBookmark(selected.id)}
          aria-pressed={isBookmarked}
          className="rounded-md bg-solana-purple px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          {isBookmarked ? '★ Bookmarked — remove' : '☆ Bookmark this bounty'}
        </button>
        <a
          href="https://earn.superteam.fun"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          View on Superteam Earn ↗
        </a>
      </div>
    </section>
  )
}
