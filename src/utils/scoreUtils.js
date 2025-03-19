import { calculateDistance } from "./coordinateUtils";

/**
 * Calculate the score based on the distance between guess and actual location
 * @param {Object} guessCoords - {x, z} coordinates of the player's guess
 * @param {Object} actualCoords - {x, z} coordinates of the actual location
 * @param {Object} mapConfig - Configuration for the specific map
 * @returns {Object} - Score information {score, distance, maxPossibleScore}
 */
export const calculateScore = (guessCoords, actualCoords, mapConfig) => {
  // Calculate the distance between guess and actual location
  const distance = calculateDistance(guessCoords, actualCoords);

  // Calculate map diagonal (approximate maximum possible distance)
  const mapDiagonal = calculateDistance(
    { x: mapConfig.worldBounds.x1, z: mapConfig.worldBounds.z1 },
    { x: mapConfig.worldBounds.x2, z: mapConfig.worldBounds.z2 }
  );

  // Max possible score
  const maxPossibleScore = 5000;

  // Score calculation - exponential decay based on distance
  // The closer you are, the more points you get
  // This formula gives 5000 points for a perfect guess, and drops quickly as distance increases
  const distanceRatio = Math.min(distance / (mapDiagonal * 0.5), 1);
  const score = Math.round(maxPossibleScore * Math.pow(1 - distanceRatio, 2));

  return {
    score,
    distance,
    maxPossibleScore,
    percentageScore: (score / maxPossibleScore) * 100,
  };
};

/**
 * Get a performance rating based on the score
 * @param {number} percentageScore - Score as a percentage of maximum possible score
 * @returns {string} - Rating description
 */
export const getScoreRating = (percentageScore) => {
  if (percentageScore >= 98) return "Perfect!";
  if (percentageScore >= 90) return "Excellent";
  if (percentageScore >= 75) return "Great";
  if (percentageScore >= 50) return "Good";
  if (percentageScore >= 25) return "Fair";
  if (percentageScore >= 10) return "Poor";
  return "Missed";
};

/**
 * Format distance for display
 * @param {number} distance - Distance in game units
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) {
    return "N/A";
  }

  // Round to 1 decimal place
  const roundedDistance = Math.round(distance * 10) / 10;

  // Format based on distance magnitude
  if (roundedDistance < 10) {
    return `${roundedDistance.toFixed(1)} m`;
  } else {
    return `${Math.round(roundedDistance)} m`;
  }
};

/**
 * Get color for score display
 * @param {number} score - Score value
 * @param {number} maxScore - Maximum possible score
 * @returns {string} - CSS color code
 */
export const getScoreColor = (score, maxScore = 5000) => {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return "#27ae60"; // Green
  if (percentage >= 70) return "#2ecc71"; // Light green
  if (percentage >= 50) return "#f39c12"; // Orange
  if (percentage >= 30) return "#e67e22"; // Dark orange
  if (percentage >= 10) return "#e74c3c"; // Red
  return "#c0392b"; // Dark red
};
