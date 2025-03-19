/**
 * Parse coordinates from Tarkov screenshot filename
 * Format: "2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png"
 * @param {string} filename - The filename to parse
 * @returns {Object} - The parsed coordinates {x, y, z}
 */
export const parseCoordinatesFromFilename = (filename) => {
  const matches = filename.match(
    /_(\-?\d+\.?\d*),\s*(\d+\.?\d*),\s*(\-?\d+\.?\d*)_/
  );

  if (!matches || matches.length < 4) {
    throw new Error(`Invalid filename format: ${filename}`);
  }

  return {
    x: parseFloat(matches[1]),
    y: parseFloat(matches[2]),
    z: parseFloat(matches[3]),
  };
};

/**
 * Calculate distance between two points in 3D space
 * @param {Object} point1 - First point {x, y, z}
 * @param {Object} point2 - Second point {x, y, z}
 * @returns {number} - Euclidean distance
 */
export const calculateDistance = (point1, point2) => {
  // Use the Euclidean distance formula for 3D points
  const dx = (point2.x || 0) - (point1.x || 0);
  const dy = (point2.y || 0) - (point1.y || 0);
  const dz = (point2.z || 0) - (point1.z || 0);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Convert Tarkov coordinates to map pixels (specific to each map)
 * @param {Object} coords - {x, z} Tarkov world coordinates
 * @param {Object} mapConfig - Configuration for the specific map
 * @returns {Object} - {x, y} pixel coordinates on the map image
 */
export const tarkovCoordsToMapPixels = (coords, mapConfig) => {
  // This is a simplified implementation - you'll need to adjust based on your maps
  const x =
    ((coords.x - mapConfig.worldBounds.x1) /
      (mapConfig.worldBounds.x2 - mapConfig.worldBounds.x1)) *
    mapConfig.imageWidth;
  const y =
    ((coords.z - mapConfig.worldBounds.z1) /
      (mapConfig.worldBounds.z2 - mapConfig.worldBounds.z1)) *
    mapConfig.imageHeight;

  return { x, y };
};

/**
 * Convert map pixel coordinates to Tarkov world coordinates
 * @param {Object} pixels - {x, y} pixel coordinates on the map image
 * @param {Object} mapConfig - Configuration for the specific map
 * @returns {Object} - {x, z} Tarkov world coordinates
 */
export const mapPixelsToTarkovCoords = (pixels, mapConfig) => {
  const x =
    (pixels.x / mapConfig.imageWidth) *
      (mapConfig.worldBounds.x2 - mapConfig.worldBounds.x1) +
    mapConfig.worldBounds.x1;
  const z =
    (pixels.y / mapConfig.imageHeight) *
      (mapConfig.worldBounds.z2 - mapConfig.worldBounds.z1) +
    mapConfig.worldBounds.z1;

  return { x, z };
};

/**
 * Convert game coordinates to leaflet map coordinates
 * @param {Object} gameCoords - Game coordinates {x, y, z}
 * @returns {Object} - Leaflet coordinates {lat, lng}
 */
export const gameToLeafletCoords = (gameCoords) => {
  // In Leaflet, we're using x as longitude and z as latitude
  return {
    lat: gameCoords.z,
    lng: gameCoords.x,
  };
};

/**
 * Convert leaflet coordinates to game coordinates
 * @param {Object} leafletCoords - Leaflet coordinates {lat, lng}
 * @returns {Object} - Game coordinates {x, y, z}
 */
export const leafletToGameCoords = (leafletCoords) => {
  return {
    x: leafletCoords.lng,
    y: 0, // Assume ground level (y=0) for now
    z: leafletCoords.lat,
  };
};
