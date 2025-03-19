import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mapData from "../data/maps.json";
import "./Home.css";

const Home = () => {
  const [maps, setMaps] = useState([]);

  useEffect(() => {
    // Filter maps that have an interactive projection
    const interactiveMaps = mapData.filter(
      (map) => map.maps && map.maps.some((m) => m.projection === "interactive")
    );
    setMaps(interactiveMaps);
  }, []);

  // Function to get map display name
  const getMapDisplayName = (map) => {
    const interactiveMap = map.maps.find((m) => m.projection === "interactive");
    if (interactiveMap && interactiveMap.displayName) {
      return interactiveMap.displayName;
    }

    // Fallback to formatted key or normalized name
    const nameToFormat = interactiveMap?.key || map.normalizedName;
    return nameToFormat
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Function to get the map image URL
  const getMapImageUrl = (map) => {
    const interactiveMap = map.maps.find((m) => m.projection === "interactive");
    if (interactiveMap) {
      return interactiveMap.svgPath || `/maps/${map.normalizedName}-2d.jpg`;
    }
    return "";
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>EFTGuessr</h1>
        <p className="subtitle">Test your Escape from Tarkov map knowledge</p>
      </div>

      <div className="map-selection">
        <h2>Select a Map</h2>
        <div className="map-grid">
          {maps.map((map) => (
            <Link
              to={`/play/${map.normalizedName}`}
              key={map.normalizedName}
              className="map-card"
            >
              <div className="map-card-image">
                <img src={getMapImageUrl(map)} alt={getMapDisplayName(map)} />
                <div className="map-overlay"></div>
              </div>
              <div className="map-card-content">
                <h3>{getMapDisplayName(map)}</h3>
                <div className="map-difficulty">
                  <span className="difficulty-indicator">
                    {map.difficulty || "Medium"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="home-footer">
        <div className="instructions">
          <h3>How to Play</h3>
          <ol>
            <li>Select a map from the options above</li>
            <li>You'll be shown images from random locations</li>
            <li>Place your guess on the map</li>
            <li>Score points based on how close your guess is</li>
            <li>Complete 5 rounds to finish the game</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
