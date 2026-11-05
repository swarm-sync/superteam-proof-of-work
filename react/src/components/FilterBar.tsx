import { useEffect, useState } from 'react'
import { CATEGORIES, STATUSES, STATUS_LABELS } from '../data/bounties'
import { useBounties, useDebouncedValue } from '../context/BountyContext'

/** Search + category/status/reward filters. Search is debounced so typing stays fast. */
export function FilterBar() {
  const { filters, setFilter, resetFilters, visibleBounties } = useBounties()
  const [searchInput, setSearchInput] = useState(filters.query)
  const debouncedQuery = useDebouncedValue(searchInput)

  // Push the debounced value into shared state whenever it settles.
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      setFilter({ query: debouncedQuery })
    }
  }, [debouncedQuery, filters.query, setFilter])

  const isFiltered =
    filters.query !== '' ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.minReward > 0

  return (
    <section
      aria-label="Filter bounties"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="bounty-search" className="block text-sm font-medium text-slate-700">
            Search bounties
          </label>
          <input
            id="bounty-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Title, sponsor, or skill — e.g. Anchor"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) =>
              setFilter({ category: e.target.value as typeof filters.category })
            }
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) =>
              setFilter({ status: e.target.value as typeof filters.status })
            }
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="min-reward" className="block text-sm font-medium text-slate-700">
            Min. reward (USD)
          </label>
          <input
            id="min-reward"
            type="number"
            min={0}
            step={100}
            value={filters.minReward}
            onChange={(e) => setFilter({ minReward: Math.max(0, Number(e.target.value) || 0) })}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              resetFilters()
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear filters
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-slate-600">
        Showing {visibleBounties.length}{' '}
        {visibleBounties.length === 1 ? 'bounty' : 'bounties'}
      </p>
    </section>
  )
}
