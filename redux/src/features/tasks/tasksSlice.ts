import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import {
  apiCreateTask,
  apiDeleteTask,
  apiFetchTasks,
  apiUpdateTask,
  type NewTaskInput,
  type Task,
  type TaskStatus,
} from './tasksApi'

/**
 * Normalized task state via createEntityAdapter:
 *   { ids: string[], entities: Record<string, Task> }
 * Normalization keeps updates O(1) by id and avoids duplicated copies of a
 * task across filtered views — every view reads the same entity.
 */
const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => a.dueDate.localeCompare(b.dueDate),
})

export type TasksLoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface TasksState extends ReturnType<typeof tasksAdapter.getInitialState> {
  loadStatus: TasksLoadStatus
  /** Last async error, human-readable; null when no error is outstanding. */
  error: string | null
  /** Ids of tasks with an in-flight save/delete, for per-row spinners. */
  savingIds: string[]
}

const initialState: TasksState = tasksAdapter.getInitialState({
  loadStatus: 'idle',
  error: null,
  savingIds: [],
})

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

/** Load the task list. Errors are captured with rejectWithValue so the UI
 *  gets a typed, displayable message instead of a serialized Error. */
export const fetchTasks = createAsyncThunk<Task[], void, { rejectValue: string }>(
  'tasks/fetchTasks',
  async (_arg, { rejectWithValue }) => {
    try {
      return await apiFetchTasks()
    } catch (error) {
      return rejectWithValue(toErrorMessage(error))
    }
  },
)

export const addTask = createAsyncThunk<Task, NewTaskInput, { rejectValue: string }>(
  'tasks/addTask',
  async (input, { rejectWithValue }) => {
    try {
      return await apiCreateTask(input)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error))
    }
  },
)

export const updateTaskStatus = createAsyncThunk<
  Task,
  { id: string; status: TaskStatus },
  { rejectValue: string }
>('tasks/updateTaskStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await apiUpdateTask(id, { status })
  } catch (error) {
    return rejectWithValue(toErrorMessage(error))
  }
})

export const deleteTask = createAsyncThunk<string, string, { rejectValue: string }>(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      return await apiDeleteTask(id)
    } catch (error) {
      return rejectWithValue(toErrorMessage(error))
    }
  },
)

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    /** Clear a surfaced error (e.g. when the user dismisses the banner). */
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loadStatus = 'loading'
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loadStatus = 'succeeded'
        tasksAdapter.setAll(state, action.payload)
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loadStatus = 'failed'
        state.error = action.payload ?? 'Failed to load tasks'
      })
      // addTask
      .addCase(addTask.pending, (state) => {
        state.error = null
      })
      .addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
        tasksAdapter.addOne(state, action.payload)
      })
      .addCase(addTask.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to add task'
      })
      // updateTaskStatus
      .addCase(updateTaskStatus.pending, (state, action) => {
        state.savingIds.push(action.meta.arg.id)
        state.error = null
      })
      .addCase(updateTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.payload.id)
        tasksAdapter.upsertOne(state, action.payload)
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.meta.arg.id)
        state.error = action.payload ?? 'Failed to update task'
      })
      // deleteTask
      .addCase(deleteTask.pending, (state, action) => {
        state.savingIds.push(action.meta.arg)
        state.error = null
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.payload)
        tasksAdapter.removeOne(state, action.payload)
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.meta.arg)
        state.error = action.payload ?? 'Failed to delete task'
      })
  },
})

export const { clearError } = tasksSlice.actions
export const tasksReducer = tasksSlice.reducer

/** Adapter selectors (selectAll, selectById, selectIds, selectTotal). */
export const tasksAdapterSelectors = tasksAdapter.getSelectors()
