# EFTGuessr

A geographic guessing game for Escape from Tarkov, inspired by GeoGuessr. Test your knowledge of Tarkov maps by guessing locations from in-game screenshots.

## Features

- **Multiple Maps**: Play on various Tarkov maps (Customs, Woods, Factory, etc.)
- **Scoring System**: Points based on how close your guess is to the actual location
- **Score Tracking**: View your scores and track your improvement
- **Admin Interface**: Upload screenshots with embedded coordinates
- **Image Optimization**: Automatically optimize images before upload to reduce storage costs
- **Dark Mode UI**: Modern dark theme for better visibility and reduced eye strain

## Tech Stack

- **Frontend**: React
- **Backend**: Supabase (PostgreSQL + Storage)
- **Map Display**: Leaflet.js with custom CRS
- **Deployment**: Vercel ready with configuration

## Prerequisites

- Node.js (v16+)
- NPM or Yarn
- Supabase account (free tier is sufficient)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tarkov-guessr.git
cd tarkov-guessr
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to create and configure your Supabase project.

### 4. Configure Environment

Create a `.env` file in the root directory:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your Supabase project URL and anon key.

### 5. Start the Development Server

```bash
npm start
# or
yarn start
```

The app should now be running at [http://localhost:3000](http://localhost:3000).

## How to Play

1. From the homepage, select a map and the number of rounds
2. For each round, you'll see a screenshot from somewhere in the selected map
3. Click on the map where you think the screenshot was taken
4. After guessing, you'll see the actual location and your score
5. Continue for all rounds to get your total score

## How to Add Screenshots

1. Take screenshots in-game making sure coordinates are captured in the filename (format: `2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png`)
2. Go to the admin page at `/admin`
3. Select the map and upload the screenshots
4. The system will automatically extract coordinates from the filenames
5. Use the optimized uploader to reduce storage costs and improve loading times

## Production Deployment

For deploying to production, refer to the following documents:

- [Production Deployment Guide](./PRODUCTION.md) - Detailed deployment instructions
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist for reliable deployments
- [Production Summary](./PRODUCTION_SUMMARY.md) - Overview of production optimizations

### Quick Deployment Commands

```bash
# Build for production (optimized, no source maps)
npm run build:production

# Analyze bundle size
npm run analyze

# Serve production build locally
npm run serve
```

### Vercel Deployment

This app is configured for easy deployment on Vercel. To deploy:

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Import the project on Vercel
3. Configure the following build settings:
   - Build Command: `npm run build:production`
   - Output Directory: `build`
4. Add your environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Deploy!

## License

[MIT License](LICENSE)

## Acknowledgements

- Inspiration from [GeoGuessr](https://www.geoguessr.com/)
- Game assets from Escape from Tarkov by Battlestate Games
