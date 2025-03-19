import React, { useState, useEffect } from "react";
import { uploadBatchScreenshots } from "../../services/locationService";
import { GAME_CONSTANTS } from "../../services/gameService";
import {
  batchOptimizeImages,
  formatFileSize,
  calculateCompressionRatio,
} from "../../utils/imageOptimizer";
import "./ImageUploader.css";

const OptimizedImageUploader = () => {
  const [files, setFiles] = useState([]);
  const [mapName, setMapName] = useState("customs");
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Optimization options
  const [optimizeEnabled, setOptimizeEnabled] = useState(true);
  const [maxWidth, setMaxWidth] = useState(1280);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState("jpeg");

  // Preview states
  const [originalFiles, setOriginalFiles] = useState([]);
  // We set optimizedFiles but only use it indirectly when uploading
  // eslint-disable-next-line no-unused-vars
  const [optimizedFiles, setOptimizedFiles] = useState([]);
  const [optimizationStats, setOptimizationStats] = useState(null);

  const maps = GAME_CONSTANTS.MAP_OPTIONS;

  // Validate filenames to ensure they contain coordinates
  const validateFilenames = (selectedFiles) => {
    const invalidFiles = selectedFiles.filter((file) => {
      try {
        // This will check if the filename contains coordinates
        const coordPattern =
          /(_(-?\d+\.?\d*),\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)_)|(_(-?\d+\.?\d*),_(-?\d+\.?\d*),_(-?\d+\.?\d*)_)/;
        return !coordPattern.test(file.name);
      } catch {
        return true;
      }
    });

    return invalidFiles;
  };

  // Generate optimization preview
  const generateOptimizationPreview = async (filesToOptimize) => {
    if (!optimizeEnabled || filesToOptimize.length === 0) {
      setOptimizedFiles([]);
      setOptimizationStats(null);
      return;
    }

    setIsOptimizing(true);

    try {
      // Optimize a sample (first 3 files max) for preview
      const samplesToOptimize = filesToOptimize.slice(0, 3);
      const optimizedSamples = await batchOptimizeImages(samplesToOptimize, {
        maxWidth,
        quality,
        format,
        preserveFilename: true,
      });

      setOptimizedFiles(optimizedSamples);

      // Calculate optimization statistics
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;

      const fileStats = samplesToOptimize.map((originalFile, index) => {
        const optimizedFile = optimizedSamples[index];
        const originalSize = originalFile.size;
        const optimizedSize = optimizedFile.size;
        const ratio = calculateCompressionRatio(originalFile, optimizedFile);

        totalOriginalSize += originalSize;
        totalOptimizedSize += optimizedSize;

        return {
          name: originalFile.name,
          originalSize,
          optimizedSize,
          ratio,
        };
      });

      const totalRatio = Math.round(
        ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100
      );

      setOptimizationStats({
        fileStats,
        totalOriginalSize,
        totalOptimizedSize,
        totalRatio,
        projectedSavings: Math.round(
          (totalRatio / 100) *
            filesToOptimize.reduce((sum, file) => sum + file.size, 0)
        ),
      });
    } catch (error) {
      console.error("Error generating optimization preview:", error);
      setError(`Failed to generate optimization preview: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Reset states
    setError(null);
    setResults(null);
    setOptimizedFiles([]);
    setOptimizationStats(null);

    // Validate filenames
    const invalidFiles = validateFilenames(selectedFiles);

    if (invalidFiles.length > 0) {
      setError(
        `Some files have invalid names. Files must have coordinates in the format: "2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29 (0).png"`
      );
      // Filter out invalid files
      const validFiles = selectedFiles.filter(
        (file) => !invalidFiles.includes(file)
      );
      setFiles(validFiles);
      setOriginalFiles(validFiles);
    } else {
      setFiles(selectedFiles);
      setOriginalFiles(selectedFiles);

      // Generate optimization preview if enabled
      if (optimizeEnabled && selectedFiles.length > 0) {
        await generateOptimizationPreview(selectedFiles);
      }
    }
  };

  // Update optimization preview when options change
  useEffect(() => {
    const updatePreview = async () => {
      if (optimizeEnabled && originalFiles.length > 0) {
        await generateOptimizationPreview(originalFiles);
      }
    };

    updatePreview();
  }, [optimizeEnabled, maxWidth, quality, format, originalFiles]);

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let filesToUpload = files;

      // Optimize files if enabled
      if (optimizeEnabled) {
        setIsOptimizing(true);
        filesToUpload = await batchOptimizeImages(files, {
          maxWidth,
          quality,
          format,
          preserveFilename: true,
        });
        setIsOptimizing(false);
      }

      const result = await uploadBatchScreenshots(filesToUpload, mapName);
      setResults(result);

      // Clear files input if all uploads were successful
      if (result.failures.length === 0) {
        setFiles([]);
        setOriginalFiles([]);
        setOptimizedFiles([]);
        setOptimizationStats(null);
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

      {/* Optimization Options */}
      <div className="optimization-options">
        <h3>Image Optimization</h3>

        <div className="form-check">
          <input
            type="checkbox"
            id="optimize-enabled"
            className="form-check-input"
            checked={optimizeEnabled}
            onChange={(e) => setOptimizeEnabled(e.target.checked)}
          />
          <label htmlFor="optimize-enabled" className="form-check-label">
            Optimize images before upload (reduces storage costs)
          </label>
        </div>

        {optimizeEnabled && (
          <div className="optimization-controls">
            <div className="form-group">
              <label htmlFor="max-width">Max Width (pixels):</label>
              <input
                type="number"
                id="max-width"
                className="form-control"
                min="640"
                max="2560"
                step="128"
                value={maxWidth}
                onChange={(e) => setMaxWidth(parseInt(e.target.value))}
              />
              <small>Recommended: 1280 for good quality vs. file size</small>
            </div>

            <div className="form-group">
              <label htmlFor="quality">Quality:</label>
              <input
                type="range"
                id="quality"
                className="form-control-range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
              />
              <span>{Math.round(quality * 100)}%</span>
              <small>Recommended: 80% for good quality vs. file size</small>
            </div>

            <div className="form-group">
              <label htmlFor="format">Format:</label>
              <select
                id="format"
                className="form-control"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="jpeg">JPEG (best compatibility)</option>
                <option value="png">PNG (lossless, larger files)</option>
                <option value="webp">
                  WebP (best compression, modern browsers)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Optimization Preview */}
        {optimizationStats && (
          <div className="optimization-preview">
            <h4>Optimization Preview</h4>
            {isOptimizing ? (
              <div className="optimizing-message">Generating preview...</div>
            ) : (
              <>
                <div className="optimization-summary">
                  <p>
                    <strong>Total Reduction:</strong>{" "}
                    {optimizationStats.totalRatio}% (from{" "}
                    {formatFileSize(optimizationStats.totalOriginalSize)} to{" "}
                    {formatFileSize(optimizationStats.totalOptimizedSize)})
                  </p>

                  {files.length > 3 && (
                    <p>
                      <strong>Projected Savings:</strong> Approximately{" "}
                      {formatFileSize(optimizationStats.projectedSavings)} for
                      all {files.length} files
                    </p>
                  )}
                </div>

                <div className="file-previews">
                  {optimizationStats.fileStats.map((stat, index) => (
                    <div className="file-preview-item" key={index}>
                      <div className="file-info">
                        <strong>{stat.name}</strong>
                        <div>
                          Original: {formatFileSize(stat.originalSize)} →{" "}
                          Optimized: {formatFileSize(stat.optimizedSize)} (
                          {stat.ratio}% reduction)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading || isOptimizing || files.length === 0}
        >
          {isUploading
            ? "Uploading..."
            : isOptimizing
            ? "Optimizing..."
            : "Upload Screenshots"}
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

export default OptimizedImageUploader;
