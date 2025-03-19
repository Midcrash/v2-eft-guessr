import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Track page views
export function UmamiAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // This automatically tracks page views when location changes
    // Umami's script handles the rest
  }, [location]);

  return null;
}

// For manual event tracking
export function trackEvent(eventName, eventData = {}) {
  if (window.umami) {
    window.umami.track(eventName, eventData);
  }
}

// Game-specific tracking functions
export const gameAnalytics = {
  trackGameStart: (mapName, roundCount) => {
    trackEvent("game_start", { map: mapName, rounds: roundCount });
  },

  trackGuessSubmitted: (mapName, currentRound, score, distance) => {
    trackEvent("guess_submitted", {
      map: mapName,
      round: currentRound,
      score: score,
      distance: distance,
    });
  },

  trackGameComplete: (mapName, totalScore, roundCount) => {
    trackEvent("game_complete", {
      map: mapName,
      totalScore: totalScore,
      roundCount: roundCount,
    });
  },
};
