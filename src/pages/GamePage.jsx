import React from "react";
import { useParams, Navigate } from "react-router-dom";
import GameView from "../components/game/GameView";

const GamePage = () => {
  // Get parameters from URL
  const { mapName, rounds } = useParams();

  // Validate parameters
  if (!mapName) {
    return <Navigate to="/" />;
  }

  const roundCount = rounds ? parseInt(rounds) : 5;

  // Ensure round count is valid
  if (isNaN(roundCount) || roundCount < 1 || roundCount > 20) {
    return <Navigate to={`/play/${mapName}/5`} />;
  }

  return <GameView mapName={mapName} roundCount={roundCount} />;
};

export default GamePage;
