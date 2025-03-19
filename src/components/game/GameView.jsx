import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TarkovMap from "../map/TarkovMap";
import ScoreCard from "./ScoreCard";
import L from "leaflet";
import { formatDistance, getScoreRating } from "../../utils/scoreUtils";
import {
  loadGameImagesOptimized,
  loadGameImagesWithFallback,
} from "../../utils/imageUtils";
import { calculateScore } from "../../services/imageService";
import "./GameView.css";

const GameView = ({ mapName, roundCount = 5 }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(true); // Only keep the loading state that we use

  // Add a state to track if a guess is being processed to prevent duplicate actions
  const [isProcessingGuess, setIsProcessingGuess] = useState(false);

  // References to track markers directly
  const guessMarkerRef = useRef(null);
  const actualMarkerRef = useRef(null);
  const pathRef = useRef(null);

  // Game state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState([]);

  // Round state
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [guessCoords, setGuessCoords] = useState(null);
  const [roundScore, setRoundScore] = useState(null);
  const [distance, setDistance] = useState(null);

  // Image preview state
  const [showLargeImage, setShowLargeImage] = useState(false);

  // State for prefetching additional images for longer games
  const [prefetchedImages, setPrefetchedImages] = useState([]);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Initialize game - Separated from mapLoading dependency to avoid circular dependency
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        console.log("Starting game initialization");

        // Use the function with fallback to get game images
        const gameImages = await loadGameImagesWithFallback(
          mapName,
          roundCount
        );

        console.log(`Loaded ${gameImages.length} images for map ${mapName}`);

        if (gameImages.length < roundCount) {
          throw new Error(
            `Not enough images available for ${roundCount} rounds. Only found ${gameImages.length}.`
          );
        }

        // Select images for the game (they're already shuffled)
        const selectedImages = gameImages.slice(0, roundCount);

        setImages(selectedImages);
        setCurrentImage(selectedImages[0]);
        console.log("Game images loaded successfully");

        // Explicitly check if map is ready and set loading state accordingly
        if (
          mapRef.current &&
          mapRef.current.isReady &&
          mapRef.current.isReady()
        ) {
          console.log("Map is already ready, setting loading to false");
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize game:", error);
        setError(`Failed to initialize game: ${error.message}`);
        setLoading(false);
      }
    };

    loadGame();
  }, [mapName, roundCount]);

  // Check if map is properly loaded - simplified approach
  useEffect(() => {
    let checkAttempts = 0;
    const maxAttempts = 20; // 10 seconds max (20 * 500ms)
    let checkInterval = null;

    console.log("Starting map readiness check");
    setMapLoading(true);

    const checkMapReady = () => {
      const isMapReady =
        mapRef.current && mapRef.current.isReady && mapRef.current.isReady();

      if (isMapReady) {
        console.log("Map ready confirmed");
        setMapLoading(false);

        // If we have images loaded, we can set loading to false
        if (currentImage) {
          console.log("Map ready and game loaded - setting loading to false");
          setLoading(false);
        }

        if (checkInterval) clearInterval(checkInterval);
        return;
      }

      checkAttempts++;
      if (checkAttempts >= maxAttempts) {
        console.warn("Map readiness check timed out");
        setMapLoading(false);

        // Set loading to false anyway if we have images
        if (currentImage) {
          console.log(
            "Map check timed out but game loaded - setting loading to false"
          );
          setLoading(false);
        }

        if (checkInterval) clearInterval(checkInterval);
        return;
      }
    };

    checkInterval = setInterval(checkMapReady, 500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [currentImage]); // Re-run this whenever the currentImage changes

  // Add a fallback to ensure loading is set to false after a timeout
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading && currentImage) {
        console.warn("FALLBACK: Force loading to false after timeout");
        setLoading(false);
      }
    }, 5000); // 5 second fallback timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading, currentImage]);

  // Handle map click to set guess marker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMapClick = useCallback(
    (coords) => {
      console.log("Map click event received with coords:", coords);
      console.log("Current loading states:", {
        loading,
        mapLoading,
        hasImage: !!currentImage,
      });

      if (!mapRef.current || !mapRef.current.getMap) {
        console.warn("Map reference not ready for click handling");
        return;
      }

      // Skip the loading check since it may be out of sync
      // Just check if we have an image and haven't submitted yet
      const canPlaceMarker =
        !guessSubmitted && !isProcessingGuess && currentImage !== null;

      if (!canPlaceMarker) {
        console.log("Cannot place marker - invalid state:", {
          guessSubmitted,
          isProcessingGuess,
          hasCurrentImage: !!currentImage,
        });
        return;
      }

      console.log("Creating marker at coordinates:", coords);

      // CRITICAL FIX: Update state with a callback to ensure synchronous update
      // that will be available immediately to the submitGuess function
      setGuessCoords(coords);
      setHasGuessed(true);

      // Make sure these changes are logged
      console.log("State updated for guess:", {
        coords,
        hasGuessed: true,
      });

      // Clean up previous marker if it exists
      if (guessMarkerRef.current) {
        console.log("Removing previous guess marker");
        try {
          guessMarkerRef.current.remove();
        } catch (err) {
          console.warn("Error removing previous marker:", err);
        }
        guessMarkerRef.current = null;
      }

      // Create new marker directly
      try {
        const mapInstance = mapRef.current.getMap();
        if (!mapInstance) {
          console.warn("Map instance not available for marker creation");
          return;
        }

        const customIcon =
          mapRef.current.icons?.redIcon || new L.Icon.Default();

        console.log("Adding marker to map at:", [coords.z, coords.x]);
        const marker = L.marker([parseFloat(coords.z), parseFloat(coords.x)], {
          icon: customIcon,
          zIndexOffset: 1000,
        }).addTo(mapInstance);

        marker.bindPopup("Your guess").openPopup();
        guessMarkerRef.current = marker;
        console.log("Marker created successfully");
      } catch (err) {
        console.error("Error creating guess marker:", err);
      }
    },
    [currentImage, guessSubmitted, isProcessingGuess, loading, mapLoading]
  );

  // Submit the guess and calculate score
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const submitGuess = useCallback(() => {
    // First, log the current state for debugging
    console.log("Submit guess called with state:", {
      hasGuessed,
      isProcessingGuess,
      guessSubmitted,
      hasCoords: !!guessCoords,
      hasCurrentImage: !!currentImage,
      currentImageData: currentImage,
    });

    // Prevent submitting if already processing
    if (isProcessingGuess) {
      console.log("Already processing a guess, please wait");
      return;
    }

    // IMPORTANT: Always re-check the DOM-rendered button state
    // If the button is visible, user should be able to submit
    const isGuessButtonVisible =
      document.querySelector(".guess-button") !== null;
    console.log("Is guess button visible:", isGuessButtonVisible);

    // Skip some checks if the button is visible (meaning UI thinks we can submit)
    const allowSubmit =
      isGuessButtonVisible || (guessCoords && hasGuessed && currentImage);

    if (!allowSubmit) {
      console.warn("Cannot submit guess - invalid state");
      return;
    }

    // Start processing to prevent multiple submissions
    setIsProcessingGuess(true);

    // If somehow we don't have coords, try to get them from the marker
    if (!guessCoords && guessMarkerRef.current) {
      try {
        const markerPos = guessMarkerRef.current.getLatLng();
        const fixedCoords = {
          x: markerPos.lng,
          y: 0,
          z: markerPos.lat,
        };
        console.log("Retrieved coords from marker:", fixedCoords);
        setGuessCoords(fixedCoords);
      } catch (err) {
        console.error("Failed to get coords from marker:", err);
        setIsProcessingGuess(false);
        return;
      }
    }

    console.log("Submitting guess:", guessCoords);
    console.log("Actual location:", currentImage?.coordinates);

    // Directly use the values we have now to avoid state timing issues
    const activeGuessCoords = guessCoords;
    const activeImage = currentImage;

    if (!activeGuessCoords || !activeImage || !activeImage.coordinates) {
      console.error("Missing data for score calculation!");
      setIsProcessingGuess(false);
      return;
    }

    // Calculate score based on distance
    const { score, distance: dist } = calculateScore(
      activeGuessCoords,
      activeImage.coordinates
    );

    console.log(`Score: ${score}, Distance: ${dist}`);

    // Update state with results
    setRoundScore(score);
    setDistance(dist);
    setTotalScore((prev) => prev + score);
    setRoundScores((prev) => [
      ...prev,
      { round: currentRound, score, distance: dist },
    ]);

    // Safety check - make sure map is ready and available
    const isMapAvailable =
      mapRef.current &&
      mapRef.current.isReady &&
      mapRef.current.isReady() &&
      mapRef.current.getMap &&
      mapRef.current.getMap();

    // Create the actual location marker only if map is available
    if (isMapAvailable) {
      try {
        const mapInstance = mapRef.current.getMap();
        const coords = activeImage.coordinates;
        const customIcon =
          mapRef.current.icons?.blueIcon || new L.Icon.Default();

        console.log("Creating actual location marker at:", [
          coords.z,
          coords.x,
        ]);

        // Create the actual location marker
        const actualMarker = L.marker(
          [parseFloat(coords.z), parseFloat(coords.x)],
          {
            icon: customIcon,
            zIndexOffset: 900,
          }
        ).addTo(mapInstance);

        // Add popup to show this is the actual location
        actualMarker.bindPopup("Actual location").openPopup();

        // Store reference for cleanup
        actualMarkerRef.current = actualMarker;

        // Create path between markers
        console.log("Creating path between guess and actual location");
        const path = L.polyline(
          [
            [parseFloat(activeGuessCoords.z), parseFloat(activeGuessCoords.x)],
            [parseFloat(coords.z), parseFloat(coords.x)],
          ],
          {
            color: "#5d4b36",
            weight: 3,
            opacity: 0.7,
            dashArray: "5, 10",
            zIndexOffset: 500,
          }
        ).addTo(mapInstance);

        // Store reference for cleanup
        pathRef.current = path;
        console.log("Markers and path created successfully");
      } catch (err) {
        console.error("Error creating markers/path:", err);
      }
    } else {
      console.warn("Map not ready for creating actual marker");
    }

    // Mark guess as submitted
    setGuessSubmitted(true);

    // Fit map to show both points with a small delay
    setTimeout(() => {
      // Check map again as state might have changed
      if (
        !mapRef.current ||
        !mapRef.current.isReady ||
        !mapRef.current.isReady()
      ) {
        console.warn("Map not ready for zooming after guess submission");
        setIsProcessingGuess(false);
        return;
      }

      try {
        console.log("Fitting map to show both markers");
        // Create a bounds object that includes both points
        const bounds = [
          [activeGuessCoords.z, activeGuessCoords.x],
          [activeImage.coordinates.z, activeImage.coordinates.x],
        ];

        // Fit bounds with safe defaults
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 3,
          animate: false, // Disable animation for stability
        });
      } catch (err) {
        console.error("Error adjusting map view after guess:", err);
      }

      // Reset processing state
      setIsProcessingGuess(false);
    }, 600);
  }, [
    currentImage,
    guessCoords,
    guessSubmitted,
    hasGuessed,
    isProcessingGuess,
    currentRound,
  ]);

  // Handle moving to the next round
  const handleNextRound = () => {
    console.log("Next round requested");

    if (currentRound >= roundCount) {
      console.log("Final round reached, showing game complete");
      setGameComplete(true);
      return;
    }

    // Prevent actions if still processing the previous guess
    if (isProcessingGuess) {
      console.warn("Still processing previous guess, please wait");
      return;
    }

    // Set processing to prevent multiple actions
    setIsProcessingGuess(true);
    console.log(`Moving to round ${currentRound + 1} of ${roundCount}`);

    // Check if we need to prefetch more images for longer games
    const nextRoundIndex = currentRound;
    const shouldPrefetch =
      roundCount > 7 &&
      nextRoundIndex >= images.length - 2 &&
      prefetchedImages.length === 0 &&
      !isPrefetching;

    if (shouldPrefetch) {
      console.log(
        "Approaching the end of current batch, prefetching more images"
      );
      setIsPrefetching(true);

      // Prefetch another batch of images asynchronously using the fallback function
      loadGameImagesWithFallback(mapName, 5)
        .then((newImages) => {
          console.log(`Prefetched ${newImages.length} additional images`);
          setPrefetchedImages(newImages);
        })
        .catch((error) => {
          console.error("Failed to prefetch additional images:", error);
        })
        .finally(() => {
          setIsPrefetching(false);
        });
    }

    // Update state for next round
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    // If we've used all our pre-loaded images, use from prefetched batch
    if (nextRoundIndex >= images.length && prefetchedImages.length > 0) {
      console.log("Using prefetched images for next rounds");
      const newBatch = [...images.slice(nextRoundIndex), ...prefetchedImages];
      setImages(newBatch);
      setCurrentImage(prefetchedImages[0]);
      // Clear the prefetched images since we've now added them to the main batch
      setPrefetchedImages([]);
    } else {
      // Use the next image from our current batch
      setCurrentImage(images[nextRoundIndex]);
    }

    setHasGuessed(false);
    setGuessSubmitted(false);
    setGuessCoords(null);
    setRoundScore(null);
    setDistance(null);
    setShowLargeImage(false);

    // Clean up all markers and paths - with safety checks
    console.log("Cleaning up markers for next round");
    try {
      if (guessMarkerRef.current) {
        console.log("Removing guess marker");
        guessMarkerRef.current.remove();
        guessMarkerRef.current = null;
      }

      if (actualMarkerRef.current) {
        console.log("Removing actual location marker");
        actualMarkerRef.current.remove();
        actualMarkerRef.current = null;
      }

      if (pathRef.current) {
        console.log("Removing path");
        pathRef.current.remove();
        pathRef.current = null;
      }
    } catch (err) {
      console.warn("Error cleaning up markers:", err);
    }

    // Wait a moment before resetting the map view
    setTimeout(() => {
      try {
        // Reset map view if needed
        if (mapRef.current && typeof mapRef.current.resetView === "function") {
          mapRef.current.resetView();
        }
      } catch (err) {
        console.warn("Error resetting map view:", err);
      }

      // Reset processing state when done
      setIsProcessingGuess(false);
    }, 200);
  };

  // Restart the game
  const handleRestartGame = () => {
    // Prevent actions if still processing
    if (isProcessingGuess) {
      return;
    }

    // Flag that we're processing
    setIsProcessingGuess(true);

    setCurrentRound(1);
    setGameComplete(false);
    setTotalScore(0);
    setRoundScores([]);
    setPrefetchedImages([]); // Clear any prefetched images

    // Clean up all markers and paths
    try {
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
        guessMarkerRef.current = null;
      }

      if (actualMarkerRef.current) {
        actualMarkerRef.current.remove();
        actualMarkerRef.current = null;
      }

      if (pathRef.current) {
        pathRef.current.remove();
        pathRef.current = null;
      }
    } catch (err) {
      console.warn("Error cleaning up markers during restart:", err);
    }

    // Reload game images with our fallback function
    console.log("Restarting game: Loading fresh images");
    loadGameImagesWithFallback(mapName, roundCount)
      .then((gameImages) => {
        console.log(`Loaded ${gameImages.length} images for restarted game`);
        setImages(gameImages);
        setCurrentImage(gameImages[0]);
        setHasGuessed(false);
        setGuessSubmitted(false);
        setGuessCoords(null);
        setRoundScore(null);
        setDistance(null);
        setShowLargeImage(false);
      })
      .catch((error) => {
        console.error("Failed to load images for restarted game:", error);
        setError(`Failed to restart game: ${error.message}`);
      })
      .finally(() => {
        // Reset processing state when done
        setTimeout(() => {
          setIsProcessingGuess(false);
        }, 200);
      });
  };

  // Toggle image zoom
  const toggleImageZoom = () => {
    setShowLargeImage(!showLargeImage);
  };

  if (loading && !currentImage) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  if (error) {
    const isStorageError =
      error.includes("storage") || error.includes("locations");
    const errorType = isStorageError ? "Storage Error" : "Error";

    return (
      <div className="game-error">
        <h2>{errorType}</h2>
        <div className="error-details">
          <p>{error}</p>

          {isStorageError && (
            <div className="storage-error-help">
              <h3>Troubleshooting Steps:</h3>
              <ol>
                <li>
                  Verify that your Supabase storage bucket named "tarkov-images"
                  exists
                </li>
                <li>
                  Check that you have uploaded images to a folder named "
                  {mapName}" in the bucket
                </li>
                <li>
                  Ensure the image filenames follow the correct format:
                  <br />
                  <code>
                    timestamp_x-coord-_y-coord-_z-coord_quaternion_etc.png
                  </code>
                  <br />
                  Example:{" "}
                  <code>
                    2023-12-05B-22-28-E_482.0-_2.6-_-118.5_0.0-_0.4-_0.0-_0.9_12.29_P0P-1742335795669.png
                  </code>
                </li>
                <li>
                  The public URL should look like:
                  <br />
                  <code>
                    https://[your-project-ref].supabase.co/storage/v1/object/public/tarkov-images/
                    {mapName}/[filename]
                  </code>
                </li>
                <li>
                  Confirm your storage bucket permissions allow anonymous access
                </li>
              </ol>

              <div className="debug-links">
                <a href="/storage-test" className="btn btn-secondary">
                  Go to Storage Debug Page
                </a>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    console.log("Attempting to reload game...");
                    window.location.reload();
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="game-complete">
        <h2>Game Complete!</h2>
        <div className="final-score">
          <p className="score-value">{totalScore}</p>
          <p className="score-label">points</p>
        </div>

        <div className="round-breakdown">
          <h3>Round Breakdown</h3>
          <div className="round-scores">
            {roundScores.map((roundData) => (
              <div key={roundData.round} className="round-score-item">
                <div className="round-number">Round {roundData.round}</div>
                <div className="round-points">
                  <span className="points-value">{roundData.score}</span>
                  <span className="distance-value">
                    ({formatDistance(roundData.distance)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="game-actions">
          <button className="btn btn-primary" onClick={handleRestartGame}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            Choose Another Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>EFTGuessr</h1>
        <div className="game-info">
          <div className="round-info">
            Round {currentRound} of {roundCount}
          </div>
          <div className="total-score-info">
            <span className="total-score-value">{totalScore}</span>
            <span className="total-score-label">points</span>
          </div>
        </div>
      </div>

      <div className="game-content">
        <div className="image-sidebar">
          {currentImage && (
            <div className="image-wrapper">
              <img
                src={currentImage.path}
                alt={`Location from ${mapName}`}
                className={`location-image ${showLargeImage ? "enlarged" : ""}`}
                onClick={toggleImageZoom}
              />
              {showLargeImage && (
                <div className="image-overlay" onClick={toggleImageZoom}>
                  <span className="close-button">&times;</span>
                </div>
              )}
            </div>
          )}

          {!guessSubmitted ? (
            <div className="guess-instruction">
              <p>Click on the map where you think this location is</p>
              {hasGuessed && (
                <button
                  className="btn btn-primary guess-button"
                  onClick={submitGuess}
                  disabled={isProcessingGuess}
                >
                  Submit Guess
                </button>
              )}
              <div
                className="debug-info"
                style={{ fontSize: "0.7em", color: "#666", marginTop: "10px" }}
              >
                {/* Add some debug info in development mode */}
                {process.env.NODE_ENV === "development" && (
                  <>
                    <div>Has guessed: {hasGuessed ? "Yes" : "No"}</div>
                    <div>Has coords: {guessCoords ? "Yes" : "No"}</div>
                    <div>Processing: {isProcessingGuess ? "Yes" : "No"}</div>
                    <div>Submitted: {guessSubmitted ? "Yes" : "No"}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="guess-results">
              <ScoreCard
                score={roundScore}
                distance={distance}
                formattedDistance={formatDistance(distance)}
                rating={getScoreRating((roundScore / 5000) * 100)}
              />

              <button
                className="btn btn-primary next-button"
                onClick={handleNextRound}
                disabled={isProcessingGuess}
              >
                {currentRound === roundCount
                  ? "See Final Results"
                  : "Next Round"}
              </button>
            </div>
          )}
        </div>

        <div className="map-wrapper">
          {mapLoading && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <p>Loading map...</p>
            </div>
          )}
          <TarkovMap mapName={mapName} onClick={handleMapClick} ref={mapRef} />
        </div>
      </div>
    </div>
  );
};

export default GameView;
