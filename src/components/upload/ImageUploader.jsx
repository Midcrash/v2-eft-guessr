import React, { useState } from "react";
import { uploadBatchScreenshots } from "../../services/locationService";
import { GAME_CONSTANTS } from "../../services/gameService";
import "./ImageUploader.css";

const ImageUploader = () => {
  const [files, setFiles] = useState([]);
  const [mapName, setMapName] = useState("customs");
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const maps = GAME_CONSTANTS.MAP_OPTIONS;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate filenames
    const invalidFiles = selectedFiles.filter((file) => {
      try {
        // This will throw an error if the filename doesn't match the expected format
        const coordPattern = /_(-?\d+\.?\d*),\s*(\d+\.?\d*),\s*(-?\d+\.?\d*)_/;
        return !coordPattern.test(file.name);
      } catch {
        return true;
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        `Some files have invalid names. Files must have coordinates in the format: "2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png"`
      );
      // Filter out invalid files
      const validFiles = selectedFiles.filter(
        (file) => !invalidFiles.includes(file)
      );
      setFiles(validFiles);
    } else {
      setError(null);
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadBatchScreenshots(files, mapName);
      setResults(result);

      // Clear files input if all uploads were successful
      if (result.failures.length === 0) {
        setFiles([]);
        document.getElementById("file-upload").value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="uploader-container">
      <h2>Upload Tarkov Screenshots</h2>

      <div className="form-group">
        <label htmlFor="map-select">Select Map:</label>
        <select
          id="map-select"
          className="form-control"
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
        >
          {maps.map((map) => (
            <option key={map.id} value={map.id}>
              {map.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="file-upload">Select Screenshots:</label>
        <input
          type="file"
          id="file-upload"
          className="form-control"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <p className="help-text">
          Filenames should follow format: "2023-12-05[22-28]_482.0, 2.6,
          -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png"
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload Screenshots"}
        </button>

        {files.length > 0 && (
          <p className="selected-files-info">{files.length} file(s) selected</p>
        )}
      </div>

      {results && (
        <div className="upload-results">
          <h3>Upload Results</h3>

          {results.success.length > 0 && (
            <div className="success-result">
              <p>✅ Successfully uploaded {results.success.length} image(s)</p>
              <ul>
                {results.success.map((success, i) => (
                  <li key={i}>
                    {success.fileName} →{" "}
                    <a
                      href={success.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Image
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.failures.length > 0 && (
            <div className="failure-result">
              <p>❌ Failed uploads: {results.failures.length}</p>
              <ul>
                {results.failures.map((fail, i) => (
                  <li key={i}>
                    {fail.file}: {fail.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
