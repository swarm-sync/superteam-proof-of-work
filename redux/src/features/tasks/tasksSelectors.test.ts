import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore } from '../../app/store'
import { fetchTasks } from './tasksSlice'
import { setPriorityFilter, setQuery, setSortField, setStatusFilter } from '../filters/filtersSlice'
import {
  selectAllTasks,
  selectTaskById,
  selectTaskCount,
  selectTaskStats,
  selectVisibleTasks,
} from './tasksSelectors'
import { resetTaskApi } from './tasksApi'

async function loadedStore() {
  localStorage.clear()
  resetTaskApi()
  const store = createAppStore()
  await store.dispatch(fetchTasks())
  return store
}

describe('tasks selectors', () => {
  beforeEach(() => {
    localStorage.clear()
    resetTaskApi()
  })

  it('selectAllTasks returns all 6 tasks in due-date order', async () => {
    const store = await loadedStore()
    const tasks = selectAllTasks(store.getState())
    expect(tasks).toHaveLength(6)
    expect(tasks[0].id).toBe('task-004')
    expect(tasks[tasks.length - 1].id).toBe('task-006')
  })

  it('selectTaskById reads a single normalized entity', async () => {
    const store = await loadedStore()
    expect(selectTaskById(store.getState(), 'task-001')?.sponsor).toBe('Superteam Ukraine')
    expect(selectTaskById(store.getState(), 'task-999')).toBeUndefined()
  })

  it('selectTaskCount counts entities', async () => {
    const store = await loadedStore()
    expect(selectTaskCount(store.getState())).toBe(6)
  })

  it('selectVisibleTasks filters by status', async () => {
    const store = await loadedStore()
    store.dispatch(setStatusFilter('done'))
    const visible = selectVisibleTasks(store.getState())
    expect(visible).toHaveLength(1)
    expect(visible[0].id).toBe('task-004')
  })

  it('selectVisibleTasks filters by priority and search together', async () => {
    const store = await loadedStore()
    store.dispatch(setPriorityFilter('high'))
    store.dispatch(setQuery('blinks'))
    const visible = selectVisibleTasks(store.getState())
    expect(visible).toHaveLength(1)
    expect(visible[0].id).toBe('task-004')
  })

  it('selectVisibleTasks sorts by reward descending', async () => {
    const store = await loadedStore()
    store.dispatch(setSortField('rewardUsd'))
    store.dispatch(setSortField('rewardUsd')) // second click flips to desc
    const visible = selectVisibleTasks(store.getState())
    expect(visible[0].rewardUsd).toBe(2500)
    expect(visible[visible.length - 1].rewardUsd).toBe(900)
  })

  it('selectVisibleTasks is memoized: same input state returns the same array', async () => {
    const store = await loadedStore()
    const state = store.getState()
    expect(selectVisibleTasks(state)).toBe(selectVisibleTasks(state))
    expect(selectAllTasks(state)).toBe(selectAllTasks(state))
  })

  it('selectTaskStats summarizes rewards and counts', async () => {
    const store = await loadedStore()
    const stats = selectTaskStats(store.getState())
    expect(stats.total).toBe(6)
    expect(stats.done).toBe(1)
    expect(stats.inProgress).toBe(2)
    expect(stats.totalRewardsUsd).toBe(2500 + 1800 + 900 + 2200 + 1500 + 1200)
    expect(stats.doneRewardsUsd).toBe(2200)
  })
})
