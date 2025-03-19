/**
 * Error tracking utility for production
 *
 * This module provides functions to log errors and optionally send them
 * to an error tracking service. In a real-world application, you would
 * likely integrate with services like Sentry, LogRocket, or similar.
 */

// Determine if we're in production environment
const isProduction = process.env.NODE_ENV === "production";

/**
 * Log an error with additional context
 *
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  // Always log to console
  console.error("[ERROR]", error);

  // In production, we would send this to an error tracking service
  if (isProduction) {
    // Add app version info
    const appInfo = {
      version: process.env.REACT_APP_VERSION || "unknown",
      environment: process.env.NODE_ENV,
    };

    // Combine error data with context and app info
    const errorData = {
      message: error.message,
      stack: error.stack,
      ...context,
      ...appInfo,
      timestamp: new Date().toISOString(),
    };

    // Log structured data for server logs to pick up
    console.error(JSON.stringify(errorData));

    // You would integrate with your error tracking service here
    // For example, with Sentry:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  }
};

/**
 * Global error boundary for handling uncaught errors
 */
export const setupGlobalErrorHandler = () => {
  if (typeof window !== "undefined") {
    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      logError(event.reason, { type: "unhandledRejection" });
    });

    // Capture global errors
    window.addEventListener("error", (event) => {
      logError(event.error || new Error(event.message), {
        type: "uncaughtError",
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });
  }
};

export default { logError, setupGlobalErrorHandler };
