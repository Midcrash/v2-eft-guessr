import { getLocationsFromStorage } from "../services/locationService";
import { getDemoImages } from "./directStorageAccess";
import { log, error } from "./logger";

/**
 * Extract coordinates from a string with various possible formats
 * Can handle comma-separated, dash-separated, or mixed formats
 *
 * @param {string} coordString - The string containing coordinates
 * @returns {Array} - Array of coordinates as floats [x, y, z]
 */
const extractCoordinatesFromString = (coordString) => {
  if (!coordString) return [0, 0, 0];

  log("Extracting coordinates from string:", coordString);

  // Replace any sequence of non-numeric/decimal separators with a single space
  // This handles various formats like "482.0,_2.6,_-118.5" or "482.0-_2.6-_-118.5"
  const cleanString = coordString.replace(/[^-\d.]+/g, " ");
  log("Cleaned coordinate string:", cleanString);

  // Split by spaces and filter out any empty strings
  const parts = cleanString.split(" ").filter(Boolean);
  log("Coordinate parts:", parts);

  // Get up to 3 coordinates
  const result = [0, 0, 0];
  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    const value = parseFloat(parts[i]);
    if (!isNaN(value)) {
      result[i] = value;
    }
  }

  log("Extracted coordinates:", result);
  return result;
};

/**
 * Parses the image filename to extract coordinate information
 * Handles both original and sanitized filename formats:
 *
 * Original format: "2023-12-05[22-32]_676.0, 8.5, 126.1_0.0, -0.9, 0.1, 0.5_12.78 (0).png"
 * Sanitized format: "2023-12-05TS-22-28-TS_482.0,_2.6,_-118.5_0.0,_0.4,_0.0,_0.9_12.29_P0P-1742338560595.png"
 *
 * @param {string} filename - The image filename to parse
 * @returns {Object} - Extracted information including coordinates
 */
export const parseImageFilename = (filename) => {
  try {
    log("Parsing filename:", filename);

    // Match original format first (with commas)
    const originalFormatMatch = filename.match(
      /_(-?\d+\.?\d*),\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)_/
    );

    if (originalFormatMatch && originalFormatMatch.length >= 4) {
      log("Found coordinates using original format with commas");
      return {
        coordinates: {
          x: parseFloat(originalFormatMatch[1]),
          y: parseFloat(originalFormatMatch[2]),
          z: parseFloat(originalFormatMatch[3]),
        },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }, // Default quaternion
        timestamp: "",
        originalFilename: filename,
      };
    }

    // Match sanitized format with commas and optional underscores (like 482.0,_2.6,_-118.5)
    const sanitizedWithCommasMatch = filename.match(
      /_(-?\d+\.?\d*),_?(-?\d+\.?\d*),_?(-?\d+\.?\d*)_/
    );

    if (sanitizedWithCommasMatch && sanitizedWithCommasMatch.length >= 4) {
      log(
        "Found coordinates using sanitized format with commas and optional underscores"
      );
      log("Extracted coordinate values:", {
        x: parseFloat(sanitizedWithCommasMatch[1]),
        y: parseFloat(sanitizedWithCommasMatch[2]),
        z: parseFloat(sanitizedWithCommasMatch[3]),
      });
      return {
        coordinates: {
          x: parseFloat(sanitizedWithCommasMatch[1]),
          y: parseFloat(sanitizedWithCommasMatch[2]),
          z: parseFloat(sanitizedWithCommasMatch[3]),
        },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }, // Default quaternion
        timestamp: "",
        originalFilename: filename,
      };
    }

    // Match sanitized format (with "-_" separators) - keep this as a fallback
    const sanitizedFormatMatch = filename.match(
      /_(-?\d+\.?\d*)-_(-?\d+\.?\d*)-_(-?\d+\.?\d*)_/
    );

    if (sanitizedFormatMatch && sanitizedFormatMatch.length >= 4) {
      log("Found coordinates using sanitized format with -_ separators");
      return {
        coordinates: {
          x: parseFloat(sanitizedFormatMatch[1]),
          y: parseFloat(sanitizedFormatMatch[2]),
          z: parseFloat(sanitizedFormatMatch[3]),
        },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }, // Default quaternion
        timestamp: "",
        originalFilename: filename,
      };
    }

    // If neither direct match works, use the more flexible approach
    // First, remove any timestamp suffix added by Supabase
    const cleanFilename = filename.replace(/-\d+\.png$/, ".png");

    // Extract the parts separated by underscores
    const parts = cleanFilename.split("_");

    if (parts.length < 3) {
      log(`Invalid filename format, too few parts: ${parts.length}`, parts);

      // Instead of trying to use regex, we'll try to extract coordinates from the whole filename
      log("Trying to extract coordinates from the entire filename");
      const coords = extractCoordinatesFromString(filename);

      if (coords[0] !== 0 || coords[2] !== 0) {
        log("Found coordinates from entire filename:", coords);
        return {
          coordinates: {
            x: coords[0],
            y: coords[1],
            z: coords[2],
          },
          quaternion: { x: 0, y: 0, z: 0, w: 1 },
          timestamp: "",
          originalFilename: filename,
        };
      }

      throw new Error(
        "Invalid filename format and no coordinates found with extraction utility"
      );
    }

    // Find the part that likely contains coordinates
    let coordPart = null;
    let coordValues = [0, 0, 0];

    // Look through parts for the one with coordinates
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      // Check if this part contains coordinate-like content
      // Coordinates typically have numbers, decimals, and separators
      if (/\d+\.?\d*/.test(part)) {
        coordPart = part;
        log("Found potential coordinate part:", part);

        // Use our robust extraction utility
        coordValues = extractCoordinatesFromString(part);

        // If we found valid X and Z coordinates, we can stop
        if (coordValues[0] !== 0 && coordValues[2] !== 0) {
          log("Found valid X and Z coordinates, using these");
          break;
        }
      }
    }

    // Verify we found valid coordinates
    if (isNaN(coordValues[0]) || isNaN(coordValues[2])) {
      log("Using global extraction fallback for coordinates");

      // Extract coordinates from the entire filename as a last resort
      coordValues = extractCoordinatesFromString(filename);
    }

    // At this point, if we still don't have valid coordinates, use placeholders
    for (let i = 0; i < 3; i++) {
      if (isNaN(coordValues[i])) {
        log(`Missing valid value for coordinate ${i}, using 0`);
        coordValues[i] = 0;
      }
    }

    log("Successfully parsed coordinates:", coordValues);

    return {
      coordinates: {
        x: coordValues[0],
        y: coordValues[1],
        z: coordValues[2],
      },
      quaternion: { x: 0, y: 0, z: 0, w: 1 }, // Default quaternion for simplicity
      timestamp: parts[0],
      originalFilename: filename,
    };
  } catch (error) {
    error("Error parsing image filename:", error, filename);
    // Return a default object with an error flag
    return {
      coordinates: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: "",
      originalFilename: filename,
      error: error.message,
    };
  }
};

/**
 * Lists all images from the storage bucket for a specific map
 * @param {string} mapName - Name of the map to get images for
 * @param {number} limit - Maximum number of images to return
 * @returns {Promise<Array>} - Array of image objects with paths and coordinates
 */
export const getGameImages = async (mapName = "customs", limit = 10) => {
  try {
    log(`Getting ${limit} game images for map: ${mapName}`);

    // Get locations directly from storage
    const locations = await getLocationsFromStorage(mapName);

    if (!locations || locations.length === 0) {
      log(`No images found in storage for map: ${mapName}`);
      throw new Error(`No locations found for map: ${mapName}`);
    }

    log(`Found ${locations.length} total images for ${mapName} in storage`);

    // Shuffle array and take up to 'limit' items
    const shuffled = [...locations].sort(() => 0.5 - Math.random());
    const selected = limit ? shuffled.slice(0, limit) : shuffled;

    log(`Selected ${selected.length} random images for game`);

    // Transform location objects to our expected format
    return selected.map((location) => ({
      id: location.id,
      path: location.image_path,
      coordinates: {
        x: location.x_coord,
        y: location.y_coord || 0, // Default to 0 if not provided
        z: location.z_coord,
      },
      originalFilename: location.filename,
      mapName: location.map_name,
    }));
  } catch (error) {
    error(`Error fetching images from storage for map ${mapName}:`, error);
    throw new Error(`Failed to load images for ${mapName}: ${error.message}`);
  }
};

// Helper to shuffle array for randomized image selection
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * Loads game images with optimized behavior for different game lengths
 * and includes built-in prefetching of images.
 *
 * @param {string} mapName - The name of the map for which images are to be loaded
 * @param {number} totalNeeded - The total number of images required for the game
 * @param {number} batchSize - The number of images to load in each batch (default: 5)
 * @returns {Promise<Array>} - Array of image objects ready for the game
 */
export const loadGameImagesOptimized = async (
  mapName,
  totalNeeded,
  batchSize = 5
) => {
  log(
    `Loading game images optimized - Map: ${mapName}, Need: ${totalNeeded}, Batch: ${batchSize}`
  );

  try {
    // For all games, we just load the images directly from storage
    log(`Loading images for ${mapName} directly from storage`);
    const allLocations = await getLocationsFromStorage(mapName);

    if (!allLocations || allLocations.length === 0) {
      log(`No locations found for map: ${mapName} in storage`);
      throw new Error(`No locations found for map: ${mapName}`);
    }

    log(
      `Found ${allLocations.length} total locations for ${mapName} in storage`
    );

    // If we have fewer locations than needed, warn but continue with what we have
    if (allLocations.length < totalNeeded) {
      log(
        `Warning: Not enough locations for ${mapName} - needed ${totalNeeded}, found ${allLocations.length}`
      );
    }

    // Shuffle the locations to ensure randomness
    const shuffledLocations = shuffleArray([...allLocations]);

    // Select the required number of locations (or all if we have fewer)
    const availableCount = Math.min(totalNeeded, shuffledLocations.length);
    const selectedLocations = shuffledLocations.slice(0, availableCount);

    log(`Selected ${selectedLocations.length} locations for game`);

    // Transform the locations into our expected format
    const imageObjects = selectedLocations.map((location) => ({
      id: location.id,
      path: location.image_path, // Use the public URL directly
      coordinates: {
        x: location.x_coord,
        y: location.y_coord || 0, // Default to 0 if not provided
        z: location.z_coord,
      },
      originalFilename: location.filename,
      mapName: location.map_name,
    }));

    // Start preloading all images in the background to ensure they're cached
    // This improves performance during gameplay without blocking the UI
    log("Starting background preloading of all game images");

    const preloadPromises = imageObjects.map((img) => {
      return new Promise((resolve) => {
        log(`Preloading image: ${img.path}`);
        const image = new Image();
        image.onload = () => {
          log(`Successfully preloaded: ${img.path}`);
          resolve(true);
        };
        image.onerror = (err) => {
          log(`Failed to preload image: ${img.path}`, err);
          resolve(false); // Resolve anyway to not block the game
        };
        image.src = img.path;
      });
    });

    // Wait for preloading to complete to ensure images are ready
    const preloadResults = await Promise.all(preloadPromises);
    const successCount = preloadResults.filter(Boolean).length;

    log(`Preloaded ${successCount}/${imageObjects.length} images successfully`);

    if (successCount === 0) {
      throw new Error(`Failed to preload any images for map: ${mapName}`);
    }

    // If we have fewer successful preloads than needed, filter to include only successful ones
    if (successCount < imageObjects.length) {
      // This would require tracking which images loaded successfully
      log(
        `Some images failed to preload, proceeding with ${successCount} images`
      );
    }

    // Return the image objects
    return imageObjects;
  } catch (error) {
    error(`Error in loadGameImagesOptimized for ${mapName}:`, error);
    throw new Error(`Failed to load optimized game images: ${error.message}`);
  }
};

/**
 * Get demo images directly from URLs without storage lookups
 * This is a fallback for when storage bucket access fails
 * @param {string} mapName - Name of the map to get images for
 * @param {number} limit - Maximum number of images to return
 * @returns {Array} - Array of image objects with direct URLs and coordinates
 */
export const getDirectUrlImages = (mapName = "customs", limit = 5) => {
  log(`Getting ${limit} direct URL images for map: ${mapName}`);

  // Use our new utility that generates demo images with direct URLs
  return getDemoImages(mapName, limit);
};

/**
 * Modified version of the optimized loading function for clarity and error handling
 * @param {string} mapName - Name of the map to get images for
 * @param {number} totalNeeded - Total number of images required for the game
 * @param {number} batchSize - For future optimization of larger games
 * @returns {Promise<Array>} - Array of image objects
 */
export const loadGameImagesWithFallback = async (
  mapName,
  totalNeeded,
  batchSize = 5
) => {
  log(`Loading game images - Map: ${mapName}, Need: ${totalNeeded}`);

  try {
    // Load images from storage with our improved function
    log("Loading images from Supabase storage");
    const imageObjects = await loadGameImagesOptimized(
      mapName,
      totalNeeded,
      batchSize
    );

    log(`Successfully loaded ${imageObjects.length} images for ${mapName}`);
    return imageObjects;
  } catch (error) {
    error(`Error loading images for ${mapName}:`, error);

    // Instead of falling back, we'll throw a more informative error
    // that helps the user understand the storage issue
    throw new Error(
      `Unable to load images for ${mapName}. ` +
        `Please ensure your Supabase storage bucket "tarkov-images" contains the ${mapName} folder ` +
        `with properly formatted image files. Error: ${error.message}`
    );
  }
};
