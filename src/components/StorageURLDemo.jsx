import React, { useState, useEffect } from "react";
import {
  getPublicUrl,
  getUrlsForFolder,
  getAvailableMaps,
  getSampleImagesForMaps,
} from "../utils/storageUtils";

const StorageURLDemo = () => {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState("");
  const [mapImages, setMapImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState({});

  // Load available maps on component mount
  useEffect(() => {
    const loadMaps = async () => {
      try {
        setLoading(true);
        const availableMaps = await getAvailableMaps();
        setMaps(availableMaps);

        if (availableMaps.length > 0) {
          setSelectedMap(availableMaps[0]);
        }

        // Also load sample images for each map
        const sampleImages = await getSampleImagesForMaps();
        setSamples(sampleImages);
      } catch (error) {
        console.error("Error loading maps:", error);
        setError("Failed to load maps: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, []);

  // Load images for selected map
  useEffect(() => {
    if (!selectedMap) return;

    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const images = await getUrlsForFolder("tarkov-images", selectedMap);
        setMapImages(images);
      } catch (error) {
        console.error(`Error loading images for ${selectedMap}:`, error);
        setError(`Failed to load images for ${selectedMap}: ${error.message}`);
        setMapImages([]);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [selectedMap]);

  const handleMapChange = (e) => {
    setSelectedMap(e.target.value);
  };

  return (
    <div className="storage-url-demo" style={{ padding: "20px" }}>
      <h2>Storage URL Demo</h2>
      <p className="text-muted">
        This demonstrates how to easily get URLs from the Supabase storage
        bucket.
      </p>

      {/* Map Selection */}
      <div className="mb-4">
        <h3>1. Select a Map</h3>
        <select
          className="form-select"
          value={selectedMap}
          onChange={handleMapChange}
          disabled={loading || maps.length === 0}
        >
          {maps.length === 0 && <option value="">No maps found</option>}
          {maps.map((map) => (
            <option key={map} value={map}>
              {map}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Images */}
      <div className="mb-4">
        <h3>Sample Images From Each Map</h3>
        {Object.keys(samples).length === 0 ? (
          <p>No sample images available</p>
        ) : (
          <div className="row">
            {Object.entries(samples).map(([mapName, imageUrl]) => (
              <div key={mapName} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-header">
                    <h5>{mapName}</h5>
                  </div>
                  <div className="card-body">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Sample from ${mapName}`}
                        className="img-fluid"
                        style={{ maxHeight: "150px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        No image available
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <small className="text-muted">
                      URL:{" "}
                      {imageUrl ? (
                        <span style={{ wordBreak: "break-all" }}>
                          {imageUrl.substring(0, 50)}...
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Images */}
      <div className="mb-4">
        <h3>Images for {selectedMap || "selected map"}</h3>

        {loading && <div className="alert alert-info">Loading images...</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && mapImages.length === 0 && (
          <div className="alert alert-warning">
            No images found for {selectedMap}
          </div>
        )}

        {mapImages.length > 0 && (
          <div className="row">
            {mapImages.map((image, index) => (
              <div key={index} className="col-md-4 mb-3">
                <div className="card h-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="card-img-top"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{image.name}</h5>
                    <p className="card-text" style={{ wordBreak: "break-all" }}>
                      <small>{image.url}</small>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-5 p-4 bg-light border rounded">
        <h3>How to Use These URL Functions</h3>
        <pre className="bg-dark text-light p-3 rounded">
          {`// 1. Import the utilities
import { getPublicUrl, getUrlsForFolder } from "../utils/storageUtils";

// 2. Get a single URL
const imageUrl = getPublicUrl("tarkov-images", "customs/image.png");

// 3. Get all URLs in a folder
const imagesWithUrls = await getUrlsForFolder("tarkov-images", "customs");

// 4. Use the URLs directly
<img src={imageUrl} alt="My image" />
`}
        </pre>
      </div>
    </div>
  );
};

export default StorageURLDemo;
