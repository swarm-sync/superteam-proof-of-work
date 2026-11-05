import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TaskPriority, TaskStatus } from '../tasks/tasksApi'

export type StatusFilter = 'all' | TaskStatus
export type SortField = 'dueDate' | 'rewardUsd' | 'priority'
export type SortDirection = 'asc' | 'desc'

export interface FiltersState {
  status: StatusFilter
  priority: TaskPriority | 'all'
  query: string
  sortField: SortField
  sortDirection: SortDirection
}

const initialState: FiltersState = {
  status: 'all',
  priority: 'all',
  query: '',
  sortField: 'dueDate',
  sortDirection: 'asc',
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.status = action.payload
    },
    setPriorityFilter(state, action: PayloadAction<TaskPriority | 'all'>) {
      state.priority = action.payload
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
    },
    /** Clicking the active sort field flips direction; a new field sorts ascending. */
    setSortField(state, action: PayloadAction<SortField>) {
      if (state.sortField === action.payload) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        state.sortField = action.payload
        state.sortDirection = 'asc'
      }
    },
    resetFilters() {
      return initialState
    },
  },
})

export const { setStatusFilter, setPriorityFilter, setQuery, setSortField, resetFilters } =
  filtersSlice.actions
export const filtersReducer = filtersSlice.reducer
