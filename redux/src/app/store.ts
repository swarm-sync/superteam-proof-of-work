import { configureStore } from '@reduxjs/toolkit'
import { tasksReducer, type TasksState } from '../features/tasks/tasksSlice'
import { filtersReducer } from '../features/filters/filtersSlice'

export const PERSISTENCE_KEY = 'solana-task-tracker:tasks-v1'

export interface PersistedTasks {
  ids: string[]
  entities: TasksState['entities']
}

/** Rehydrate the normalized tasks slice from localStorage, if present. */
export function loadPersistedTasks(): PersistedTasks | undefined {
  try {
    const raw = localStorage.getItem(PERSISTENCE_KEY)
    if (!raw) return undefined
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as PersistedTasks).ids) &&
      typeof (parsed as PersistedTasks).entities === 'object'
    ) {
      return parsed as PersistedTasks
    }
    return undefined
  } catch {
    return undefined
  }
}

function savePersistedTasks(state: RootState): void {
  try {
    const persisted: PersistedTasks = {
      ids: state.tasks.ids,
      entities: state.tasks.entities,
    }
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(persisted))
  } catch {
    // Storage full or unavailable — the app keeps working in memory.
  }
}

export function createAppStore(preloadedTasks?: PersistedTasks) {
  const persisted = preloadedTasks ?? loadPersistedTasks()
  const store = configureStore({
    reducer: {
      tasks: tasksReducer,
      filters: filtersReducer,
    },
    preloadedState: persisted
      ? {
          tasks: {
            ids: persisted.ids,
            entities: persisted.entities,
            loadStatus: 'succeeded' as const,
            error: null,
            savingIds: [],
          },
        }
      : undefined,
  })

  // Persist only the normalized tasks slice, on every change (cheap: small list).
  let lastSerialized = ''
  store.subscribe(() => {
    const state = store.getState()
    const serialized = JSON.stringify({
      ids: state.tasks.ids,
      entities: state.tasks.entities,
    })
    if (serialized !== lastSerialized) {
      lastSerialized = serialized
      savePersistedTasks(state)
    }
  })

  return store
}

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

/** The app's single store instance. Tests call createAppStore() for isolation. */
export const store = createAppStore()
