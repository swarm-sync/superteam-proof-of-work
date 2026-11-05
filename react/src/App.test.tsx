import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

function renderApp() {
  return render(<App />)
}

describe('Solana Bounty Tracker', () => {
  it('renders the header, stats, and all 12 bounties by default', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /Solana Bounty Tracker/i })).toBeInTheDocument()
    expect(screen.getByText('Showing 12 bounties')).toBeInTheDocument()
    expect(screen.getByText('Solana Pay checkout plugin for Shopify')).toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText(/Search bounties/i), 'anchor')
    expect(await screen.findByText('Showing 1 bounty')).toBeInTheDocument()
    expect(screen.getByText('Anchor program audit checklist generator')).toBeInTheDocument()
    expect(screen.queryByText('Design a wallet onboarding flow for a DeFi app')).not.toBeInTheDocument()
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.selectOptions(screen.getByLabelText(/Category/i), 'Design')
    expect(await screen.findByText('Showing 2 bounties')).toBeInTheDocument()
  })

  it('sorts by reward when the Reward header button is clicked', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /sort by reward/i }))
    const rows = screen.getAllByRole('button', { name: /Press Enter for details/i })
    expect(rows[0]).toHaveAccessibleName(expect.stringContaining('Solana Pay checkout plugin'))
  })

  it('opens the detail panel when a row is clicked and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByText('Build a Solana validator ordering explainer'))
    const panel = await screen.findByRole('region', { name: /validator ordering explainer/i })
    expect(within(panel).getByText(/Explain how Solana validators order transactions/i)).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: /validator ordering explainer/i })).not.toBeInTheDocument()
  })

  it('toggles a bookmark and exposes the pressed state', async () => {
    const user = userEvent.setup()
    renderApp()
    const bookmark = screen.getByRole('button', {
      name: /Bookmark Build a Solana validator ordering explainer/i,
    })
    expect(bookmark).toHaveAttribute('aria-pressed', 'false')
    await user.click(bookmark)
    expect(bookmark).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText(/Search bounties/i), 'zzz-no-match')
    expect(await screen.findByText(/No bounties match your filters/i)).toBeInTheDocument()
  })
})
