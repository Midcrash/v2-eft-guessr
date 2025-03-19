# Production Deployment Guide for Tarkov Guessr

This document provides guidance on deploying the Tarkov Guessr application to production environments.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- A Supabase account with:
  - A project set up
  - A storage bucket named "tarkov-images" with appropriate permissions
  - Images uploaded to the storage bucket

## Environment Configuration

The application uses environment variables for configuration. Before deploying, make sure you have the following environment variables set:

### Required Variables

- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous/public API key

### Optional Variables

- `REACT_APP_SITE_TITLE`: The title of your application (defaults to "Tarkov Guessr")
- `REACT_APP_SITE_DESCRIPTION`: The description of your application
- `REACT_APP_VERSION`: The application version (defaults to package.json version)

## Building for Production

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory with your production environment variables:

   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-public-api-key
   ```

3. Build the application:

   ```
   npm run build:production
   ```

4. The optimized production build will be created in the `build` directory.

## Deployment Options

### Netlify

The repository includes a `netlify.toml` configuration file for deploying to Netlify:

1. Connect your repository to Netlify
2. Set the environment variables in the Netlify dashboard
3. Deploy your site

### Vercel

1. Connect your repository to Vercel
2. Set the environment variables in the Vercel dashboard
3. Deploy your site

### Traditional Web Server

1. Copy the contents of the `build` directory to your web server's public HTML directory
2. Configure your web server to serve `index.html` for all routes (to support client-side routing)

## Post-Deployment Verification

After deploying, verify the following:

1. The application loads correctly
2. Maps are loading properly
3. The game functions as expected
4. Images are loading from Supabase storage

## Performance Optimization

The production build is already optimized, but you can further analyze it:

```
npm run analyze
```

This will generate a visualization of the bundle size to help identify large dependencies.

## Troubleshooting

### Images Not Loading

- Check that your Supabase storage bucket has the correct permissions
- Verify that the images are uploaded in the expected directory structure
- Check browser console for any CORS-related errors

### Application Crashes

- Check that all required environment variables are set correctly
- Verify that your Supabase project is online and accessible

## Security Considerations

- The Supabase anonymous key is meant to be public but only grants limited permissions
- Set up appropriate security policies in your Supabase project
- Make sure your storage bucket policies are configured correctly to prevent unauthorized access

## Support

If you encounter any issues, please check:

- [Supabase Documentation](https://supabase.io/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Create React App Documentation](https://create-react-app.dev/docs/getting-started)
