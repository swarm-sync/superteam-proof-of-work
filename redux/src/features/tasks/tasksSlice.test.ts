import { beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, PERSISTENCE_KEY } from '../../app/store'
import {
  addTask,
  clearError,
  deleteTask,
  fetchTasks,
  updateTaskStatus,
} from './tasksSlice'
import { failNextApiCalls, resetTaskApi } from './tasksApi'

function freshStore() {
  localStorage.clear()
  resetTaskApi()
  return createAppStore()
}

describe('tasks slice', () => {
  beforeEach(() => {
    localStorage.clear()
    resetTaskApi()
  })

  it('starts idle with no tasks', () => {
    const store = freshStore()
    const state = store.getState().tasks
    expect(state.loadStatus).toBe('idle')
    expect(state.ids).toHaveLength(0)
    expect(state.error).toBeNull()
  })

  it('fetchTasks loads the seed list into normalized state', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    const state = store.getState().tasks
    expect(state.loadStatus).toBe('succeeded')
    expect(state.ids).toHaveLength(6)
    // Normalized: entities keyed by id, ids in due-date order (adapter sort).
    expect(state.entities['task-004']?.title).toContain('Blinks')
    expect(state.ids[0]).toBe('task-004') // earliest due date: 2026-10-15
  })

  it('addTask appends a normalized entity', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    const result = await store.dispatch(
      addTask({
        title: 'New bounty task',
        sponsor: 'Test Sponsor',
        rewardUsd: 750,
        priority: 'high',
        dueDate: '2026-12-10',
        notes: 'test note',
      }),
    )
    expect(addTask.fulfilled.match(result)).toBe(true)
    const state = store.getState().tasks
    expect(state.ids).toHaveLength(7)
    const added = Object.values(state.entities).find((t) => t?.title === 'New bounty task')
    expect(added?.status).toBe('todo')
    expect(added?.rewardUsd).toBe(750)
  })

  it('updateTaskStatus changes only the targeted entity', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    await store.dispatch(updateTaskStatus({ id: 'task-002', status: 'done' }))
    const state = store.getState().tasks
    expect(state.entities['task-002']?.status).toBe('done')
    expect(state.entities['task-001']?.status).toBe('in-progress')
  })

  it('deleteTask removes the entity and its id', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    await store.dispatch(deleteTask('task-003'))
    const state = store.getState().tasks
    expect(state.ids).toHaveLength(5)
    expect(state.entities['task-003']).toBeUndefined()
  })

  it('fetchTasks failure sets loadStatus failed and a readable error', async () => {
    const store = freshStore()
    failNextApiCalls(1)
    const result = await store.dispatch(fetchTasks())
    expect(fetchTasks.rejected.match(result)).toBe(true)
    const state = store.getState().tasks
    expect(state.loadStatus).toBe('failed')
    expect(state.error).toMatch(/could not reach the task service/i)
  })

  it('addTask failure keeps existing tasks and records the error', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    failNextApiCalls(1)
    await store.dispatch(
      addTask({
        title: 'Will fail',
        sponsor: 'Nobody',
        rewardUsd: 100,
        priority: 'low',
        dueDate: '2026-12-01',
      }),
    )
    const state = store.getState().tasks
    expect(state.ids).toHaveLength(6)
    expect(state.error).toMatch(/could not reach the task service/i)
  })

  it('updateTaskStatus failure clears the saving flag and records the error', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    failNextApiCalls(1)
    await store.dispatch(updateTaskStatus({ id: 'task-001', status: 'done' }))
    const state = store.getState().tasks
    expect(state.entities['task-001']?.status).toBe('in-progress')
    expect(state.savingIds).not.toContain('task-001')
    expect(state.error).toMatch(/could not reach the task service/i)
  })

  it('deleteTask of an unknown id reports a not-found error', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    const result = await store.dispatch(deleteTask('task-999'))
    expect(deleteTask.rejected.match(result)).toBe(true)
    expect(store.getState().tasks.error).toMatch(/not found/i)
    expect(store.getState().tasks.ids).toHaveLength(6)
  })

  it('clearError clears a surfaced error', async () => {
    const store = freshStore()
    failNextApiCalls(1)
    await store.dispatch(fetchTasks())
    expect(store.getState().tasks.error).not.toBeNull()
    store.dispatch(clearError())
    expect(store.getState().tasks.error).toBeNull()
  })

  it('persists the normalized tasks slice to localStorage on change', async () => {
    const store = freshStore()
    await store.dispatch(fetchTasks())
    const raw = localStorage.getItem(PERSISTENCE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string) as { ids: string[]; entities: Record<string, unknown> }
    expect(parsed.ids).toHaveLength(6)
    expect(Object.keys(parsed.entities)).toHaveLength(6)
  })
})
