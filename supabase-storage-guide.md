# Supabase Storage Setup for EFTGuessr

This guide explains how to set up and use Supabase Storage for the EFTGuessr game. Supabase provides a simple and secure way to store and manage images and other assets needed for the game.

## Table of Contents

1. [Storage Structure](#storage-structure)
2. [Setting Up Supabase](#setting-up-supabase)
3. [Bucket Configuration](#bucket-configuration)
4. [Database Schema](#database-schema)
5. [Upload Workflow](#upload-workflow)
6. [Integrating with EFTGuessr](#integrating-with-EFTGuessr)
7. [Troubleshooting](#troubleshooting)

## Storage Structure

The EFTGuessr game uses the following Supabase storage structure:

### Buckets

1. **tarkov-images** - For storing location screenshots
2. **tarkov-maps** - For storing map images and SVGs
3. **tarkov-assets** - For UI elements, markers, and other assets

### Directory Structure

```
tarkov-images/
├── customs/
│   ├── image-1.jpg
│   ├── image-2.jpg
│   └── ...
├── woods/
│   ├── image-1.jpg
│   └── ...
└── ...

tarkov-maps/
├── customs/
│   ├── customs-2d.jpg
│   ├── customs-interactive.svg
│   └── metadata.json
├── woods/
│   ├── woods-2d.jpg
│   ├── woods-interactive.svg
│   └── metadata.json
└── ...

tarkov-assets/
├── markers/
│   ├── marker-red.png
│   ├── marker-blue.png
│   └── ...
├── ui/
│   ├── logo.png
│   └── ...
└── ...
```

## Setting Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project with a name like "tarkov-guessr"
3. Once your project is created, note the Project URL and anon/public API key from the project settings

## Bucket Configuration

Create the three required storage buckets with appropriate permissions:

1. Go to the Storage section in your Supabase dashboard
2. Create each bucket:

   ### tarkov-images

   - Name: `tarkov-images`
   - Public access: Enable - files can be accessed by anyone
   - Security setting: Choose "Only authenticated users can upload/delete files"

   ### tarkov-maps

   - Name: `tarkov-maps`
   - Public access: Enable - files can be accessed by anyone
   - Security setting: Choose "Only authenticated users can upload/delete files"

   ### tarkov-assets

   - Name: `tarkov-assets`
   - Public access: Enable - files can be accessed by anyone
   - Security setting: Choose "Only authenticated users can upload/delete files"

## Database Schema

Create the necessary tables in your Supabase database:

### Locations Table

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_name TEXT NOT NULL,
  x_coord FLOAT NOT NULL,
  y_coord FLOAT,
  z_coord FLOAT NOT NULL,
  image_path TEXT NOT NULL,
  original_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_coordinates UNIQUE (map_name, x_coord, z_coord),
  CONSTRAINT unique_image_path UNIQUE (image_path)
);

-- Add indexes for better performance
CREATE INDEX idx_locations_map_name ON locations (map_name);
```

### Map Configs Table (Optional)

```sql
CREATE TABLE map_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_name TEXT UNIQUE NOT NULL,
  world_bounds JSONB NOT NULL,
  image_width INTEGER NOT NULL,
  image_height INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Upload Workflow

### Manual Upload from Dashboard

1. Navigate to the Storage section in your Supabase dashboard
2. Select the appropriate bucket (e.g., `tarkov-images`)
3. Navigate to the appropriate folder (e.g., `customs`)
4. Upload files using the dashboard interface
5. After uploading, you'll need to manually insert records into the `locations` table with the correct coordinates and paths

### Using the Admin Interface

The EFTGuessr Admin interface automates the process:

1. Sign in to the Admin page
2. Select the map the images belong to
3. Upload images with filenames that include the coordinates (format: `2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png`)
4. The app will automatically:
   - Upload the image to the correct bucket and folder
   - Parse coordinates from the filename
   - Create a database record with the image path and coordinates

## Integrating with EFTGuessr

The game is already set up to use Supabase. Here's how it works:

1. **Configuration**: Update the Supabase URL and key in `src/api/supabase.js`

```javascript
// src/api/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
```

2. **Image Loading**: The game loads location images from Supabase using the `getGameImages` function in `src/utils/imageUtils.js`

3. **Map Loading**: Map images are referenced in the map configuration files

4. **Admin Upload**: The Admin interface uses the `uploadBatchScreenshots` function in `src/services/locationService.js` to upload images and create database records

## Troubleshooting

### Common Issues

1. **Images not loading**

   - Check the browser console for errors
   - Verify that the image paths in the database match the actual paths in Supabase storage
   - Ensure public access is enabled for the buckets

2. **Upload failures**

   - Check file size limits in Supabase (default max: 50MB)
   - Verify that the correct permissions are set for the buckets
   - Check filename format if coordinates aren't being parsed correctly

3. **Filename Issues**

   - Supabase Storage has restrictions on special characters in filenames
   - The application automatically sanitizes filenames, replacing problematic characters
   - Original filenames are stored in the database for reference
   - If you see "Invalid key" errors, it means the sanitization function needs updating
   - Common problematic characters include: `[](){}|\\^<>?*'"`, spaces, and non-ASCII characters

4. **CORS Issues**
   - Configure CORS in your Supabase project settings to allow requests from your app domain
   - Default settings should work for local development (http://localhost:3000)

### Useful Queries

To check all locations in the database:

```sql
SELECT * FROM locations ORDER BY created_at DESC LIMIT 20;
```

To count locations by map:

```sql
SELECT map_name, COUNT(*) FROM locations GROUP BY map_name ORDER BY COUNT(*) DESC;
```

To check for problematic paths:

```sql
SELECT id, map_name, image_path
FROM locations
WHERE image_path NOT LIKE 'https://%'
LIMIT 10;
```

To compare original filenames with sanitized paths:

```sql
SELECT
  id,
  map_name,
  original_filename,
  SUBSTRING(image_path FROM '([^/]+)$') AS sanitized_filename
FROM locations
ORDER BY created_at DESC
LIMIT 20;
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
