import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { tasksAdapterSelectors } from './tasksSlice'
import type { Task } from './tasksApi'

const selectTasksState = (state: RootState) => state.tasks
const selectFiltersState = (state: RootState) => state.filters

/** All tasks, sorted by due date (adapter sortComparer). Memoized. */
export const selectAllTasks = createSelector(
  [selectTasksState],
  (tasks) => tasksAdapterSelectors.selectAll(tasks),
)

export const selectTaskById = (state: RootState, id: string) =>
  tasksAdapterSelectors.selectById(state.tasks, id)

export const selectTaskCount = createSelector(
  [selectTasksState],
  (tasks) => tasksAdapterSelectors.selectTotal(tasks),
)

export const selectLoadStatus = (state: RootState) => state.tasks.loadStatus
export const selectTasksError = (state: RootState) => state.tasks.error
export const selectSavingIds = (state: RootState) => state.tasks.savingIds

const PRIORITY_RANK: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }

/**
 * The visible task list: status + priority + text filters, then the chosen
 * sort. Memoized with createSelector — recomputes only when the tasks or the
 * filters change, not on every unrelated render.
 */
export const selectVisibleTasks = createSelector(
  [selectAllTasks, selectFiltersState],
  (tasks, filters) => {
    const query = filters.query.trim().toLowerCase()
    const filtered = tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (!query) return true
      return [task.title, task.sponsor, task.notes]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    const direction = filters.sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (filters.sortField === 'dueDate') {
        return direction * a.dueDate.localeCompare(b.dueDate)
      }
      if (filters.sortField === 'rewardUsd') {
        return direction * (a.rewardUsd - b.rewardUsd)
      }
      return direction * (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    })
  },
)

/** Summary numbers for the stats bar. Memoized. */
export const selectTaskStats = createSelector([selectAllTasks], (tasks) => {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const totalRewardsUsd = tasks.reduce((sum, t) => sum + t.rewardUsd, 0)
  const doneRewardsUsd = tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.rewardUsd, 0)
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10),
  ).length
  return { total, done, inProgress, totalRewardsUsd, doneRewardsUsd, overdue }
})
