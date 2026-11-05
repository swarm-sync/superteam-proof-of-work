import { BountyProvider } from './context/BountyContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StatsBar } from './components/StatsBar'
import { FilterBar } from './components/FilterBar'
import { BountyTable } from './components/BountyTable'
import { BountyDetail } from './components/BountyDetail'

export default function App() {
  return (
    <BountyProvider>
      <ErrorBoundary>
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
          <a
            href="#bounty-table"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip to bounty table
          </a>
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-solana-purple">
              Solana · Superteam Earn
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">
              Solana Bounty Tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Track open bounties across the Solana ecosystem: filter by category, sort by
              reward or deadline, and bookmark the ones you plan to submit to. Data is a
              realistic sample shown for demonstration — live data would come from the
              Superteam Earn API.
            </p>
          </header>

          <main className="flex flex-col gap-5">
            <StatsBar />
            <FilterBar />
            <div id="bounty-table">
              <BountyTable />
            </div>
            <BountyDetail />
          </main>

          <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
            Built with React 18, TypeScript, Tailwind CSS, and Context + hooks. Bookmarks
            persist in your browser (localStorage). Keyboard: Tab to move, Enter to open a
            bounty, ↑/↓ to move between rows, Esc to close details.
          </footer>
        </div>
      </ErrorBoundary>
    </BountyProvider>
  )
}
