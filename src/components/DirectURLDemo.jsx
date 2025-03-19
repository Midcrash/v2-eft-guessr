import React, { useState, useEffect } from "react";
import {
  buildDirectUrl,
  getKnownMaps,
  getSampleImage,
  checkUrlAccessible,
  getDemoImages,
} from "../utils/directStorageAccess";

const DirectURLDemo = () => {
  const [selectedMap, setSelectedMap] = useState("customs");
  const [customFileName, setCustomFileName] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [urlStatus, setUrlStatus] = useState(null);
  const [demoImages, setDemoImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Available maps
  const maps = getKnownMaps();

  // Initialize with the sample image for customs
  useEffect(() => {
    if (selectedMap) {
      const sampleUrl = getSampleImage(selectedMap);
      setDirectUrl(sampleUrl || "");

      // Load the demo images
      setDemoImages(getDemoImages(selectedMap, 5));
    }
  }, [selectedMap]);

  // Handle map selection change
  const handleMapChange = (e) => {
    setSelectedMap(e.target.value);
  };

  // Handle custom filename input
  const handleFilenameChange = (e) => {
    setCustomFileName(e.target.value);
  };

  // Build and test a custom URL
  const testCustomUrl = async () => {
    if (!selectedMap || !customFileName) {
      alert("Please select a map and enter a filename");
      return;
    }

    setIsLoading(true);
    setUrlStatus(null);

    // Build the custom URL
    const url = buildDirectUrl(
      "tarkov-images",
      `${selectedMap}/${customFileName}`
    );
    setCustomUrl(url);

    // Test if the URL is accessible
    try {
      const isAccessible = await checkUrlAccessible(url);
      setUrlStatus(isAccessible ? "success" : "error");
    } catch (error) {
      console.error("Error checking URL:", error);
      setUrlStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="direct-url-demo container mt-4">
      <h1>Direct Storage URL Access</h1>
      <p className="lead">
        This demo shows how to directly access Supabase storage URLs without
        using the Storage API. This is useful when you have limited permissions
        but know the structure of your bucket.
      </p>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Known Sample</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="mapSelect" className="form-label">
                  Select Map:
                </label>
                <select
                  id="mapSelect"
                  className="form-select"
                  value={selectedMap}
                  onChange={handleMapChange}
                >
                  {maps.map((map) => (
                    <option key={map} value={map}>
                      {map}
                    </option>
                  ))}
                </select>
              </div>

              {directUrl ? (
                <div>
                  <p>
                    <strong>Direct URL:</strong>
                  </p>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      value={directUrl}
                      readOnly
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => navigator.clipboard.writeText(directUrl)}
                    >
                      Copy
                    </button>
                  </div>

                  <div className="text-center mt-3">
                    <img
                      src={directUrl}
                      alt={`Sample from ${selectedMap}`}
                      className="img-fluid border rounded"
                      style={{ maxHeight: "300px" }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=Image+Not+Found";
                        e.target.alt = "Image not found";
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  No sample image available for {selectedMap}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Custom File Access</h5>
            </div>
            <div className="card-body">
              <p>Try accessing a specific file by entering its name:</p>

              <div className="mb-3">
                <label htmlFor="mapSelectCustom" className="form-label">
                  Map:
                </label>
                <select
                  id="mapSelectCustom"
                  className="form-select"
                  value={selectedMap}
                  onChange={handleMapChange}
                >
                  {maps.map((map) => (
                    <option key={map} value={map}>
                      {map}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="filenameInput" className="form-label">
                  Filename:
                </label>
                <input
                  id="filenameInput"
                  type="text"
                  className="form-control"
                  value={customFileName}
                  onChange={handleFilenameChange}
                  placeholder="e.g., my-image.png"
                />
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={testCustomUrl}
                  disabled={isLoading || !customFileName}
                >
                  {isLoading ? "Testing..." : "Test URL"}
                </button>
              </div>

              {customUrl && (
                <div className="mt-3">
                  <div
                    className={`alert ${
                      urlStatus === "success"
                        ? "alert-success"
                        : urlStatus === "error"
                        ? "alert-danger"
                        : "alert-info"
                    }`}
                  >
                    {urlStatus === "success" && <p>✅ URL is accessible!</p>}
                    {urlStatus === "error" && <p>❌ URL is not accessible.</p>}
                    {!urlStatus && <p>Testing URL accessibility...</p>}
                  </div>

                  <p>
                    <strong>Generated URL:</strong>
                  </p>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      value={customUrl}
                      readOnly
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => navigator.clipboard.writeText(customUrl)}
                    >
                      Copy
                    </button>
                  </div>

                  {urlStatus === "success" && (
                    <div className="text-center mt-3">
                      <img
                        src={customUrl}
                        alt="Custom image"
                        className="img-fluid border rounded"
                        style={{ maxHeight: "200px" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h2>Demo Images with Coordinates</h2>
        <p>These are generated images with predefined coordinates:</p>

        <div className="row">
          {demoImages.map((image, index) => (
            <div key={index} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">{`Demo ${index + 1}`}</h5>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Coords:</strong> X: {image.coordinates.x.toFixed(1)}
                    , Y: {image.coordinates.y.toFixed(1)}, Z:{" "}
                    {image.coordinates.z.toFixed(1)}
                  </p>
                  <div className="text-center">
                    {/* The image likely won't load since it's generated with a demo filename */}
                    <img
                      src="https://via.placeholder.com/200x150?text=Generated+Image"
                      alt={`Demo image ${index + 1}`}
                      className="img-fluid border rounded"
                      style={{ maxHeight: "150px" }}
                    />
                  </div>
                </div>
                <div className="card-footer">
                  <small className="text-muted">
                    URL:{" "}
                    <span style={{ wordBreak: "break-all" }}>
                      {image.url.substring(0, 40)}...
                    </span>
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header bg-dark text-white">
          <h3 className="mb-0">How To Use Direct URLs</h3>
        </div>
        <div className="card-body">
          <pre className="bg-light p-3 rounded">
            {`import { buildDirectUrl, getImageUrl } from "../utils/directStorageAccess";

// Method 1: Build a URL directly
const url1 = buildDirectUrl("tarkov-images", "customs/my-image.png");

// Method 2: Use the helper function
const url2 = getImageUrl("customs", "my-image.png");

// Use the URL in an img tag
<img src={url1} alt="My image" />

// Or test if the URL is accessible
const isAccessible = await checkUrlAccessible(url1);`}
          </pre>

          <div className="alert alert-info mt-3">
            <strong>Note about permissions:</strong> To allow public access to
            your Supabase storage, you need to create a storage policy in the
            Supabase dashboard that allows anonymous users to read files from
            your bucket. Go to <code>Storage → Policies</code> and create a
            policy that allows public read access.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectURLDemo;
