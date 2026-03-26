"use client";

import { Component, type ReactNode } from "react";
import styles from "./error-boundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for catching and handling errors in component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Send to error tracking service (e.g., Sentry)
      console.error("Error details:", {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error) ?? (
          <div className={styles.container}>
            <div className={styles.content}>
              <h1 className={styles.title}>Something went wrong</h1>
              <p className={styles.message}>
                We encountered an unexpected error. Please try refreshing the
                page.
              </p>
              {process.env.NODE_ENV === "development" && (
                <details className={styles.details}>
                  <summary>Error details (development only)</summary>
                  <pre className={styles.errorText}>
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                className={styles.button}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
