# Files to Clean Up Before Deployment

This document lists files that can be safely deleted before deploying to Vercel, as they're either unused, duplicate, or only needed for testing.

## Test and Debug Components

These components were created for testing and debugging purposes and aren't needed in production:

- `src/components/TestInsertButton.jsx` - Test component for database insertion
- `src/services/testInsert.js` - Test service for database operations

## Duplicate or Obsolete Files

These files are duplicate or obsolete and can be removed:

- `src/pages/CustomsMap.css` - Not imported anywhere
- `src/pages/Home.jsx` (or `src/pages/HomePage.jsx`) - Both appear to serve similar purposes, but App.jsx uses HomePage.jsx while App.js uses Home.jsx
- `src/App.js` - Appears to be a duplicate of App.jsx

## Development Tools

These components may still be useful for development but could be removed for production:

- `src/components/StorageTest.jsx` - Debug component for storage testing
- `src/components/StorageURLDemo.jsx` - Debug component for storage URLs
- `src/components/DirectURLDemo.jsx` - Debug component for direct URL access

## How to Clean Up

You have two options:

1. **Production Branch Approach (Recommended)**:

   - Create a separate production branch without these files
   - Deploy only the production branch to Vercel

2. **Selective Deployment**:
   - Use Vercel's ignore patterns in vercel.json to exclude these files
   - Add the following to your vercel.json:

```json
{
  "github": {
    "silent": true
  },
  "ignoreFiles": [
    "src/components/TestInsertButton.jsx",
    "src/services/testInsert.js",
    "src/pages/CustomsMap.css",
    "src/pages/Home.jsx",
    "src/App.js",
    "src/components/StorageTest.jsx",
    "src/components/StorageURLDemo.jsx",
    "src/components/DirectURLDemo.jsx"
  ]
}
```

These files don't impact functionality but removing them will reduce your bundle size and keep your production environment cleaner.
