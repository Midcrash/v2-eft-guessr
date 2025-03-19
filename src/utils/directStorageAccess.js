/**
 * Direct Storage Access Utilities
 *
 * These utilities help access Supabase storage directly by building URLs,
 * without needing to list buckets or use the Supabase client's storage APIs.
 * This is useful when you have limited permissions for the anonymous role.
 */

const SUPABASE_URL = "https://zzskvzngwjuccpsdnvlh.supabase.co";
const BUCKET_NAME = "tarkov-images";

/**
 * Build a direct public URL for a file in Supabase storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path within the bucket (e.g., "customs/image.png")
 * @returns {string} - The direct public URL
 */
export const buildDirectUrl = (bucket = BUCKET_NAME, path) => {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};

/**
 * Get a direct URL for a file in the tarkov-images bucket
 * @param {string} mapName - The map name (folder)
 * @param {string} fileName - The filename
 * @returns {string} - The direct URL
 */
export const getImageUrl = (mapName, fileName) => {
  return buildDirectUrl(BUCKET_NAME, `${mapName}/${fileName}`);
};

/**
 * Get an array of known maps
 * @returns {Array<string>} - Array of map names
 */
export const getKnownMaps = () => {
  return [
    "customs",
    "woods",
    "factory",
    "shoreline",
    "interchange",
    "reserve",
    "lighthouse",
    "labs",
  ];
};

/**
 * Get a hardcoded sample image for a map
 * This is a fallback for demonstration when you can't list bucket contents
 * @param {string} mapName - The map name
 * @returns {string} - A sample image URL for the map
 */
export const getSampleImage = (mapName) => {
  // Known filename pattern for the customs map
  if (mapName === "customs") {
    return buildDirectUrl(
      BUCKET_NAME,
      "customs/2023-12-05B-22-28-E_482.0-_2.6-_-118.5_0.0-_0.4-_0.0-_0.9_12.29_P0P-1742335795669.png"
    );
  }

  // For other maps, you can add known filenames here
  // This is a fallback approach when you can't dynamically list bucket contents

  // Return a default image URL if no specific sample is available
  return null;
};

/**
 * Check if a URL is accessible by attempting to load it as an image
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Promise resolving to true if accessible, false otherwise
 */
export const checkUrlAccessible = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Convert coordinates and other information into a filename
 * This is useful for generating filenames that match your pattern
 * @param {Object} coords - Coordinates object {x, y, z}
 * @param {Object} quaternion - Quaternion object {x, y, z, w}
 * @returns {string} - Formatted filename
 */
export const formatFilename = (
  coords,
  quaternion = { x: 0, y: 0, z: 0, w: 1 }
) => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const coordPart = `${coords.x.toFixed(1)}-_${coords.y.toFixed(
    1
  )}-_${coords.z.toFixed(1)}`;
  const quatPart = `${quaternion.x.toFixed(1)}-_${quaternion.y.toFixed(
    1
  )}-_${quaternion.z.toFixed(1)}-_${quaternion.w.toFixed(1)}`;

  return `${timestamp}_${coordPart}_${quatPart}_12.29_P0P.png`;
};

/**
 * Create a direct URL for an image with coordinates
 * @param {string} mapName - Map name
 * @param {Object} coords - Coordinates object {x, y, z}
 * @returns {string} - URL for the image
 */
export const createCoordinateImageUrl = (mapName, coords) => {
  const filename = formatFilename(coords);
  return getImageUrl(mapName, filename);
};

/**
 * Get known demo images for maps with coordinates
 * @param {string} mapName - Map name
 * @param {number} count - Number of images to return
 * @returns {Array<Object>} - Array of image objects with URLs and coordinates
 */
export const getDemoImages = (mapName, count = 5) => {
  // Hardcoded demo images for each map with coordinates
  const demoSets = {
    customs: [
      { coords: { x: 482.0, y: 2.6, z: -118.5 } },
      { coords: { x: 356.3, y: 1.8, z: -221.2 } },
      { coords: { x: 289.7, y: 0.5, z: -178.3 } },
      { coords: { x: 421.5, y: 3.2, z: -195.6 } },
      { coords: { x: 326.9, y: 1.7, z: -142.8 } },
      { coords: { x: 398.2, y: 2.1, z: -215.3 } },
      { coords: { x: 275.6, y: 0.8, z: -201.9 } },
    ],
    woods: [
      { coords: { x: 312.4, y: 0.9, z: -167.3 } },
      { coords: { x: 245.1, y: 1.2, z: -134.7 } },
      { coords: { x: 356.8, y: 0.5, z: -198.2 } },
      { coords: { x: 287.5, y: 1.3, z: -142.1 } },
      { coords: { x: 332.9, y: 0.7, z: -178.5 } },
    ],
    factory: [
      { coords: { x: 134.2, y: 2.5, z: -67.8 } },
      { coords: { x: 156.5, y: 3.1, z: -85.2 } },
      { coords: { x: 198.3, y: 2.8, z: -102.7 } },
      { coords: { x: 212.4, y: 5.2, z: -121.5 } },
      { coords: { x: 245.7, y: 4.8, z: -143.8 } },
    ],
    // Add other maps as needed
  };

  // Use the specified map or fall back to customs
  const demoData = demoSets[mapName] || demoSets.customs;

  // Generate image objects with URLs
  return demoData.slice(0, count).map((item, index) => {
    // Create a filename based on the coordinates
    const filename = formatFilename(item.coords);

    return {
      id: `${mapName}-demo-${index}`,
      path: getImageUrl(mapName, filename),
      url: getImageUrl(mapName, filename),
      name: filename,
      coordinates: item.coords,
      originalFilename: filename,
      mapName: mapName,
    };
  });
};
