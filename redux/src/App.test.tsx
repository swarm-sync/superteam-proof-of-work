import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { store } from './app/store'
import { fetchTasks } from './features/tasks/tasksSlice'
import { resetFilters } from './features/filters/filtersSlice'
import { failNextApiCalls, resetTaskApi } from './features/tasks/tasksApi'

beforeEach(async () => {
  localStorage.clear()
  resetTaskApi()
  store.dispatch(resetFilters())
  // Reset the singleton store to the fresh server seed between tests.
  await store.dispatch(fetchTasks())
})

describe('Bounty Task Tracker (Redux)', () => {
  it('loads and lists the seed tasks', async () => {
    render(<App />)
    expect(await screen.findByText('Draft validator-ordering explainer outline')).toBeInTheDocument()
    expect(screen.getByText('Showing 6 of 6 tasks')).toBeInTheDocument()
    expect(screen.getByText('Rewards tracked')).toBeInTheDocument()
  })

  it('adds a task through the form', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Draft validator-ordering explainer outline')

    await user.type(screen.getByLabelText(/Title \*/i), 'Write the QoS video script')
    await user.type(screen.getByLabelText(/Sponsor \*/i), 'Jito')
    await user.type(screen.getByLabelText(/Reward \(USD\) \*/i), '800')
    await user.type(screen.getByLabelText(/Due date \*/i), '2026-12-01')
    await user.click(screen.getByRole('button', { name: /Add task/i }))

    expect(await screen.findByText('Write the QoS video script')).toBeInTheDocument()
    expect(await screen.findByText('Showing 7 of 7 tasks')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Task added.')
  })

  it('shows a validation error for a too-short title', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Draft validator-ordering explainer outline')

    await user.type(screen.getByLabelText(/Title \*/i), 'Hi')
    await user.type(screen.getByLabelText(/Sponsor \*/i), 'Jito')
    await user.type(screen.getByLabelText(/Reward \(USD\) \*/i), '800')
    await user.type(screen.getByLabelText(/Due date \*/i), '2026-12-01')
    await user.click(screen.getByRole('button', { name: /Add task/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('at least 3 characters')
    expect(screen.getByText('Showing 6 of 6 tasks')).toBeInTheDocument()
  })

  it('marks a task done via its status select', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Design wallet onboarding flow frames')

    const select = screen.getByLabelText('Status for Design wallet onboarding flow frames')
    await user.selectOptions(select, 'done')

    // The done count in the stats bar goes from 1 to 2 once the async
    // update thunk resolves — wait for it instead of asserting mid-flight.
    const stats = screen.getByLabelText('Task totals')
    await waitFor(() =>
      expect(within(stats).getByText('Done').closest('div')).toHaveTextContent('2'),
    )
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Draft validator-ordering explainer outline')

    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'todo')
    expect(await screen.findByText('Showing 3 of 6 tasks')).toBeInTheDocument()
    expect(screen.queryByText('Ship Blinks tipping action (final review)')).not.toBeInTheDocument()
  })

  it('sorts by reward descending', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Draft validator-ordering explainer outline')

    const rewardButton = screen.getByRole('button', { name: /^Reward/ })
    await user.click(rewardButton) // ascending
    await user.click(rewardButton) // descending
    const list = screen.getByRole('list', { name: /Bounty tasks/i })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Draft validator-ordering explainer outline')
  })

  it('surfaces an API failure in the error banner and lets the user dismiss it', async () => {
    const user = userEvent.setup()
    failNextApiCalls(1)
    render(<App />)
    await screen.findByText('Draft validator-ordering explainer outline')

    // Trigger a failing save: delete a task while the API is rigged to fail.
    await user.click(
      screen.getByRole('button', { name: /Delete Write compressed-NFT guide/i }),
    )
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('could not reach the task service')
    await user.click(screen.getByRole('button', { name: /Dismiss error/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // The task is still there — a failed delete does not remove it.
    expect(screen.getByText('Write compressed-NFT guide, section 1')).toBeInTheDocument()
  })

  it('deletes a task', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('Write compressed-NFT guide, section 1')

    await user.click(
      screen.getByRole('button', { name: /Delete Write compressed-NFT guide/i }),
    )
    await screen.findByText('Showing 5 of 5 tasks')
    expect(screen.queryByText('Write compressed-NFT guide, section 1')).not.toBeInTheDocument()
  })
})
