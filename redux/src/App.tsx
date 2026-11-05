import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { clearError, fetchTasks } from './features/tasks/tasksSlice'
import { StatsBar } from './components/StatsBar'
import { FilterBar } from './components/FilterBar'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'

function Dashboard() {
  const dispatch = useAppDispatch()
  const loadStatus = useAppSelector((state) => state.tasks.loadStatus)
  const error = useAppSelector((state) => state.tasks.error)

  // Load once on mount. If tasks were rehydrated from localStorage the slice
  // already holds them; fetchTasks refreshes from the (simulated) server.
  useEffect(() => {
    if (loadStatus === 'idle') {
      void dispatch(fetchTasks())
    }
  }, [dispatch, loadStatus])

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
      <a
        href="#task-list"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to task list
      </a>
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-solana-purple">
          Solana · Superteam Earn
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
          Bounty Task Tracker
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Track the work behind your Solana bounty submissions: what is due, what
          pays, and what is done. State is managed with Redux Toolkit — normalized
          entities, async thunks, memoized selectors — and persists in your
          browser so a reload never loses your list.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>
            <strong>Something went wrong:</strong> {error}
          </p>
          <button
            type="button"
            onClick={() => dispatch(clearError())}
            aria-label="Dismiss error"
            className="shrink-0 rounded-md border border-red-300 px-2 py-1 font-medium hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex flex-col gap-5">
        <StatsBar />
        <TaskForm />
        <FilterBar />
        <div id="task-list">
          <TaskList />
        </div>
      </main>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Built with React 19, Redux Toolkit (createEntityAdapter, createAsyncThunk,
        createSelector), TypeScript, and Tailwind CSS. Tasks persist in localStorage;
        the simulated API in src/features/tasks/tasksApi.ts stands in for a real
        backend. Keyboard: Tab to move, Enter/Space to activate controls.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  )
}
