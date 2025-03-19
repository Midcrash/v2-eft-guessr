import supabase from "../api/supabase";
import { calculateScore } from "../utils/scoreUtils";
import { getLocationsFromStorage } from "./locationService";
import { getDirectUrlImages } from "../utils/imageUtils";

/**
 * Constants for the game
 */
export const GAME_CONSTANTS = {
  DEFAULT_ROUND_COUNT: 5,
  MAP_OPTIONS: [
    { id: "customs", name: "Customs" },
    { id: "woods", name: "Woods" },
    { id: "factory", name: "Factory" },
    { id: "interchange", name: "Interchange" },
    { id: "reserve", name: "Reserve" },
    { id: "shoreline", name: "Shoreline" },
    { id: "lighthouse", name: "Lighthouse" },
    { id: "labs", name: "The Lab" },
    { id: "streets", name: "Streets of Tarkov" },
    { id: "ground-zero", name: "Ground Zero" },
  ],
};

/**
 * Create the database schema if it doesn't exist
 * This is useful for development and first-time setup
 */
export const initDatabase = async () => {
  // Check if the locations table exists
  const { error: checkError } = await supabase
    .from("locations")
    .select("id")
    .limit(1);

  // If table doesn't exist, create it
  if (checkError && checkError.code === "42P01") {
    await supabase.rpc("init_tarkov_guessr_schema");
  }
};

/**
 * Get random locations for a game session
 * @param {string} mapName - Name of the map to get locations for
 * @param {number} count - Number of locations to get
 * @returns {Array} - Array of location objects
 */
export const getRandomLocations = async (mapName, count = 5) => {
  try {
    console.log(
      `getRandomLocations: Requesting ${count} locations for map ${mapName}`
    );

    try {
      // First try to get locations from storage
      console.log("Attempting to get locations from storage...");
      // Get locations directly from storage instead of the database
      const locations = await getLocationsFromStorage(mapName);

      if (locations && locations.length > 0) {
        const availableCount = locations.length;
        console.log(
          `Found ${availableCount} locations for map ${mapName} in storage`
        );

        // Filter out any placeholder files that might have slipped through
        const validLocations = locations.filter((loc) => {
          // Check if this is a placeholder file
          const isPlaceholder =
            loc.filename === ".emptyFolderPlaceholder" ||
            loc.image_path.includes(".emptyFolderPlaceholder");

          if (isPlaceholder) {
            console.warn(`Filtered out placeholder file: ${loc.image_path}`);
            return false;
          }
          return true;
        });

        if (validLocations.length === 0) {
          console.warn("All locations were placeholders, using demo locations");
          // Fall through to fallback
        } else {
          // For simplicity, just shuffle and return what we have
          if (count > validLocations.length) {
            console.warn(
              `Requested ${count} locations but only ${validLocations.length} are available after filtering placeholders`
            );
            // Shuffle what we have
            return [...validLocations].sort(() => 0.5 - Math.random());
          }

          // Return shuffled locations up to count
          return [...validLocations]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        }
      } else {
        // If no locations found in storage, we'll fall through to the fallback
        console.warn("No locations found in storage, using demo locations");
      }
    } catch (storageError) {
      console.warn("Error accessing storage:", storageError.message);
      // Continue to fallback
    }

    // FALLBACK: If storage access failed or returned no results, use demo locations
    console.log("Using direct URL demo locations as fallback");

    // Get demo locations with direct URLs
    // This is synchronous, which makes it a reliable fallback
    const demoLocations = getDirectUrlImages(mapName, count);

    if (demoLocations.length === 0) {
      throw new Error(
        `No locations (even demo ones) available for map: ${mapName}`
      );
    }

    console.log(
      `Using ${demoLocations.length} demo locations for map ${mapName}`
    );
    return demoLocations;
  } catch (error) {
    console.error("Error fetching random locations:", error);
    throw error;
  }
};

/**
 * Start a new game session
 * @param {string} mapName - Name of the map
 * @param {number} roundCount - Number of rounds
 * @returns {Object} - Game session information
 */
export const startGame = async (
  mapName,
  roundCount = GAME_CONSTANTS.DEFAULT_ROUND_COUNT
) => {
  try {
    // Get random locations for this game
    const locations = await getRandomLocations(mapName, roundCount);

    if (locations.length === 0) {
      throw new Error(`No locations found for map: ${mapName}`);
    }

    // Create a new game record
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        map_name: mapName,
        round_count: roundCount,
      })
      .select()
      .single();

    if (gameError) throw gameError;

    // Create round records for each location
    // Note: For storage-based locations, we may generate IDs on the fly
    const rounds = locations.map((location, index) => ({
      game_id: game.id,
      location_id: location.id || `${mapName}-${location.filename}`, // Handle storage-based locations
      round_number: index + 1,
      actual_x: location.x_coord,
      actual_z: location.z_coord,
    }));

    const { error: roundsError } = await supabase.from("rounds").insert(rounds);

    if (roundsError) throw roundsError;

    return {
      gameId: game.id,
      mapName,
      locations,
      roundCount,
    };
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

/**
 * Get information for a specific round
 * @param {string} gameId - ID of the game session
 * @param {number} roundNumber - Round number
 * @returns {Object} - Round information
 */
export const getRoundInfo = async (gameId, roundNumber) => {
  const { data, error } = await supabase
    .from("rounds")
    .select(
      `
      *,
      location:location_id(*)
    `
    )
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .single();

  if (error) {
    console.error("Error fetching round info:", error);
    throw error;
  }

  return data;
};

/**
 * Submit a guess for a round
 * @param {string} gameId - ID of the game session
 * @param {number} roundNumber - Round number
 * @param {Object} guessCoords - {x, z} coordinates of the player's guess
 * @param {Object} mapConfig - Configuration for the specific map
 * @returns {Object} - Result of the guess
 */
export const submitGuess = async (
  gameId,
  roundNumber,
  guessCoords,
  mapConfig
) => {
  try {
    // Get the round information
    const round = await getRoundInfo(gameId, roundNumber);

    // Calculate score
    const actualCoords = { x: round.actual_x, z: round.actual_z };
    const scoreResult = calculateScore(guessCoords, actualCoords, mapConfig);

    // Update the round with the guess information
    const { error: updateError } = await supabase
      .from("rounds")
      .update({
        guess_x: guessCoords.x,
        guess_z: guessCoords.z,
        distance: scoreResult.distance,
        score: scoreResult.score,
      })
      .eq("id", round.id);

    if (updateError) throw updateError;

    return {
      ...scoreResult,
      actualCoords,
      guessCoords,
    };
  } catch (error) {
    console.error("Error submitting guess:", error);
    throw error;
  }
};

/**
 * Complete a game and calculate the total score
 * @param {string} gameId - ID of the game session
 * @returns {Object} - Game completion information
 */
export const completeGame = async (gameId) => {
  try {
    // Get all rounds for this game
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("score")
      .eq("game_id", gameId);

    if (roundsError) throw roundsError;

    // Calculate total score
    const totalScore = rounds.reduce(
      (sum, round) => sum + (round.score || 0),
      0
    );

    // Update the game record
    const { data: game, error: gameError } = await supabase
      .from("games")
      .update({
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", gameId)
      .select()
      .single();

    if (gameError) throw gameError;

    return {
      gameId,
      totalScore,
      roundScores: rounds.map((r) => r.score || 0),
    };
  } catch (error) {
    console.error("Error completing game:", error);
    throw error;
  }
};

/**
 * Get high scores
 * @param {string} mapName - Name of the map (optional)
 * @param {number} limit - Maximum number of scores to return
 * @returns {Array} - Array of high score objects
 */
export const getHighScores = async (mapName = null, limit = 10) => {
  let query = supabase
    .from("games")
    .select("*")
    .not("completed_at", "is", null)
    .order("total_score", { ascending: false })
    .limit(limit);

  if (mapName) {
    query = query.eq("map_name", mapName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching high scores:", error);
    throw error;
  }

  return data || [];
};
