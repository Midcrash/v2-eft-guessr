/**
 * Supabase Storage Configuration for EFTGuessr
 * This file defines the storage structure, bucket names, and access patterns
 */

// Bucket names used in the application
export const STORAGE_BUCKETS = {
  IMAGES: "tarkov-images", // For location screenshots
  MAPS: "tarkov-maps", // For map images and SVGs
  ASSETS: "tarkov-assets", // For UI elements and other assets
};

// Functions to get standardized paths for various storage needs
/**
 * Generate a storage path for a location screenshot
 * @param {string} mapName - The map name (e.g., "customs")
 * @param {string} filename - The original filename
 * @returns {string} The storage path
 */
export const getLocationPath = (mapName, filename) => {
  return `${mapName}/${filename}`;
};

/**
 * Generate a storage path for a map image
 * @param {string} mapName - The map name (e.g., "customs")
 * @param {string} type - The type of map image (e.g., "2d", "interactive")
 * @param {string} extension - The file extension (default: "jpg")
 * @returns {string} The storage path
 */
export const getMapImagePath = (mapName, type = "2d", extension = "jpg") => {
  return `${mapName}/${mapName}-${type}.${extension}`;
};

/**
 * Get the URL for a file in Supabase storage
 * @param {Object} supabase - The initialized Supabase client
 * @param {string} bucket - The bucket name from STORAGE_BUCKETS
 * @param {string} path - The file path within the bucket
 * @returns {string} The public URL for the file
 */
export const getPublicUrl = (supabase, bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Recommended storage structure for Supabase buckets:
 *
 * tarkov-images/
 * ├── customs/
 * │   ├── image-1.jpg
 * │   ├── image-2.jpg
 * │   └── ...
 * ├── woods/
 * │   ├── image-1.jpg
 * │   └── ...
 * └── ...
 *
 * tarkov-maps/
 * ├── customs/
 * │   ├── customs-2d.jpg
 * │   ├── customs-interactive.svg
 * │   └── metadata.json
 * ├── woods/
 * │   ├── woods-2d.jpg
 * │   ├── woods-interactive.svg
 * │   └── metadata.json
 * └── ...
 *
 * tarkov-assets/
 * ├── markers/
 * │   ├── marker-red.png
 * │   ├── marker-blue.png
 * │   └── ...
 * ├── ui/
 * │   ├── logo.png
 * │   └── ...
 * └── ...
 */
