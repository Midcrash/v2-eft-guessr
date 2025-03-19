#!/usr/bin/env node

/**
 * Script to validate required environment variables for production build
 *
 * This script is run during the build process to ensure all necessary
 * environment variables are present before building for production.
 */

// Try to load .env file if it exists
try {
  require("dotenv").config();
} catch (e) {
  console.log("dotenv not installed, skipping .env load");
}

// Define required environment variables
const requiredEnvVars = [
  "REACT_APP_SUPABASE_URL",
  "REACT_APP_SUPABASE_ANON_KEY",
];

// Check for missing variables
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

// Exit with error if any required variables are missing
if (missingVars.length > 0) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "🚨 Error: Missing required environment variables:"
  );
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error(
    "\nPlease make sure these variables are defined in your .env file or deployment environment."
  );
  process.exit(1);
}

// Log success message
console.log(
  "\x1b[32m%s\x1b[0m",
  "✅ All required environment variables are present."
);
process.exit(0);
