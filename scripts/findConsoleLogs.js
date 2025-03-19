/**
 * Script to find console.log statements in the codebase
 *
 * This script is cross-platform and will work on Windows, Mac, and Linux.
 * It recursively searches all JS and JSX files for console.log statements.
 */

const fs = require("fs");
const path = require("path");

// Define the directory to search in
const searchDir = path.join(__dirname, "..", "src");

// Define file extensions to search
const extensions = [".js", ".jsx"];

// Define the pattern to search for
const patterns = [
  "console.log",
  "console.warn",
  "console.error",
  "console.info",
  "console.debug",
];

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Counters for statistics
const stats = {
  totalFiles: 0,
  matchingFiles: 0,
  totalMatches: 0,
  byType: {},
};

// Initialize counters for each pattern
patterns.forEach((pattern) => {
  stats.byType[pattern] = 0;
});

/**
 * Recursively search for files with specified extensions
 * @param {string} dir - The directory to search in
 * @returns {string[]} - Array of file paths
 */
function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursive call for directories
      results = results.concat(findFiles(filePath));
    } else {
      // Check if the file has one of the specified extensions
      const ext = path.extname(filePath).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });

  return results;
}

/**
 * Search for patterns in a file
 * @param {string} filePath - The path to the file
 * @returns {Object} - Object containing matches
 */
function searchFile(filePath) {
  stats.totalFiles++;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let hasMatch = false;
  const matches = {};

  lines.forEach((line, lineNumber) => {
    patterns.forEach((pattern) => {
      if (line.includes(pattern)) {
        hasMatch = true;
        stats.byType[pattern]++;
        stats.totalMatches++;

        if (!matches[pattern]) {
          matches[pattern] = [];
        }

        matches[pattern].push({
          line: lineNumber + 1,
          content: line.trim(),
        });
      }
    });
  });

  if (hasMatch) {
    stats.matchingFiles++;
    return {
      filePath: filePath.replace(path.join(__dirname, ".."), ""),
      matches,
    };
  }

  return null;
}

/**
 * Print the results in a readable format
 * @param {Array} results - Array of search results
 */
function printResults(results) {
  console.log(`${colors.cyan}===== Console Log Finder =====\n${colors.reset}`);

  if (results.length === 0) {
    console.log(
      `${colors.green}No console statements found in the codebase!${colors.reset}`
    );
    return;
  }

  console.log(
    `${colors.yellow}Found ${stats.totalMatches} console statements in ${stats.matchingFiles} files:${colors.reset}\n`
  );

  results.forEach((result) => {
    console.log(`${colors.cyan}${result.filePath}${colors.reset}`);

    Object.keys(result.matches).forEach((pattern) => {
      console.log(`  ${colors.yellow}${pattern}:${colors.reset}`);

      result.matches[pattern].forEach((match) => {
        console.log(
          `    ${colors.magenta}Line ${match.line}:${colors.reset} ${match.content}`
        );
      });
    });

    console.log("");
  });

  // Print statistics
  console.log(`${colors.cyan}===== Statistics =====\n${colors.reset}`);
  console.log(
    `${colors.blue}Total files scanned:${colors.reset} ${stats.totalFiles}`
  );
  console.log(
    `${colors.blue}Files with matches:${colors.reset} ${stats.matchingFiles}`
  );
  console.log(
    `${colors.blue}Total matches:${colors.reset} ${stats.totalMatches}\n`
  );

  console.log(`${colors.blue}Breakdown by type:${colors.reset}`);
  Object.keys(stats.byType).forEach((pattern) => {
    if (stats.byType[pattern] > 0) {
      console.log(
        `  ${colors.yellow}${pattern}:${colors.reset} ${stats.byType[pattern]}`
      );
    }
  });

  // Recommendations
  console.log(`\n${colors.cyan}===== Recommendations =====\n${colors.reset}`);
  console.log(
    `${colors.green}1. Replace console.log with logger.log from src/utils/logger.js${colors.reset}`
  );
  console.log(
    `${colors.green}2. Replace console.warn with logger.warn${colors.reset}`
  );
  console.log(
    `${colors.green}3. Replace console.error with logger.error${colors.reset}`
  );
  console.log(
    `${colors.green}4. Use the logger utility to ensure logs are stripped in production${colors.reset}`
  );
}

// Main execution
try {
  const files = findFiles(searchDir);
  const results = [];

  files.forEach((file) => {
    const result = searchFile(file);
    if (result) {
      results.push(result);
    }
  });

  printResults(results);

  // Exit with error code if matches found (useful for CI)
  process.exit(stats.totalMatches > 0 ? 1 : 0);
} catch (error) {
  console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
  process.exit(1);
}
