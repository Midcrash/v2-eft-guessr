/**
 * Logger utility to handle conditional logging based on environment
 *
 * This utility provides functions that only log in development mode
 * and are completely removed in production, reducing bundle size
 * and preventing information leakage
 */

const isDev = process.env.NODE_ENV !== "production";

/**
 * Log information only in development mode
 * @param {...any} args - Arguments to pass to console.log
 */
export const log = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * Log warnings only in development mode
 * @param {...any} args - Arguments to pass to console.warn
 */
export const warn = (...args) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Log errors in both development and production
 * In production, this could be connected to an error tracking service
 * @param {...any} args - Arguments to pass to console.error
 */
export const error = (...args) => {
  console.error(...args);

  // In production, you might want to send this to an error tracking service
  if (!isDev && window.errorTrackingService) {
    window.errorTrackingService.captureError(...args);
  }
};

/**
 * Log information about the current environment
 * Useful for debugging deployment issues
 */
export const logEnvironmentInfo = () => {
  if (isDev) {
    console.log(
      "%c Development Environment ",
      "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 3px;",
      {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || "unknown",
        supabaseConfigured: Boolean(
          process.env.REACT_APP_SUPABASE_URL &&
            process.env.REACT_APP_SUPABASE_ANON_KEY
        ),
      }
    );
  } else {
    // Minimal production logging
    console.log(
      `%c Tarkov Guessr v${
        process.env.REACT_APP_VERSION || "0.1.0"
      } %c Production`,
      "background: #6e2c2c; color: white; padding: 2px 4px; border-radius: 3px 0 0 3px;",
      "background: #252525; color: white; padding: 2px 4px; border-radius: 0 3px 3px 0;"
    );
  }
};

export default {
  log,
  warn,
  error,
  logEnvironmentInfo,
};
