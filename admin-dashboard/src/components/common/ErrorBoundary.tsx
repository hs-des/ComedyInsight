import { Component, ErrorInfo, ReactNode } from 'react'

import { ErrorState } from '../feedback'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: unknown[]
  reportUrl?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info)
    } else {
      console.error('Error boundary caught:', error, info)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props

    if (this.state.hasError && resetKeys && prevProps.resetKeys) {
      const isDifferent = resetKeys.length !== prevProps.resetKeys.length || resetKeys.some((item, index) => !Object.is(item, prevProps.resetKeys![index]))

      if (isDifferent) {
        this.handleReset()
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return <>{this.props.fallback(this.state.error, this.handleReset)}</>
      }

      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <ErrorState
          onRetry={this.handleReset}
          details={this.state.error.message}
          action=
            {this.props.reportUrl ? (
              <button
                type="button"
                onClick={() => window.open(this.props.reportUrl, '_blank', 'noopener,noreferrer')}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-100"
              >
                Report issue
              </button>
            ) : null}
        />
      )
    }

    return this.props.children
  }
}

