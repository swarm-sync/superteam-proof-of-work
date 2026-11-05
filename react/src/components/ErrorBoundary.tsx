import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Catches render errors anywhere in the dashboard tree and shows a
 * recoverable message instead of a blank page. Keyboard-focusable so
 * assistive-tech users land on the recovery action.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Bounty dashboard crashed:', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-lg border border-red-300 bg-red-50 p-6 text-center"
      >
        <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="mt-2 text-sm text-red-700">
          The bounty dashboard hit an unexpected error
          {this.state.message ? `: ${this.state.message}` : '.'} Your bookmarks are
          safe — try loading the dashboard again.
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    )
  }
}
