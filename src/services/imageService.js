import { parseImageFilename } from "../utils/imageUtils";
import {
  loadGameImagesOptimized,
  loadGameImagesWithFallback,
} from "../utils/imageUtils";

/**
 * Fetch random images for a game session
 * @param {string} mapName - The map name for filtering images
 * @param {number} count - Number of images to fetch
 * @returns {Promise<Array>} - Array of image objects with paths and coordinates
 */
export const fetchRandomImages = async (mapName, count = 5) => {
  try {
    console.log(`Fetching ${count} random images for map: ${mapName}`);
    // Use the fallback function to ensure we get images even if storage fails
    const images = await loadGameImagesWithFallback(mapName, count);
    return images;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw new Error(
      `Failed to fetch images for game session: ${error.message}`
    );
  }
};

/**
 * Calculate the score based on the distance between guess and actual location
 * @param {Object} guessCoords - The coordinates of the player's guess {x, y, z}
 * @param {Object} actualCoords - The actual coordinates from the image {x, y, z}
 * @returns {Object} - Score and distance
 */
export const calculateScore = (guessCoords, actualCoords) => {
  // Calculate Euclidean distance in 3D space
  const dx = guessCoords.x - actualCoords.x;
  const dy = guessCoords.y - actualCoords.y;
  const dz = guessCoords.z - actualCoords.z;

  // Calculate distance
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Calculate score based on distance
  // The closer the guess, the higher the score
  // Max score of 5000 points
  const maxDistance = 500; // Maximum distance for scoring
  const maxScore = 5000; // Maximum possible score

  let score = 0;
  if (distance <= maxDistance) {
    // Score decreases exponentially with distance
    score = Math.round(maxScore * Math.exp(-distance / 100));
  }

  return {
    score,
    distance,
  };
};
