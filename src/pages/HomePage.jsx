import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GAME_CONSTANTS } from "../services/gameService";
import { getMapsFromStorage } from "../services/locationService";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [mapName, setMapName] = useState("customs");
  const [roundCount, setRoundCount] = useState(5);
  const [availableMaps, setAvailableMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setLoading(true);
        const maps = await getMapsFromStorage();

        if (maps && maps.length > 0) {
          setAvailableMaps(maps);
          setMapName(maps[0]);
        } else {
          // If no maps in storage yet, use the predefined list
          setAvailableMaps(GAME_CONSTANTS.MAP_OPTIONS.map((m) => m.id));
        }
      } catch (error) {
        console.error("Error fetching maps:", error);
        setError("Failed to load available maps. Please try again later.");
        // Fall back to predefined list
        setAvailableMaps(GAME_CONSTANTS.MAP_OPTIONS.map((m) => m.id));
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  }, []);

  const handleStartGame = () => {
    navigate(`/play/${mapName}/${roundCount}`);
  };

  const getMapDisplayName = (mapId) => {
    const map = GAME_CONSTANTS.MAP_OPTIONS.find((m) => m.id === mapId);
    return map ? map.name : mapId.charAt(0).toUpperCase() + mapId.slice(1);
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">EFTGuessr</h1>
        <p className="home-description">
          Test your knowledge of Escape from Tarkov maps by guessing locations
          from screenshots.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="game-settings">
          <div className="form-group">
            <label htmlFor="map-select">Select Map:</label>
            <select
              id="map-select"
              className="form-control"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
            >
              {availableMaps.map((mapId) => (
                <option key={mapId} value={mapId}>
                  {getMapDisplayName(mapId)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="round-select">Number of Rounds:</label>
            <select
              id="round-select"
              className="form-control"
              value={roundCount}
              onChange={(e) => setRoundCount(parseInt(e.target.value))}
            >
              {[3, 5, 10].map((count) => (
                <option key={count} value={count}>
                  {count} rounds
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>

        {/* <div className="admin-links">
          <a href="/admin" className="admin-link">
            Admin Area
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default HomePage;
