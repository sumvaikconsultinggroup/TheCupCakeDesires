'use client'

import { extractErrorDetails, getUserFriendlyErrorMessage, logError } from '@/utils/errorLogger'
import { Home, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  userFriendlyMessage: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      userFriendlyMessage: '',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      userFriendlyMessage: getUserFriendlyErrorMessage(error),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = extractErrorDetails(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })

    if (typeof window !== 'undefined') {
      errorData.route = window.location.pathname
      errorData.userAgent = navigator.userAgent

      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          errorData.userId = user.id || user.clerkId
          errorData.userEmail = user.email
        }
      } catch (e) {
        // Ignore errors reading user data
      }
    }

    logError(errorData)

    if (typeof window !== 'undefined') {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: { message: error.message, stack: error.stack },
          context: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            route: window.location.pathname,
          },
        }),
      }).catch((apiError) => {
        console.error('Failed to log error via API:', apiError)
      })
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      userFriendlyMessage: '',
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="font-bake-body relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6 py-16">
          {/* Decorative blooms — same vocabulary as the rest of the site */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-accent/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-32 h-112 w-md rounded-full bg-cocoa/10 blur-3xl"
          />

          <div className="relative w-full max-w-xl">
            <div className="rounded-3xl border border-line bg-ivory p-10 shadow-[0_40px_100px_-30px_rgba(46,31,21,0.3)] md:p-12">
              {/* Eyebrow */}
              <p className="bake-eyebrow text-center">
                <span className="mx-auto inline-block h-px w-8 align-middle bg-rose-accent" />
                <span className="mx-3">A small kitchen hiccup</span>
                <span className="inline-block h-px w-8 align-middle bg-rose-accent" />
              </p>

              {/* Title */}
              <h1 className="bake-display-lg mt-6 text-center">
                The frosting <span className="bake-display-italic text-rose-accent">slipped.</span>
              </h1>

              <p className="bake-body mt-5 text-center text-cocoa-soft">
                {this.state.userFriendlyMessage ||
                  'Something on this page didn’t bake quite right. Give it another moment, or head back to the shop floor.'}
              </p>

              {/* Dev-only details */}
              {process.env.NODE_ENV === 'development' &&
                this.props.showDetails &&
                this.state.error && (
                  <div className="mt-6 rounded-2xl border border-line bg-cream-deep/40 p-4 text-left">
                    <p className="bake-caption text-rose-accent">Developer details</p>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[12px] text-cocoa-soft">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button onClick={this.handleReset} className="bake-btn">
                  <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  Try again
                </button>
                <Link href="/" className="bake-btn bake-btn-ghost">
                  <Home className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  Back to shop
                </Link>
              </div>

              {/* Support footer */}
              <div className="mt-8 border-t border-line pt-6 text-center">
                <p className="bake-body-sm text-taupe">
                  Still stuck? Reach the bakery at{' '}
                  <a
                    href="mailto:hello@cupcakedesires.com"
                    className="inline-flex items-center gap-1 font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
                    hello@cupcakedesires.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
