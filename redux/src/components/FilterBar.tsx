import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  resetFilters,
  setPriorityFilter,
  setQuery,
  setSortField,
  setStatusFilter,
  type SortField,
} from '../features/filters/filtersSlice'
import { selectVisibleTasks } from '../features/tasks/tasksSelectors'

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: 'dueDate', label: 'Due date' },
  { field: 'rewardUsd', label: 'Reward' },
  { field: 'priority', label: 'Priority' },
]

export function FilterBar() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.filters)
  const visibleCount = useAppSelector((state) => selectVisibleTasks(state).length)
  const totalCount = useAppSelector((state) => state.tasks.ids.length)

  const isFiltered =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.query !== '' ||
    filters.sortField !== 'dueDate' ||
    filters.sortDirection !== 'asc'

  return (
    <section
      aria-label="Filter tasks"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="task-search" className="block text-sm font-medium text-slate-700">
            Search tasks
          </label>
          <input
            id="task-search"
            type="search"
            value={filters.query}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            placeholder="Title, sponsor, or notes"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value as typeof filters.status))}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={(e) =>
              dispatch(setPriorityFilter(e.target.value as typeof filters.priority))
            }
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <fieldset className="flex items-end gap-2">
          <legend className="sr-only">Sort tasks by</legend>
          <span aria-hidden="true" className="pb-2 text-sm font-medium text-slate-700">
            Sort:
          </span>
          {SORT_FIELDS.map(({ field, label }) => (
            <button
              key={field}
              type="button"
              onClick={() => dispatch(setSortField(field))}
              aria-pressed={filters.sortField === field}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                filters.sortField === field
                  ? 'border-solana-purple bg-violet-100 text-violet-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {label}
              {filters.sortField === field &&
                (filters.sortDirection === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </fieldset>

        {isFiltered && (
          <button
            type="button"
            onClick={() => dispatch(resetFilters())}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear filters
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-slate-600">
        Showing {visibleCount} of {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
      </p>
    </section>
  )
}
