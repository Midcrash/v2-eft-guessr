# Tarkov Guessr Deployment Checklist

Use this checklist to ensure your deployment process is complete and nothing is overlooked.

## Pre-Deployment Checklist

### Environment Configuration

- [ ] `.env` file contains all required environment variables:
  - [ ] `REACT_APP_SUPABASE_URL` is set to your Supabase project URL
  - [ ] `REACT_APP_SUPABASE_ANON_KEY` is set to your Supabase public key
  - [ ] Any additional environment variables are properly configured

### Code Quality

- [ ] ESLint check passes with `npm run lint`
- [ ] All tests pass with `npm test`
- [ ] No console.log statements remain in production code (except for error logging)
- [ ] All development-only logs have been updated to use the logger utility

### Performance

- [ ] Images are optimized and properly sized
- [ ] Bundle size is reasonable (use `npm run analyze` to check)
- [ ] No unnecessary dependencies are included

### Security

- [ ] No sensitive information or API keys are hardcoded in the client-side code
- [ ] All API requests properly validate input
- [ ] Proper error handling is implemented throughout the app

### Browser Compatibility

- [ ] Application works in all target browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### SEO & Metadata

- [ ] Title and meta tags are properly set
- [ ] favicon and app icons are in place
- [ ] robots.txt is configured correctly
- [ ] manifest.json has correct information

## Build Process

1. Install dependencies:

   ```
   npm install
   ```

2. Run linting:

   ```
   npm run lint
   ```

3. Build for production:

   ```
   npm run build:production
   ```

4. Test the production build locally:

   ```
   npm run serve
   ```

5. Analyze bundle size (optional):
   ```
   npm run analyze
   ```

## Deployment Process

### Vercel Deployment

1. [ ] Connect your GitHub repository to Vercel
2. [ ] Configure build settings:
   - Build command: `npm run build:production`
   - Output directory: `build`
3. [ ] Add environment variables in Vercel dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. [ ] Verify vercel.json settings are correct
5. [ ] Deploy the site
6. [ ] Check deployment logs for any warnings or errors

### Traditional Web Server Deployment

1. [ ] Build the project: `npm run build:production`
2. [ ] Copy the contents of the `build` directory to your web server
3. [ ] Configure your web server for SPA routing (all routes to index.html)
4. [ ] Set up proper MIME types and caching headers
5. [ ] Enable HTTPS
6. [ ] Test the deployment

## Post-Deployment Verification

- [ ] Application loads correctly
- [ ] All features work as expected
- [ ] Performance is acceptable (use Lighthouse to check)
- [ ] Images load correctly
- [ ] Error tracking is working
- [ ] Analytics are recording properly (if applicable)
- [ ] Check that environment variables are correctly applied
- [ ] Verify that all API endpoints are working
- [ ] Test direct URL access for deep linking

## Monitoring & Maintenance

- [ ] Set up uptime monitoring
- [ ] Configure error tracking alerts
- [ ] Establish a rollback procedure in case of issues
- [ ] Document the deployment process for future reference

## Future Improvements

- [ ] Implement CI/CD pipeline
- [ ] Add automated testing
- [ ] Implement feature flags
- [ ] Set up a staging environment
- [ ] Implement A/B testing
