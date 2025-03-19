import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // You'll need to create this with basic styling
import App from "./App.jsx";
import { setupGlobalErrorHandler } from "./utils/errorTracking";
import * as serviceWorker from "./serviceWorker";
import { logEnvironmentInfo, warn } from "./utils/logger";

// Initialize error tracking in production
if (process.env.NODE_ENV === "production") {
  setupGlobalErrorHandler();
}

// Log environment information
logEnvironmentInfo();

// Warn about missing environment variables
if (
  !process.env.REACT_APP_SUPABASE_URL ||
  !process.env.REACT_APP_SUPABASE_ANON_KEY
) {
  warn(
    "%c⚠️ Missing Supabase environment variables. Application may not function correctly.",
    "background: #FFC107; color: black; padding: 2px 4px; border-radius: 3px;"
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://create-react-app.dev/docs/making-a-progressive-web-app/
serviceWorker.register();
