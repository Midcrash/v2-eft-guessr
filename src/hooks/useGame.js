import { useState, useEffect } from "react";
import {
  startGame,
  getRoundInfo,
  submitGuess,
  completeGame,
} from "../services/gameService";
import { getMapConfig } from "../services/locationService";

/**
 * Custom hook for managing the game state
 * @param {string} mapName - The name of the map to play on
 * @param {number} roundCount - Number of rounds to play
 * @returns {Object} - Game state and functions
 */
const useGame = (mapName, roundCount = 5) => {
  const [state, setState] = useState({
    // Game session info
    gameId: null,
    mapName,
    roundCount,

    // Game state
    isLoading: true,
    isError: false,
    errorMessage: "",
    isGameStarted: false,
    isGameComplete: false,

    // Round state
    currentRound: 1,
    locations: [],
    currentImage: null,
    hasGuessed: false,
    guessCoords: null,
    actualCoords: null,

    // Scores
    roundScore: null,
    distance: null,
    totalScore: 0,

    // Map info
    mapConfig: null,
  });

  // Initialize the game
  useEffect(() => {
    const initGame = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, isError: false }));

        // Get map configuration
        const mapConfig = await getMapConfig(mapName);

        // Start a new game
        const { gameId, locations } = await startGame(mapName, roundCount);

        setState((prev) => ({
          ...prev,
          gameId,
          mapConfig,
          locations,
          currentImage: locations[0].image_path,
          isLoading: false,
          isGameStarted: true,
        }));
      } catch (error) {
        console.error("Failed to start game:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          errorMessage: `Failed to start game: ${error.message}`,
        }));
      }
    };

    initGame();
  }, [mapName, roundCount]);

  // Make a guess for the current round
  const makeGuess = async (coords) => {
    if (state.hasGuessed || state.isLoading || !state.gameId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { score, distance, actualCoords } = await submitGuess(
        state.gameId,
        state.currentRound,
        coords,
        state.mapConfig
      );

      setState((prev) => ({
        ...prev,
        hasGuessed: true,
        guessCoords: coords,
        actualCoords,
        roundScore: score,
        distance,
        totalScore: prev.totalScore + score,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to submit guess:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isError: true,
        errorMessage: `Failed to submit guess: ${error.message}`,
      }));
    }
  };

  // Move to the next round or finish the game
  const nextRound = async () => {
    if (!state.hasGuessed || state.isLoading) return;

    const nextRoundNumber = state.currentRound + 1;

    if (nextRoundNumber > state.roundCount) {
      // Game complete
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const { totalScore } = await completeGame(state.gameId);

        setState((prev) => ({
          ...prev,
          isGameComplete: true,
          totalScore,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to complete game:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isError: true,
          errorMessage: `Failed to complete game: ${error.message}`,
        }));
      }
    } else {
      // Next round
      setState((prev) => ({
        ...prev,
        currentRound: nextRoundNumber,
        currentImage: prev.locations[nextRoundNumber - 1].image_path,
        hasGuessed: false,
        guessCoords: null,
        actualCoords: null,
        roundScore: null,
        distance: null,
      }));
    }
  };

  // Restart the game
  const restartGame = async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        isGameComplete: false,
        currentRound: 1,
        totalScore: 0,
        hasGuessed: false,
        guessCoords: null,
        actualCoords: null,
        roundScore: null,
        distance: null,
      }));

      // Start a new game
      const { gameId, locations } = await startGame(mapName, roundCount);

      setState((prev) => ({
        ...prev,
        gameId,
        locations,
        currentImage: locations[0].image_path,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to restart game:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isError: true,
        errorMessage: `Failed to restart game: ${error.message}`,
      }));
    }
  };

  return {
    ...state,
    makeGuess,
    nextRound,
    restartGame,
  };
};

export default useGame;
