import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import { BOUNTIES, type Bounty } from '../data/bounties'
import {
  DEFAULT_FILTERS,
  filterBounties,
  sortBounties,
  type FilterState,
  type SortDirection,
  type SortKey,
} from '../utils/bounties'

interface BountyState {
  filters: FilterState
  sortKey: SortKey
  sortDirection: SortDirection
  selectedId: string | null
  /** IDs the user has bookmarked; persisted to localStorage by the provider. */
  bookmarkedIds: string[]
}

type Action =
  | { type: 'SET_FILTER'; patch: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SORT'; key: SortKey }
  | { type: 'SELECT'; id: string | null }
  | { type: 'TOGGLE_BOOKMARK'; id: string }

const BOOKMARK_STORAGE_KEY = 'solana-bounty-tracker:bookmarks'

function loadBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function reducer(state: BountyState, action: Action): BountyState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.patch } }
    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_FILTERS }
    case 'SET_SORT': {
      if (state.sortKey === action.key) {
        return {
          ...state,
          sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
        }
      }
      return { ...state, sortKey: action.key, sortDirection: 'desc' }
    }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'TOGGLE_BOOKMARK': {
      const has = state.bookmarkedIds.includes(action.id)
      const next = has
        ? state.bookmarkedIds.filter((id) => id !== action.id)
        : [...state.bookmarkedIds, action.id]
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage full or unavailable — bookmarks still work in memory.
      }
      return { ...state, bookmarkedIds: next }
    }
    default:
      return state
  }
}

interface BountyContextValue {
  bounties: Bounty[]
  visibleBounties: Bounty[]
  filters: FilterState
  sortKey: SortKey
  sortDirection: SortDirection
  selected: Bounty | null
  bookmarkedIds: string[]
  setFilter: (patch: Partial<FilterState>) => void
  resetFilters: () => void
  setSort: (key: SortKey) => void
  select: (id: string | null) => void
  toggleBookmark: (id: string) => void
}

const BountyContext = createContext<BountyContextValue | null>(null)

export function BountyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    filters: DEFAULT_FILTERS,
    sortKey: 'deadline' as SortKey,
    sortDirection: 'asc' as SortDirection,
    selectedId: null,
    bookmarkedIds: loadBookmarks(),
  }))

  const visibleBounties = useMemo(
    () =>
      sortBounties(filterBounties(BOUNTIES, state.filters), state.sortKey, state.sortDirection),
    [state.filters, state.sortKey, state.sortDirection],
  )

  const selected = useMemo(
    () => BOUNTIES.find((b) => b.id === state.selectedId) ?? null,
    [state.selectedId],
  )

  const value = useMemo<BountyContextValue>(
    () => ({
      bounties: BOUNTIES,
      visibleBounties,
      filters: state.filters,
      sortKey: state.sortKey,
      sortDirection: state.sortDirection,
      selected,
      bookmarkedIds: state.bookmarkedIds,
      setFilter: (patch) => dispatch({ type: 'SET_FILTER', patch }),
      resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
      setSort: (key) => dispatch({ type: 'SET_SORT', key }),
      select: (id) => dispatch({ type: 'SELECT', id }),
      toggleBookmark: (id) => dispatch({ type: 'TOGGLE_BOOKMARK', id }),
    }),
    [visibleBounties, selected, state],
  )

  return <BountyContext.Provider value={value}>{children}</BountyContext.Provider>
}

export function useBounties(): BountyContextValue {
  const ctx = useContext(BountyContext)
  if (!ctx) throw new Error('useBounties must be used inside <BountyProvider>')
  return ctx
}

/** Debounce a string value (used for the search input). */
export function useDebouncedValue(value: string, delayMs = 250): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}
